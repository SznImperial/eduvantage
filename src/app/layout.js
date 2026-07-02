import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata = {
  title: "EduVantage | Next-Gen Multi-Tenant School Management SaaS",
  description: "EduVantage centralizes administrative workflows, school registrations, academic grading, and student attendance tracking under a secure multi-tenant model powered by Supabase RLS.",
  metadataBase: new URL("https://eduvantage-saas.vercel.app"),
  openGraph: {
    title: "EduVantage | School Management SaaS",
    description: "Centralized workflows and academic tracking powered by Next.js and Supabase.",
    type: "website",
  }
};

import ToastProvider from "@/components/ToastProvider";

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`} data-theme="light" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (!theme) {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
