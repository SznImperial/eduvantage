import { 
  saveGradesAction, 
  enrollStudentAction, 
  createPasswordResetRequestAction,
  resolvePasswordResetRequestAction,
  loginUser,
  createUserAccount,
  createClassAction,
  signUpSchool
} from '@/app/actions';
import { createAdminClient } from '@/lib/supabaseAdmin';

export async function POST(req) {
  const body = await req.json();
  const { action, args } = body;

  try {
    if (action === 'saveGrades') {
      const result = await saveGradesAction(...args);
      return Response.json(result);
    } 
    else if (action === 'enrollStudent') {
      const result = await enrollStudentAction(...args);
      return Response.json(result);
    }
    else if (action === 'resetPassword') {
      const result = await createPasswordResetRequestAction(...args);
      return Response.json(result);
    }
    else if (action === 'createUserAccount') {
      const formData = new FormData();
      for (const [k, v] of Object.entries(args[0])) {
        formData.append(k, v);
      }
      const result = await createUserAccount(formData);
      return Response.json(result);
    }
    else if (action === 'signUpSchool') {
      const formData = new FormData();
      for (const [k, v] of Object.entries(args[0])) {
        formData.append(k, v);
      }
      const result = await signUpSchool(null, formData);
      return Response.json(result);
    }
    else if (action === 'resolvePasswordReset') {
      const result = await resolvePasswordResetRequestAction(...args);
      return Response.json(result);
    }
    else if (action === 'getResetRequest') {
      const adminClient = createAdminClient();
      const { data } = await adminClient.from('password_reset_requests').select('id').eq('email', args[0]).single();
      return Response.json(data);
    }
    else if (action === 'createClassAction') {
      const result = await createClassAction(...args);
      return Response.json(result);
    }
    else if (action === 'login') {
      const formData = new FormData();
      formData.append('email', args[0]);
      formData.append('password', args[1]);
      const result = await loginUser(null, formData);
      return Response.json(result || { success: true });
    }
    else if (action === 'setupTestAccounts') {
      const adminClient = createAdminClient();
      
      const ts = Date.now();
      
      // Setup School A
      // We will set its limit artificially low to test atomic limits quickly
      const { data: sA } = await adminClient.from('schools')
        .insert([{ 
          name: `School A ${ts}`, 
          slug: `school-a-${ts}`,
          max_student_limit: 2,
          max_class_limit: 2
        }])
        .select().single();
        
      const { data: adminA } = await adminClient.auth.admin.createUser({ email: `admina_${ts}@schoola.com`, password: 'password123', email_confirm: true });
      await adminClient.from('profiles').insert([{ id: adminA.user.id, school_id: sA.id, first_name: 'Admin', last_name: 'A', role: 'admin', email: `admina_${ts}@schoola.com` }]);

      // Setup School B
      const { data: sB } = await adminClient.from('schools').insert([{ name: `School B ${ts}`, slug: `school-b-${ts}` }]).select().single();
      const { data: yB } = await adminClient.from('academic_years').insert([{ school_id: sB.id, name: '2026/2027', start_date: '2026-09-01', end_date: '2027-06-30' }]).select().single();
      const { data: cB } = await adminClient.from('classes').insert([{ school_id: sB.id, name: 'Grade 10B', grade_level: '10' }]).select().single();
      const { data: subB } = await adminClient.from('subjects').insert([{ school_id: sB.id, name: 'Math B', code: 'MTHB' }]).select().single();
      const { data: csB } = await adminClient.from('class_subjects').insert([{ school_id: sB.id, class_id: cB.id, subject_id: subB.id }]).select().single();
      
      // Student B in School B
      const { data: stuB } = await adminClient.auth.admin.createUser({ email: `studentb_${ts}@schoolb.com`, password: 'password123', email_confirm: true });
      await adminClient.from('profiles').insert([{ id: stuB.user.id, school_id: sB.id, first_name: 'Student', last_name: 'B', role: 'student', email: `studentb_${ts}@schoolb.com` }]);

      return Response.json({
        schoolA_id: sA.id,
        adminA_email: `admina_${ts}@schoola.com`,
        adminA_id: adminA.user.id,
        schoolB_id: sB.id,
        classB_id: cB.id,
        studentB_id: stuB.user.id,
        ts
      });
    }
    
    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
