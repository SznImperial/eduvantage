'use server';

import { createClient } from '@/lib/supabaseServer';
import { createAdminClient } from '@/lib/supabaseAdmin';
import { redirect } from 'next/navigation';

/**
 * Normalizes internal and database exceptions to a simple, generic user message
 * while logging the full exception server-side for debugging.
 */
function getFriendlyError(error) {
  // Log the full actual error for server-side debugging
  console.error('IMP3RIAL EDU Internal Exception:', error);

  // Return the actual error message
  return error?.message || 'Something went wrong. Please try again.';
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
    .select('school_id, role, schools(active_academic_year_id, active_academic_term_id)')
    .eq('id', user.id)
    .single();
    
  if (pError || !profile) throw new Error('Public profile context not found.');
  return { 
    supabase, 
    user, 
    schoolId: profile.school_id, 
    role: profile.role,
    activeYearId: profile.schools?.active_academic_year_id,
    activeTermId: profile.schools?.active_academic_term_id
  };
}

/**
 * Validates that the provided foreign keys belong to the caller's school tenant.
 * references: array of { table: 'table_name', id: 'uuid_string' } or { table: 'table_name', ids: ['uuid_string'] }
 */
async function verifyTenantOwnership(references, schoolId, client) {
  for (const ref of references) {
    if (ref.hasOwnProperty('id') && (ref.id === undefined || ref.id === null || ref.id === '')) {
      throw new Error(`Missing required identifier for ${ref.table}.`);
    }
    if (ref.hasOwnProperty('ids') && (!ref.ids || ref.ids.length === 0 || ref.ids.some(id => id === undefined || id === null || id === ''))) {
      throw new Error(`Missing or invalid identifiers for ${ref.table}.`);
    }

    const rawIds = ref.ids || (ref.id ? [ref.id] : []);
    const idsToCheck = Array.from(new Set(rawIds));
    if (idsToCheck.length === 0) continue;
    
    // Check all IDs for this table in a single query
    const { data, error } = await client
      .from(ref.table)
      .select('id, school_id')
      .in('id', idsToCheck);
      
    if (error) {
      console.error(`Tenant verification error on ${ref.table}:`, error.message);
      throw new Error(`Unauthorized reference in ${ref.table}.`);
    }
    
    // Validate we got records back for all requested IDs and they belong to this school
    if (!data || data.length !== idsToCheck.length || data.some(record => record.school_id !== schoolId)) {
      throw new Error(`Unauthorized cross-tenant reference detected in ${ref.table}.`);
    }
  }
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
  const tier = formData.get('subscriptionTier') || 'free';
  const cycle = formData.get('billingCycle') || 'annual';

  if (!schoolName || !slug || !firstName || !lastName || !email || !password) {
    return { error: 'All fields are required.' };
  }

  const slugRegex = /^[a-z0-9-]+$/;
  if (!slugRegex.test(slug)) {
    return { error: 'Subdomain slug can only contain lowercase letters, numbers, and hyphens.' };
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

  // All registrations start as free tier. Upgrade happens via Paystack payment.
  let maxStudentLimit = 10;
  let maxClassLimit = 3;
  let status = 'active';

  // 2. Use admin client to write to schools and profiles bypassing initial RLS constraints
  const adminClient = createAdminClient();

  // Create the School (tenant)
  const { data: schoolData, error: schoolError } = await adminClient
    .from('schools')
    .insert([{ 
      name: schoolName, 
      slug,
      subscription_tier: 'free', // Always start as free until payment is verified
      subscription_status: status,
      max_student_limit: maxStudentLimit,
      max_class_limit: maxClassLimit
    }])
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
    // Cleanup school & user concurrently so one failure doesn't block the other
    await Promise.allSettled([
      adminClient.from('schools').delete().eq('id', schoolData.id),
      adminClient.auth.admin.deleteUser(user.id)
    ]);
    return { error: getFriendlyError(profileError) };
  }

  return { success: true, schoolId: schoolData.id, email, tier, cycle };
}

// Lockout Configuration Constants
const LOCKOUT_MAX_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// In-memory fallback cache
const inMemoryLockoutCache = new Map();

function cleanInMemoryCache() {
  const now = Date.now();
  for (const [email, record] of inMemoryLockoutCache.entries()) {
    const lastAttemptTime = new Date(record.last_attempt_at).getTime();
    const isExpired = now - lastAttemptTime > LOCKOUT_WINDOW_MS;
    const isBlockExpired = !record.blocked_until || now > new Date(record.blocked_until).getTime();
    if (isExpired && isBlockExpired) {
      inMemoryLockoutCache.delete(email);
    }
  }
}

async function getLockoutRecord(email) {
  const normalizedEmail = email.toLowerCase().trim();
  const adminClient = createAdminClient();
  
  try {
    const { data, error } = await adminClient
      .from('failed_login_attempts')
      .select('attempts_count, last_attempt_at, blocked_until')
      .eq('email', normalizedEmail)
      .maybeSingle();
      
    if (error) {
      console.warn('DB lockout check failed, using in-memory cache:', error.message);
      return inMemoryLockoutCache.get(normalizedEmail) || null;
    }
    return data;
  } catch (err) {
    console.warn('DB lockout check exception, using in-memory cache:', err);
    return inMemoryLockoutCache.get(normalizedEmail) || null;
  }
}

async function updateLockoutRecord(email, attemptsCount, lastAttemptAt, blockedUntil) {
  const normalizedEmail = email.toLowerCase().trim();
  const adminClient = createAdminClient();
  const record = {
    email: normalizedEmail,
    attempts_count: attemptsCount,
    last_attempt_at: lastAttemptAt.toISOString(),
    blocked_until: blockedUntil ? blockedUntil.toISOString() : null
  };
  
  inMemoryLockoutCache.set(normalizedEmail, record);
  cleanInMemoryCache();
  
  try {
    const { error } = await adminClient
      .from('failed_login_attempts')
      .upsert(record);
      
    if (error) {
      console.warn('DB lockout update failed:', error.message);
    }
  } catch (err) {
    console.warn('DB lockout update exception:', err);
  }
}

async function resetLockoutRecord(email) {
  const normalizedEmail = email.toLowerCase().trim();
  const adminClient = createAdminClient();
  
  inMemoryLockoutCache.delete(normalizedEmail);
  cleanInMemoryCache();
  
  try {
    const { error } = await adminClient
      .from('failed_login_attempts')
      .delete()
      .eq('email', normalizedEmail);
      
    if (error) {
      console.warn('DB lockout reset failed:', error.message);
    }
  } catch (err) {
    console.warn('DB lockout reset exception:', err);
  }
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

  const normalizedEmail = email.toLowerCase().trim();

  // 1. Check lockout status
  const lockout = await getLockoutRecord(normalizedEmail);
  if (lockout && lockout.blocked_until) {
    const blockedUntil = new Date(lockout.blocked_until);
    if (blockedUntil > new Date()) {
      const waitTimeMin = Math.ceil((blockedUntil.getTime() - Date.now()) / 60000);
      return { error: `Too many failed login attempts. Please wait ${waitTimeMin} minute(s) before trying again.` };
    }
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // 2. Record failed login attempt
    const currentLockout = lockout && (new Date() - new Date(lockout.last_attempt_at) <= LOCKOUT_WINDOW_MS) ? lockout : null;
    const newCount = (currentLockout ? currentLockout.attempts_count : 0) + 1;
    const now = new Date();
    let blockedUntil = null;
    
    if (newCount >= LOCKOUT_MAX_ATTEMPTS) {
      blockedUntil = new Date(now.getTime() + LOCKOUT_WINDOW_MS);
    }
    
    await updateLockoutRecord(normalizedEmail, newCount, now, blockedUntil);

    return { error: getFriendlyError(error) };
  }

  // 3. Reset/clear lockout record on success
  await resetLockoutRecord(normalizedEmail);

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
 * Creates a new user (Teacher/Student/Parent) within the Admin's school.
 * Syncs teacher metadata to teachers table, and links students to class enrollments/parents.
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

    // Verify foreign keys for student creation
    if (role === 'student') {
      const refs = [];
      const classId = formData.get('classId');
      if (classId) refs.push({ table: 'classes', id: classId });
      
      if (formData.get('parentType') === 'existing') {
        const parentId = formData.get('parentId');
        if (parentId) refs.push({ table: 'profiles', id: parentId });
      }
      if (refs.length > 0) {
        await verifyTenantOwnership(refs, schoolId, adminClient);
      }
    }

    // SaaS limits are now enforced atomically via RPC during profile insertion

    // 1. Create the main authentication account
    const { data: newAuthData, error: createAuthError } = await adminClient.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        role: role,
        school_id: schoolId
      }
    });

    if (createAuthError) {
      return { error: getFriendlyError(createAuthError) };
    }

    const userId = newAuthData.user.id;

    // 2. Create profile
    const profilePayload = {
      id: userId,
      school_id: schoolId,
      first_name: firstName,
      last_name: lastName,
      role: role,
      email: email.trim().toLowerCase(),
    };

    if (role === 'student') {
      profilePayload.admission_no = formData.get('admissionNo') || null;
    } else if (role === 'teacher') {
      profilePayload.phone = formData.get('phone') || null;
    }

    let newProfileError = null;

    if (role === 'student') {
      // Use atomic RPC for students to enforce limits
      const { data: rpcData, error: rpcError } = await adminClient.rpc('create_student_profile_atomic', {
        p_id: profilePayload.id,
        p_school_id: profilePayload.school_id,
        p_first_name: profilePayload.first_name,
        p_last_name: profilePayload.last_name,
        p_email: profilePayload.email,
        p_admission_no: profilePayload.admission_no
      });

      if (rpcError) {
        newProfileError = rpcError;
      } else if (rpcData && !rpcData.success) {
        newProfileError = new Error(rpcData.error);
      }
    } else {
      // Standard insert for non-students
      const { error } = await adminClient
        .from('profiles')
        .insert([profilePayload]);
      newProfileError = error;
    }

    if (newProfileError) {
      await adminClient.auth.admin.deleteUser(userId);
      return { error: getFriendlyError(newProfileError) };
    }

    // 3. Role-specific additional sync
    if (role === 'teacher') {
      const { error: tMetaErr } = await adminClient
        .from('teachers')
        .insert([{
          id: userId,
          school_id: schoolId,
          phone: formData.get('phone') || null,
          specialization: formData.get('specialization') || null,
          qualification: formData.get('qualification') || null,
          joined_date: new Date().toISOString().split('T')[0]
        }]);

      if (tMetaErr) {
        // Rollback
        await adminClient.from('profiles').delete().eq('id', userId);
        await adminClient.auth.admin.deleteUser(userId);
        return { error: getFriendlyError(tMetaErr) };
      }
    } else if (role === 'student') {
      const classId = formData.get('classId');
      if (classId) {
        const { error: enrollErr } = await adminClient
          .from('enrollments')
          .insert([{
            school_id: schoolId,
            student_id: userId,
            class_id: classId
          }]);
        if (enrollErr) {
          console.warn('Student enrollment mapping failed:', enrollErr.message);
        }
      }

      // Parent linkage
      const parentType = formData.get('parentType');
      if (parentType === 'existing') {
        const parentId = formData.get('parentId');
        if (parentId) {
          await adminClient
            .from('parent_student')
            .insert([{
              school_id: schoolId,
              parent_id: parentId,
              student_id: userId
            }]);
        }
      } else if (parentType === 'new') {
        const parentName = formData.get('parentName');
        const parentEmail = formData.get('parentEmail');
        const parentPassword = formData.get('parentPassword');
        const parentPhone = formData.get('parentPhone');

        if (parentName && parentEmail && parentPassword) {
          // Check if parent email already exists
          const { data: existingParent } = await adminClient
            .from('profiles')
            .select('id')
            .eq('email', parentEmail.trim().toLowerCase())
            .maybeSingle();

          let resolvedParentId = existingParent?.id;

          if (!resolvedParentId) {
            const { data: parentAuth, error: pAuthErr } = await adminClient.auth.admin.createUser({
              email: parentEmail.trim().toLowerCase(),
              password: parentPassword,
              email_confirm: true,
              user_metadata: {
                role: 'parent',
                school_id: schoolId
              }
            });

            if (!pAuthErr && parentAuth?.user) {
              resolvedParentId = parentAuth.user.id;
              const nameParts = parentName.trim().split(' ');
              const pFirst = nameParts[0] || 'Parent';
              const pLast = nameParts.slice(1).join(' ') || 'User';

              await adminClient
                .from('profiles')
                .insert([{
                  id: resolvedParentId,
                  school_id: schoolId,
                  first_name: pFirst,
                  last_name: pLast,
                  role: 'parent',
                  email: parentEmail.trim().toLowerCase(),
                  phone: parentPhone || null
                }]);
            }
          }

          if (resolvedParentId) {
            await adminClient
              .from('parent_student')
              .insert([{
                school_id: schoolId,
                parent_id: resolvedParentId,
                student_id: userId
              }]);
          }
        }
      }
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
    const { schoolId, role } = await getAuthContext();
    if (role !== 'admin') return { error: 'Unauthorized.' };

    const adminClient = createAdminClient();
    await verifyTenantOwnership([{ table: 'profiles', id }], schoolId, adminClient);
    // Delete profile (which triggers cascade deletions in other tables)
    const { error: pError } = await adminClient.from('profiles').delete().eq('id', id);
    if (pError) return { error: getFriendlyError(pError) };

    // Delete authentication credential user
    const { error: aError } = await adminClient.auth.admin.deleteUser(id);
    if (aError) {
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

    const { data: yearData, error } = await supabase.from('academic_years').insert([{
      school_id: schoolId,
      name,
      start_date: startDate || null,
      end_date: endDate || null,
      is_active: true
    }]).select().single();

    if (error) return { error: getFriendlyError(error) };

    return { success: true };
  } catch (err) {
    return { error: getFriendlyError(err) };
  }
}

/**
 * Creates an Academic Term. Admin only.
 */
export async function createAcademicTermAction(academicYearId, name, startDate, endDate) {
  try {
    const { supabase, schoolId, role } = await getAuthContext();
    if (role !== 'admin') return { error: 'Unauthorized.' };

    await verifyTenantOwnership([{ table: 'academic_years', id: academicYearId }], schoolId, supabase);

    const { error } = await supabase.from('academic_terms').insert([{
      school_id: schoolId,
      academic_year_id: academicYearId,
      name,
      start_date: startDate || null,
      end_date: endDate || null
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
export async function createClassAction(name, gradeLevel) {
  try {
    const { supabase, schoolId, role } = await getAuthContext();
    if (role !== 'admin' && role !== 'super_admin') return { error: 'Unauthorized.' };

    // Atomic SaaS limits enforcement via RPC
    const { data: rpcData, error } = await supabase.rpc('create_class_atomic', {
      p_school_id: schoolId,
      p_name: name,
      p_grade_level: gradeLevel
    });

    if (error) return { error: getFriendlyError(error) };
    if (rpcData && !rpcData.success) return { error: rpcData.error };
    return { success: true };
  } catch (err) {
    return { error: getFriendlyError(err) };
  }
}

/**
 * Deletes a Class section. Admin only.
 * Cascading deletes handle class_subjects, enrollments, and attendance automatically.
 */
export async function deleteClassAction(classId) {
  try {
    const { supabase, schoolId, role } = await getAuthContext();
    if (role !== 'admin' && role !== 'super_admin') return { error: 'Unauthorized.' };

    await verifyTenantOwnership([{ table: 'classes', id: classId }], schoolId, supabase);

    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', classId)
      .eq('school_id', schoolId);

    if (error) return { error: getFriendlyError(error) };
    return { success: true };
  } catch (err) {
    return { error: getFriendlyError(err) };
  }
}

/**
 * Sets the active academic session (Year and Term) globally for the school.
 */
export async function setActiveSessionAction(yearId, termId) {
  try {
    const { supabase, schoolId, role } = await getAuthContext();
    if (role !== 'admin') return { error: 'Unauthorized.' };

    const { error } = await supabase
      .from('schools')
      .update({
        active_academic_year_id: yearId,
        active_academic_term_id: termId
      })
      .eq('id', schoolId);

    if (error) return { error: getFriendlyError(error) };
    return { success: true };
  } catch (err) {
    return { error: getFriendlyError(err) };
  }
}

/**
 * Promotes a list of students to a target class. Decouples enrollment if targetClassId is 'graduate' or null.
 */
export async function promoteStudentsAction(studentIds, targetClassId) {
  try {
    const { supabase, schoolId, role, activeYearId } = await getAuthContext();
    if (role !== 'admin') return { error: 'Unauthorized.' };

    if (!activeYearId) {
      return { error: 'No active academic year configured for this school. Cannot promote students.' };
    }

    await verifyTenantOwnership([
      { table: 'profiles', ids: studentIds },
      ...(targetClassId && targetClassId !== 'graduate' ? [{ table: 'classes', id: targetClassId }] : [])
    ], schoolId, supabase);

    if (!targetClassId || targetClassId === 'graduate') {
      // Do nothing for graduation. The student simply won't get a new enrollment record for the active year.
      // Their historical enrollments remain intact.
    } else {
      for (const studentId of studentIds) {
        // We do NOT delete existing mappings to preserve history.
        // We only insert the new enrollment for the active academic year.
        
        // Ensure no duplicate exists for the same student + active year
        await supabase
          .from('enrollments')
          .delete()
          .eq('student_id', studentId)
          .eq('academic_year_id', activeYearId)
          .eq('school_id', schoolId);

        // Insert new enrollment mapping
        const { error } = await supabase
          .from('enrollments')
          .insert([{
            school_id: schoolId,
            student_id: studentId,
            class_id: targetClassId,
            academic_year_id: activeYearId
          }]);

        if (error) return { error: getFriendlyError(error) };
      }
    }

    return { success: true };
  } catch (err) {
    return { error: getFriendlyError(err) };
  }
}

/**
 * Creates a password reset request. Publicly accessible.
 */
export async function createPasswordResetRequestAction(email, fullName) {
  try {
    const adminClient = createAdminClient();
    
    // Resolve school_id from email profile
    const { data: profile, error: pError } = await adminClient
      .from('profiles')
      .select('school_id')
      .eq('email', email.trim().toLowerCase())
      .limit(1)
      .maybeSingle();

    if (pError || !profile) {
      return { error: 'No profile found matching this email address.' };
    }

    const { error } = await adminClient
      .from('password_reset_requests')
      .insert([{
        school_id: profile.school_id,
        email: email.trim().toLowerCase(),
        full_name: fullName,
        status: 'pending'
      }]);

    if (error) return { error: getFriendlyError(error) };
    return { success: true };
  } catch (err) {
    return { error: getFriendlyError(err) };
  }
}

/**
 * Resolves a password reset request and updates auth user. Admin only.
 */
export async function resolvePasswordResetRequestAction(requestId, tempPassword) {
  try {
    const { role, schoolId } = await getAuthContext();
    if (role !== 'admin') return { error: 'Unauthorized.' };

    const adminClient = createAdminClient();
    
    // BOLA Fix: Verify the request belongs to the caller's tenant
    await verifyTenantOwnership([{ table: 'password_reset_requests', id: requestId }], schoolId, adminClient);

    const { data: req, error: rError } = await adminClient
      .from('password_reset_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (rError || !req) return { error: 'Request not found.' };

    const { data: profile, error: pError } = await adminClient
      .from('profiles')
      .select('id')
      .eq('email', req.email)
      .single();

    if (pError || !profile) return { error: 'User profile not found.' };

    // Update password in auth.users
    const { error: aError } = await adminClient.auth.admin.updateUserById(
      profile.id,
      { password: tempPassword }
    );

    if (aError) return { error: getFriendlyError(aError) };

    // Mark as resolved
    const { error: uError } = await adminClient
      .from('password_reset_requests')
      .update({
        status: 'resolved',
        temp_password: tempPassword
      })
      .eq('id', requestId);

    if (uError) return { error: getFriendlyError(uError) };

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
 * Uses server-side active academic year to prevent cross-tenant data leakage.
 */
export async function allocateCourseAction(classId, subjectId, teacherId) {
  try {
    const { supabase, schoolId, role, activeYearId } = await getAuthContext();
    if (role !== 'admin') return { error: 'Unauthorized.' };
    if (!activeYearId) return { error: 'No active academic year set. Please set an active session first.' };

    await verifyTenantOwnership([
      { table: 'classes', id: classId },
      { table: 'subjects', id: subjectId },
      ...(teacherId ? [{ table: 'profiles', id: teacherId }] : [])
    ], schoolId, supabase);

    const { error } = await supabase.from('class_subjects').insert([{
      school_id: schoolId,
      class_id: classId,
      subject_id: subjectId,
      academic_year_id: activeYearId,
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
 * Automatically stamps with the school's active academic year.
 */
export async function enrollStudentAction(studentId, classId) {
  try {
    const { supabase, schoolId, role, activeYearId } = await getAuthContext();
    if (role !== 'admin') return { error: 'Unauthorized.' };
    if (!activeYearId) return { error: 'No active academic year set. Please set an active session first.' };

    await verifyTenantOwnership([
      { table: 'profiles', id: studentId },
      { table: 'classes', id: classId }
    ], schoolId, supabase);

    const { error } = await supabase.from('enrollments').insert([{
      school_id: schoolId,
      student_id: studentId,
      class_id: classId,
      academic_year_id: activeYearId
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
    const { supabase, schoolId, role } = await getAuthContext();
    if (role !== 'admin') return { error: 'Unauthorized.' };

    await verifyTenantOwnership([{ table: 'announcements', id }], schoolId, supabase);
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

    await verifyTenantOwnership([
      { table: 'classes', id: classId },
      { table: 'profiles', ids: records.map(r => r.student_id) }
    ], schoolId, supabase);

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
 * Uses server-side active year/term to prevent cross-tenant data leakage.
 */
export async function saveGradesAction(classSubjectId, studentIds, upserts) {
  try {
    const { supabase, schoolId, role, user, activeYearId, activeTermId } = await getAuthContext();
    if (role !== 'admin' && role !== 'teacher') return { error: 'Unauthorized.' };
    if (!activeYearId || !activeTermId) return { error: 'No active academic session set. Please set an active session first.' };

    await verifyTenantOwnership([
      { table: 'class_subjects', id: classSubjectId },
      { table: 'profiles', ids: studentIds }
    ], schoolId, supabase);

    // 1. Delete existing marks for these students under this course, year, and term
    const { error: delError } = await supabase
      .from('grades')
      .delete()
      .eq('class_subject_id', classSubjectId)
      .eq('academic_term_id', activeTermId)
      .in('student_id', studentIds);

    if (delError) return { error: getFriendlyError(delError) };

    // 2. Format insert payloads
    const payloads = upserts.map(u => ({
      school_id: schoolId,
      student_id: u.student_id,
      class_subject_id: classSubjectId,
      academic_year_id: activeYearId,
      academic_term_id: activeTermId,
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
export async function updateSubscriptionAction(schoolId, tier, billingCycle = 'annual') {
  try {
    const { supabase, role } = await getAuthContext();
    if (role !== 'admin' && role !== 'super_admin') {
      return { error: 'Unauthorized.' };
    }

    let maxStudentLimit = 10;
    let maxClassLimit = 3;

    if (tier === 'starter') {
      maxStudentLimit = 100;
      maxClassLimit = 10;
    } else if (tier === 'growth') {
      maxStudentLimit = 500;
      maxClassLimit = 40;
    } else if (tier === 'enterprise') {
      maxStudentLimit = 9999;
      maxClassLimit = 99;
    }

    const now = new Date();
    const periodEnd = new Date(now);
    if (billingCycle === 'monthly') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    const updatePayload = {
      subscription_tier: tier,
      max_student_limit: maxStudentLimit,
      max_class_limit: maxClassLimit,
      subscription_status: 'active',
      billing_cycle: billingCycle,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
    };

    // For free tier, clear billing metadata
    if (tier === 'free') {
      updatePayload.billing_cycle = null;
      updatePayload.current_period_start = null;
      updatePayload.current_period_end = null;
    }

    const { error } = await supabase
      .from('schools')
      .update(updatePayload)
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
    const { schoolId, role } = await getAuthContext();
    if (role !== 'admin' && role !== 'super_admin') return { error: 'Unauthorized.' };

    const adminClient = createAdminClient();
    if (role !== 'super_admin') {
      await verifyTenantOwnership([{ table: 'parent_student', id }], schoolId, adminClient);
    }
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

    await verifyTenantOwnership([{ table: 'class_subjects', id: classSubjectId }], schoolId, supabase);

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
    const { supabase, schoolId, role } = await getAuthContext();
    if (role !== 'admin') return { error: 'Unauthorized.' };

    await verifyTenantOwnership([{ table: 'timetable_slots', id }], schoolId, supabase);

    const { error } = await supabase.from('timetable_slots').delete().eq('id', id);
    if (error) return { error: getFriendlyError(error) };
    return { success: true };
  } catch (err) {
    return { error: getFriendlyError(err) };
  }
}

/**
 * Creates/issues a Fee Record for a student. Admin only.
 * Uses server-side active year/term to prevent cross-tenant data leakage.
 */
export async function createFeeRecordAction(studentId, amountOwed, amountPaid, status) {
  try {
    const { supabase, schoolId, role, activeYearId, activeTermId } = await getAuthContext();
    if (role !== 'admin') return { error: 'Unauthorized.' };
    if (!activeYearId || !activeTermId) return { error: 'No active academic session set. Please set an active session first.' };

    await verifyTenantOwnership([
      { table: 'profiles', id: studentId }
    ], schoolId, supabase);

    const { error } = await supabase.from('fee_records').insert([{
      school_id: schoolId,
      student_id: studentId,
      academic_term_id: activeTermId,
      academic_year_id: activeYearId,
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
    const { supabase, schoolId, role } = await getAuthContext();
    if (role !== 'admin') return { error: 'Unauthorized.' };

    await verifyTenantOwnership([
      { table: 'fee_records', id }
    ], schoolId, supabase);

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

    await verifyTenantOwnership([{ table: 'class_subjects', id: classSubjectId }], schoolId, supabase);

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
    const { supabase, schoolId, role } = await getAuthContext();
    if (role !== 'admin' && role !== 'teacher') return { error: 'Unauthorized.' };

    await verifyTenantOwnership([{ table: 'assignments', id }], schoolId, supabase);

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
    const { supabase, schoolId, role } = await getAuthContext();
    if (role !== 'admin' && role !== 'teacher') return { error: 'Unauthorized.' };

    await verifyTenantOwnership([{ table: 'submissions', id: submissionId }], schoolId, supabase);

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

    await verifyTenantOwnership([{ table: 'assignments', id: assignmentId }], schoolId, supabase);

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

    await verifyTenantOwnership([
      { table: 'profiles', id: studentId },
      { table: 'class_subjects', id: classSubjectId }
    ], schoolId, supabase);

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

    await verifyTenantOwnership([{ table: 'class_subjects', id: classSubjectId }], schoolId, supabase);

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
    const { supabase, schoolId, role, user } = await getAuthContext();
    if (role !== 'admin' && role !== 'teacher') return { error: 'Unauthorized.' };

    const { data: exam, error: examErr } = await supabase
      .from('cbt_exams')
      .select('school_id, created_by, class_subjects(teacher_id)')
      .eq('id', id)
      .single();
    if (examErr || !exam) return { error: 'Exam not found.' };
    if (exam.school_id !== schoolId) return { error: 'Unauthorized.' };

    if (role === 'teacher') {
      const isCreator = exam.created_by === user.id;
      const isAllocated = exam.class_subjects?.teacher_id === user.id;
      if (!isCreator && !isAllocated) {
        return { error: 'Unauthorized: You are not the creator of this exam or allocated to this subject.' };
      }
    }

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
    const { supabase, schoolId, role } = await getAuthContext();
    if (role !== 'admin') return { error: 'Unauthorized.' };

    await verifyTenantOwnership([{ table: 'cbt_exams', id }], schoolId, supabase);

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
    const { supabase, schoolId, role } = await getAuthContext();
    if (role !== 'admin') return { error: 'Unauthorized.' };

    await verifyTenantOwnership([{ table: 'cbt_exams', id: examId }], schoolId, supabase);

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
    const { supabase, schoolId, role } = await getAuthContext();
    if (role !== 'admin') return { error: 'Unauthorized.' };

    await verifyTenantOwnership([{ table: 'cbt_exams', id: examId }], schoolId, supabase);

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

    if (!examId) return { error: 'Missing required identifier for cbt_exams.' };
    if (!Array.isArray(answers)) return { error: 'Answers must be a valid array.' };

    // Fetch exam with school_id and class context
    const { data: exam, error: examErr } = await supabase
      .from('cbt_exams')
      .select('school_id, class_subject_id, class_subjects(class_id)')
      .eq('id', examId)
      .single();
    if (examErr || !exam) return { error: 'Exam not found.' };
    if (exam.school_id !== schoolId) return { error: 'Unauthorized.' };

    // Verify enrollment
    const classId = exam.class_subjects?.class_id;
    if (!classId) return { error: 'Exam class context not found.' };

    const { data: enrollment, error: enrollErr } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', user.id)
      .eq('class_id', classId)
      .limit(1)
      .maybeSingle();

    if (enrollErr || !enrollment) {
      return { error: 'Unauthorized: Student is not enrolled in the class for this exam.' };
    }

    // Recompute score
    const { data: questions, error: qError } = await supabase
      .from('cbt_questions')
      .select('id, correct_option')
      .eq('exam_id', examId);
      
    if (qError) return { error: getFriendlyError(qError) };
    if (!questions || questions.length === 0) return { error: 'Exam has no questions or not found.' };

    let correctCount = 0;
    for (const q of questions) {
      const userAnsObj = answers.find(a => a.question_id === q.id);
      if (userAnsObj && userAnsObj.answer?.toUpperCase() === q.correct_option?.toUpperCase()) {
        correctCount++;
      }
    }
    const computedScore = Math.round((correctCount / questions.length) * 10000) / 100;

    const { error } = await supabase.from('cbt_submissions').upsert([{
      school_id: schoolId,
      exam_id: examId,
      student_id: user.id,
      answers,
      score: computedScore,
      total_questions: questions.length,
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

/**
 * Updates the authenticated user's password.
 */
export async function changePasswordAction(newPassword) {
  try {
    const { supabase } = await getAuthContext();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { error: getFriendlyError(error) };
    return { success: true };
  } catch (err) {
    return { error: getFriendlyError(err) };
  }
}

/**
 * Uploads a study material file (notes) to storage and saves metadata.
 */
export async function uploadMaterialAction(formData) {
  try {
    const { supabase, schoolId, user } = await getAuthContext();
    const classSubjectId = formData.get('class_subject_id');
    const academicTermId = formData.get('academic_term_id');
    const title = formData.get('title');
    const description = formData.get('description');
    const file = formData.get('file');

    if (!file || !title || !classSubjectId || !academicTermId) {
      return { error: 'Missing required fields.' };
    }

    if (file.size > 10 * 1024 * 1024) {
      return { error: 'File size exceeds 10MB limit.' };
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${schoolId}/${classSubjectId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError, data: uploadData } = await supabase.storage
      .from('study_materials')
      .upload(fileName, file);

    if (uploadError) return { error: getFriendlyError(uploadError) };

    const { data: publicUrlData } = supabase.storage
      .from('study_materials')
      .getPublicUrl(fileName);

    const { error: dbError } = await supabase.from('study_materials').insert({
      school_id: schoolId,
      class_subject_id: classSubjectId,
      academic_term_id: academicTermId,
      title,
      description,
      file_url: publicUrlData.publicUrl,
      file_type: file.type || 'application/octet-stream',
      file_size_bytes: file.size,
      created_by: user.id
    });

    if (dbError) return { error: getFriendlyError(dbError) };

    revalidatePath('/dashboard/teacher/notes');
    return { success: true };
  } catch (err) {
    return { error: getFriendlyError(err) };
  }
}

/**
 * Deletes a study material from the database.
 */
export async function deleteMaterialAction(id) {
  try {
    const { supabase } = await getAuthContext();
    const { error } = await supabase.from('study_materials').delete().eq('id', id);
    if (error) return { error: getFriendlyError(error) };
    
    revalidatePath('/dashboard/teacher/notes');
    return { success: true };
  } catch (err) {
    return { error: getFriendlyError(err) };
  }
}

/**
 * Toggles a study material completion status for the current student.
 */
export async function toggleMaterialCompletionAction(materialId, isCompleted) {
  try {
    const { supabase, schoolId, user } = await getAuthContext();
    
    if (isCompleted) {
      const { error } = await supabase.from('material_completions').insert({
        school_id: schoolId,
        material_id: materialId,
        student_id: user.id
      });
      if (error && error.code !== '23505') return { error: getFriendlyError(error) };
    } else {
      const { error } = await supabase.from('material_completions').delete()
        .eq('material_id', materialId)
        .eq('student_id', user.id);
      if (error) return { error: getFriendlyError(error) };
    }

    revalidatePath('/dashboard/student/notes');
    return { success: true };
  } catch (err) {
    return { error: getFriendlyError(err) };
  }
}
