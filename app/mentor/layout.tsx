import AuthLayout from '../components/layout/AuthLayout';

export default function MentorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthLayout>{children}</AuthLayout>;
} 