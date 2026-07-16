# IMP3RIAL EDU 🎓

[![Next.js](https://img.shields.io/badge/Framework-Next.js%2016-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-blueviolet?style=flat-square&logo=supabase)](https://supabase.com/)
[![React](https://img.shields.io/badge/Frontend-React%2019-blue?style=flat-square&logo=react)](https://react.dev/)
[![ESLint](https://img.shields.io/badge/Linter-ESLint-4B32C3?style=flat-square&logo=eslint)](https://eslint.org/)

**IMP3RIAL EDU** is a state-of-the-art, secure, multi-tenant School Management System (SMS) and Learning Management System (LMS) combined. Built with modern web performance standards, it isolates institutional data at the database level using PostgreSQL Row-Level Security (RLS), providing multiple schools with isolated, high-performance environments under a single SaaS platform.

---

## 🚀 Technology Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router, Server Actions, Server Components)
- **Frontend library:** [React 19](https://react.dev/)
- **Backend & Database:** [Supabase](https://supabase.com/) (PostgreSQL, Realtime, Storage)
- **Authentication:** Supabase Auth with secure session cookies
- **Security Control:** Row-Level Security (RLS) & Role-Based Access Control (RBAC)
- **Aesthetic Styling:** Modern CSS variables & HSL-tailored premium layouts with fluid dark/light theme support
- **Icons:** [Lucide React](https://lucide.dev/)

---

## ✨ Core Features

- **Multi-Tenant Architecture:** Total data isolation between schools powered by Supabase RLS.
- **Tenant Control & Enrollment Gates:** Strictly prevents cross-school data visibility and ensures schools cannot exceed their student/class subscription limits.
- **Computer-Based Testing (CBT):** Timed exam lobby, real-time exam questions renderer, auto-grading, and anti-cheat tracking (flags tab switching, window blurring, and noise spikes).
- **Academic Workflow Management:** Onboarding of students/teachers, class scheduling, course allocations, real-time attendance logging, and student promotions.
- **Integrated LMS:** Assignments dispatch, online solution submissions, grading portal, and parent tracking.
- **Financial Tracking:** Student fees management (amounts owed vs. amounts paid) with history logging.
- **Security & Integrity protection:** Failed login lockout mechanism (5 failed attempts locks the IP/user for 15 minutes to block brute-force attempts).

---

## 🛠️ Getting Started

### Prerequisites

- **Node.js:** version 18.17.0 or higher (Node 20+ recommended)
- **Supabase Instance:** A project set up on Supabase with the Postgres schema applied.

### Installation & Local Setup

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
   Copy `.env.local.example` to a new file named `.env.local` in the project root:
   ```bash
   cp .env.local.example .env.local
   ```
   Fill in your Supabase details:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   ```

4. **Prepare Database Migrations & Seeds:**
   - Run the SQL scripts in `supabase/migrations/` sequentially in your Supabase SQL Editor.
   - Run `supabase/seed.sql` to populate default roles, metadata, and default schools.

5. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 🏗️ Building for Production

To build the application for production deployment:

```bash
# Compile and optimize the project
npm run build

# Start the production server
npm run start
```

To run linter checks:
```bash
npm run lint
```

---

## 🔒 Security Architecture

- **Row-Level Security (RLS):** Policies are bound to every business-level table, comparing the user's logged-in session ID (`auth.uid()`) to the school's `school_id` mapped in their profiles.
- **Server Action Validation:** Every backend transaction utilizes the `verifyTenantOwnership` check inside `src/app/actions.js` to assert that records referenced by ID belong to the operator's school.
- **Brute Force Defense:** Login attempts are rate-limited. Too many consecutive failed attempts write a record to `failed_login_attempts` and trigger a temporary 15-minute lock on that email address.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
