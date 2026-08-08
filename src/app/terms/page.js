import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service | IMP3RIAL EDU',
  description: 'Terms of Service and operational guidelines for IMP3RIAL EDU.',
  alternates: {
    canonical: '/terms',
  },
};

import { ArrowLeft, CheckCircle2, AlertTriangle, CreditCard } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="page-wrapper bg-background min-h-screen">
      <div className="container py-xl max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-xs text-sm text-muted-foreground hover:text-foreground mb-lg transition-colors">
          <ArrowLeft size={16} />
          Back to Home
        </Link>
        
        <div className="mb-xl border-b border-border pb-lg">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mb-sm">Terms of Service</h1>
          <p className="text-muted-foreground text-lg">Rules and operational guidelines for institutions utilizing the IMP3RIAL EDU platform.</p>
          <p className="text-xs text-muted-foreground mt-sm">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="prose prose-invert max-w-none space-y-xl">
          
          <section>
            <div className="flex items-center gap-sm mb-md">
              <CreditCard className="text-primary" size={24} />
              <h2 className="text-2xl font-bold m-0 text-foreground">1. SaaS Subscription & Billing</h2>
            </div>
            <p className="text-foreground leading-relaxed">
              IMP3RIAL EDU operates on a tiered B2B SaaS model (Starter, Growth, Enterprise). Institutional subscriptions are managed via Paystack on a monthly or annual billing cycle. 
            </p>
            <p className="text-foreground leading-relaxed mt-sm">
              <strong>Enrollment Gates:</strong> Each tier strictly enforces student seating caps. If your school attempts to exceed its allocated student enrollment limit, the system will actively block the addition of new users until the School Admin upgrades the subscription tier. Failure to maintain an active Paystack subscription will result in immediate suspension of LMS and CBT portal access for your students and staff.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-sm mb-md">
              <AlertTriangle className="text-amber-500" size={24} />
              <h2 className="text-2xl font-bold m-0 text-foreground">2. Proctored CBT Integrity Rules</h2>
            </div>
            <p className="text-foreground leading-relaxed">
              Our platform features a highly secure Computer-Based Testing (CBT) environment. By using the CBT module, students and administrators agree to our automated enforcement policies:
            </p>
            <ul className="list-disc pl-md text-foreground leading-relaxed space-y-xs mt-sm">
              <li><strong>The 3-Strike Rule:</strong> If a student exits fullscreen mode or switches browser tabs during an active examination, a strike is recorded. Upon the third violation, the system flags the attempt as <code>proctor_violated</code>.</li>
              <li><strong>Immediate Lockout:</strong> A <code>proctor_violated</code> status instantly locks the student out of the lobby and automatically submits their current answers to the database.</li>
              <li><strong>Server-Side Grading:</strong> All CBT scores are calculated and validated strictly on the server-side against protected answer keys. Client-side score manipulation is completely ineffective.</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-sm mb-md">
              <CheckCircle2 className="text-green-500" size={24} />
              <h2 className="text-2xl font-bold m-0 text-foreground">3. Security & Brute Force Protection</h2>
            </div>
            <p className="text-foreground leading-relaxed">
              We employ aggressive security measures to protect institutional portals. Users are responsible for maintaining the confidentiality of their credentials.
            </p>
            <p className="text-foreground leading-relaxed mt-sm">
              <strong>Account Lockouts:</strong> If our system detects five (5) consecutive failed login attempts, the target account is automatically subjected to a 15-minute brute-force IP/user lockout. Administrators cannot manually override this temporary security lock; the timer must naturally expire.
            </p>
          </section>

          <section>
            <h2 id="availability" className="text-2xl font-bold mb-sm text-foreground">4. System Availability & Architecture</h2>
            <p className="text-foreground leading-relaxed">
              While we strive for 99.99% uptime utilizing Next.js and Supabase cloud infrastructure, IMP3RIAL EDU is provided "as is". We reserve the right to perform scheduled maintenance, typically during non-academic hours. We continuously monitor daily attendance cron jobs and webhook reliabilities, but we cannot be held liable for temporary interruptions caused by our third-party infrastructure providers (e.g., Vercel, Supabase, Groq).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-sm text-foreground">5. Tenant Admin Responsibilities</h2>
            <p className="text-foreground leading-relaxed">
              School Administrators hold the primary responsibility for the accuracy of their academic data. This includes ensuring correct term mapping, managing staff subject allocations, and maintaining accurate financial fee ledgers. IMP3RIAL EDU is not liable for administrative errors made within the School Admin portal that result in incorrect report cards or billing disputes with parents.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
