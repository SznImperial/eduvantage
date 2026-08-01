# IMP3RIAL EDU (EduVantage) 🎓

[![Next.js](https://img.shields.io/badge/Framework-Next.js%2016-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-blueviolet?style=flat-square&logo=supabase)](https://supabase.com/)
[![React](https://img.shields.io/badge/Frontend-React%2019-blue?style=flat-square&logo=react)](https://react.dev/)
[![Paystack](https://img.shields.io/badge/Billing-Paystack-00C3F7?style=flat-square&logo=paystack)](https://paystack.com/)
[![ESLint](https://img.shields.io/badge/Linter-ESLint-4B32C3?style=flat-square&logo=eslint)](https://eslint.org/)

**IMP3RIAL EDU (EduVantage)** is a state-of-the-art, secure, and flexible multi-tenant School Management System (SMS) and Learning Management System (LMS). Engineered with modern web performance standards and designed for both African and global educational standards, it isolates institutional data at the database level using PostgreSQL Row-Level Security (RLS). This architecture allows multiple schools to seamlessly run inside isolated, high-performance environments under a single scalable SaaS platform.

---

## 🌟 Key Highlights & Innovations

- **Hybrid Primary & Secondary School Architecture:** 
  - Supports both traditional multi-teacher systems (where teachers are assigned per subject in Secondary schools) and specialized **Primary School models**, where a single designated Class Teacher manages all academic activities, assignments, and subjects for their homeroom classroom.
  - Schools can register as *Primary*, *Secondary*, or *Both*, automatically tailoring the admin dashboard and staffing workflow to their institutional level.

- **SaaS Billing & Paystack Integration:** 
  - Automated tier management (Starter, Growth, Enterprise) with intuitive subscription cycle toggles (Monthly/Annual).
  - Built-in enrollment gates and real-time subscription enforcement that protect system resources while providing clear billing histories.

- **Total Data Sovereignty & Lifecycle Management:**
  - Administrators maintain full control over their institutional data.
  - Features a secure **Danger Zone** with mandatory confirmation controls that instantly executes a clean, cascading database wipe of the entire school, attendance logs, profiles, and associated Supabase Auth accounts via custom PostgreSQL triggers—preventing data bloat and respecting user privacy.

- **Next-Gen CBT & Anti-Cheat Engine:** 
  - Timed examination lobbies with real-time question rendering and instantaneous auto-grading.
  - Active **Anti-Cheat Tracking** that detects and flags suspicious behaviors including tab switching, browser window blurring, and unexpected background noise spikes during examinations.

---

## 🚀 Technology Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router, Server Actions, React Server Components)
- **Frontend Library:** [React 19](https://react.dev/)
- **Backend & Database:** [Supabase](https://supabase.com/) (PostgreSQL, Realtime APIs, Cloud Storage, RPC functions)
- **Authentication & Security:** Supabase Auth, secure HTTP-only cookies, Custom Postgres Auth Triggers
- **Payments & Billing:** [Paystack Integration](https://paystack.com/)
- **Styling & Design System:** Vanilla CSS with scoped CSS variables, HSL color tokens, responsive micro-animations, glassmorphism UI accents, and seamless dark/light adaptation.
- **Icons:** [Lucide React](https://lucide.dev/)

---

## ✨ Comprehensive Features

### 🏫 Academic Administration
- **Staff & Student Onboarding:** Batch registrations, profile management, and seamless role assignments.
- **Dynamic Grading & Broadsheets:** Automated calculation of termly grades, visual report card badges (bold, high-contrast color grading from bright green 'A's to intuitive warnings), and downloadable school-wide broadsheets.
- **Attendance Tracking:** Fast daily attendance registers with visual historical analytics for teachers and administrators.

### 📚 Learning Management System (LMS)
- **Assignments & Class Notes:** Teachers can upload rich lecture notes, dispatch assignments with firm deadlines, and manage digital solution submissions.
- **Parent & Student Portals:** Dedicated dashboard views where students can access report cards, study notes, and timetables, while parents monitor academic growth and attendance in real-time.

### 💳 Financial Management
- **Student Fees Ledger:** Real-time collection rate tracking, outstanding balance calculations, and individual fee billing records.
- **Subscription Health:** Clear, transparent SaaS pricing tables and subscription management tools for school owners.

---

## 🛠️ Getting Started

### Prerequisites
- **Node.js:** v18.17.0 or higher (v20+ or v22+ recommended)
- **Supabase Account:** An active Supabase project with PostgreSQL access.
- **Paystack Account:** (Optional) For live billing and subscription verifications.

### Local Setup & Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/SznImperial/eduvantage.git
   cd eduvantage
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.local.example` (or create a new `.env.local` file in the root root):
   ```bash
   cp .env.local.example .env.local
   ```
   Provide your specific project credentials:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

   # Paystack Configuration (SaaS Plans)
   PAYSTACK_SECRET_KEY=your_paystack_secret
   NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
   ```

4. **Apply Database Migrations & Triggers:**
   - Execute the sequential SQL migration scripts inside `supabase/migrations/` via your Supabase SQL Editor. This initializes tables, custom functions (`create_class_atomic`), Row-Level Security policies, and deletion triggers.
   - Run `supabase/seed.sql` to populate initial test tiers and default roles.

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view and test the application locally.

---

## 🏗️ Production Deployment & Testing

We strongly encourage validating production builds locally before pushing to CI/CD platforms (like Netlify or Vercel):

```bash
# Run local code diagnostics and linting
npm run lint

# Compile and optimize for production
npm run build

# Preview production server locally
npm run start
```

---

## 🔒 Security & Data Integrity

- **Strict Tenant Isolation (RLS):** Every single query is bounded by PostgreSQL Row-Level Security policies that check `auth.uid()` against the school's specific `school_id`. No school can ever glimpse another school's data or financial records.
- **Server-Side Action Validation:** All data mutations inside `src/app/actions.js` enforce backend tenancy and authorization verification before executing database writes.
- **Brute Force Lockout Protection:** Automated failed login tracking (`failed_login_attempts`) immediately restricts repeat offenders with temporary 15-minute IP/user locks after 5 invalid tries.
- **Cascade Auth Wiping:** Custom database triggers (`handle_deleted_profile`) clean out orphaned authentication identities directly at the Postgres engine level when an administrator triggers an account reset or school deletion.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
