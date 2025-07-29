'use client';

import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import NotificationBell from '../notifications/NotificationBell';

interface NavbarProps {
  userRole?: string;
}

export default function Navbar({ userRole }: NavbarProps) {
  const { signOut } = useAuth();

  const roleLinks = {
    admin: [
      { href: '/admin/dashboard', label: 'Dashboard' },
      { href: '/admin/students', label: 'Students' },
      { href: '/admin/donors', label: 'Donors' },
      { href: '/admin/mentors', label: 'Mentors' },
    ],
    donor: [
      { href: '/donor/dashboard', label: 'Dashboard' },
      { href: '/donor/students', label: 'My Students' },
    ],
    mentor: [
      { href: '/mentor/dashboard', label: 'Dashboard' },
      { href: '/mentor/profile', label: 'Profile' },
    ],
    student: [
      { href: '/student/dashboard', label: 'Dashboard' },
      { href: '/student/reports', label: 'Reports' },
      { href: '/student/receipts', label: 'Receipts' },
      { href: '/student/sponsorships', label: 'Sponsorships' },
    ],
  };

  const links = userRole ? roleLinks[userRole as keyof typeof roleLinks] : [];

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-indigo-600">
                NGO Sponsorship
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-indigo-600"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            <NotificationBell />
            <button
              onClick={() => signOut()}
              className="text-gray-500 hover:text-gray-700"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="sm:hidden">
        <div className="pt-2 pb-3 space-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
            >
              {link.label}
            </Link>
          ))}
          <div className="pl-3 pr-4 py-2 flex items-center justify-between">
            <NotificationBell />
            <button
              onClick={() => signOut()}
              className="text-gray-500 hover:text-gray-700"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
} 