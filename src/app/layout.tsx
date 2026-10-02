import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IMPOSSIBLE — Evidence before ambition",
  description:
    "An evidence-driven venture engine. Seven days to test a real problem.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
