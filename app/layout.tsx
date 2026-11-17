import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Student Feedback Collector",
  description:
    "Collect student feedback with live Tamil and English voice transcription.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        {process.env.VERCEL === "1" && <Analytics />}
      </body>
    </html>
  );
}
