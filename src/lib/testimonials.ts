import { supabase } from './supabase'
import { dbLogger } from './logger'

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

export interface TestimonialInput {
    name: string
    title?: string
    photo_url?: string
    content: string
    rating?: number
    is_visible?: boolean
    display_order?: number
}

// Fetch all visible testimonials (for public display)
export async function getVisibleTestimonials(): Promise<Testimonial[]> {
    const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('is_visible', true)
        .order('display_order', { ascending: true }) as { data: Testimonial[] | null; error: unknown }

    if (error) {
        dbLogger.error('Error', error)
        return []
    }

    return data || []
}

// Fetch all testimonials (for admin)
export async function getAllTestimonials(): Promise<Testimonial[]> {
    const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('display_order', { ascending: true }) as { data: Testimonial[] | null; error: unknown }

    if (error) {
        dbLogger.error('Error', error)
        return []
    }

    return data || []
}

// Create a new testimonial
export async function createTestimonial(input: TestimonialInput): Promise<Testimonial | null> {
    const { data, error } = await (supabase
        .from('testimonials') as unknown as { insert: (data: unknown[]) => { select: () => { single: () => Promise<{ data: Testimonial | null; error: unknown }> } } })
        .insert([{
            name: input.name,
            title: input.title || null,
            photo_url: input.photo_url || null,
            content: input.content,
            rating: input.rating || 5,
            is_visible: input.is_visible ?? true,
            display_order: input.display_order || 0
        }])
        .select()
        .single()

    if (error) {
        dbLogger.error('Error', error)
        return null
    }

    return data
}

// Update a testimonial
export async function updateTestimonial(id: string, input: Partial<TestimonialInput>): Promise<Testimonial | null> {
    const { data, error } = await (supabase
        .from('testimonials') as unknown as { update: (data: unknown) => { eq: (col: string, val: string) => { select: () => { single: () => Promise<{ data: Testimonial | null; error: unknown }> } } } })
        .update({
            ...input,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

    if (error) {
        dbLogger.error('Error', error)
        return null
    }

    return data
}

// Delete a testimonial
export async function deleteTestimonial(id: string): Promise<boolean> {
    const { error } = await (supabase
        .from('testimonials') as unknown as { delete: () => { eq: (col: string, val: string) => Promise<{ error: unknown }> } })
        .delete()
        .eq('id', id)

    if (error) {
        dbLogger.error('Error', error)
        return false
    }

    return true
}

// Toggle visibility
export async function toggleTestimonialVisibility(id: string, isVisible: boolean): Promise<boolean> {
    const { error } = await (supabase
        .from('testimonials') as unknown as { update: (data: unknown) => { eq: (col: string, val: string) => Promise<{ error: unknown }> } })
        .update({ is_visible: isVisible, updated_at: new Date().toISOString() })
        .eq('id', id)

    if (error) {
        dbLogger.error('Error', error)
        return false
    }

    return true
}

// Update display order
export async function updateTestimonialOrder(id: string, order: number): Promise<boolean> {
    const { error } = await (supabase
        .from('testimonials') as unknown as { update: (data: unknown) => { eq: (col: string, val: string) => Promise<{ error: unknown }> } })
        .update({ display_order: order, updated_at: new Date().toISOString() })
        .eq('id', id)

    if (error) {
        dbLogger.error('Error', error)
        return false
    }

    return true
}
