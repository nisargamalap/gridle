// src/app/layout.js
import { Albert_Sans } from 'next/font/google';
import './globals.css';
import ClientLayout from '../components/ui/ClientLayout';
import Providers from "@/app/providers";

const albertSans = Albert_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-albert-sans',
});

export const metadata = {
  title: 'GRIDLE - Simplify your task, organize your life',
  description: 'Web-Based Task Management with AI Integrations',
};

export default function RootLayout({ children }) {
  const isAdminUser = true;

  return (
    <html lang="en" className={`${albertSans.variable}`}>
      <body>
        <Providers>
          <ClientLayout isAdmin={isAdminUser}>
            {children}
          </ClientLayout>
        </Providers>
      </body>
    </html>
  );
}
