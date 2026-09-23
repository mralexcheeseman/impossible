import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Idea Lab / IMPOSSIBLE',
  description: 'A working collection of ideas, evidence and design experiments.',
  robots: { index: false, follow: false },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
