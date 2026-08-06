import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import ToastProvider from "@/components/ToastProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata = {
  title: "EduVantage | Next-Gen Multi-Tenant School Operating System",
  description: "EduVantage centralizes administrative workflows, school registrations, academic grading, tuition tracking, and proctored CBT exams under a secure multi-tenant model.",
  metadataBase: new URL("https://imp3rialedu-saas.vercel.app"),
  openGraph: {
    title: "EduVantage | School Operating System & CBT Platform",
    description: "Centralized workflows, proctored CBT exams, and academic tracking.",
    type: "website",
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#F7F6F1",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`} data-theme="light">
      <body className={inter.className}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
