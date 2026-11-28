import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Tamil } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSansTamil = Noto_Sans_Tamil({
  variable: "--font-noto-sans-tamil",
  subsets: ["tamil"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Science Hub - Jaffna | Official Online Learning Portal",
  description:
    "Official Learning Management System of Science Hub - Jaffna (Education changes the world) for Live Zoom Classes, Study Tutes, Past Lesson Recordings, and Timed Online Exams.",
  icons: {
    icon: "/logo.jpg",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${notoSansTamil.variable} h-full antialiased`}
    >
      <body
        style={{
          fontFamily:
            "var(--font-geist-sans), var(--font-noto-sans-tamil), sans-serif",
        }}
        className="min-h-full flex flex-col"
      >
        {children}
      </body>
    </html>
  );
}