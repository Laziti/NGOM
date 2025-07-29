import { supabase } from '../lib/supabase';
import { createNotification } from './notifications';

export type ReportStatus = 'pending' | 'approved' | 'rejected';

interface ReportData {
  student_id: string;
  type: 'weekly' | 'academic';
  file_url: string;
}

interface ReceiptData {
  student_id: string;
  file_url: string;
}

export async function createReport(reportData: ReportData) {
  const { error } = await supabase.from('reports').insert([
    {
      ...reportData,
      status: 'pending',
    },
  ]);

  if (error) throw error;
}

export async function createReceipt(receiptData: ReceiptData) {
  const { error } = await supabase.from('receipts').insert([
    {
      ...receiptData,
      status: 'pending',
    },
  ]);

  if (error) throw error;
}

export async function updateReportStatus(
  reportId: string,
  status: ReportStatus,
  feedback?: string
) {
  // Update report status
  const { error } = await supabase
    .from('reports')
    .update({ status, feedback })
    .eq('id', reportId);

  if (error) throw error;

  // Get report details for notification
  const { data: report } = await supabase
    .from('reports')
    .select(`
      *,
      student:students(
        user:users(*)
      )
    `)
    .eq('id', reportId)
    .single();

  if (report?.student?.user) {
    // Notify student
    await createNotification(
      report.student.user.id,
      `Your ${report.type} report has been ${status}${
        feedback ? `. Feedback: ${feedback}` : ''
      }`
    );
  }
}

export async function updateReceiptStatus(
  receiptId: string,
  status: ReportStatus,
  feedback?: string
) {
  // Update receipt status
  const { error } = await supabase
    .from('receipts')
    .update({ status, feedback })
    .eq('id', receiptId);

  if (error) throw error;

  // Get receipt details for notification
  const { data: receipt } = await supabase
    .from('receipts')
    .select(`
      *,
      student:students(
        user:users(*)
      )
    `)
    .eq('id', receiptId)
    .single();

  if (receipt?.student?.user) {
    // Notify student
    await createNotification(
      receipt.student.user.id,
      `Your receipt has been ${status}${feedback ? `. Feedback: ${feedback}` : ''}`
    );
  }
}

export async function getStudentReports(studentId: string) {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('student_id', studentId)
    .order('submitted_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getStudentReceipts(studentId: string) {
  const { data, error } = await supabase
    .from('receipts')
    .select('*')
    .eq('student_id', studentId)
    .order('uploaded_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getPendingReports() {
  const { data, error } = await supabase
    .from('reports')
    .select(`
      *,
      student:students(
        user:users(*)
      )
    `)
    .eq('status', 'pending')
    .order('submitted_at', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getPendingReceipts() {
  const { data, error } = await supabase
    .from('receipts')
    .select(`
      *,
      student:students(
        user:users(*)
      )
    `)
    .eq('status', 'pending')
    .order('uploaded_at', { ascending: true });

  if (error) throw error;
  return data;
} 