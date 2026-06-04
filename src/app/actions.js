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
  
  // Keep clean client validation and login auth feedback intact
  if (
    msg.includes('required') || 
    msg.includes('Unauthorized') || 
    msg.includes('credentials') || 
    msg.includes('invalid login') ||
    msg.includes('Invalid login') ||
    msg.includes('Email and password') ||
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
  const role = formData.get('role'); // 'teacher' or 'student'

  if (!firstName || !lastName || !email || !password || !role) {
    return { error: 'All fields are required.' };
  }

  try {
    const { schoolId, role: currentRole } = await getAuthContext();
    if (currentRole !== 'admin') {
      return { error: 'Unauthorized: Only school administrators can create accounts.' };
    }

    // Use admin client to create the authentication account for the new user
    const adminClient = createAdminClient();
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
    if (role !== 'admin') return { error: 'Unauthorized.' };

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
export async function createAnnouncementAction(title, content) {
  try {
    const { supabase, schoolId, role, user } = await getAuthContext();
    if (role !== 'admin') return { error: 'Unauthorized.' };

    const { error } = await supabase.from('announcements').insert([{
      school_id: schoolId,
      title,
      content,
      created_by: user.id
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
