/** A row of the testimonials table. Reads and writes go through /api/testimonials and /api/admin/testimonials. */
export interface Testimonial {
    id: string
    name: string
    title: string | null
    photo_url: string | null
    content: string
    rating: number
    is_visible: boolean
    display_order: number
    created_at: string
    updated_at: string
}
