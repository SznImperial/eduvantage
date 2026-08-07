import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

webpush.setVapidDetails(
  'mailto:admin@eduvantage.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export const PUSH_EVENTS = {
  RESULTS_PUBLISHED: 'RESULTS_PUBLISHED',
  BROADCAST_SENT: 'BROADCAST_SENT',
  ASSIGNMENT_POSTED: 'ASSIGNMENT_POSTED',
  CBT_AUDIT: 'CBT_AUDIT'
};

/**
 * Registry of functions that resolve which user IDs should receive a push notification for a given event.
 */
const eventResolvers = {
  [PUSH_EVENTS.RESULTS_PUBLISHED]: async (supabase, payload) => {
    // payload: { classId, termId, schoolId }
    // Recipients: Students in the class + their parents
    const { data: enrollments } = await supabase
      .from('student_classes')
      .select('student_id')
      .eq('class_id', payload.classId);
    
    if (!enrollments || enrollments.length === 0) return [];
    const studentIds = enrollments.map(e => e.student_id);

    const { data: parentLinks } = await supabase
      .from('parent_student_links')
      .select('parent_id')
      .in('student_id', studentIds);

    const parentIds = parentLinks ? parentLinks.map(l => l.parent_id) : [];
    
    // Return unique IDs and standard payload format
    const uniqueIds = [...new Set([...studentIds, ...parentIds])];
    return uniqueIds.map(id => ({
      userId: id,
      title: 'New Results Published',
      body: 'Your term results have just been published.',
      url: '/dashboard' // Could be more specific if we know their exact role, but /dashboard handles redirects
    }));
  },

  [PUSH_EVENTS.BROADCAST_SENT]: async (supabase, payload) => {
    // payload: { audienceType, audienceId, schoolId, title }
    let userIds = [];
    if (payload.audienceType === 'all') {
      const { data } = await supabase.from('profiles').select('id').eq('school_id', payload.schoolId);
      if (data) userIds = data.map(d => d.id);
    } else if (payload.audienceType === 'role') {
      const { data } = await supabase.from('profiles').select('id').eq('school_id', payload.schoolId).eq('role', payload.audienceId);
      if (data) userIds = data.map(d => d.id);
    } else if (payload.audienceType === 'class') {
      const { data: classStudents } = await supabase.from('student_classes').select('student_id').eq('class_id', payload.audienceId);
      if (classStudents) userIds = classStudents.map(d => d.student_id);
    }

    return userIds.map(id => ({
      userId: id,
      title: 'New Broadcast Announcement',
      body: payload.title,
      url: '/dashboard'
    }));
  },

  [PUSH_EVENTS.ASSIGNMENT_POSTED]: async (supabase, payload) => {
    // payload: { classSubjectId, schoolId, title }
    // Find class_id from class_subject
    const { data: cs } = await supabase.from('class_subjects').select('class_id').eq('id', payload.classSubjectId).single();
    if (!cs) return [];

    const { data: enrollments } = await supabase.from('student_classes').select('student_id').eq('class_id', cs.class_id);
    if (!enrollments) return [];

    return enrollments.map(e => ({
      userId: e.student_id,
      title: 'New Assignment Posted',
      body: payload.title,
      url: '/dashboard/student' // Students go here
    }));
  },

  [PUSH_EVENTS.CBT_AUDIT]: async (supabase, payload) => {
    // payload: { schoolId, examTitle }
    const { data: admins } = await supabase.from('profiles').select('id').eq('school_id', payload.schoolId).eq('role', 'admin');
    if (!admins) return [];

    return admins.map(a => ({
      userId: a.id,
      title: 'CBT Requires Audit',
      body: `Teacher submitted "${payload.examTitle}" for review.`,
      url: '/dashboard/admin'
    }));
  }
};

/**
 * Triggers a push notification for a specific event type.
 * Safe to await inside Server Actions because it uses Promise.all for fast concurrent sending.
 */
export async function triggerPushEvent(eventType, payload) {
  try {
    // Use the Service Role to bypass RLS when looking up targets and subscriptions
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const resolver = eventResolvers[eventType];
    if (!resolver) {
      console.warn(`No resolver found for push event: ${eventType}`);
      return;
    }

    // 1. Resolve targets
    const targets = await resolver(supabase, payload);
    if (targets.length === 0) return;

    // 2. Fetch all push subscriptions for the resolved targets
    const targetUserIds = [...new Set(targets.map(t => t.userId))];
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('id, user_id, endpoint, p256dh, auth')
      .in('user_id', targetUserIds);

    if (error || !subscriptions || subscriptions.length === 0) return;

    // 3. Send notifications in parallel
    const sendPromises = subscriptions.map(async (sub) => {
      // Find the specific notification content for this user
      const targetData = targets.find(t => t.userId === sub.user_id);
      if (!targetData) return;

      const pushPayload = JSON.stringify({
        title: targetData.title,
        body: targetData.body,
        url: targetData.url
      });

      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      try {
        await webpush.sendNotification(pushSubscription, pushPayload);
      } catch (err) {
        // 410 Gone means the subscription is no longer valid (user revoked or browser cleared)
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
          console.log(`Cleaned up stale push subscription ${sub.id} for user ${sub.user_id}`);
        } else {
          console.error(`Failed to send push to ${sub.user_id}:`, err);
        }
      }
    });

    await Promise.all(sendPromises);

  } catch (err) {
    console.error(`Error in triggerPushEvent (${eventType}):`, err);
  }
}
