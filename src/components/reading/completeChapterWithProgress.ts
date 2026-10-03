interface ProgressWriter {
    updateReadingProgress: (pageNumber: number) => Promise<boolean>
    completeChapter: (chapterIndex: number) => Promise<boolean>
}

/** لا نرسل علامة الإتمام قبل أن يؤكد الخادم حفظ الصفحة الأخيرة. */
export async function completeChapterWithProgress(writer: ProgressWriter, page: number, chapter: number | null): Promise<string | null> {
    try {
        if (!await writer.updateReadingProgress(page)) {
            return 'تعذّر حفظ الصفحة الأخيرة. أعد المحاولة قبل الانتقال.'
        }
        if (chapter !== null && !await writer.completeChapter(chapter)) {
            return 'حُفظت الصفحة، لكن تعذّر تسجيل إتمام الفصل. أعد المحاولة قبل الانتقال.'
        }
        return null
    } catch {
        return 'تعذّر حفظ تقدم القراءة. تحقق من اتصالك وأعد المحاولة.'
    }
}
