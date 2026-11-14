import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'agentbadge — Lighthouse for AI Coding Agents',
  description: 'Scores how well a repository can be worked on by AI coding agents from 0 to 100.',
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased bg-[#0b0f19] text-gray-100 flex flex-col justify-between">
        {children}
      </body>
    </html>
  );
}
