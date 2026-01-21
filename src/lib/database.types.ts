/**
 * Database Types for Supabase
 * 
 * هذا الملف يحتوي على أنواع TypeScript لجداول قاعدة البيانات.
 * يمكنك توليد هذه الأنواع تلقائياً باستخدام:
 * 
 * npx supabase gen types typescript --project-id pqqaupbkamtfjweajkjo > src/lib/database.types.ts
 * 
 * أو يدوياً من لوحة تحكم Supabase:
 * Settings > API > Generate types
 */

export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string
                    email: string
                    password_hash: string
                    full_name: string
                    phone_number: string | null
                    is_phone_verified: boolean
                    is_verified: boolean
                    is_active: boolean
                    is_admin: boolean
                    registered_at: string
                    last_login_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>
                Update: Partial<Database['public']['Tables']['users']['Row']>
            }
            devices: {
                Row: {
                    id: string
                    user_id: string
                    device_id: string
                    device_fingerprint: string
                    device_info: Record<string, unknown>
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: Omit<Database['public']['Tables']['devices']['Row'], 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Database['public']['Tables']['devices']['Row']>
            }
            sessions: {
                Row: {
                    id: string
                    user_id: string
                    device_id: string
                    token: string
                    expires_at: string
                    is_active: boolean
                    created_at: string
                }
                Insert: Omit<Database['public']['Tables']['sessions']['Row'], 'id' | 'created_at'>
                Update: Partial<Database['public']['Tables']['sessions']['Row']>
            }
            reading_progress: {
                Row: {
                    id: string
                    user_id: string
                    current_page: number
                    total_pages: number
                    bookmarks: string[]
                    completion_percentage: number
                    completed_chapters: string[]
                    last_read_time: string
                    created_at: string
                    updated_at: string
                }
                Insert: Omit<Database['public']['Tables']['reading_progress']['Row'], 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Database['public']['Tables']['reading_progress']['Row']>
            }
            bookmarks: {
                Row: {
                    id: string
                    user_id: string
                    page_path: string
                    page_title: string
                    created_at: string
                }
                Insert: Omit<Database['public']['Tables']['bookmarks']['Row'], 'id' | 'created_at'>
                Update: Partial<Database['public']['Tables']['bookmarks']['Row']>
            }
            certificates: {
                Row: {
                    id: string
                    user_id: string
                    certificate_id: string
                    user_name: string
                    course_name: string
                    issued_at: string
                    completion_percentage: number
                    is_public: boolean
                    created_at: string
                }
                Insert: Omit<Database['public']['Tables']['certificates']['Row'], 'id' | 'created_at'>
                Update: Partial<Database['public']['Tables']['certificates']['Row']>
            }
            user_gamification: {
                Row: {
                    id: string
                    user_id: string
                    total_points: number
                    current_level: number
                    points_to_next_level: number
                    current_streak: number
                    longest_streak: number
                    last_activity_date: string | null
                    exercises_completed: number
                    created_at: string
                    updated_at: string
                }
                Insert: Omit<Database['public']['Tables']['user_gamification']['Row'], 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Database['public']['Tables']['user_gamification']['Row']>
            }
            user_exercise_stats: {
                Row: {
                    id: string
                    user_id: string
                    total_completed: number
                    total_correct: number
                    total_points: number
                    quizzes_completed: number
                    fill_blanks_completed: number
                    prompt_builders_completed: number
                    last_exercise_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: Omit<Database['public']['Tables']['user_exercise_stats']['Row'], 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Database['public']['Tables']['user_exercise_stats']['Row']>
            }
            exercise_progress: {
                Row: {
                    id: string
                    user_id: string
                    exercise_id: string
                    is_completed: boolean
                    is_correct: boolean
                    points_earned: number
                    created_at: string
                    updated_at: string
                }
                Insert: Omit<Database['public']['Tables']['exercise_progress']['Row'], 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Database['public']['Tables']['exercise_progress']['Row']>
            }
            points_history: {
                Row: {
                    id: string
                    user_id: string
                    points: number
                    action_type: string
                    action_details: Record<string, unknown> | null
                    created_at: string
                }
                Insert: Omit<Database['public']['Tables']['points_history']['Row'], 'id' | 'created_at'>
                Update: Partial<Database['public']['Tables']['points_history']['Row']>
            }
            verification_codes: {
                Row: {
                    id: string
                    user_id: string
                    code: string
                    is_used: boolean
                    used_at: string | null
                    created_at: string
                }
                Insert: Omit<Database['public']['Tables']['verification_codes']['Row'], 'id' | 'created_at'>
                Update: Partial<Database['public']['Tables']['verification_codes']['Row']>
            }
            testimonials: {
                Row: {
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
                Insert: Omit<Database['public']['Tables']['testimonials']['Row'], 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Database['public']['Tables']['testimonials']['Row']>
            }
            site_settings: {
                Row: {
                    id: string
                    key: string
                    value: Record<string, unknown>
                    created_at: string
                    updated_at: string
                }
                Insert: Omit<Database['public']['Tables']['site_settings']['Row'], 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Database['public']['Tables']['site_settings']['Row']>
            }
            admin_sessions: {
                Row: {
                    id: string
                    token: string
                    ip_address: string | null
                    user_agent: string | null
                    created_at: string
                    last_activity: string
                    expires_at: string
                }
                Insert: Omit<Database['public']['Tables']['admin_sessions']['Row'], 'id'>
                Update: Partial<Database['public']['Tables']['admin_sessions']['Row']>
            }
            badges: {
                Row: {
                    id: string
                    name_ar: string
                    description_ar: string
                    icon: string
                    category: string
                    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
                    requirement_type: string
                    requirement_value: number
                    is_hidden: boolean
                    created_at: string
                }
                Insert: Omit<Database['public']['Tables']['badges']['Row'], 'id' | 'created_at'>
                Update: Partial<Database['public']['Tables']['badges']['Row']>
            }
            user_badges: {
                Row: {
                    id: string
                    user_id: string
                    badge_id: string
                    earned_at: string
                    is_featured: boolean
                }
                Insert: Omit<Database['public']['Tables']['user_badges']['Row'], 'id'>
                Update: Partial<Database['public']['Tables']['user_badges']['Row']>
            }
            user_certificates: {
                Row: {
                    id: string
                    user_id: string
                    certificate_id: string
                    issued_at: string
                    total_points: number
                    completed_exercises: number
                    is_public: boolean
                }
                Insert: Omit<Database['public']['Tables']['user_certificates']['Row'], 'id'>
                Update: Partial<Database['public']['Tables']['user_certificates']['Row']>
            }
            user_achievements: {
                Row: {
                    id: string
                    user_id: string
                    achievement_id: string
                    unlocked_at: string
                    points_awarded: number
                }
                Insert: Omit<Database['public']['Tables']['user_achievements']['Row'], 'id'>
                Update: Partial<Database['public']['Tables']['user_achievements']['Row']>
            }
            public_certificates: {
                Row: {
                    id: string
                    certificate_id: string
                    user_name: string
                    issued_at: string
                    total_points: number
                }
                Insert: Omit<Database['public']['Tables']['public_certificates']['Row'], 'id'>
                Update: Partial<Database['public']['Tables']['public_certificates']['Row']>
            }
        }
    }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
