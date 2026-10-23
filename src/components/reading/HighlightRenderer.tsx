/** A saved highlight/note row (user_notes). */
export interface NoteData {
    id: string
    user_id: string
    section_id: string
    page_number: number
    highlighted_text: string | null
    text_start_offset: number | null
    text_end_offset: number | null
    content_block_index: number | null
    note_text: string | null
    highlight_color: 'orange' | 'yellow' | 'green' | 'blue' | 'purple'
    created_at: string
    updated_at: string
}
