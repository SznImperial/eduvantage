# IMP3RIAL EDU Technical Documentation

## 1. Overview & Architecture

IMP3RIAL EDU is a modern, scalable multi-tenant school management system. The core architectural principle of this system is **multi-tenancy**. Instead of a single application serving a single school, a single unified platform serves multiple schools (tenants) simultaneously, with strict data isolation.

### 1.1 Multi-Tenancy Model
Data isolation is enforced through **PostgreSQL Row-Level Security (RLS)** in Supabase. Each user belongs to a specific school, and their database queries are automatically filtered to only allow read/write access to records associated with their respective `school_id`. This prevents cross-tenant data leaks and ensures high security.

### 1.2 Role-Based Access Control (RBAC)
The platform differentiates users via distinct roles. These roles dictate what UI portals are visible and what data they can interact with:
*   **Super Admin** (`super_admin`): The global SaaS administrator capable of managing tenant schools and overarching system settings.
*   **School Admin** (`admin`): The principal or administrator for a single school. They can manage classes, subjects, teachers, and students within their tenant.
*   **Teacher** (`teacher`): Can access their assigned classes, input grades, and manage course materials.
*   **Student** (`student`): Can view their schedules, coursework, and grades.
*   **Parent** (`parent`): Can monitor their child's academic progress and communicate with teachers.

---

## 2. Tech Stack

*   **Framework:** Next.js (App Router, Server Actions, Server Components)
*   **Backend / Database:** Supabase (PostgreSQL, Supabase Auth)
*   **Styling:** Tailwind CSS / Custom UI CSS (`globals.css`)
*   **Icons:** Lucide React

---

## 3. Setup & Installation

### 3.1 Local Development Setup

1.  **Clone the repository and install dependencies:**
    ```bash
    git clone https://github.com/yourusername/imp3rialedu.git
    cd imp3rialedu
    npm install
    ```

2.  **Environment Variables:**
    Copy `.env.local.example` to `.env.local` and populate it with your Supabase project keys.
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

3.  **Run the application locally:**
    ```bash
    npm run dev
    ```
    The application will be accessible at `http://localhost:3000`.

### 3.2 Database Setup
1. Apply the initial schema migrations inside your Supabase project.
2. Go to the SQL Editor in your Supabase dashboard and run the seed script located at `supabase/seed.sql`. This will create default tenant schools (e.g., Aetherium Academy, Zenith Heights High), subjects, and classes.

---

## 4. Database Schema Overview

The Supabase PostgreSQL database is structured to enforce the multi-tenant architecture:

*   **`schools`**: The core tenant table containing school information (ID, name, slug).
*   **`profiles`**: Extending the standard Supabase Auth user. Contains `first_name`, `last_name`, `role`, and a foreign key to `school_id`.
*   **`academic_years`**: Defines time periods for academic activities, linked to a specific `school_id`.
*   **`subjects`**: Represents courses offered by a school, linked to a `school_id`.
*   **`classes`**: Represents a physical or virtual classroom, linked to an `academic_year_id` and `school_id`.

**Security Note:**
Every table (except global tables like `schools`) includes a `school_id` foreign key. Supabase RLS policies are attached to these tables ensuring users can only interact with rows where `school_id` matches their own profile's `school_id`.

---

## 5. Project Structure

```text
src/
├── app/                  # Next.js App Router root
│   ├── dashboard/        # Authenticated portals (admin, teacher, student, etc.)
│   ├── login/            # Authentication flow
│   ├── register/         # User onboarding flow
│   └── page.js           # Public landing page
├── components/           # Reusable UI components
│   └── landing/          # Landing page specific components
└── lib/                  # Utilities
    └── supabaseServer.js # Supabase client configurations
```

## 6. Future Enhancements

*   **Billing & Subscriptions:** Integrate Stripe for SaaS billing models based on school usage.
*   **Advanced Analytics:** Add a reporting dashboard for Super Admins to monitor tenant activity.
*   **Notifications System:** Real-time push notifications for grade updates and announcements using Supabase Realtime.
