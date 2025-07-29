'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import Navbar from './Navbar';
import LoadingScreen from '../auth/LoadingScreen';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { loading } = useAuth();
  
  // Determine user role from pathname
  const userRole = pathname?.split('/')[1];

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userRole={userRole} />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
} 