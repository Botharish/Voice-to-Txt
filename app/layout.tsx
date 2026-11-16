import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Student Feedback Collector",
  description:
    "Collect student feedback in Tamil or English by speaking or typing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
