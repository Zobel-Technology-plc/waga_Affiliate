'use client'
import { usePathname } from 'next/navigation';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '../components/layouts/Header';
import BottomNav from '@/components/BottomNav/BottomNav';
import { GlobalProvider } from './GlobalProvider';
import ClientSessionWrapper from './ClientSessionWrapper'; // Import the wrapper

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || ''; // Provide a default empty string
  const isAdminOrLoginRoute = pathname.startsWith('/admin') || pathname === '/login';

  return (
    <html lang="en">
      <body className={inter.className}>
        <GlobalProvider>
          {!isAdminOrLoginRoute && <Header /> }
          <ClientSessionWrapper>
            {children}
            {!isAdminOrLoginRoute && <BottomNav />}
          </ClientSessionWrapper>
        </GlobalProvider>
      </body>
    </html>
  );
}
