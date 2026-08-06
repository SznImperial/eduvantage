import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // 1. Get an active school and a class
  const { data: classes } = await supabase.from('classes').select('id, school_id').limit(1);
  const classId = classes[0].id;
  const schoolId = classes[0].school_id;

  // 2. Fetch existing students
  const { data: existingStudents } = await supabase
    .from('profiles')
    .select('id, first_name')
    .eq('role', 'student')
    .eq('school_id', schoolId)
    .limit(4);

  if (existingStudents.length < 4) {
    throw new Error("Not enough existing students in the database for the test.");
  }

  const studentA = existingStudents[0].id;
  const studentB = existingStudents[1].id;
  const studentC = existingStudents[2].id;
  const studentD = existingStudents[3].id;
  
  console.log(`Using existing students: ${existingStudents.map(s => s.first_name).join(', ')}`);

  const today = new Date();
  const attendances = [];

  // Helper to add attendance
  const addRecord = (studentId, daysAgo, status) => {
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    attendances.push({
      school_id: schoolId,
      student_id: studentId,
      class_id: classId,
      date: d.toISOString().split('T')[0],
      status: status
    });
  };

  // Student A: 1 absence in 60 days
  for (let i = 1; i <= 60; i++) {
    addRecord(studentA, i, i === 20 ? 'absent' : 'present');
  }

  // Student B: Sudden Spike (3 absences in last 10 days)
  for (let i = 1; i <= 60; i++) {
    let status = 'present';
    if (i === 2 || i === 4 || i === 8) status = 'absent';
    addRecord(studentB, i, status);
  }

  // Student C: Slow decline (95% last month, 70% this month)
  // prior month (days 31-60): 30 days, 1 absent = ~96%
  for (let i = 31; i <= 60; i++) addRecord(studentC, i, i === 40 ? 'absent' : 'present');
  // current month (days 1-30): 30 days, 10 absent = ~66%
  for (let i = 1; i <= 30; i++) addRecord(studentC, i, i % 3 === 0 ? 'absent' : 'present');

  // Student D: New (2 days ever, 1 absence)
  addRecord(studentD, 1, 'absent');
  addRecord(studentD, 2, 'present');

  console.log(`Inserting ${attendances.length} attendance records...`);
  
  // Batch insert
  for (let i = 0; i < attendances.length; i += 50) {
    await supabase.from('attendance').upsert(attendances.slice(i, i + 50), { onConflict: 'student_id,class_id,date' });
  }

  console.log("Seed complete! Now calling the API route locally to test.");
  
  try {
    const res = await fetch('http://localhost:3000/api/cron/attendance-flags', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`
      }
    });

    console.log("Cron response:", await res.json());
  } catch (err) {
    console.log("Cron trigger failed. Is the Next.js server running on port 3000?", err.message);
  }
}

main().catch(console.error);
