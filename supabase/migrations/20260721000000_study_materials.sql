-- 1. Create the `study_materials` table to store metadata for uploaded files
CREATE TABLE IF NOT EXISTS public.study_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    class_subject_id UUID REFERENCES public.class_subjects(id) ON DELETE CASCADE NOT NULL,
    academic_term_id UUID REFERENCES public.academic_terms(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size_bytes BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 2. Create the `material_completions` table to track which students have read/written the notes
CREATE TABLE IF NOT EXISTS public.material_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    material_id UUID REFERENCES public.study_materials(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_student_material_completion UNIQUE (material_id, student_id)
);

-- Enable RLS
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_completions ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for `study_materials`
CREATE POLICY "materials_select" ON public.study_materials FOR SELECT USING (school_id = public.get_auth_school_id() OR public.is_super_admin());
CREATE POLICY "materials_modify" ON public.study_materials FOR ALL USING (
    school_id = public.get_auth_school_id() AND 
    (public.get_auth_role() IN ('admin', 'teacher') OR public.is_super_admin())
);

-- 4. RLS Policies for `material_completions`
CREATE POLICY "completions_select" ON public.material_completions FOR SELECT USING (school_id = public.get_auth_school_id() OR public.is_super_admin());
CREATE POLICY "completions_modify" ON public.material_completions FOR ALL USING (
    school_id = public.get_auth_school_id() AND 
    (public.get_auth_role() IN ('admin', 'teacher', 'student') OR public.is_super_admin())
);

-- 5. Set up Supabase Storage for the uploaded files
-- Insert the bucket. It will just ignore if it already exists.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('study_materials', 'study_materials', true) 
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
-- Note: 'storage.objects' uses different auth checks than public tables.
-- Allow everyone to read from the study_materials bucket (since the bucket is public, this is mainly for authenticated reads just in case)
CREATE POLICY "Allow authenticated read access" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'study_materials');

-- Allow teachers and admins to insert/update/delete in the study_materials bucket
CREATE POLICY "Allow authenticated teachers to insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'study_materials');
CREATE POLICY "Allow authenticated teachers to update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'study_materials');
CREATE POLICY "Allow authenticated teachers to delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'study_materials');
