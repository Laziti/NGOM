import { supabase } from '../lib/supabase';
import { createNotification } from './notifications';

export interface Report {
  id: string;
  student_id: string;
  type: 'weekly' | 'academic';
  content: string;
  file_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  feedback?: string;
  submitted_at: string;
}

export interface Receipt {
  id: string;
  student_id: string;
  amount: number;
  file_url: string;
  status: 'pending' | 'approved' | 'rejected';
  feedback?: string;
  uploaded_at: string;
}

export interface SponsorshipStatus {
  id: string;
  student_id: string;
  donor_id: string;
  status: 'pending' | 'approved' | 'rejected';
  donor: {
    id: string;
    full_name: string;
    email: string;
  };
}

export async function submitReport(
  studentId: string,
  type: 'weekly' | 'academic',
  content: string,
  file?: File
): Promise<void> {
  let file_url: string | undefined;

  // Upload file if provided
  if (file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${type}-report-${Date.now()}.${fileExt}`;
    const filePath = `reports/${studentId}/${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('student-files')
      .upload(filePath, file);

    if (uploadError) throw uploadError;
    
    const { data: { publicUrl } } = supabase.storage
      .from('student-files')
      .getPublicUrl(filePath);
    
    file_url = publicUrl;
  }

  // Create report record
  const { error } = await supabase.from('reports').insert([
    {
      student_id: studentId,
      type,
      content,
      file_url,
      status: 'pending',
      submitted_at: new Date().toISOString(),
    },
  ]);

  if (error) throw error;

  // Notify mentor if assigned
  const { data: student } = await supabase
    .from('students')
    .select('assigned_mentor_id')
    .eq('id', studentId)
    .single();

  if (student?.assigned_mentor_id) {
    await createNotification(
      student.assigned_mentor_id,
      `New ${type} report submitted for review`
    );
  }
}

export async function uploadReceipt(
  studentId: string,
  amount: number,
  file: File
): Promise<void> {
  // Upload file
  const fileExt = file.name.split('.').pop();
  const fileName = `receipt-${Date.now()}.${fileExt}`;
  const filePath = `receipts/${studentId}/${fileName}`;

  const { error: uploadError, data } = await supabase.storage
    .from('student-files')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('student-files')
    .getPublicUrl(filePath);

  // Create receipt record
  const { error } = await supabase.from('receipts').insert([
    {
      student_id: studentId,
      amount,
      file_url: publicUrl,
      status: 'pending',
      uploaded_at: new Date().toISOString(),
    },
  ]);

  if (error) throw error;

  // Notify admin
  const { data: admin } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'admin')
    .single();

  if (admin) {
    await createNotification(
      admin.id,
      `New tuition receipt uploaded for verification`
    );
  }
}

export async function getStudentReports(studentId: string): Promise<Report[]> {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('student_id', studentId)
    .order('submitted_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getStudentReceipts(studentId: string): Promise<Receipt[]> {
  const { data, error } = await supabase
    .from('receipts')
    .select('*')
    .eq('student_id', studentId)
    .order('uploaded_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getSponsorshipStatus(studentId: string): Promise<SponsorshipStatus[]> {
  const { data, error } = await supabase
    .from('sponsorships')
    .select(`
      id,
      student_id,
      donor_id,
      status,
      donor:users(
        id,
        full_name,
        email
      )
    `)
    .eq('student_id', studentId);

  if (error) throw error;
  return data.map(item => ({
    ...item,
    donor: item.donor[0],
  }));
}

export async function resubmitReport(reportId: string, content: string, file?: File): Promise<void> {
  let file_url: string | undefined;

  // Get existing report
  const { data: existingReport, error: fetchError } = await supabase
    .from('reports')
    .select('student_id, type')
    .eq('id', reportId)
    .single();

  if (fetchError) throw fetchError;

  // Upload new file if provided
  if (file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${existingReport.type}-report-${Date.now()}.${fileExt}`;
    const filePath = `reports/${existingReport.student_id}/${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('student-files')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('student-files')
      .getPublicUrl(filePath);

    file_url = publicUrl;
  }

  // Update report
  const { error } = await supabase
    .from('reports')
    .update({
      content,
      file_url: file_url || undefined,
      status: 'pending',
      feedback: null,
    })
    .eq('id', reportId);

  if (error) throw error;

  // Notify mentor if assigned
  const { data: student } = await supabase
    .from('students')
    .select('assigned_mentor_id')
    .eq('id', existingReport.student_id)
    .single();

  if (student?.assigned_mentor_id) {
    await createNotification(
      student.assigned_mentor_id,
      `A ${existingReport.type} report has been resubmitted for review`
    );
  }
}

export async function resubmitReceipt(
  receiptId: string,
  amount: number,
  file: File
): Promise<void> {
  // Get existing receipt
  const { data: existingReceipt, error: fetchError } = await supabase
    .from('receipts')
    .select('student_id')
    .eq('id', receiptId)
    .single();

  if (fetchError) throw fetchError;

  // Upload new file
  const fileExt = file.name.split('.').pop();
  const fileName = `receipt-${Date.now()}.${fileExt}`;
  const filePath = `receipts/${existingReceipt.student_id}/${fileName}`;

  const { error: uploadError, data } = await supabase.storage
    .from('student-files')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('student-files')
    .getPublicUrl(filePath);

  // Update receipt
  const { error } = await supabase
    .from('receipts')
    .update({
      amount,
      file_url: publicUrl,
      status: 'pending',
      feedback: null,
    })
    .eq('id', receiptId);

  if (error) throw error;

  // Notify admin
  const { data: admin } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'admin')
    .single();

  if (admin) {
    await createNotification(
      admin.id,
      `A tuition receipt has been resubmitted for verification`
    );
  }
} 