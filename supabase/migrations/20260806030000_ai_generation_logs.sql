-- 20260806030000_ai_generation_logs.sql
-- Adds usage tracking for the AI Report Card Generation feature

CREATE TABLE public.ai_generation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    academic_term_id UUID NOT NULL REFERENCES public.academic_terms(id) ON DELETE CASCADE,
    generation_count INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_generation_quota UNIQUE(teacher_id, student_id, academic_term_id)
);

-- Enable RLS
ALTER TABLE public.ai_generation_logs ENABLE ROW LEVEL SECURITY;

-- Setup basic tenant isolation policies
CREATE POLICY "ai_gen_select" 
ON public.ai_generation_logs 
FOR SELECT 
USING (school_id = public.get_auth_school_id());

CREATE POLICY "ai_gen_modify" 
ON public.ai_generation_logs 
FOR ALL 
USING (school_id = public.get_auth_school_id());
