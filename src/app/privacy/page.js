import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Database, Bot, Lock } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="page-wrapper bg-background min-h-screen">
      <div className="container py-xl max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-xs text-sm text-muted-foreground hover:text-foreground mb-lg transition-colors">
          <ArrowLeft size={16} />
          Back to Home
        </Link>
        
        <div className="mb-xl border-b border-border pb-lg">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mb-sm">Privacy Policy</h1>
          <p className="text-muted-foreground text-lg">Detailed insight into how IMP3RIAL EDU protects, isolates, and processes your institutional data.</p>
          <p className="text-xs text-muted-foreground mt-sm">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="prose prose-invert max-w-none space-y-xl">
          <section>
            <div className="flex items-center gap-sm mb-md">
              <Database className="text-primary" size={24} />
              <h2 id="architecture" className="text-2xl font-bold m-0 text-foreground">1. Multi-Tenant Data Isolation (RLS)</h2>
            </div>
            <p className="text-foreground leading-relaxed">
              IMP3RIAL EDU operates on a strict multi-tenant architecture powered by Supabase and PostgreSQL. Every single database table containing sensitive information utilizes <strong>Row-Level Security (RLS)</strong>. This means that data isolation is enforced at the database engine level. 
            </p>
            <p className="text-foreground leading-relaxed mt-sm">
              Your school's unique <code>school_id</code> binds all your students, staff, attendance logs, and financial records. It is cryptographically impossible for users from one school to query, view, or mutate the data of another school. Furthermore, all our Server Actions utilize a <code>verifyTenantOwnership</code> protocol to prevent Insecure Direct Object Reference (IDOR) attacks.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-sm mb-md">
              <Lock className="text-amber-500" size={24} />
              <h2 className="text-2xl font-bold m-0 text-foreground">2. Collection of Proctoring Data (CBT Engine)</h2>
            </div>
            <p className="text-foreground leading-relaxed">
              To ensure academic integrity during Computer-Based Testing (CBT), our testing lobbies monitor specific client-side behaviors. During an active exam, we track:
            </p>
            <ul className="list-disc pl-md text-foreground leading-relaxed space-y-xs mt-sm">
              <li><strong>Browser Focus & Tab Switching:</strong> We utilize the browser's Visibility API and Fullscreen API to detect if a student leaves the exam environment.</li>
              <li><strong>Ambient Noise Spikes:</strong> We utilize the Web Audio API to detect sudden spikes in background noise. <em>Crucially, audio is never recorded, transmitted, or stored on our servers.</em> It is analyzed purely on the student's local device to generate mathematical anomaly flags for the proctor's dashboard.</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-sm mb-md">
              <Bot className="text-blue-500" size={24} />
              <h2 className="text-2xl font-bold m-0 text-foreground">3. AI Data Processing (Groq API)</h2>
            </div>
            <p className="text-foreground leading-relaxed">
              IMP3RIAL EDU integrates ultra-fast LLaMA 3.1 models via the Groq API to provide our AI-Powered Educational Intelligence features, such as Auto-Generated Teacher Comments and Parent-Facing Term Summaries.
            </p>
            <p className="text-foreground leading-relaxed mt-sm">
              When these features are triggered, we securely transmit continuous assessment and exam scores to the Groq API strictly for generation purposes. We do not permit Groq or any third party to use your school's academic data or student names to train their foundational models.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-sm mb-md">
              <ShieldCheck className="text-green-500" size={24} />
              <h2 className="text-2xl font-bold m-0 text-foreground">4. Data Sovereignty & The Danger Zone</h2>
            </div>
            <p className="text-foreground leading-relaxed">
              We believe administrators should have total sovereignty over their data. In the event your institution wishes to leave the platform or start fresh, Super Admins have access to the <strong>Danger Zone</strong>.
            </p>
            <p className="text-foreground leading-relaxed mt-sm">
              Initiating a school deletion triggers custom cascading PostgreSQL functions (e.g., <code>handle_deleted_profile</code>). This executes an irreversible, cascading database wipe that instantly destroys all associated attendance logs, LMS assignments, CBT exam records, fee histories, and purges all associated user identities directly from the Supabase Auth engine. We leave no orphaned data behind.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-sm text-foreground">5. Third-Party Integrations</h2>
            <p className="text-foreground leading-relaxed">
              To provide our SaaS billing services, we integrate with <strong>Paystack</strong>. When School Admins manage their subscriptions or Parents pay tuition fees through our platform, financial data is securely tokenized and processed directly by Paystack. IMP3RIAL EDU does not store your raw credit card information or primary account numbers (PAN) on our database.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
