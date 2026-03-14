import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import StyledComponentsRegistry from "@/lib/registry";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Academix - Academic Management System",
  description: "A comprehensive academic management system for virtual classrooms, assignment tracking, and student performance monitoring.",
  keywords: ["education", "LMS", "virtual classroom", "academic management", "Academix"],
  authors: [{ name: "Academix Team" }],
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  themeColor: "#4f46e5", // Indigo-600
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <StyledComponentsRegistry>
          {children}
          <Toaster position="top-right" richColors />
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
