'use client';

import DashboardCard from '@/app/components/dashboard/DashboardCard';

export default function StudentDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Student Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardCard title="Sponsorship Status">
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>Status</span>
              <span className="font-semibold text-yellow-600">Pending</span>
            </div>
            <div className="flex justify-between">
              <span>Donor</span>
              <span className="text-gray-500">Not assigned</span>
            </div>
            <div className="flex justify-between">
              <span>Mentor</span>
              <span className="text-gray-500">Not assigned</span>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Reports">
          <div className="space-y-4">
            <div className="border rounded p-4">
              <h4 className="font-medium mb-2">Weekly Report</h4>
              <button className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                Submit Report
              </button>
            </div>
            <div className="border rounded p-4">
              <h4 className="font-medium mb-2">Academic Report</h4>
              <button className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                Submit Report
              </button>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Receipts">
          <div className="space-y-2">
            <p className="text-gray-500">Upload receipts for expenses</p>
            <button className="mt-4 w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
              Upload Receipt
            </button>
          </div>
        </DashboardCard>
      </div>
    </div>
  );
} 