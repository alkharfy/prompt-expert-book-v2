import 'server-only'
import { dbLogger } from './logger'

// ============ Configuration ============

const KASHIER_API_URL = 'https://api.kashier.io/v3'
const KASHIER_TEST_API_URL = 'https://test-api.kashier.io/v3'

function getBaseUrl(): string {
    const mode = process.env.NEXT_PUBLIC_KASHIER_MODE || 'test'
    return mode === 'live' ? KASHIER_API_URL : KASHIER_TEST_API_URL
}

function getCreateSessionUrl(): string {
    return `${getBaseUrl()}/payment/sessions`
}

function getVerifyUrl(sessionId: string): string {
    return `${getBaseUrl()}/payment/sessions/${sessionId}/payment`
}

function getApiKey(): string {
    const key = process.env.KASHIER_API_KEY
    if (!key) {
        dbLogger.error('KASHIER_API_KEY is not set')
        throw new Error('KASHIER_API_KEY is not set')
    }
    // تنظيف المفتاح من المسافات وعلامات التنصيص الزائدة
    return key.trim().replace(/^["']|["']$/g, '')
}

function getSecretKey(): string {
    const key = process.env.KASHIER_SECRET_KEY
    if (!key) {
        dbLogger.error('KASHIER_SECRET_KEY is not set')
        throw new Error('KASHIER_SECRET_KEY is not set')
    }
    // تنظيف المفتاح من المسافات وعلامات التنصيص الزائدة
    return key.trim().replace(/^["']|["']$/g, '')
}

function getMerchantId(): string {
    const id = process.env.KASHIER_MERCHANT_ID
    if (!id) throw new Error('KASHIER_MERCHANT_ID is not set')
    // تنظيف المعرّف من المسافات وعلامات التنصيص الزائدة
    return id.trim().replace(/^["']|["']$/g, '')
}

// ============ Types ============

export interface CreateSessionParams {
    orderId: string
    amount: string
    customerEmail: string
    customerReference: string
    description: string
    redirectUrl: string
    webhookUrl?: string
}

export interface KashierSessionResponse {
    status: string
    _id: string
    paymentParams: {
        amount: string
        currency: string
        order: string
        hash: string
    }
    sessionUrl: string
    createdAt: string
}

export interface KashierPaymentStatus {
    sessionId: string
    status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED' | 'CREATED' | 'OPENED'
    amount: string
    currency: string
    merchantOrderId: string
    method: string
    orderId: string
    customer: {
        email: string
        reference: string
    }
}

// ============ API Functions ============

/**
 * إنشاء جلسة دفع جديدة في كاشير
 */
export async function createPaymentSession(params: CreateSessionParams): Promise<{
    success: boolean
    sessionId?: string
    sessionUrl?: string
    error?: string
}> {
    try {
        const body = {
            expireAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 ساعة
            maxFailureAttempts: 3,
            paymentType: 'credit',
            amount: params.amount,
            currency: 'EGP',
            order: params.orderId,
            merchantRedirect: params.redirectUrl,
            display: 'ar',
            type: 'one-time',
            allowedMethods: 'card,wallet',
            merchantId: getMerchantId(),
            failureRedirect: false,
            brandColor: '#FF6B35',
            description: params.description,
            customer: {
                email: params.customerEmail,
                reference: params.customerReference
            },
            interactionSource: 'ECOMMERCE',
            enable3DS: true,
            ...(params.webhookUrl ? { serverWebhook: params.webhookUrl } : {})
        }

        const url = getCreateSessionUrl()
        const apiKey = getApiKey()
        const secretKey = getSecretKey()
        const merchantId = getMerchantId()

        const headers: Record<string, string> = {
            'Authorization': secretKey,
            'api-key': apiKey,
            'Content-Type': 'application/json'
        }


        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal: controller.signal
        }).finally(() => clearTimeout(timeoutId))

        if (!response.ok) {
            const errorData = await response.text()
            console.error('Kashier API failure:', response.status, errorData)
            dbLogger.error(`Kashier API error (${response.status}):`, errorData)
            return { success: false, error: `فشل في إنشاء جلسة الدفع (${response.status})` }
        }

        const data: KashierSessionResponse = await response.json()

        return {
            success: true,
            sessionId: data._id,
            sessionUrl: data.sessionUrl
        }
    } catch (error) {
        dbLogger.error('Error creating payment session:', error)
        return { success: false, error: 'حدث خطأ في الاتصال بخدمة الدفع' }
    }
}


/**
 * التحقق من حالة الدفع عبر كاشير
 */
export async function verifyPaymentSession(sessionId: string): Promise<{
    ok: boolean
    paid: boolean
    status?: KashierPaymentStatus['status']
    data?: KashierPaymentStatus
    error?: string
}> {
    try {
        const url = getVerifyUrl(sessionId)
        const apiKey = getApiKey()
        const secretKey = getSecretKey()

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': secretKey,
                'api-key': apiKey
            },
            signal: controller.signal
        }).finally(() => clearTimeout(timeoutId))

        if (!response.ok) {
            const errorData = await response.text()
            dbLogger.error('Kashier verify error:', errorData)
            return { ok: false, paid: false, error: 'فشل في التحقق من حالة الدفع' }
        }

        const result = await response.json()
        const paymentData: KashierPaymentStatus = result.data

        const paid = paymentData?.status === 'SUCCESS'

        return {
            ok: true,
            paid,
            status: paymentData?.status,
            data: paymentData
        }
    } catch (error) {
        dbLogger.error('Error verifying payment:', error)
        return { ok: false, paid: false, error: 'حدث خطأ في التحقق من الدفع' }
    }
}
