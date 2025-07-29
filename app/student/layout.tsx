import AuthLayout from '../components/layout/AuthLayout';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthLayout>{children}</AuthLayout>;
} 