-- 20260806020000_grade_breakdown_and_publishing.sql
-- Adds CA1, CA2, and Exam breakdown to grades, plus Admin publishing approval workflow

-- 1. Add new grading components and approval workflow columns
ALTER TABLE public.grades
ADD COLUMN ca1_score NUMERIC(5,2) DEFAULT 0 CHECK (ca1_score >= 0 AND ca1_score <= 20),
ADD COLUMN ca2_score NUMERIC(5,2) DEFAULT 0 CHECK (ca2_score >= 0 AND ca2_score <= 20),
ADD COLUMN exam_score NUMERIC(5,2) DEFAULT 0 CHECK (exam_score >= 0 AND exam_score <= 60),
ADD COLUMN status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
ADD COLUMN published_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN published_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. Modify grade_value constraints to allow null temporarily (if needed) or keep as is (since it acts as the total)
-- We'll keep grade_value as the sum (CA1 + CA2 + Exam). The application logic handles this.
