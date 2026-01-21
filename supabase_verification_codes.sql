-- Verification Codes Table
-- Run this SQL in your Supabase SQL Editor to create the required table

-- Create verification_codes table
CREATE TABLE IF NOT EXISTS public.verification_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    code VARCHAR(8) NOT NULL,
    is_used BOOLEAN DEFAULT false,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add is_verified column to users table if not exists
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_verification_codes_user_id ON public.verification_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_codes_code ON public.verification_codes(code);

-- Enable Row Level Security
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read their own codes
DROP POLICY IF EXISTS "Users can view own verification codes" ON public.verification_codes;
CREATE POLICY "Users can view own verification codes" ON public.verification_codes
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Allow service role to do everything
DROP POLICY IF EXISTS "Service role full access" ON public.verification_codes;
CREATE POLICY "Service role full access" ON public.verification_codes
    FOR ALL USING (auth.role() = 'service_role');

-- Policy: Allow anonymous to insert (for registration)
DROP POLICY IF EXISTS "Anonymous can insert verification codes" ON public.verification_codes;
CREATE POLICY "Anonymous can insert verification codes" ON public.verification_codes
    FOR INSERT WITH CHECK (true);

-- Policy: Allow anonymous to select (for verification)
DROP POLICY IF EXISTS "Anonymous can select verification codes" ON public.verification_codes;
CREATE POLICY "Anonymous can select verification codes" ON public.verification_codes
    FOR SELECT USING (true);

-- Policy: Allow anonymous to update (for marking as used)
DROP POLICY IF EXISTS "Anonymous can update verification codes" ON public.verification_codes;
CREATE POLICY "Anonymous can update verification codes" ON public.verification_codes
    FOR UPDATE USING (true);

-- Grant necessary permissions
GRANT ALL ON public.verification_codes TO anon;
GRANT ALL ON public.verification_codes TO authenticated;
GRANT ALL ON public.verification_codes TO service_role;
