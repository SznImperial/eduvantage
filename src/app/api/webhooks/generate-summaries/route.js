import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req) {
  try {
    // 1. Security Check
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { classId, termId, schoolId } = body;

    if (!classId || !termId || !schoolId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // 2. Initialize Service Role Client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Missing Supabase env vars");
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 3. Fetch Students in the class
    const { data: students, error: studentErr } = await supabase
      .from('enrollments')
      .select('student_id, profiles!student_id(first_name, last_name)')
      .eq('class_id', classId)
      .eq('school_id', schoolId);

    if (studentErr) throw studentErr;
    if (!students || students.length === 0) return NextResponse.json({ success: true, message: 'No students' });

    // 4. Fetch all necessary data for the class for this term
    // Grades & Remarks
    const { data: grades, error: gradesErr } = await supabase
      .from('grades')
      .select('student_id, grade_value, remarks, class_subjects(subjects(name))')
      .eq('academic_term_id', termId)
      .eq('status', 'published')
      .eq('school_id', schoolId);
    if (gradesErr) throw gradesErr;

    // Term dates for attendance
    const { data: termData } = await supabase
      .from('academic_terms')
      .select('start_date, end_date')
      .eq('id', termId)
      .single();

    // Attendance
    let attQuery = supabase
      .from('attendance')
      .select('student_id, status')
      .eq('class_id', classId)
      .eq('school_id', schoolId);

    if (termData?.start_date) attQuery = attQuery.gte('date', termData.start_date);
    if (termData?.end_date) attQuery = attQuery.lte('date', termData.end_date);

    const { data: attendance, error: attErr } = await attQuery;
    if (attErr) throw attErr;

    // Open flags
    const { data: flags, error: flagsErr } = await supabase
      .from('attendance_flags')
      .select('student_id, flag_type, reason')
      .eq('status', 'open')
      .eq('school_id', schoolId);
    if (flagsErr) throw flagsErr;

    // Total subjects for the class
    const { data: classSubjects } = await supabase
      .from('class_subjects')
      .select('id')
      .eq('class_id', classId);
    const totalClassSubjects = classSubjects ? classSubjects.length : 0;

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) throw new Error("Missing GROQ_API_KEY");

    let summariesCreated = 0;

    // 5. Generate and store summary for each student in parallel
    const groqPromises = students.map(async (student) => {
      const studentId = student.student_id;
      const firstName = student.profiles?.first_name || 'The student';

      const studentGrades = grades.filter(g => g.student_id === studentId);
      if (studentGrades.length === 0) return; // Skip if no grades

      const studentAtt = attendance.filter(a => a.student_id === studentId);
      let attPercentage = null;
      if (studentAtt.length > 0) {
        const presentCount = studentAtt.filter(a => a.status === 'present' || a.status === 'late').length;
        attPercentage = Math.round((presentCount / studentAtt.length) * 100);
      }

      const studentFlag = flags.find(f => f.student_id === studentId);

      // Build data context string for the AI
      let dataContext = `Student Name: ${firstName}\n\nGrades & Remarks:\n`;
      studentGrades.forEach(g => {
        const subjectName = g.class_subjects?.subjects?.name || 'Subject';
        dataContext += `- ${subjectName}: ${g.grade_value}% (${g.remarks || 'No remark'})\n`;
      });

      if (attPercentage !== null) {
        dataContext += `\nOverall Attendance this term: ${attPercentage}%\n`;
      }
      
      if (studentFlag) {
        dataContext += `\nNote: The school system has flagged this student for an attendance anomaly recently (${studentFlag.reason}). Mention this gently, but do not be overly alarmist.\n`;
      }

      const publishedCount = studentGrades.length;
      const isComplete = totalClassSubjects > 0 && publishedCount >= totalClassSubjects;
      
      let systemPrompt = "You are an educator writing a short, parent-facing plain-language summary for a student's report card. " +
                         "Read the provided grades, remarks, and attendance. Write a warm but honest 3-5 sentence summary of how they did this term overall, what stood out, and what to keep an eye on. " +
                         "Do NOT use education jargon. Do NOT use cliché AI vocabulary (e.g., delve, testament, tapestry). Do NOT use emojis. Speak directly to the parent (e.g., 'David had a strong term...'). Do not sugarcoat a poor term, but be constructive.";

      if (!isComplete && totalClassSubjects > 0) {
        systemPrompt += `\n\nCRITICAL INSTRUCTION: Not all subjects have been graded yet (${publishedCount} out of ${totalClassSubjects} published). You MUST explicitly mention in your first sentence that this is a partial/early update based on the first few grades published so far, so the parent knows the term results are still incomplete.`;
      }

      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [
              {
                role: "system",
                content: systemPrompt
              },
              {
                role: "user",
                content: `Here is the data for the term:\n\n${dataContext}`
              }
            ],
            temperature: 0.4,
            max_tokens: 250
          })
        });

        if (response.ok) {
          const data = await response.json();
          const summary = data.choices[0]?.message?.content?.trim();

          if (summary) {
            await supabase.from('report_card_summaries').upsert({
              school_id: schoolId,
              student_id: studentId,
              academic_term_id: termId,
              summary: summary,
              updated_at: new Date().toISOString()
            }, { onConflict: 'student_id,academic_term_id' });
            summariesCreated++;
          }
        } else {
            console.error(`Groq API error for ${studentId}:`, await response.text());
        }
      } catch (err) {
        console.error(`AI generation failed for student ${studentId}:`, err);
      }
    });

    await Promise.all(groqPromises);

    return NextResponse.json({ success: true, summariesCreated });
  } catch (err) {
    console.error("Generate Summaries Webhook Error:", err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
