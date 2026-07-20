import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "G6 Vendor Portal",
  description: "Vendor registration, billing and invoicing portal for G6 Labs Asia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
