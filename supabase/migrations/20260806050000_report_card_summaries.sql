-- Create report card summaries table
CREATE TABLE IF NOT EXISTS public.report_card_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    academic_term_id UUID REFERENCES public.academic_terms(id) ON DELETE CASCADE NOT NULL,
    summary TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_student_term_summary UNIQUE(student_id, academic_term_id)
);

-- Index for quick lookups by student and term
CREATE INDEX idx_report_card_summaries_student_term ON public.report_card_summaries(student_id, academic_term_id);

-- Enable RLS
ALTER TABLE public.report_card_summaries ENABLE ROW LEVEL SECURITY;

-- Select Policy: Admins can see all, Parents can see their children's summaries, Students can see their own
CREATE POLICY "report_card_summaries_select" ON public.report_card_summaries
FOR SELECT USING (
    school_id = public.get_auth_school_id() 
    AND (
        public.get_auth_role() = 'admin' 
        OR public.get_auth_role() = 'super_admin'
        OR (public.get_auth_role() = 'parent' AND EXISTS (
            SELECT 1 FROM public.parent_student ps 
            WHERE ps.parent_id = auth.uid() AND ps.student_id = report_card_summaries.student_id
        ))
        OR (public.get_auth_role() = 'student' AND student_id = auth.uid())
    )
);

-- Modify Policy: Only Admins can manually modify (backend API uses service_role which bypasses RLS)
CREATE POLICY "report_card_summaries_modify" ON public.report_card_summaries
FOR ALL USING (
    school_id = public.get_auth_school_id() 
    AND (public.get_auth_role() = 'admin' OR public.get_auth_role() = 'super_admin')
);
