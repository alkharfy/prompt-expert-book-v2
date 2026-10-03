/** The server resolves reward eligibility and points; the client only submits the known reward ID. */
export async function claimReadingReward(rewardId: string, request: typeof fetch = fetch): Promise<{ alreadyClaimed: boolean }> {
    const response = await request('/api/achievements/claimed', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewardId }),
    })
    const result = await response.json() as { success?: boolean; alreadyClaimed?: boolean }
    if (!response.ok || result.success !== true) {
        throw new Error('تعذّر تسجيل المكافأة. أعد المحاولة؛ لم يتم تأكيد منح النقاط.')
    }
    return { alreadyClaimed: result.alreadyClaimed === true }
}
