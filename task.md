# User Profile Feature Implementation Plan

- `[x]` Update `actions.js`
  - `[x]` Add `getUserProfileMetrics` action with strict RLS and school isolation.
- `[x]` Create Profile Components
  - `[x]` `StudentProfileCard`
  - `[x]` `TeacherProfileCard`
- `[x]` Update Admin Users Page (`src/app/dashboard/admin/users/page.js`)
  - `[x]` Add Class Filter dropdown for students.
  - `[x]` Add "View Profile" action buttons.
- `[x]` Create Admin User Profile Route (`/dashboard/admin/users/[role]/[id]/page.js`)
- `[x]` Create Student "My Profile" Route (`/dashboard/student/profile/page.js`)
- `[x]` Create Teacher "My Profile" Route (`/dashboard/teacher/profile/page.js`)
- `[x]` Update Sidebar
  - `[x]` Add "My Profile" to the Account section for Students and Teachers.
