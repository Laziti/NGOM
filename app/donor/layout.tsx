import AuthLayout from '../components/layout/AuthLayout';

export default function DonorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthLayout>{children}</AuthLayout>;
} 