'use client';

import { useState, useEffect } from 'react';
import DashboardCard from '@/app/components/dashboard/DashboardCard';
import DataTable, { Column } from '@/app/components/tables/DataTable';
import {
  getPendingReports,
  getPendingReceipts,
  updateReportStatus,
  updateReceiptStatus,
  ReportStatus,
} from '@/app/services/reports';

interface User {
  full_name: string;
  email: string;
}

interface Student {
  user: User;
}

interface Report {
  id: string;
  type: 'weekly' | 'academic';
  file_url: string;
  submitted_at: string;
  student: Student;
}

interface Receipt {
  id: string;
  file_url: string;
  uploaded_at: string;
  student: Student;
}

export default function AdminReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string>('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    id: string;
    type: 'report' | 'receipt';
    action: ReportStatus;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [reportsData, receiptsData] = await Promise.all([
        getPendingReports(),
        getPendingReceipts(),
      ]);
      setReports(reportsData);
      setReceipts(receiptsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedItem) return;

    try {
      if (selectedItem.type === 'report') {
        await updateReportStatus(selectedItem.id, selectedItem.action, feedback);
      } else {
        await updateReceiptStatus(selectedItem.id, selectedItem.action, feedback);
      }
      setShowFeedbackModal(false);
      setFeedback('');
      setSelectedItem(null);
      loadData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const openFeedbackModal = (id: string, type: 'report' | 'receipt', action: ReportStatus) => {
    setSelectedItem({ id, type, action });
    setShowFeedbackModal(true);
  };

  const reportColumns: Column<Report>[] = [
    {
      header: 'Student',
      accessor: (report) => report.student.user.full_name,
    },
    {
      header: 'Type',
      accessor: (report) => report.type,
    },
    {
      header: 'Submitted',
      accessor: (report) =>
        new Date(report.submitted_at).toLocaleDateString(),
    },
    {
      header: 'File',
      accessor: (report) => (
        <a
          href={report.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-900"
        >
          View File
        </a>
      ),
    },
  ];

  const receiptColumns: Column<Receipt>[] = [
    {
      header: 'Student',
      accessor: (receipt) => receipt.student.user.full_name,
    },
    {
      header: 'Uploaded',
      accessor: (receipt) =>
        new Date(receipt.uploaded_at).toLocaleDateString(),
    },
    {
      header: 'File',
      accessor: (receipt) => (
        <a
          href={receipt.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-900"
        >
          View Receipt
        </a>
      ),
    },
  ];

  const reportActions = (report: Report) => (
    <div className="flex space-x-2">
      <button
        onClick={() => openFeedbackModal(report.id, 'report', 'approved')}
        className="text-green-600 hover:text-green-900"
      >
        Approve
      </button>
      <button
        onClick={() => openFeedbackModal(report.id, 'report', 'rejected')}
        className="text-red-600 hover:text-red-900"
      >
        Reject
      </button>
    </div>
  );

  const receiptActions = (receipt: Receipt) => (
    <div className="flex space-x-2">
      <button
        onClick={() => openFeedbackModal(receipt.id, 'receipt', 'approved')}
        className="text-green-600 hover:text-green-900"
      >
        Approve
      </button>
      <button
        onClick={() => openFeedbackModal(receipt.id, 'receipt', 'rejected')}
        className="text-red-600 hover:text-red-900"
      >
        Reject
      </button>
    </div>
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Reports & Receipts</h1>

      <DashboardCard title="Pending Reports">
        <DataTable<Report>
          columns={reportColumns}
          data={reports}
          actions={reportActions}
        />
      </DashboardCard>

      <DashboardCard title="Pending Receipts">
        <DataTable<Receipt>
          columns={receiptColumns}
          data={receipts}
          actions={receiptActions}
        />
      </DashboardCard>

      {showFeedbackModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Provide Feedback
            </h3>
            <textarea
              className="w-full border rounded-md p-2 mb-4"
              rows={4}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Enter feedback (optional)"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowFeedbackModal(false);
                  setFeedback('');
                  setSelectedItem(null);
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusUpdate}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 