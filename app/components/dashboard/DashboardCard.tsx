import { ReactNode } from 'react';

interface DashboardCardProps {
  title: ReactNode;
  children: ReactNode;
}

export default function DashboardCard({ title, children }: DashboardCardProps) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          {title}
        </h3>
        <div className="mt-2">{children}</div>
      </div>
    </div>
  );
} 