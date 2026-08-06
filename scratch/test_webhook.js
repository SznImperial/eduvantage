import { createClient } from '@supabase/supabase-js';

import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = envFile.split('\n').reduce((acc, line) => {
  const [key, val] = line.split('=');
  if (key && val) acc[key.trim()] = val.trim();
  return acc;
}, {});

Object.assign(process.env, env);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Find Shode Babajide
  const { data: student1 } = await supabase.from('profiles').select('id, school_id').ilike('first_name', '%Babajide%').single();
  const { data: student2 } = await supabase.from('profiles').select('id, school_id').ilike('last_name', '%Babajide%').single();
  const studentData = student1 || student2;

  if (!studentData) {
      const { data: search } = await supabase.from('profiles').select('*').limit(5);
      console.log("Found some profiles instead:", search);
      return;
  }

  const { data: enroll } = await supabase.from('enrollments').select('*').eq('student_id', studentData.id).single();
  const { data: school } = await supabase.from('schools').select('*').eq('id', studentData.school_id).single();
  
  const classId = enroll.class_id;
  const termId = school.active_academic_term_id;
  const schoolId = studentData.school_id;

  console.log("Triggering webhook for class", classId, "term", termId, "school", schoolId);

  const res = await fetch('http://localhost:3000/api/webhooks/generate-summaries', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CRON_SECRET}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ classId, termId, schoolId })
  });

  console.log("Webhook response status:", res.status);
  const text = await res.text();
  console.log("Webhook response body:", text);

  // Check if summary was created
  const { data: summary } = await supabase.from('report_card_summaries').select('*').eq('student_id', studentData.id);
  console.log("Summaries in DB:", summary);
}

run().catch(console.error);
