-- IMP3RIAL EDU Demo Seed Data SQL
-- Paste this script into the Supabase SQL Editor AFTER running the initial migration.
-- Make sure to update the UUID placeholders if you wish to link directly to specific users,
-- or simply use this to populate reference catalogs (subjects, academic terms).

-- 1. Create two test schools (tenants)
INSERT INTO public.schools (id, name, slug) VALUES 
('11111111-1111-1111-1111-111111111111', 'Aetherium Academy', 'aetherium'),
('22222222-2222-2222-2222-222222222222', 'Zenith Heights High', 'zenith')
ON CONFLICT (slug) DO NOTHING;

-- 2. Setup Academic Years / Terms for both schools
INSERT INTO public.academic_years (id, school_id, name, start_date, end_date, is_active) VALUES
('11111111-aaaa-1111-aaaa-111111111111', '11111111-1111-1111-1111-111111111111', '2026 Fall Term', '2026-09-01', '2026-12-20', true),
('22222222-bbbb-2222-bbbb-222222222222', '22222222-2222-2222-2222-222222222222', '2026 Academic Year', '2026-08-15', '2027-06-01', true)
ON CONFLICT DO NOTHING;

-- 3. Setup Subjects for Aetherium Academy
INSERT INTO public.subjects (school_id, name, code) VALUES
('11111111-1111-1111-1111-111111111111', 'Quantum Physics', 'PHY-401'),
('11111111-1111-1111-1111-111111111111', 'Data Structures & Algorithms', 'CS-202'),
('11111111-1111-1111-1111-111111111111', 'Creative Writing', 'ENG-102'),
('11111111-1111-1111-1111-111111111111', 'Multivariable Calculus', 'MTH-302')
ON CONFLICT DO NOTHING;

-- 4. Setup Subjects for Zenith Heights High
INSERT INTO public.subjects (school_id, name, code) VALUES
('22222222-2222-2222-2222-222222222222', 'General Biology', 'BIO-101'),
('22222222-2222-2222-2222-222222222222', 'Algebra I', 'MTH-101'),
('22222222-2222-2222-2222-222222222222', 'World History', 'HIS-101'),
('22222222-2222-2222-2222-222222222222', 'Introduction to French', 'FRN-101')
ON CONFLICT DO NOTHING;

-- 5. Setup Classes for Aetherium Academy
INSERT INTO public.classes (id, school_id, academic_year_id, name, grade_level) VALUES
('11111111-cccc-1111-cccc-111111111111', '11111111-1111-1111-1111-111111111111', '11111111-aaaa-1111-aaaa-111111111111', 'Class 12-Science A', '12'),
('11111111-dddd-1111-dddd-111111111111', '11111111-1111-1111-1111-111111111111', '11111111-aaaa-1111-aaaa-111111111111', 'Class 11-Arts B', '11')
ON CONFLICT DO NOTHING;

-- 6. Setup Classes for Zenith Heights High
INSERT INTO public.classes (id, school_id, academic_year_id, name, grade_level) VALUES
('22222222-cccc-2222-cccc-222222222222', '22222222-2222-2222-2222-222222222222', '22222222-bbbb-2222-bbbb-222222222222', 'Grade 9 - Section Red', '9'),
('22222222-dddd-2222-dddd-222222222222', '22222222-2222-2222-2222-222222222222', '22222222-bbbb-2222-bbbb-222222222222', 'Grade 9 - Section Blue', '9')
ON CONFLICT DO NOTHING;
