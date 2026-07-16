import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '../src/lib/supabaseAdmin.js';
import { setMockCookies } from './mockSupabaseServer.mjs';
import { POST as testRunnerRoute } from './route.test.mjs';

// Import the mocked server actions
import {
  signUpSchool,
  loginUser,
  logoutUser,
  createUserAccount,
  deleteUserAction,
  createAcademicYearAction,
  createAcademicTermAction,
  createClassAction,
  setActiveSessionAction,
  promoteStudentsAction,
  createPasswordResetRequestAction,
  resolvePasswordResetRequestAction,
  createSubjectAction,
  allocateCourseAction,
  enrollStudentAction,
  createAnnouncementAction,
  deleteAnnouncementAction,
  saveAttendanceAction,
  saveGradesAction,
  updateSubscriptionAction,
  linkParentStudentAction,
  unlinkParentStudentAction,
  createTimetableSlotAction,
  deleteTimetableSlotAction,
  createFeeRecordAction,
  updateFeeRecordAction,
  createAssignmentAction,
  deleteAssignmentAction,
  gradeSubmissionAction,
  submitAssignmentAction,
  toggleStudentSubjectAction,
  createCbtExamAction,
  deleteCbtExamAction,
  updateCbtExamStatusAction,
  releaseCbtResultsAction,
  withholdCbtResultsAction,
  submitCbtExamAction,
  changePasswordAction
} from './actions.test.mjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const results = [];

function logResult(endpoint, method, testCase, expected, actual, status, severity = 'N/A') {
  results.push({ endpoint, method, testCase, expected, actual, status, severity });
}

async function getSession(email, password) {
  const client = createSupabaseClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

function loginAs(session) {
  if (!session) {
    setMockCookies([]);
    return;
  }
  const ref = supabaseUrl.match(/https:\/\/([^.]+)\.supabase/)[1];
  const cookieName = `sb-${ref}-auth-token`;
  setMockCookies([{ name: cookieName, value: JSON.stringify(session) }]);
}

async function runSuite() {
  const ts = Date.now();
  const adminClient = createAdminClient();

  console.log('--- Step 1: Running route-level production gating tests ---');
  // Mock NODE_ENV = 'production'
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    const mockReq = {
      json: async () => ({ action: 'setupTestAccounts', args: [] })
    };
    const res = await testRunnerRoute(mockReq);
    const body = await res.json();
    if (res.status === 404) {
      logResult('POST /api/test-runner', 'POST', 'Production gating test (NODE_ENV=production)', '404 Not Found', JSON.stringify(body), 'Pass');
    } else {
      logResult('POST /api/test-runner', 'POST', 'Production gating test (NODE_ENV=production)', '404 Not Found', `Status: ${res.status}, Body: ${JSON.stringify(body)}`, 'Fail', 'Critical');
    }
  } catch (err) {
    logResult('POST /api/test-runner', 'POST', 'Production gating test (NODE_ENV=production)', '404 Not Found', err.message, 'Fail', 'Critical');
  }
  process.env.NODE_ENV = originalEnv;

  console.log('--- Step 2: Provisioning Test Data (Two-School Isolation) ---');
  
  // 1. Create schools
  const { data: sA, error: errSA } = await adminClient.from('schools').insert([{ name: `School A ${ts}`, slug: `school-a-${ts}` }]).select().single();
  const { data: sB, error: errSB } = await adminClient.from('schools').insert([{ name: `School B ${ts}`, slug: `school-b-${ts}` }]).select().single();
  
  if (errSA || errSB) {
    console.error('Failed to create schools:', errSA || errSB);
    return;
  }
  console.log(`Created School A (${sA.id}) and School B (${sB.id})`);

  // 2. Create Auth users
  const adminAEmail = `admina_${ts}@schoola.com`;
  const adminBEmail = `adminb_${ts}@schoolb.com`;
  const superAdminAEmail = `superadmin_${ts}@schoola.com`;
  const teacherAEmail = `teachera_${ts}@schoola.com`;
  const studentAEmail = `studenta_${ts}@schoola.com`;
  const studentBEmail = `studentb_${ts}@schoolb.com`;
  const password = 'password123';

  const { data: authAdminA } = await adminClient.auth.admin.createUser({ email: adminAEmail, password, email_confirm: true });
  const { data: authAdminB } = await adminClient.auth.admin.createUser({ email: adminBEmail, password, email_confirm: true });
  const { data: authSuperAdminA } = await adminClient.auth.admin.createUser({ email: superAdminAEmail, password, email_confirm: true });
  const { data: authTeacherA } = await adminClient.auth.admin.createUser({ email: teacherAEmail, password, email_confirm: true });
  const { data: authStudentA } = await adminClient.auth.admin.createUser({ email: studentAEmail, password, email_confirm: true });
  const { data: authStudentB } = await adminClient.auth.admin.createUser({ email: studentBEmail, password, email_confirm: true });

  // 3. Create Profiles
  await adminClient.from('profiles').insert([
    { id: authAdminA.user.id, school_id: sA.id, first_name: 'Admin', last_name: 'A', role: 'admin', email: adminAEmail },
    { id: authAdminB.user.id, school_id: sB.id, first_name: 'Admin', last_name: 'B', role: 'admin', email: adminBEmail },
    { id: authSuperAdminA.user.id, school_id: sA.id, first_name: 'Super', last_name: 'A', role: 'super_admin', email: superAdminAEmail },
    { id: authTeacherA.user.id, school_id: sA.id, first_name: 'Teacher', last_name: 'A', role: 'teacher', email: teacherAEmail },
    { id: authStudentA.user.id, school_id: sA.id, first_name: 'Student', last_name: 'A', role: 'student', email: studentAEmail },
    { id: authStudentB.user.id, school_id: sB.id, first_name: 'Student', last_name: 'B', role: 'student', email: studentBEmail }
  ]);

  // 4. Create Academic Sessions
  const { data: yA } = await adminClient.from('academic_years').insert([{ school_id: sA.id, name: `Year A ${ts}`, is_active: true }]).select().single();
  const { data: yB } = await adminClient.from('academic_years').insert([{ school_id: sB.id, name: `Year B ${ts}`, is_active: true }]).select().single();
  const { data: tA } = await adminClient.from('academic_terms').insert([{ school_id: sA.id, academic_year_id: yA.id, name: '1st Term' }]).select().single();
  const { data: tB } = await adminClient.from('academic_terms').insert([{ school_id: sB.id, academic_year_id: yB.id, name: '1st Term' }]).select().single();

  await adminClient.from('schools').update({ active_academic_year_id: yA.id, active_academic_term_id: tA.id }).eq('id', sA.id);
  await adminClient.from('schools').update({ active_academic_year_id: yB.id, active_academic_term_id: tB.id }).eq('id', sB.id);

  // 5. Create Classes & Subjects & Allocations
  const { data: cA } = await adminClient.from('classes').insert([{ school_id: sA.id, name: `Class A ${ts}`, grade_level: '10' }]).select().single();
  const { data: cB } = await adminClient.from('classes').insert([{ school_id: sB.id, name: `Class B ${ts}`, grade_level: '10' }]).select().single();

  const { data: subA } = await adminClient.from('subjects').insert([{ school_id: sA.id, name: `Math A ${ts}`, code: 'MTHA' }]).select().single();
  const { data: subB } = await adminClient.from('subjects').insert([{ school_id: sB.id, name: `Math B ${ts}`, code: 'MTHB' }]).select().single();

  const { data: csA } = await adminClient.from('class_subjects').insert([{ school_id: sA.id, class_id: cA.id, subject_id: subA.id, academic_year_id: yA.id, teacher_id: authTeacherA.user.id }]).select().single();
  const { data: csB } = await adminClient.from('class_subjects').insert([{ school_id: sB.id, class_id: cB.id, subject_id: subB.id, academic_year_id: yB.id }]).select().single();

  // 6. Enroll Students
  await adminClient.from('enrollments').insert([
    { school_id: sA.id, student_id: authStudentA.user.id, class_id: cA.id, academic_year_id: yA.id },
    { school_id: sB.id, student_id: authStudentB.user.id, class_id: cB.id, academic_year_id: yB.id }
  ]);

  // 7. Create announcements for deletion tests
  const { data: annA } = await adminClient.from('announcements').insert([{ school_id: sA.id, title: 'Ann A', content: 'Ann A', created_by: authAdminA.user.id }]).select().single();
  const { data: annB } = await adminClient.from('announcements').insert([{ school_id: sB.id, title: 'Ann B', content: 'Ann B', created_by: authAdminB.user.id }]).select().single();

  // 8. Create password reset requests
  const { data: resetReqB } = await adminClient.from('password_reset_requests').insert([{ school_id: sB.id, email: studentBEmail, full_name: 'Student B', status: 'pending' }]).select().single();

  // 9. parent_student mappings
  const { data: psA } = await adminClient.from('parent_student').insert([{ school_id: sA.id, parent_id: authAdminA.user.id, student_id: authStudentA.user.id }]).select().single();
  const { data: psB } = await adminClient.from('parent_student').insert([{ school_id: sB.id, parent_id: authAdminB.user.id, student_id: authStudentB.user.id }]).select().single();

  // 10. Login and obtain sessions
  console.log('Authenticating test sessions...');
  const sessionAdminA = await getSession(adminAEmail, password);
  const sessionAdminB = await getSession(adminBEmail, password);
  const sessionSuperAdminA = await getSession(superAdminAEmail, password);
  const sessionTeacherA = await getSession(teacherAEmail, password);
  const sessionStudentA = await getSession(studentAEmail, password);
  const sessionStudentB = await getSession(studentBEmail, password);

  console.log('--- Step 3: Running Fixed API Endpoint Tests ---');

  // --- deleteAnnouncementAction ---
  // Cross-tenant deletion test
  loginAs(sessionAdminA);
  try {
    const res = await deleteAnnouncementAction(annB.id);
    logResult('deleteAnnouncementAction', 'POST', 'Cross-Tenant Announcement Delete', 'Error (Unauthorized)', JSON.stringify(res), res?.error ? 'Pass' : 'Fail', 'Critical');
  } catch (err) {
    logResult('deleteAnnouncementAction', 'POST', 'Cross-Tenant Announcement Delete', 'Error (Unauthorized)', err.message, 'Pass');
  }

  // --- deleteUserAction ---
  // Cross-tenant profile delete test
  loginAs(sessionAdminA);
  try {
    const res = await deleteUserAction(authStudentB.user.id);
    logResult('deleteUserAction', 'POST', 'Cross-Tenant Profile Delete', 'Error (Unauthorized)', JSON.stringify(res), res?.error ? 'Pass' : 'Fail', 'Critical');
  } catch (err) {
    logResult('deleteUserAction', 'POST', 'Cross-Tenant Profile Delete', 'Error (Unauthorized)', err.message, 'Pass');
  }

  // --- unlinkParentStudentAction ---
  // Cross-tenant mapping unlink test for School A admin
  loginAs(sessionAdminA);
  try {
    const res = await unlinkParentStudentAction(psB.id);
    logResult('unlinkParentStudentAction', 'POST', 'Cross-Tenant Mapping Unlink', 'Error (Unauthorized)', JSON.stringify(res), res?.error ? 'Pass' : 'Fail', 'Critical');
  } catch (err) {
    logResult('unlinkParentStudentAction', 'POST', 'Cross-Tenant Mapping Unlink', 'Error (Unauthorized)', err.message, 'Pass');
  }

  // platform super_admin bypass test for unlinkParentStudentAction
  loginAs(sessionSuperAdminA);
  try {
    const res = await unlinkParentStudentAction(psB.id);
    logResult('unlinkParentStudentAction', 'POST', 'Super Admin Tenant Bypass', 'Success', JSON.stringify(res), res?.success ? 'Pass' : 'Fail', 'Critical');
  } catch (err) {
    logResult('unlinkParentStudentAction', 'POST', 'Super Admin Tenant Bypass', 'Success', err.message, 'Fail', 'Critical');
  }

  // --- verifyTenantOwnership Undefined ID Check ---
  loginAs(sessionAdminA);
  try {
    const res = await deleteTimetableSlotAction(null);
    if (res?.error && res.error.includes('Missing required identifier')) {
      logResult('verifyTenantOwnership', 'N/A', 'Undefined ID Check', 'Clean Error (400 equivalents)', JSON.stringify(res), 'Pass');
    } else {
      logResult('verifyTenantOwnership', 'N/A', 'Undefined ID Check', 'Clean Error (400 equivalents)', JSON.stringify(res), 'Fail', 'High');
    }
  } catch (err) {
    logResult('verifyTenantOwnership', 'N/A', 'Undefined ID Check', 'Clean Error (400 equivalents)', err.message, 'Fail', 'High');
  }

  // --- deleteTimetableSlotAction (Crash check / valid execution) ---
  // Let's create a timetable slot A using admin
  loginAs(sessionAdminA);
  const { data: slotA } = await adminClient.from('timetable_slots').insert([{
    school_id: sA.id,
    class_subject_id: csA.id,
    day_of_week: 'Monday',
    start_time: '08:00:00',
    end_time: '09:00:00',
    room: 'Room A'
  }]).select().single();

  try {
    const res = await deleteTimetableSlotAction(slotA.id);
    logResult('deleteTimetableSlotAction', 'POST', 'Valid execution (Crash check)', 'Success', JSON.stringify(res), res?.success ? 'Pass' : 'Fail', 'High');
  } catch (err) {
    logResult('deleteTimetableSlotAction', 'POST', 'Valid execution (Crash check)', 'Success', err.stack || err.message, 'Fail', 'High');
  }

  // --- updateFeeRecordAction (Crash check / valid execution) ---
  // Create fee record
  const { data: feeA } = await adminClient.from('fee_records').insert([{
    school_id: sA.id,
    student_id: authStudentA.user.id,
    academic_term_id: tA.id,
    academic_year_id: yA.id,
    amount_owed: 100,
    amount_paid: 0,
    status: 'unpaid'
  }]).select().single();

  loginAs(sessionAdminA);
  try {
    const res = await updateFeeRecordAction(feeA.id, 50, 'partial');
    logResult('updateFeeRecordAction', 'POST', 'Valid execution (Crash check)', 'Success', JSON.stringify(res), res?.success ? 'Pass' : 'Fail', 'High');
  } catch (err) {
    logResult('updateFeeRecordAction', 'POST', 'Valid execution (Crash check)', 'Success', err.stack || err.message, 'Fail', 'High');
  }

  // --- deleteAssignmentAction & gradeSubmissionAction (Crash check / valid execution) ---
  // Create assignment
  const { data: assignA } = await adminClient.from('assignments').insert([{
    school_id: sA.id,
    class_subject_id: csA.id,
    title: 'Assignment A',
    description: 'Desc A',
    due_date: new Date(Date.now() + 86400000).toISOString()
  }]).select().single();

  // Create submission
  const { data: subRecA } = await adminClient.from('submissions').insert([{
    school_id: sA.id,
    assignment_id: assignA.id,
    student_id: authStudentA.user.id,
    submission_text: 'Done',
    status: 'submitted'
  }]).select().single();

  loginAs(sessionTeacherA);
  try {
    const res = await gradeSubmissionAction(subRecA.id, 'A', 'Good');
    logResult('gradeSubmissionAction', 'POST', 'Valid execution (Crash check)', 'Success', JSON.stringify(res), res?.success ? 'Pass' : 'Fail', 'High');
  } catch (err) {
    logResult('gradeSubmissionAction', 'POST', 'Valid execution (Crash check)', 'Success', err.stack || err.message, 'Fail', 'High');
  }

  try {
    const res = await deleteAssignmentAction(assignA.id);
    logResult('deleteAssignmentAction', 'POST', 'Valid execution (Crash check)', 'Success', JSON.stringify(res), res?.success ? 'Pass' : 'Fail', 'High');
  } catch (err) {
    logResult('deleteAssignmentAction', 'POST', 'Valid execution (Crash check)', 'Success', err.stack || err.message, 'Fail', 'High');
  }

  // --- deleteCbtExamAction Teacher-Level allocation bounds ---
  // Create exam A authored by Teacher A
  loginAs(sessionTeacherA);
  const examResA = await createCbtExamAction('Exam Teacher A', csA.id, 60, [
    { question_text: 'Q1', option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D', correct_option: 'A' },
    { question_text: 'Q2', option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D', correct_option: 'B' }
  ]);
  const examIdA = examResA.examId;

  // Verify Teacher A can delete their own exam
  try {
    const res = await deleteCbtExamAction(examIdA);
    logResult('deleteCbtExamAction', 'POST', 'Teacher delete own exam', 'Success', JSON.stringify(res), res?.success ? 'Pass' : 'Fail', 'High');
  } catch (err) {
    logResult('deleteCbtExamAction', 'POST', 'Teacher delete own exam', 'Success', err.message, 'Fail', 'High');
  }

  // Create another exam A2 for School A to test cross-teacher deletion
  const { data: examA2 } = await adminClient.from('cbt_exams').insert([{
    school_id: sA.id,
    class_subject_id: csA.id,
    title: 'Exam A2',
    duration_minutes: 60,
    status: 'draft',
    created_by: authAdminA.user.id // Created by admin, not teacher A
  }]).select().single();

  // Teacher A tries to delete exam A2 (not creator, not allocated teacher of a different class if allocated teacher check is active. Wait, Teacher A IS allocated to csA, so let's make an exam for a class-subject that Teacher A is NOT allocated to!)
  const { data: cA_other } = await adminClient.from('classes').insert([{ school_id: sA.id, name: `Other Class`, grade_level: '10' }]).select().single();
  const { data: csA_other } = await adminClient.from('class_subjects').insert([{ school_id: sA.id, class_id: cA_other.id, subject_id: subA.id, academic_year_id: yA.id }]).select().single();
  const { data: examA_other } = await adminClient.from('cbt_exams').insert([{
    school_id: sA.id,
    class_subject_id: csA_other.id,
    title: 'Exam other class',
    duration_minutes: 60,
    status: 'draft',
    created_by: authAdminA.user.id
  }]).select().single();

  loginAs(sessionTeacherA);
  try {
    const res = await deleteCbtExamAction(examA_other.id);
    logResult('deleteCbtExamAction', 'POST', 'Teacher delete other class exam', 'Error (Unauthorized)', JSON.stringify(res), res?.error ? 'Pass' : 'Fail', 'High');
  } catch (err) {
    logResult('deleteCbtExamAction', 'POST', 'Teacher delete other class exam', 'Error (Unauthorized)', err.message, 'Pass');
  }

  // --- submitCbtExamAction Student enrollment validation and server-side score calculation ---
  // Create an exam A3
  loginAs(sessionTeacherA);
  const examResA3 = await createCbtExamAction('Exam A3', csA.id, 60, [
    { question_text: 'Q1', option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D', correct_option: 'A' },
    { question_text: 'Q2', option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D', correct_option: 'B' }
  ]);
  const examIdA3 = examResA3.examId;

  // Approve the exam A3
  loginAs(sessionAdminA);
  await updateCbtExamStatusAction(examIdA3, 'approved');

  // Student B (School B) tries to submit to Exam A3
  loginAs(sessionStudentB);
  try {
    const res = await submitCbtExamAction(examIdA3, [], 100, 2, 0, 0, false);
    logResult('submitCbtExamAction', 'POST', 'Cross-Tenant Exam Submission', 'Error (Unauthorized)', JSON.stringify(res), res?.error ? 'Pass' : 'Fail', 'Critical');
  } catch (err) {
    logResult('submitCbtExamAction', 'POST', 'Cross-Tenant Exam Submission', 'Error (Unauthorized)', err.message, 'Pass');
  }

  // Student A submits to Exam A3:
  // Answers: Q1 = 'A' (correct), Q2 = 'C' (incorrect).
  // Claimed score: 100 (adversarial)
  loginAs(sessionStudentA);
  try {
    // We get the actual questions first using admin to map IDs
    const { data: qs } = await adminClient.from('cbt_questions').select('id, correct_option').eq('exam_id', examIdA3);
    const q1 = qs.find(q => q.correct_option === 'A');
    const q2 = qs.find(q => q.correct_option === 'B');

    const res = await submitCbtExamAction(examIdA3, [
      { question_id: q1.id, answer: 'A' }, // correct
      { question_id: q2.id, answer: 'C' }  // incorrect
    ], 100, 2, 0, 0, false);

    // Read the stored score from DB
    const { data: subRec } = await adminClient.from('cbt_submissions').select('score').eq('exam_id', examIdA3).eq('student_id', authStudentA.user.id).single();
    if (subRec && subRec.score === 50.0) {
      logResult('submitCbtExamAction', 'POST', 'Adversarial Score recalculation', 'Stored score = 50.0', `Stored score: ${subRec.score}`, 'Pass');
    } else {
      logResult('submitCbtExamAction', 'POST', 'Adversarial Score recalculation', 'Stored score = 50.0', `Stored score: ${subRec ? subRec.score : 'None'} (Response: ${JSON.stringify(res)})`, 'Fail', 'High');
    }
  } catch (err) {
    logResult('submitCbtExamAction', 'POST', 'Adversarial Score recalculation', 'Stored score = 50.0', err.message, 'Fail', 'High');
  }

  // --- LOGIN LOCKOUT PROTECTION TESTS ---
  console.log('--- Step 3.5: Running Login Lockout Protection Tests ---');
  const lockoutEmail = `lockout_test_${ts}@lockout.com`;
  const correctPassword = 'correct_password_123';
  const wrongPassword = 'wrong_password';

  try {
    // 1. Create a temporary user for testing lockout
    const { data: lockoutAuthUser } = await adminClient.auth.admin.createUser({
      email: lockoutEmail,
      password: correctPassword,
      email_confirm: true
    });
    await adminClient.from('profiles').insert([{
      id: lockoutAuthUser.user.id,
      school_id: sA.id,
      first_name: 'Lockout',
      last_name: 'Test',
      role: 'admin',
      email: lockoutEmail
    }]);

    // 2. Perform 5 failed login attempts
    for (let i = 0; i < 5; i++) {
      const formData = new FormData();
      formData.append('email', lockoutEmail);
      formData.append('password', wrongPassword);
      await loginUser(null, formData);
    }

    // 3. Verify that the 6th login attempt with CORRECT password is blocked by lockout
    const lockoutFormData = new FormData();
    lockoutFormData.append('email', lockoutEmail);
    lockoutFormData.append('password', correctPassword);
    
    const blockRes = await loginUser(null, lockoutFormData);
    if (blockRes && blockRes.error && blockRes.error.includes('Too many failed login attempts')) {
      logResult('loginUser', 'POST', 'Brute Force Lockout - Block 6th Try (Correct Password)', 'Lockout Error', JSON.stringify(blockRes), 'Pass');
    } else {
      logResult('loginUser', 'POST', 'Brute Force Lockout - Block 6th Try (Correct Password)', 'Lockout Error', JSON.stringify(blockRes), 'Fail', 'Critical');
    }

    // 4. Reset the lockout using admin client (simulate admin/duration reset)
    await adminClient.from('failed_login_attempts').delete().eq('email', lockoutEmail);

    // 5. Verify that login succeeds now
    const loginRes = await loginUser(null, lockoutFormData);
    if (loginRes && loginRes.success) {
      logResult('loginUser', 'POST', 'Brute Force Lockout - Login Succeeds After Lockout Reset', 'Success', JSON.stringify(loginRes), 'Pass');
    } else {
      logResult('loginUser', 'POST', 'Brute Force Lockout - Login Succeeds After Lockout Reset', 'Success', JSON.stringify(loginRes), 'Fail', 'Critical');
    }

    // Clean up lockout test user
    await adminClient.auth.admin.deleteUser(lockoutAuthUser.user.id);
  } catch (err) {
    logResult('loginUser', 'POST', 'Brute Force Lockout Test Suite', 'Success', err.message, 'Fail', 'Critical');
  }

  // --- CLEANUP ---
  console.log('--- Step 4: Cleaning Up Test Data ---');
  try {
    const usersToDelete = [authAdminA.user.id, authAdminB.user.id, authSuperAdminA.user.id, authTeacherA.user.id, authStudentA.user.id, authStudentB.user.id];
    for (const uid of usersToDelete) {
      await adminClient.auth.admin.deleteUser(uid);
    }
    await adminClient.from('schools').delete().in('id', [sA.id, sB.id]);
    console.log('Cleanup completed successfully.');
  } catch (err) {
    console.error('Cleanup failed:', err.message);
  }

  console.log('\n--- Test Suite Summary Table ---');
  console.log('| Endpoint | Method | Test case | Expected | Actual | Status (Pass/Fail) | Severity if fail |');
  console.log('| --- | --- | --- | --- | --- | --- | --- |');
  for (const r of results) {
    const cleanActual = r.actual.replace(/\r?\n/g, ' ').slice(0, 100);
    console.log(`| ${r.endpoint} | ${r.method} | ${r.testCase} | ${r.expected} | ${cleanActual} | ${r.status} | ${r.severity} |`);
  }
}

runSuite().catch(console.error);
