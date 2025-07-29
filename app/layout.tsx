import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationsProvider } from './contexts/NotificationsContext';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NGO Sponsorship System",
  description: "A platform connecting students with donors and mentors",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <NotificationsProvider>
        {children}
          </NotificationsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
