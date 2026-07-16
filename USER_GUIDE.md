# IMP3RIAL EDU User Guide

Welcome to **IMP3RIAL EDU**, your modern, unified school management platform! 

This guide provides step-by-step instructions on how to use IMP3RIAL EDU from the perspective of our different users: Super Admins, School Admins, Teachers, Students, and Parents.

---

## 1. Getting Started

### 1.1 Accessing the Platform
You can access IMP3RIAL EDU through your web browser. Your school will provide you with the specific URL (e.g. `https://imp3rialedu-saas.vercel.app`) to access the platform.

### 1.2 Logging In
1. Navigate to the IMP3RIAL EDU login page.
2. Enter your registered **Email** and **Password**.
3. Click the **Log In** button.
4. *Note: If you have forgotten your password, click the "Forgot Password?" link, enter your email and full name, and submit a password reset request. A school administrator will review and resolve it, generating a temporary password for you.*

### 1.3 Navigating the Dashboard
Once logged in, you will be directed to your personalized dashboard based on your role.
- **Sidebar Navigation**: Use the left-hand sidebar to navigate between different sections of the portal. It highlights your active tab.
- **Header**: The top header displays a breadcrumb (to show you exactly where you are) and an active session banner displaying your role.
- **Theme Toggle**: Use the moon/sun icon in the top right corner to switch between Light Mode and Dark Mode for comfortable viewing.

---

## 2. Portals by Role

### 2.1 Super Admin Portal
*Role: Global SaaS Administrator*

As a Super Admin, you have a bird's-eye view of the entire IMP3RIAL EDU ecosystem.
- **Tenant Management**: Register new schools (tenants) onto the platform, assigning them unique IDs, slugs, and student/class caps.
- **Tier & Cap Allocations**: Upgrade/downgrade subscription tiers and adjust school capacities (e.g., student and class limits) in real-time.
- **System Logs**: View active listings of schools, their current subscriptions, and tenant slug identifiers.

### 2.2 School Admin Portal
*Role: Principal / School Administrator*

As a School Admin, you are responsible for managing your specific institution. You cannot see data from other schools.
- **Manage Users**: Onboard new teachers, students, and parents into the system. Create password reset responses.
- **Manage Classes & Subjects**: Define the subjects offered by your school and create classes for the academic year.
- **Academic Years & Terms**: Set up and manage the start and end dates of terms/semesters, and manage active sessions.
- **Student Promotions**: Bulk promote students from one class to another or assign them to the Graduated Archive.
- **Fees Management**: Set up tuition fees, view fee records, and log payments made by students.

### 2.3 Teacher Portal
*Role: Educator / Instructor*

As a Teacher, IMP3RIAL EDU provides tools to manage your classrooms efficiently.
- **My Classes**: View all the classes and subjects you are allocated to teach for the active term.
- **Roster & Attendance**: Log daily student attendance (Present, Absent, Late) for your allocated classes.
- **LMS Assignments**: Create class coursework assignments, download student uploads, grade submissions, and give feedback.
- **Grade-book**: Record scores for continuous assessments (tests, exams) in a unified spreadsheet interface.
- **CBT Exam Constructor**: Create Computer-Based Tests, add multiple choice questions, and monitor test status (Draft, Published).

### 2.4 Student Portal
*Role: Enrolled Student*

As a Student, IMP3RIAL EDU is your hub for all academic information.
- **My Schedule**: View your daily timetable slots, subjects, and teacher details.
- **LMS Work**: Download assignment worksheets, upload files, write response text, and view teacher grades/feedback.
- **Financial Status**: Monitor your current term fees statement (amount owed, amount paid, and receipts).
- **CBT Lobby & Exam Take**: Enter timed computer-based exams.
  > [!IMPORTANT]
  > **Exam Proctor Rules**: During CBT exams, do not exit fullscreen mode or switch tabs. Doing so three times will trigger a proctor violation and lock you out of the exam, automatically submitting your current answers.
- **Academic Reports**: View your grades list, performance history, and announcements.

### 2.5 Parent Portal
*Role: Parent / Guardian*

As a Parent, you can stay informed about your child's educational journey.
- **Student Overview**: Toggle between the profiles of multiple children linked to your parent account.
- **Academic Progress**: Monitor real-time grades, teacher grading comments, and attendance logs.
- **Proctor Integrity Reports**: View proctor reports for CBT exams, showing tab switch logs, noise spikes, and proctor flags.
- **School Communications**: Read announcements broadcasted by the administration.

---

## 3. Frequently Asked Questions (FAQ)

**Q: Too many failed login attempts locked my account. What should I do?**
A: IMP3RIAL EDU locks accounts for 15 minutes after 5 consecutive failed attempts to protect against brute-force attacks. Please wait for the lockout timer to expire before attempting to log in again.

**Q: Why don't I see my classes or courses?**
A: The school administrator may not have active allocations for the current term or year. Reach out to your School Admin to confirm that your profile is enrolled in classes/subjects.

**Q: Can I access the portal on my mobile phone?**
A: Yes! IMP3RIAL EDU is designed with a fully responsive layout. You can access the platform seamlessly from your mobile browser on any smartphone or tablet.

**Q: How is my data kept secure?**
A: The platform utilizes PostgreSQL Row-Level Security (RLS) to ensure that your data is completely isolated. Cross-tenant queries are blocked at the database level.
