'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { supabase } from '@/app/lib/supabase';
import DashboardCard from '@/app/components/dashboard/DashboardCard';
import FileUpload from '@/app/components/common/FileUpload';
import {
  uploadReceipt,
  resubmitReceipt,
  getStudentReceipts,
  Receipt,
} from '@/app/services/students';

export default function StudentReceipts() {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<unknown>(null);
  const [amount, setAmount] = useState('');
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadReceipts();
    }
  }, [user]);

  const loadReceipts = async () => {
    try {
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (student) {
        const data = await getStudentReceipts(student.id);
        setReceipts(data);
      }
    } catch (error) {
      console.error('Error loading receipts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !selectedFile) return;

    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!student) throw new Error('Student record not found');

      const amountValue = parseFloat(amount);
      if (isNaN(amountValue)) throw new Error('Invalid amount');

      if (editingReceipt) {
        await resubmitReceipt(editingReceipt.id, amountValue, selectedFile as File);
      } else {
        await uploadReceipt(student.id, amountValue, selectedFile as File);
      }

      setAmount('');
      setSelectedFile(null);
      setEditingReceipt(null);
      setSuccess(
        editingReceipt
          ? 'Receipt resubmitted successfully'
          : 'Receipt uploaded successfully'
      );
      loadReceipts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload receipt');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (receipt: Receipt) => {
    setEditingReceipt(receipt);
    setAmount(receipt.amount.toString());
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Tuition Receipts</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DashboardCard
          title={editingReceipt ? 'Resubmit Receipt' : 'Upload New Receipt'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Amount (USD)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Enter amount"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Receipt Document
              </label>
              <FileUpload
                studentId={user?.id || ''}
                type="receipt"
                onUploadComplete={(file) => setSelectedFile(file)}
                maxSize={5 * 1024 * 1024}
                acceptedTypes={['.pdf', '.jpg', '.jpeg', '.png']}
              />
            </div>

            <div className="flex justify-end space-x-2">
              {editingReceipt && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingReceipt(null);
                    setAmount('');
                    setSelectedFile(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={submitting || !selectedFile}
                className={`px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  (submitting || !selectedFile) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {submitting
                  ? 'Uploading...'
                  : editingReceipt
                  ? 'Resubmit Receipt'
                  : 'Upload Receipt'}
              </button>
            </div>
          </form>
        </DashboardCard>

        <DashboardCard title="Recent Receipts">
          <div className="space-y-4">
            {receipts.length > 0 ? (
              receipts.map((receipt) => (
                <div
                  key={receipt.id}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {formatAmount(receipt.amount)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Uploaded on {formatDate(receipt.uploaded_at)}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        receipt.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : receipt.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1)}
                    </span>
                  </div>

                  <a
                    href={receipt.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-600 hover:text-indigo-500"
                  >
                    View Receipt
                  </a>

                  {receipt.feedback && (
                    <div className="mt-2 text-sm">
                      <span className="font-medium text-gray-500">Feedback: </span>
                      <span className="text-gray-600">{receipt.feedback}</span>
                    </div>
                  )}

                  {receipt.status === 'rejected' && (
                    <button
                      onClick={() => handleEdit(receipt)}
                      className="mt-2 text-sm text-indigo-600 hover:text-indigo-500"
                    >
                      Resubmit Receipt
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No receipts uploaded yet</p>
            )}
          </div>
        </DashboardCard>
      </div>
    </div>
  );
} 