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

    // 2. Initialize Service Role Client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Missing Supabase env vars");
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 3. Fetch Data
    // We fetch all active students
    const { data: students, error: studentsErr } = await supabase
      .from('profiles')
      .select('id, school_id')
      .eq('role', 'student');
      
    if (studentsErr) throw studentsErr;

    // Fetch attendance from the last 60 days
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const sixtyDaysAgoStr = sixtyDaysAgo.toISOString().split('T')[0];

    const { data: attendances, error: attErr } = await supabase
      .from('attendance')
      .select('student_id, date, status')
      .gte('date', sixtyDaysAgoStr);

    if (attErr) throw attErr;

    // Fetch existing flags to handle deduplication
    const { data: existingFlags, error: flagErr } = await supabase
      .from('attendance_flags')
      .select('*');

    if (flagErr) throw flagErr;

    const newFlags = [];
    const today = new Date();
    
    // 4. Process each student
    for (const student of students) {
      const studentAtts = attendances.filter(a => a.student_id === student.id);
      if (studentAtts.length === 0) continue;

      const studentFlags = existingFlags.filter(f => f.student_id === student.id);

      const fourteenDaysAgo = new Date(today);
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const last14 = studentAtts.filter(a => new Date(a.date) >= fourteenDaysAgo);
      const last30 = studentAtts.filter(a => new Date(a.date) >= thirtyDaysAgo);
      const prior30 = studentAtts.filter(a => new Date(a.date) >= sixtyDaysAgo && new Date(a.date) < thirtyDaysAgo);

      // Evaluate Spike
      const last14Absences = last14.filter(a => a.status === 'absent');
      if (last14Absences.length >= 3) {
        const type = 'spike';
        const openFlag = studentFlags.find(f => f.flag_type === type && f.status === 'open');
        const pastFlag = studentFlags.find(f => f.flag_type === type && f.status !== 'open');
        
        let shouldFlag = false;
        if (!openFlag) {
          if (!pastFlag) {
            shouldFlag = true;
          } else {
            // Worsening check: any absence after the past flag was updated?
            const updatedDate = new Date(pastFlag.updated_at);
            const hasNewAbsence = last14Absences.some(a => new Date(a.date) > updatedDate);
            if (hasNewAbsence) shouldFlag = true;
          }
        }

        if (shouldFlag) {
          newFlags.push({
            student_id: student.id,
            school_id: student.school_id,
            flag_type: type,
            context: `${last14Absences.length} absences in the last 14 days.`
          });
        }
      }

      // Evaluate Decline
      if (last30.length >= 5 && prior30.length >= 5) {
        const last30Present = last30.filter(a => a.status === 'present' || a.status === 'late').length;
        const prior30Present = prior30.filter(a => a.status === 'present' || a.status === 'late').length;
        
        const last30Pct = (last30Present / last30.length) * 100;
        const prior30Pct = (prior30Present / prior30.length) * 100;

        if (prior30Pct - last30Pct >= 20) {
          const type = 'decline';
          const openFlag = studentFlags.find(f => f.flag_type === type && f.status === 'open');
          const pastFlag = studentFlags.find(f => f.flag_type === type && f.status !== 'open');
          
          let shouldFlag = false;
          if (!openFlag) {
            if (!pastFlag) {
              shouldFlag = true;
            } else {
              const updatedDate = new Date(pastFlag.updated_at);
              // Worsening check: any absence after the past flag was updated?
              const recentAbsences = last30.filter(a => a.status === 'absent' && new Date(a.date) > updatedDate);
              if (recentAbsences.length > 0) shouldFlag = true;
            }
          }

          if (shouldFlag) {
            newFlags.push({
              student_id: student.id,
              school_id: student.school_id,
              flag_type: type,
              context: `Attendance dropped from ${Math.round(prior30Pct)}% (prior month) to ${Math.round(last30Pct)}% (current month).`
            });
          }
        }
      }
    }

    // 5. Generate AI Reasons and Insert
    for (const flag of newFlags) {
      let reason = flag.context; // fallback
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [
              {
                role: "system",
                content: "You are an assistant that summarizes attendance anomalies into a single, highly concise plain-English sentence. Maximum 15 words. Example: '3 absences in the last 2 weeks.' or 'Attendance dropped from 94% to 68% this month.'"
              },
              {
                role: "user",
                content: `Summarize this anomaly: ${flag.context}`
              }
            ],
            temperature: 0.2,
            max_tokens: 30
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          const generated = data.choices[0]?.message?.content?.trim();
          if (generated) reason = generated;
        } else {
          console.error("Groq API failed with status", response.status);
        }
      } catch (err) {
        console.error("AI Generation failed for anomaly, using fallback.", err);
      }

      await supabase.from('attendance_flags').insert({
        school_id: flag.school_id,
        student_id: flag.student_id,
        flag_type: flag.flag_type,
        reason: reason,
        status: 'open'
      });
    }

    return NextResponse.json({ success: true, flagsCreated: newFlags.length });
  } catch (err) {
    console.error("Cron Error:", err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
