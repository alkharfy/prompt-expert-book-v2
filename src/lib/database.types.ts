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
                    firebase_uid: string | null
                    referral_code: string | null
                    referred_by: string | null
                    registered_at: string
                    last_login_at: string | null
                    current_plan: string | null
                    plan_expires_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: Record<string, unknown>
                Update: Record<string, unknown>
            }
            devices: {
                Row: {
                    id: string
                    user_id: string
                    device_id: string
                    device_fingerprint: string
                    device_info: Record<string, unknown>
                    is_active: boolean
                    registered_at: string | null
                    last_used: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: Record<string, unknown>
                Update: Record<string, unknown>
            }
            sessions: {
                Row: {
                    id: string
                    user_id: string
                    device_id: string
                    session_token: string
                    expires_at: string
                    is_active: boolean
                    created_at: string
                }
                Insert: Record<string, unknown>
                Update: Record<string, unknown>
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
                Insert: Record<string, unknown>
                Update: Record<string, unknown>
            }
            bookmarks: {
                Row: {
                    id: string
                    user_id: string
                    page_path: string
                    page_title: string
                    created_at: string
                }
                Insert: Record<string, unknown>
                Update: Record<string, unknown>
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
                Insert: Record<string, unknown>
                Update: Record<string, unknown>
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
                Insert: Record<string, unknown>
                Update: Record<string, unknown>
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
                Insert: Record<string, unknown>
                Update: Record<string, unknown>
            }
            exercise_progress: {
                Row: {
                    id: string
                    user_id: string
                    exercise_id: string
                    exercise_type: string | null
                    is_completed: boolean
                    is_correct: boolean
                    points_earned: number
                    completed_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: Record<string, unknown>
                Update: Record<string, unknown>
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
                Insert: Record<string, unknown>
                Update: Record<string, unknown>
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
                Insert: Record<string, unknown>
                Update: Record<string, unknown>
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
                Insert: Record<string, unknown>
                Update: Record<string, unknown>
            }
            site_settings: {
                Row: {
                    id: string
                    key: string
                    value: Record<string, unknown>
                    created_at: string
                    updated_at: string
                }
                Insert: Record<string, unknown>
                Update: Record<string, unknown>
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
                Insert: Record<string, unknown>
                Update: Record<string, unknown>
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
                Insert: Record<string, unknown>
                Update: Record<string, unknown>
            }
            user_badges: {
                Row: {
                    id: string
                    user_id: string
                    badge_id: string
                    earned_at: string
                    is_featured: boolean
                }
                Insert: Record<string, unknown>
                Update: Record<string, unknown>
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
                Insert: Record<string, unknown>
                Update: Record<string, unknown>
            }
            user_achievements: {
                Row: {
                    id: string
                    user_id: string
                    achievement_id: string
                    unlocked_at: string
                    points_awarded: number
                }
                Insert: Record<string, unknown>
                Update: Record<string, unknown>
            }
            public_certificates: {
                Row: {
                    id: string
                    certificate_id: string
                    user_name: string
                    issued_at: string
                    total_points: number
                }
                Insert: Record<string, unknown>
                Update: Record<string, unknown>
            }
            user_notes: {
                Row: {
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
                Insert: Record<string, unknown>
                Update: Record<string, unknown>
            }
            mission_templates: {
                Row: {
                    id: string
                    title_ar: string
                    description_ar: string
                    icon: string
                    category: 'reading' | 'exercises' | 'notes' | 'tools' | 'streak' | 'social'
                    min_target: number
                    max_target: number
                    base_points: number
                    bonus_multiplier: number
                    requires_plan: string | null
                    min_level: number
                    is_active: boolean
                    created_at: string
                }
                Insert: Record<string, unknown>
                Update: Record<string, unknown>
            }
            user_daily_missions: {
                Row: {
                    id: string
                    user_id: string
                    mission_template_id: string
                    mission_date: string
                    target_value: number
                    current_value: number
                    status: 'active' | 'completed' | 'expired' | 'skipped'
                    points_earned: number
                    completed_at: string | null
                    slot_number: number
                    created_at: string
                }
                Insert: Record<string, unknown>
                Update: Record<string, unknown>
            }
            chat_messages: {
                Row: {
                    id: string
                    user_id: string
                    session_id: string
                    role: 'user' | 'assistant'
                    content: string
                    model: string | null
                    created_at: string
                }
                Insert: {
                    user_id: string
                    session_id: string
                    role: 'user' | 'assistant'
                    content: string
                    model?: string | null
                }
                Update: Record<string, unknown>
            }
            chat_ratings: {
                Row: {
                    id: string
                    user_id: string
                    message_content: string
                    query_content: string
                    model: string | null
                    rating: number
                    created_at: string
                }
                Insert: {
                    user_id: string
                    message_content: string
                    query_content: string
                    model?: string | null
                    rating: number
                }
                Update: Record<string, unknown>
            }
            subscriptions: {
                Row: {
                    id: string
                    user_id: string
                    plan_id: string
                    payment_id: string | null
                    status: string
                    starts_at: string
                    expires_at: string
                    upgraded_from: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    user_id: string
                    plan_id: string
                    expires_at: string
                    payment_id?: string | null
                    status?: string
                    starts_at?: string
                    upgraded_from?: string | null
                }
                Update: Record<string, unknown>
            }
            plan_features: {
                Row: {
                    id: string
                    plan_id: string
                    feature_key: string
                    is_enabled: boolean
                }
                Insert: {
                    plan_id: string
                    feature_key: string
                    is_enabled?: boolean
                }
                Update: Record<string, unknown>
            }
            payments: {
                Row: {
                    id: string
                    user_id: string
                    kashier_session_id: string | null
                    kashier_order_id: string | null
                    amount: number
                    currency: string
                    plan_id: string
                    payment_method: string | null
                    status: string
                    created_at: string
                    paid_at: string | null
                    notes: string | null
                }
                Insert: {
                    user_id: string
                    amount: number
                    plan_id: string
                    kashier_session_id?: string | null
                    kashier_order_id?: string | null
                    currency?: string
                    payment_method?: string | null
                    status?: string
                    notes?: string | null
                }
                Update: Record<string, unknown>
            }
            email_preferences: {
                Row: {
                    id: string
                    user_id: string
                    reminders_enabled: boolean
                    reminder_frequency: 'daily' | 'every_3_days' | 'weekly' | 'smart'
                    preferred_time: string
                    timezone: string
                    streak_reminders: boolean
                    mission_reminders: boolean
                    milestone_notifications: boolean
                    weekly_recap: boolean
                    last_email_sent_at: string | null
                    total_emails_sent: number
                    unsubscribe_token: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    user_id: string
                    reminders_enabled?: boolean
                    reminder_frequency?: 'daily' | 'every_3_days' | 'weekly' | 'smart'
                    preferred_time?: string
                    timezone?: string
                    streak_reminders?: boolean
                    mission_reminders?: boolean
                    milestone_notifications?: boolean
                    weekly_recap?: boolean
                }
                Update: Record<string, unknown>
            }
            email_log: {
                Row: {
                    id: string
                    user_id: string
                    email_type: string
                    subject: string
                    template_id: string | null
                    status: 'sent' | 'failed' | 'bounced'
                    sent_at: string
                }
                Insert: {
                    user_id: string
                    email_type: string
                    subject: string
                    template_id?: string | null
                    status?: 'sent' | 'failed' | 'bounced'
                }
                Update: Record<string, unknown>
            }
            referrals: {
                Row: {
                    id: string
                    referrer_id: string
                    referred_id: string
                    referral_code: string
                    status: string
                    reward_given: boolean
                    created_at: string
                }
                Insert: {
                    referrer_id: string
                    referred_id: string
                    referral_code: string
                    status?: string
                    reward_given?: boolean
                }
                Update: Record<string, unknown>
            }
        }
        Functions: {
            get_user_plan: {
                Args: { p_user_id: string }
                Returns: { plan_id: string | null; expires_at: string | null; status: string | null }[]
            }
            user_has_feature: {
                Args: { p_user_id: string; p_feature: string }
                Returns: boolean
            }
            has_successful_payment: {
                Args: { p_user_id: string }
                Returns: boolean
            }
        }
    }
}
