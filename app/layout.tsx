import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zone Lark — FCA Dashboard",
  description: "AI-powered Facility Condition Assessment platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
