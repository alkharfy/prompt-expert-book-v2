// ملف مشترك لإدارة جلسات الـ Admin باستخدام قاعدة البيانات
// يدعم Serverless و multiple instances بدون فقدان البيانات
import crypto from 'crypto'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { apiLogger } from './logger'

// إنشاء Supabase client مع service_role للوصول الكامل
// تأخير الإنشاء حتى وقت التشغيل لتجنب أخطاء build time
let supabaseAdmin: SupabaseClient | null = null

function getSupabaseAdmin(): SupabaseClient {
    if (!supabaseAdmin) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY
        
        if (!url || !key) {
            throw new Error('Missing Supabase environment variables for admin session')
        }
        
        supabaseAdmin = createClient(url, key, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        })
    }
    return supabaseAdmin
}

interface AdminSession {
    id: string
    token: string
    ip_address: string | null
    user_agent: string | null
    created_at: string
    last_activity: string
    expires_at: string
}

// مدة صلاحية الجلسة (ساعتين)
export const SESSION_DURATION = 2 * 60 * 60 * 1000

// مدة عدم النشاط المسموحة (30 دقيقة)
const INACTIVITY_TIMEOUT = 30 * 60 * 1000

// الحد الأقصى للجلسات النشطة
const MAX_SESSIONS = 5

// هل نستخدم قاعدة البيانات أم الذاكرة (fallback)
let useDatabase = true

// تخزين مؤقت للـ fallback
const memorySessionsMap = new Map<string, { createdAt: number; lastActivity: number; ip?: string }>()

// توليد توكن آمن
export function generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex')
}

// تنظيف الجلسات المنتهية
export async function cleanupOldSessions(): Promise<void> {
    if (!useDatabase) {
        // Fallback: تنظيف من الذاكرة
        const now = Date.now()
        const keysToDelete: string[] = []
        memorySessionsMap.forEach((session, token) => {
            if (now - session.createdAt > SESSION_DURATION ||
                now - session.lastActivity > INACTIVITY_TIMEOUT) {
                keysToDelete.push(token)
            }
        })
        keysToDelete.forEach(key => memorySessionsMap.delete(key))
        return
    }
    
    try {
        const now = new Date()
        const inactivityCutoff = new Date(now.getTime() - INACTIVITY_TIMEOUT)
        
        await getSupabaseAdmin()
            .from('admin_sessions')
            .delete()
            .or(`expires_at.lt.${now.toISOString()},last_activity.lt.${inactivityCutoff.toISOString()}`)
        
        apiLogger.debug('Cleaned up expired admin sessions')
    } catch (error) {
        apiLogger.error('Failed to cleanup admin sessions', { error })
        useDatabase = false // Switch to fallback
    }
}

// إنشاء جلسة جديدة
export async function createSession(ip?: string, userAgent?: string): Promise<string> {
    const token = generateSecureToken()
    const now = Date.now()
    
    if (!useDatabase) {
        // Fallback: استخدام الذاكرة
        if (memorySessionsMap.size >= MAX_SESSIONS) {
            let oldestToken: string | null = null
            let oldestTime = Infinity
            memorySessionsMap.forEach((session, t) => {
                if (session.createdAt < oldestTime) {
                    oldestTime = session.createdAt
                    oldestToken = t
                }
            })
            if (oldestToken) memorySessionsMap.delete(oldestToken)
        }
        memorySessionsMap.set(token, { createdAt: now, lastActivity: now, ip })
        return token
    }
    
    try {
        // تنظيف الجلسات القديمة أولاً
        await cleanupOldSessions()
        
        // التحقق من عدد الجلسات
        const { count } = await getSupabaseAdmin()
            .from('admin_sessions')
            .select('*', { count: 'exact', head: true })
        
        if (count && count >= MAX_SESSIONS) {
            // حذف أقدم جلسة
            const { data: oldest } = await getSupabaseAdmin()
                .from('admin_sessions')
                .select('id')
                .order('created_at', { ascending: true })
                .limit(1)
                .single()
            
            if (oldest) {
                await getSupabaseAdmin()
                    .from('admin_sessions')
                    .delete()
                    .eq('id', oldest.id)
            }
        }
        
        const expiresAt = new Date(now + SESSION_DURATION)
        
        const { error } = await getSupabaseAdmin()
            .from('admin_sessions')
            .insert({
                token,
                ip_address: ip || null,
                user_agent: userAgent || null,
                created_at: new Date(now).toISOString(),
                last_activity: new Date(now).toISOString(),
                expires_at: expiresAt.toISOString()
            })
        
        if (error) {
            apiLogger.error('Failed to create admin session', { error })
            useDatabase = false
            memorySessionsMap.set(token, { createdAt: now, lastActivity: now, ip })
        } else {
            apiLogger.info('Admin session created', { ip })
        }
        
        return token
    } catch (error) {
        apiLogger.error('Error creating admin session, falling back to memory', { error })
        useDatabase = false
        memorySessionsMap.set(token, { createdAt: now, lastActivity: now, ip })
        return token
    }
}

// التحقق من صحة التوكن
export async function verifyToken(token: string, ip?: string): Promise<boolean> {
    if (!useDatabase) {
        // Fallback: التحقق من الذاكرة
        const session = memorySessionsMap.get(token)
        if (!session) return false
        
        const now = Date.now()
        if (now - session.createdAt > SESSION_DURATION ||
            now - session.lastActivity > INACTIVITY_TIMEOUT) {
            memorySessionsMap.delete(token)
            return false
        }
        session.lastActivity = now
        return true
    }
    
    try {
        const { data: session, error } = await getSupabaseAdmin()
            .from('admin_sessions')
            .select('*')
            .eq('token', token)
            .single() as { data: AdminSession | null, error: unknown }
        
        if (error || !session) {
            return false
        }
        
        const now = new Date()
        const expiresAt = new Date(session.expires_at)
        const lastActivity = new Date(session.last_activity)
        const inactivityCutoff = new Date(now.getTime() - INACTIVITY_TIMEOUT)
        
        // التحقق من الصلاحية
        if (now > expiresAt) {
            await revokeSession(token)
            return false
        }
        
        // التحقق من عدم النشاط
        if (lastActivity < inactivityCutoff) {
            await revokeSession(token)
            return false
        }
        
        // تحديث وقت النشاط
        await getSupabaseAdmin()
            .from('admin_sessions')
            .update({ last_activity: now.toISOString() })
            .eq('token', token)
        
        return true
    } catch (error) {
        apiLogger.error('Error verifying admin token', { error })
        return false
    }
}

// إلغاء جلسة
export async function revokeSession(token: string): Promise<void> {
    if (!useDatabase) {
        memorySessionsMap.delete(token)
        return
    }
    
    try {
        await getSupabaseAdmin()
            .from('admin_sessions')
            .delete()
            .eq('token', token)
        
        apiLogger.info('Admin session revoked')
    } catch (error) {
        apiLogger.error('Error revoking admin session', { error })
    }
}

// إلغاء جميع الجلسات
export async function revokeAllSessions(): Promise<void> {
    if (!useDatabase) {
        memorySessionsMap.clear()
        return
    }
    
    try {
        await getSupabaseAdmin()
            .from('admin_sessions')
            .delete()
            .gte('id', '00000000-0000-0000-0000-000000000000')
        
        apiLogger.info('All admin sessions revoked')
    } catch (error) {
        apiLogger.error('Error revoking all admin sessions', { error })
    }
}

// للتوافق مع الكود القديم
export const activeSessions = memorySessionsMap
