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
  title: "IMP3RIAL EDU | Next-Gen Multi-Tenant School Operating System",
  description: "IMP3RIAL EDU centralizes administrative workflows, school registrations, academic grading, tuition tracking, and proctored CBT exams under a secure multi-tenant model.",
  metadataBase: new URL("https://edu.imp3rial.dev"),
  openGraph: {
    title: "IMP3RIAL EDU | School Operating System & CBT Platform",
    description: "Centralized workflows, proctored CBT exams, and academic tracking.",
    type: "website",
    url: "https://edu.imp3rial.dev",
    siteName: "IMP3RIAL EDU",
    images: [
      {
        url: "/imp3rialedu_dashboard_mockup.png",
        width: 1200,
        height: 630,
        alt: "IMP3RIAL EDU Dashboard Mockup",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "IMP3RIAL EDU | School Operating System",
    description: "Centralized workflows, proctored CBT exams, and academic tracking.",
    images: ["/imp3rialedu_dashboard_mockup.png"],
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#090c12", // Deep navy dark mode
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "IMP3RIAL EDU",
  "operatingSystem": "Web Browser",
  "applicationCategory": "EducationalApplication",
  "offers": {
    "@type": "Offer",
    "price": "40000",
    "priceCurrency": "NGN"
  },
  "description": "Next-Gen Multi-Tenant School Operating System and CBT Platform.",
  "url": "https://edu.imp3rial.dev"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`} data-theme="dark">
      <body className={inter.className}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
