'use server';

import { createClient } from '@/lib/supabaseServer';
import { createAdminClient } from '@/lib/supabaseAdmin';
import { redirect } from 'next/navigation';

/**
 * Normalizes internal and database exceptions to simple, non-confusing user messages.
 */
function getFriendlyError(error) {
  if (!error) return 'Something went wrong. Please try again later.';
  
  const msg = typeof error === 'string' ? error : (error.message || '');
  
  // Let standard user-facing auth, verification, and validation messages pass through directly
  if (
    msg.includes('required') || 
    msg.includes('Unauthorized') || 
    msg.includes('credentials') || 
    msg.includes('login') || 
    msg.includes('Email') || 
    msg.includes('email') || 
    msg.includes('password') || 
    msg.includes('Password') || 
    msg.includes('confirm') || 
    msg.includes('Confirm') || 
    msg.includes('verify') || 
    msg.includes('Verify') || 
    msg.includes('registered') || 
    msg.includes('rate') || 
    msg.includes('request') || 
    msg.includes('valid') || 
    msg.includes('short') ||
    msg.includes('Session') ||
    msg.includes('profile context')
  ) {
    return msg;
  }
  
  // Map specific duplicate constraint errors to helpful product copy
  if (msg.includes('duplicate key') || msg.includes('already exists') || msg.includes('unique constraint')) {
    if (msg.includes('profiles_email_key') || msg.includes('email')) {
      return 'An account with this email address already exists.';
    }
    if (msg.includes('schools_slug_key') || msg.includes('slug')) {
      return 'This school workspace link is already taken. Please choose another one.';
    }
    return 'This record already exists in our database.';
  }

  // Log internal errors to system console for diagnostics, but show friendly fallback to user
  console.error('EduVantage Internal DB Exception:', msg);
  return 'Database is under maintenance. Please try again later.';
}

/**
 * Helper to retrieve current authenticated user's session context on the server safely.
 * Throws unauthorized errors if token verification fails.
 */
async function getAuthContext() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Unauthorized session.');
  
  const { data: profile, error: pError } = await supabase
    .from('profiles')
    .select('school_id, role')
    .eq('id', user.id)
    .single();
    
  if (pError || !profile) throw new Error('Public profile context not found.');
  return { supabase, user, schoolId: profile.school_id, role: profile.role };
}

/**
 * Registers a new School (Tenant) and provisions the creator as the School Admin.
 */
export async function signUpSchool(prevState, formData) {
  const schoolName = formData.get('schoolName');
  const slug = formData.get('schoolSlug')?.toLowerCase().trim();
  const firstName = formData.get('firstName');
  const lastName = formData.get('lastName');
  const email = formData.get('email');
  const password = formData.get('password');

  if (!schoolName || !slug || !firstName || !lastName || !email || !password) {
    return { error: 'All fields are required.' };
  }

  const supabase = await createClient();

  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    return { error: getFriendlyError(authError) };
  }

  const user = authData.user;
  if (!user) {
    return { error: 'Auth signup succeeded but user details were not returned.' };
  }

  // 2. Use admin client to write to schools and profiles bypassing initial RLS constraints
  const adminClient = createAdminClient();

  // Create the School (tenant)
  const { data: schoolData, error: schoolError } = await adminClient
    .from('schools')
    .insert([{ name: schoolName, slug }])
    .select()
    .single();

  if (schoolError) {
    // Cleanup auth user to allow retrying
    await adminClient.auth.admin.deleteUser(user.id);
    return { error: getFriendlyError(schoolError) };
  }

  // Create the Profile and associate it with the School as an admin
  const { error: profileError } = await adminClient
    .from('profiles')
    .insert([
      {
        id: user.id,
        school_id: schoolData.id,
        first_name: firstName,
        last_name: lastName,
        role: 'admin',
        email,
      },
    ]);

  if (profileError) {
    // Cleanup school & user
    await adminClient.from('schools').delete().eq('id', schoolData.id);
    await adminClient.auth.admin.deleteUser(user.id);
    return { error: getFriendlyError(profileError) };
  }

  return { success: true };
}

/**
 * Handles user sign in.
 */
export async function loginUser(prevState, formData) {
  const email = formData.get('email');
  const password = formData.get('password');

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: getFriendlyError(error) };
  }

  return { success: true };
}

/**
 * Logs out the current user and redirects to login page.
 */
export async function logoutUser() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

/**
 * Creates a new user (Teacher/Student) within the Admin's school.
 * Requires the calling user to be an admin of their school.
 */
export async function createUserAccount(formData) {
  const firstName = formData.get('firstName');
  const lastName = formData.get('lastName');
  const email = formData.get('email');
  const password = formData.get('password');
  const role = formData.get('role'); // 'teacher', 'student', or 'parent'

  if (!firstName || !lastName || !email || !password || !role) {
    return { error: 'All fields are required.' };
  }

  try {
    const { schoolId, role: currentRole } = await getAuthContext();
    if (currentRole !== 'admin' && currentRole !== 'super_admin') {
      return { error: 'Unauthorized: Only school administrators can create accounts.' };
    }

    const adminClient = createAdminClient();

    // Enforce SaaS Subscription limits on student creations
    if (role === 'student') {
      const { count: studentCount, error: countErr } = await adminClient
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('role', 'student');

      if (countErr) return { error: getFriendlyError(countErr) };

      const { data: school, error: schoolErr } = await adminClient
        .from('schools')
        .select('max_student_limit')
        .eq('id', schoolId)
        .single();

      if (schoolErr) return { error: getFriendlyError(schoolErr) };

      if (studentCount >= school.max_student_limit) {
        return { 
          error: `Limit Reached: Your current plan allows up to ${school.max_student_limit} students. You currently have ${studentCount}. Please upgrade your plan in the Billing dashboard.` 
        };
      }
    }

    // Use admin client to create the authentication account for the new user
    const { data: newAuthData, error: createAuthError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm emails to bypass SMTP configuration in development
    });

    if (createAuthError) {
      return { error: getFriendlyError(createAuthError) };
    }

    // Create the profile for the new user
    const { error: newProfileError } = await adminClient
      .from('profiles')
      .insert([
        {
          id: newAuthData.user.id,
          school_id: schoolId,
          first_name: firstName,
          last_name: lastName,
          role: role,
          email: email,
        }
      ]);

    if (newProfileError) {
      // Rollback auth creation
      await adminClient.auth.admin.deleteUser(newAuthData.user.id);
      return { error: getFriendlyError(newProfileError) };
    }

    return { success: true };
  } catch (err) {
    return { error: getFriendlyError(err) };
  }
}

/**
 * Deletes a user profile (and auth account). Admin only.
 */
export async function deleteUserAction(id) {
  try {
    const { role } = await getAuthContext();
    if (role !== 'admin') return { error: 'Unauthorized.' };

    const adminClient = createAdminClient();
    // Delete profile (which triggers cascade deletions in other tables)
    const { error: pError } = await adminClient.from('profiles').delete().eq('id', id);
    if (pError) return { error: getFriendlyError(pError) };

    // Delete authentication credential user
    const { error: aError } = await adminClient.auth.admin.deleteUser(id);
    if (aError) {
      // Note: If profile was deleted but auth deletion failed, we log it but proceed
      console.warn(`Auth deletion failed for ${id}: ${aError.message}`);
    }

    return { success: true };
  } catch (err) {
    return { error: getFriendlyError(err) };
  }
}

/**
 * Creates an Academic Year term. Admin only.
 */
export async function createAcademicYearAction(name, startDate, endDate) {
  try {
    const { supabase, schoolId, role } = await getAuthContext();
    if (role !== 'admin') return { error: 'Unauthorized.' };

    const { error } = await supabase.from('academic_years').insert([{
      school_id: schoolId,
      name,
      start_date: startDate,
      end_date: endDate,
      is_active: true
    }]);

    if (error) return { error: getFriendlyError(error) };
    return { success: true };
  } catch (err) {
    return { error: getFriendlyError(err) };
  }
}

/**
 * Creates a Class section. Admin only.
 */
export async function createClassAction(name, gradeLevel, academicYearId) {
  try {
    const { supabase, schoolId, role } = await getAuthContext();
    if (role !== 'admin' && role !== 'super_admin') return { error: 'Unauthorized.' };

    // Enforce SaaS Subscription limits on class creations
    const { count: classCount, error: countErr } = await supabase
      .from('classes')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', schoolId);

    if (countErr) return { error: getFriendlyError(countErr) };

    const { data: school, error: schoolErr } = await supabase
      .from('schools')
      .select('max_class_limit')
      .eq('id', schoolId)
      .single();

    if (schoolErr) return { error: getFriendlyError(schoolErr) };

    if (classCount >= school.max_class_limit) {
      return { 
        error: `Limit Reached: Your current plan allows up to ${school.max_class_limit} classes. You currently have ${classCount}. Please upgrade your plan in the Billing dashboard.` 
      };
    }

    const { error } = await supabase.from('classes').insert([{
      school_id: schoolId,
      name,
      grade_level: gradeLevel,
      academic_year_id: academicYearId
    }]);

    if (error) return { error: getFriendlyError(error) };
    return { success: true };
  } catch (err) {
    return { error: getFriendlyError(err) };
  }
}

/**
 * Creates a Catalog Subject. Admin only.
 */
export async function createSubjectAction(name, code) {
  try {
    const { supabase, schoolId, role } = await getAuthContext();
    if (role !== 'admin') return { error: 'Unauthorized.' };

    const { error } = await supabase.from('subjects').insert([{
      school_id: schoolId,
      name,
      code
    }]);

    if (error) return { error: getFriendlyError(error) };
    return { success: true };
  } catch (err) {
    return { error: getFriendlyError(err) };
  }
}

/**
 * Allocates a Subject to a Class and assigns a Teacher. Admin only.
 */
export async function allocateCourseAction(classId, subjectId, teacherId) {
  try {
    const { supabase, schoolId, role } = await getAuthContext();
    if (role !== 'admin') return { error: 'Unauthorized.' };

    const { error } = await supabase.from('class_subjects').insert([{
      school_id: schoolId,
      class_id: classId,
      subject_id: subjectId,
      teacher_id: teacherId === '' ? null : teacherId
    }]);

    if (error) return { error: getFriendlyError(error) };
    return { success: true };
  } catch (err) {
    return { error: getFriendlyError(err) };
  }
}

/**
 * Enrolls a Student in a Class section. Admin only.
 */
export async function enrollStudentAction(studentId, classId) {
  try {
    const { supabase, schoolId, role } = await getAuthContext();
    if (role !== 'admin') return { error: 'Unauthorized.' };

    const { error } = await supabase.from('enrollments').insert([{
      school_id: schoolId,
      student_id: studentId,
      class_id: classId
    }]);

    if (error) return { error: getFriendlyError(error) };
    return { success: true };
  } catch (err) {
    return { error: getFriendlyError(err) };
  }
}

/**
 * Publishes/Saves school Announcements. Admin only.
 */
export async function createAnnouncementAction(title, content, audienceType = 'all', audienceId = null) {
  try {
    const { supabase, schoolId, role, user } = await getAuthContext();
    if (role !== 'admin') return { error: 'Unauthorized.' };

    const { error } = await supabase.from('announcements').insert([{
      school_id: schoolId,
      title,
      content,
      created_by: user.id,
      audience_type: audienceType,
      audience_id: audienceId || null
    }]);

    if (error) return { error: getFriendlyError(error) };
    return { success: true };
  } catch (err) {
    return { error: getFriendlyError(err) };
  }
}

/**
 * Removes an Announcement. Admin only.
 */
export async function deleteAnnouncementAction(id) {
  try {
    const { supabase, role } = await getAuthContext();
    if (role !== 'admin') return { error: 'Unauthorized.' };

    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) return { error: getFriendlyError(error) };
    return { success: true };
  } catch (err) {
    return { error: getFriendlyError(err) };
  }
}

/**
 * Saves or updates Class Attendance logs. Teachers/Admins only.
 */
export async function saveAttendanceAction(classId, date, records) {
  try {
    const { supabase, schoolId, role } = await getAuthContext();
    if (role !== 'admin' && role !== 'teacher') return { error: 'Unauthorized.' };

    const upserts = records.map(rec => ({
      school_id: schoolId,
      student_id: rec.student_id,
      class_id: classId,
      date: date,
      status: rec.status,
      notes: rec.notes || null
    }));

    const { error } = await supabase
      .from('attendance')
      .upsert(upserts, { onConflict: 'student_id,class_id,date' });

    if (error) return { error: getFriendlyError(error) };
    return { success: true };
  } catch (err) {
    return { error: getFriendlyError(err) };
  }
}

/**
 * Saves or updates Student Grades/Marks. Teachers/Admins only.
 */
export async function saveGradesAction(classSubjectId, studentIds, upserts) {
  try {
    const { supabase, schoolId, role, user } = await getAuthContext();
    if (role !== 'admin' && role !== 'teacher') return { error: 'Unauthorized.' };

    // 1. Delete existing marks for these students under this course
    const { error: delError } = await supabase
      .from('grades')
      .delete()
      .eq('class_subject_id', classSubjectId)
      .in('student_id', studentIds);

    if (delError) return { error: getFriendlyError(delError) };

    // 2. Format insert payloads
    const payloads = upserts.map(u => ({
      school_id: schoolId,
      student_id: u.student_id,
      class_subject_id: classSubjectId,
      grade_value: u.grade_value,
      remarks: u.remarks || null,
      graded_by: user.id
    }));

    // 3. Perform inserts
    if (payloads.length > 0) {
      const { error: insertError } = await supabase.from('grades').insert(payloads);
      if (insertError) return { error: getFriendlyError(insertError) };
    }

    return { success: true };
  } catch (err) {
    return { error: getFriendlyError(err) };
  }
}

/**
 * Updates the subscription tier for a School (Tenant).
 * Triggers changes in student and class limits.
 */
export async function updateSubscriptionAction(schoolId, tier) {
  try {
    const { supabase, role } = await getAuthContext();
    if (role !== 'admin' && role !== 'super_admin') {
      return { error: 'Unauthorized.' };
    }

    let maxStudentLimit = 10;
    let maxClassLimit = 3;

    if (tier === 'starter') {
      maxStudentLimit = 50;
      maxClassLimit = 10;
    } else if (tier === 'growth') {
      maxStudentLimit = 500;
      maxClassLimit = 40;
    } else if (tier === 'enterprise') {
      maxStudentLimit = 9999;
      maxClassLimit = 99;
    }

    const { error } = await supabase
      .from('schools')
      .update({
        subscription_tier: tier,
        max_student_limit: maxStudentLimit,
        max_class_limit: maxClassLimit,
        subscription_status: 'active'
      })
      .eq('id', schoolId);

    if (error) return { error: getFriendlyError(error) };
    return { success: true };
  } catch (err) {
    return { error: getFriendlyError(err) };
  }
}

/**
 * Links a parent profile to a student profile. Admin only.
 */
export async function linkParentStudentAction(parentId, studentId) {
  try {
    const { schoolId, role } = await getAuthContext();
    if (role !== 'admin' && role !== 'super_admin') return { error: 'Unauthorized.' };

    const adminClient = createAdminClient();
    const { error } = await adminClient
      .from('parent_student')
      .insert([{
        school_id: schoolId,
        parent_id: parentId,
        student_id: studentId
      }]);

    if (error) return { error: getFriendlyError(error) };
    return { success: true };
  } catch (err) {
    return { error: getFriendlyError(err) };
  }
}

/**
 * Unlinks a parent profile from a student profile. Admin only.
 */
export async function unlinkParentStudentAction(id) {
  try {
    const { role } = await getAuthContext();
    if (role !== 'admin' && role !== 'super_admin') return { error: 'Unauthorized.' };

    const adminClient = createAdminClient();
    const { error } = await adminClient
      .from('parent_student')
      .delete()
      .eq('id', id);

    if (error) return { error: getFriendlyError(error) };
    return { success: true };
  } catch (err) {
    return { error: getFriendlyError(err) };
  }
}

/**
 * Creates a Timetable Slot. Admin only.
 */
export async function createTimetableSlotAction(classSubjectId, dayOfWeek, startTime, endTime, room) {
  try {
    const { supabase, schoolId, role } = await getAuthContext();
    if (role !== 'admin') return { error: 'Unauthorized.' };

    const { error } = await supabase.from('timetable_slots').insert([{
      school_id: schoolId,
      class_subject_id: classSubjectId,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      room
    }]);

    if (error) return { error: getFriendlyError(error) };
    return { success: true };
  } catch (err) {
    return { error: getFriendlyError(err) };
  }
}

/**
 * Deletes a Timetable Slot. Admin only.
 */
export async function deleteTimetableSlotAction(id) {
  try {
    const { supabase, role } = await getAuthContext();
    if (role !== 'admin') return { error: 'Unauthorized.' };

    const { error } = await supabase.from('timetable_slots').delete().eq('id', id);
    if (error) return { error: getFriendlyError(error) };
    return { success: true };
  } catch (err) {
    return { error: getFriendlyError(err) };
  }
}

/**
 * Creates/issues a Fee Record for a student. Admin only.
 */
export async function createFeeRecordAction(studentId, term, academicYearId, amountOwed, amountPaid, status) {
  try {
    const { supabase, schoolId, role } = await getAuthContext();
    if (role !== 'admin') return { error: 'Unauthorized.' };

    const { error } = await supabase.from('fee_records').insert([{
      school_id: schoolId,
      student_id: studentId,
      term,
      academic_year_id: academicYearId,
      amount_owed: parseFloat(amountOwed || 0),
      amount_paid: parseFloat(amountPaid || 0),
      status
    }]);

    if (error) return { error: getFriendlyError(error) };
    return { success: true };
  } catch (err) {
    return { error: getFriendlyError(err) };
  }
}

/**
 * Updates a Fee Record (e.g. payment updates). Admin only.
 */
export async function updateFeeRecordAction(id, amountPaid, status) {
  try {
    const { supabase, role } = await getAuthContext();
    if (role !== 'admin') return { error: 'Unauthorized.' };

    const { error } = await supabase.from('fee_records').update({
      amount_paid: parseFloat(amountPaid || 0),
      status,
      updated_at: new Date().toISOString()
    }).eq('id', id);

    if (error) return { error: getFriendlyError(error) };
    return { success: true };
  } catch (err) {
    return { error: getFriendlyError(err) };
  }
}

/**
 * Creates an Assignment. Teachers/Admins only.
 */
export async function createAssignmentAction(classSubjectId, title, description, dueDate) {
  try {
    const { supabase, schoolId, role } = await getAuthContext();
    if (role !== 'admin' && role !== 'teacher') return { error: 'Unauthorized.' };

    const { error } = await supabase.from('assignments').insert([{
      school_id: schoolId,
      class_subject_id: classSubjectId,
      title,
      description,
      due_date: dueDate
    }]);

    if (error) return { error: getFriendlyError(error) };
    return { success: true };
  } catch (err) {
    return { error: getFriendlyError(err) };
  }
}

/**
 * Deletes an Assignment. Teachers/Admins only.
 */
export async function deleteAssignmentAction(id) {
  try {
    const { supabase, role } = await getAuthContext();
    if (role !== 'admin' && role !== 'teacher') return { error: 'Unauthorized.' };

    const { error } = await supabase.from('assignments').delete().eq('id', id);
    if (error) return { error: getFriendlyError(error) };
    return { success: true };
  } catch (err) {
    return { error: getFriendlyError(err) };
  }
}

/**
 * Grades a student Submission. Teachers/Admins only.
 */
export async function gradeSubmissionAction(submissionId, grade, feedback) {
  try {
    const { supabase, role } = await getAuthContext();
    if (role !== 'admin' && role !== 'teacher') return { error: 'Unauthorized.' };

    const { error } = await supabase.from('submissions').update({
      grade,
      feedback,
      status: 'graded'
    }).eq('id', submissionId);

    if (error) return { error: getFriendlyError(error) };
    return { success: true };
  } catch (err) {
    return { error: getFriendlyError(err) };
  }
}

/**
 * Submits coursework assignment response. Student only.
 */
export async function submitAssignmentAction(assignmentId, submissionText, fileUrl) {
  try {
    const { supabase, schoolId, role, user } = await getAuthContext();
    if (role !== 'student') return { error: 'Unauthorized.' };

    const { error } = await supabase.from('submissions').upsert([{
      school_id: schoolId,
      assignment_id: assignmentId,
      student_id: user.id,
      submission_text: submissionText,
      file_url: fileUrl || null,
      status: 'submitted',
      submitted_at: new Date().toISOString()
    }], { onConflict: 'assignment_id, student_id' });

    if (error) return { error: getFriendlyError(error) };
    return { success: true };
  } catch (err) {
    return { error: getFriendlyError(err) };
  }
}

/**
 * Toggles elective subject assignment for a student. Admin only.
 */
export async function toggleStudentSubjectAction(studentId, classSubjectId, isEnrolled) {
  try {
    const { supabase, schoolId, role } = await getAuthContext();
    if (role !== 'admin') return { error: 'Unauthorized.' };

    if (isEnrolled) {
      // Enroll elective
      const { error } = await supabase.from('student_subjects').insert([{
        school_id: schoolId,
        student_id: studentId,
        class_subject_id: classSubjectId
      }]);
      if (error) return { error: getFriendlyError(error) };
    } else {
      // Unenroll elective
      const { error } = await supabase.from('student_subjects')
        .delete()
        .eq('student_id', studentId)
        .eq('class_subject_id', classSubjectId);
      if (error) return { error: getFriendlyError(error) };
    }
    return { success: true };
  } catch (err) {
    return { error: getFriendlyError(err) };
  }
}

/**
 * Creates a CBT Exam with multiple questions. Teachers/Admins only.
 */
export async function createCbtExamAction(title, classSubjectId, durationMinutes, questions) {
  try {
    const { supabase, schoolId, role, user } = await getAuthContext();
    if (role !== 'admin' && role !== 'teacher') return { error: 'Unauthorized.' };

    // 1. Insert exam
    const { data: exam, error: examError } = await supabase.from('cbt_exams').insert([{
      school_id: schoolId,
      class_subject_id: classSubjectId,
      title,
      duration_minutes: parseInt(durationMinutes || 0),
      status: role === 'admin' ? 'approved' : 'pending_approval',
      created_by: user.id
    }]).select().single();

    if (examError) return { error: getFriendlyError(examError) };

    // 2. Insert questions
    if (questions && questions.length > 0) {
      const questionsToInsert = questions.map(q => ({
        school_id: schoolId,
        exam_id: exam.id,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_option: q.correct_option
      }));

      const { error: qError } = await supabase.from('cbt_questions').insert(questionsToInsert);
      if (qError) {
        // Rollback exam insertion
        await supabase.from('cbt_exams').delete().eq('id', exam.id);
        return { error: getFriendlyError(qError) };
      }
    }

    return { success: true, examId: exam.id };
  } catch (err) {
    return { error: getFriendlyError(err) };
  }
}

/**
 * Deletes a CBT Exam. Teachers/Admins only.
 */
export async function deleteCbtExamAction(id) {
  try {
    const { supabase, role } = await getAuthContext();
    if (role !== 'admin' && role !== 'teacher') return { error: 'Unauthorized.' };

    const { error } = await supabase.from('cbt_exams').delete().eq('id', id);
    if (error) return { error: getFriendlyError(error) };
    return { success: true };
  } catch (err) {
    return { error: getFriendlyError(err) };
  }
}

/**
 * Audits/approves/rejects a CBT Exam. Admin only.
 */
export async function updateCbtExamStatusAction(id, status) {
  try {
    const { supabase, role } = await getAuthContext();
    if (role !== 'admin') return { error: 'Unauthorized.' };

    const { error } = await supabase.from('cbt_exams').update({ status }).eq('id', id);
    if (error) return { error: getFriendlyError(error) };
    return { success: true };
  } catch (err) {
    return { error: getFriendlyError(err) };
  }
}

/**
 * Releases CBT exam submission scores. Admin only.
 */
export async function releaseCbtResultsAction(examId) {
  try {
    const { supabase, role } = await getAuthContext();
    if (role !== 'admin') return { error: 'Unauthorized.' };

    const { error } = await supabase.from('cbt_submissions').update({ status: 'released' }).eq('exam_id', examId);
    if (error) return { error: getFriendlyError(error) };
    return { success: true };
  } catch (err) {
    return { error: getFriendlyError(err) };
  }
}

/**
 * Withholds CBT exam submission scores. Admin only.
 */
export async function withholdCbtResultsAction(examId) {
  try {
    const { supabase, role } = await getAuthContext();
    if (role !== 'admin') return { error: 'Unauthorized.' };

    const { error } = await supabase.from('cbt_submissions').update({ status: 'withheld' }).eq('exam_id', examId);
    if (error) return { error: getFriendlyError(error) };
    return { success: true };
  } catch (err) {
    return { error: getFriendlyError(err) };
  }
}

/**
 * Saves a student's CBT submission score and proctoring metrics. Student only.
 */
export async function submitCbtExamAction(examId, answers, score, totalQuestions, tabSwitchCount, noiseSpikeCount, proctorViolated) {
  try {
    const { supabase, schoolId, role, user } = await getAuthContext();
    if (role !== 'student') return { error: 'Unauthorized.' };

    const { error } = await supabase.from('cbt_submissions').upsert([{
      school_id: schoolId,
      exam_id: examId,
      student_id: user.id,
      answers,
      score: parseFloat(score || 0),
      total_questions: parseInt(totalQuestions || 0),
      tab_switch_count: parseInt(tabSwitchCount || 0),
      noise_spike_count: parseInt(noiseSpikeCount || 0),
      proctor_violated: !!proctorViolated,
      status: 'submitted',
      submitted_at: new Date().toISOString()
    }], { onConflict: 'exam_id, student_id' });

    if (error) return { error: getFriendlyError(error) };
    return { success: true };
  } catch (err) {
    return { error: getFriendlyError(err) };
  }
}

