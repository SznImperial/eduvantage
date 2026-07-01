-- Migration: Add Ansar-Ud-Deen Features to EduVantage SaaS (Multi-Tenant Scoped)
-- Path: supabase/migrations/20260702000000_ansar_deen_features.sql

-- 1. Create TEACHERS metadata table (extends profiles for teachers)
CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    phone TEXT,
    specialization TEXT,
    qualification TEXT,
    joined_date DATE DEFAULT CURRENT_DATE NOT NULL
);

-- 2. Create TIMETABLE_SLOTS table
CREATE TABLE IF NOT EXISTS public.timetable_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    class_subject_id UUID REFERENCES public.class_subjects(id) ON DELETE CASCADE NOT NULL,
    day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room TEXT NOT NULL,
    CHECK (start_time < end_time),
    CONSTRAINT unique_school_timetable_slot UNIQUE(school_id, class_subject_id, day_of_week, start_time)
);

-- 3. Create FEE_RECORDS table
CREATE TABLE IF NOT EXISTS public.fee_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    term TEXT NOT NULL CHECK (term IN ('1st Term', '2nd Term', '3rd Term')),
    academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE CASCADE NOT NULL,
    amount_owed NUMERIC NOT NULL DEFAULT 0 CHECK (amount_owed >= 0),
    amount_paid NUMERIC NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
    status TEXT NOT NULL CHECK (status IN ('paid', 'partial', 'unpaid')),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_student_fee_term UNIQUE(student_id, term, academic_year_id)
);

-- 4. Create ASSIGNMENTS table
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    class_subject_id UUID REFERENCES public.class_subjects(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create SUBMISSIONS table
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    submission_text TEXT NOT NULL,
    file_url TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    grade TEXT,
    feedback TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'submitted', 'graded')) DEFAULT 'submitted',
    CONSTRAINT unique_student_assignment_submission UNIQUE (assignment_id, student_id)
);

-- 6. Create STUDENT_SUBJECTS table (Elective Registrations)
CREATE TABLE IF NOT EXISTS public.student_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    class_subject_id UUID REFERENCES public.class_subjects(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_student_elective_subject UNIQUE (student_id, class_subject_id)
);

-- 7. Create CBT_EXAMS table
CREATE TABLE IF NOT EXISTS public.cbt_exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    class_subject_id UUID REFERENCES public.class_subjects(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    status TEXT NOT NULL CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected')) DEFAULT 'draft',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Create CBT_QUESTIONS table
CREATE TABLE IF NOT EXISTS public.cbt_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    exam_id UUID REFERENCES public.cbt_exams(id) ON DELETE CASCADE NOT NULL,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option TEXT NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D'))
);

-- 9. Create CBT_SUBMISSIONS table
CREATE TABLE IF NOT EXISTS public.cbt_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    exam_id UUID REFERENCES public.cbt_exams(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    score NUMERIC NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL DEFAULT 0,
    tab_switch_count INTEGER NOT NULL DEFAULT 0,
    noise_spike_count INTEGER NOT NULL DEFAULT 0,
    proctor_violated BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL CHECK (status IN ('submitted', 'released', 'withheld')) DEFAULT 'submitted',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_student_exam UNIQUE (exam_id, student_id)
);

-- 10. Upgrade ANNOUNCEMENTS table to support targeted audiences
ALTER TABLE public.announcements 
ADD COLUMN IF NOT EXISTS audience_type TEXT NOT NULL DEFAULT 'all' CHECK (audience_type IN ('all', 'class', 'student')),
ADD COLUMN IF NOT EXISTS audience_id UUID;

-- ----------------------------------------------------
-- ENABLE ROW LEVEL SECURITY (RLS) ON NEW TABLES
-- ----------------------------------------------------
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_submissions ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- ROW LEVEL SECURITY POLICIES
-- ----------------------------------------------------

-- 1. Teachers Metadata policies
CREATE POLICY "teachers_select" ON public.teachers FOR SELECT USING (school_id = public.get_auth_school_id() OR public.is_super_admin());
CREATE POLICY "teachers_modify" ON public.teachers FOR ALL USING ((school_id = public.get_auth_school_id() AND public.get_auth_role() = 'admin') OR public.is_super_admin());

-- 2. Timetable Slots policies
CREATE POLICY "timetable_slots_select" ON public.timetable_slots FOR SELECT USING (school_id = public.get_auth_school_id() OR public.is_super_admin());
CREATE POLICY "timetable_slots_modify" ON public.timetable_slots FOR ALL USING ((school_id = public.get_auth_school_id() AND public.get_auth_role() = 'admin') OR public.is_super_admin());

-- 3. Fee Records policies
CREATE POLICY "fee_records_select" ON public.fee_records FOR SELECT USING (
    school_id = public.get_auth_school_id() 
    OR public.is_super_admin()
    OR (
        public.get_auth_role() = 'student' 
        AND student_id = auth.uid()
    )
    OR (
        public.get_auth_role() = 'parent' 
        AND student_id IN (SELECT student_id FROM public.parent_student WHERE parent_id = auth.uid())
    )
);
CREATE POLICY "fee_records_modify" ON public.fee_records FOR ALL USING ((school_id = public.get_auth_school_id() AND public.get_auth_role() = 'admin') OR public.is_super_admin());

-- 4. Assignments policies
CREATE POLICY "assignments_select" ON public.assignments FOR SELECT USING (school_id = public.get_auth_school_id() OR public.is_super_admin());
CREATE POLICY "assignments_modify" ON public.assignments FOR ALL USING (
    (school_id = public.get_auth_school_id() AND public.get_auth_role() IN ('admin', 'teacher')) 
    OR public.is_super_admin()
);

-- 5. Submissions policies
CREATE POLICY "submissions_select" ON public.submissions FOR SELECT USING (
    school_id = public.get_auth_school_id() 
    OR public.is_super_admin()
    OR (
        public.get_auth_role() = 'student' 
        AND student_id = auth.uid()
    )
    OR (
        public.get_auth_role() = 'parent' 
        AND student_id IN (SELECT student_id FROM public.parent_student WHERE parent_id = auth.uid())
    )
);
CREATE POLICY "submissions_insert" ON public.submissions FOR INSERT WITH CHECK (
    (school_id = public.get_auth_school_id() AND public.get_auth_role() = 'student' AND student_id = auth.uid())
    OR public.is_super_admin()
);
CREATE POLICY "submissions_update" ON public.submissions FOR UPDATE USING (
    (school_id = public.get_auth_school_id() AND public.get_auth_role() IN ('admin', 'teacher', 'student'))
    OR public.is_super_admin()
);
CREATE POLICY "submissions_delete" ON public.submissions FOR DELETE USING (
    (school_id = public.get_auth_school_id() AND public.get_auth_role() = 'admin')
    OR public.is_super_admin()
);

-- 6. Student Subjects Electives policies
CREATE POLICY "student_subjects_select" ON public.student_subjects FOR SELECT USING (school_id = public.get_auth_school_id() OR public.is_super_admin());
CREATE POLICY "student_subjects_modify" ON public.student_subjects FOR ALL USING ((school_id = public.get_auth_school_id() AND public.get_auth_role() = 'admin') OR public.is_super_admin());

-- 7. CBT Exams policies
CREATE POLICY "cbt_exams_select" ON public.cbt_exams FOR SELECT USING (school_id = public.get_auth_school_id() OR public.is_super_admin());
CREATE POLICY "cbt_exams_modify" ON public.cbt_exams FOR ALL USING (
    (school_id = public.get_auth_school_id() AND public.get_auth_role() IN ('admin', 'teacher'))
    OR public.is_super_admin()
);

-- 8. CBT Questions policies
CREATE POLICY "cbt_questions_select" ON public.cbt_questions FOR SELECT USING (school_id = public.get_auth_school_id() OR public.is_super_admin());
CREATE POLICY "cbt_questions_modify" ON public.cbt_questions FOR ALL USING (
    (school_id = public.get_auth_school_id() AND public.get_auth_role() IN ('admin', 'teacher'))
    OR public.is_super_admin()
);

-- 9. CBT Submissions policies
CREATE POLICY "cbt_submissions_select" ON public.cbt_submissions FOR SELECT USING (
    school_id = public.get_auth_school_id() 
    OR public.is_super_admin()
    OR (
        public.get_auth_role() = 'student' 
        AND student_id = auth.uid()
    )
    OR (
        public.get_auth_role() = 'parent' 
        AND student_id IN (SELECT student_id FROM public.parent_student WHERE parent_id = auth.uid())
    )
);
CREATE POLICY "cbt_submissions_insert" ON public.cbt_submissions FOR INSERT WITH CHECK (
    (school_id = public.get_auth_school_id() AND public.get_auth_role() = 'student' AND student_id = auth.uid())
    OR public.is_super_admin()
);
CREATE POLICY "cbt_submissions_update" ON public.cbt_submissions FOR UPDATE USING (
    (school_id = public.get_auth_school_id() AND public.get_auth_role() IN ('admin', 'teacher'))
    OR public.is_super_admin()
);

-- Update announcements select policy to support targeted class and student view scope
DROP POLICY IF EXISTS "announcements_select" ON public.announcements;
CREATE POLICY "announcements_select" ON public.announcements FOR SELECT USING (
    school_id = public.get_auth_school_id()
    OR public.is_super_admin()
    OR (
        audience_type = 'all'
    )
    OR (
        audience_type = 'class' 
        AND audience_id IN (
            SELECT class_id FROM public.enrollments WHERE student_id = auth.uid()
            UNION
            SELECT class_id FROM public.class_subjects WHERE teacher_id = auth.uid()
            UNION
            SELECT class_id FROM public.parent_student ps JOIN public.enrollments e ON ps.student_id = e.student_id WHERE ps.parent_id = auth.uid()
        )
    )
    OR (
        audience_type = 'student'
        AND (
            audience_id = auth.uid()
            OR audience_id IN (SELECT student_id FROM public.parent_student WHERE parent_id = auth.uid())
        )
    )
);

-- ----------------------------------------------------
-- STORAGE BUCKET FOR COURSEWORK SUBMISSIONS
-- ----------------------------------------------------

-- Insert 'submissions' bucket configuration
INSERT INTO storage.buckets (id, name, public)
VALUES ('submissions', 'submissions', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for submissions bucket
CREATE POLICY "Submissions Storage Public Read Access"
ON storage.objects FOR SELECT USING (bucket_id = 'submissions');

CREATE POLICY "Submissions Storage Authenticated Insert Access"
ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'submissions'
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Submissions Storage Owner Delete Access"
ON storage.objects FOR DELETE USING (
    bucket_id = 'submissions'
    AND auth.uid() = owner
);
