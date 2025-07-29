import { supabase } from '../lib/supabase';
import { createNotification } from './notifications';

export interface SponsorshipRequest {
  id: string;
  student_id: string;
  donor_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface StudentProfile {
  id: string;
  university: string;
  about?: string;
  extra_docs?: string[];
  assigned_donor_id: string | null;
  user: {
    id: string;
    full_name: string;
    email: string;
    gender: string;
  };
}

interface StudentResponse {
  id: string;
  university: string;
  about: string | null;
  extra_docs: string[] | null;
  assigned_donor_id: string | null;
  user: Array<{
    id: string;
    full_name: string;
    email: string;
    gender: string;
  }>;
}

interface StudentWithInnerUser {
  id: string;
  user: Array<{
    id: string;
    full_name: string;
  }>;
}

function transformStudentResponse(student: StudentResponse): StudentProfile {
  return {
    id: student.id,
    university: student.university,
    about: student.about || undefined,
    extra_docs: student.extra_docs || undefined,
    assigned_donor_id: student.assigned_donor_id,
    user: student.user[0],
  };
}

export async function getAvailableStudents() {
  const { data, error } = await supabase
    .from('students')
    .select(`
      id,
      university,
      about,
      extra_docs,
      assigned_donor_id,
      user:users(
        id,
        full_name,
        email,
        gender
      )
    `)
    .is('assigned_donor_id', null);

  if (error) throw error;
  return (data as StudentResponse[]).map(transformStudentResponse);
}

export async function getAssignedStudents(donorId: string) {
  const { data, error } = await supabase
    .from('students')
    .select(`
      id,
      university,
      about,
      extra_docs,
      assigned_donor_id,
      user:users(
        id,
        full_name,
        email,
        gender
      )
    `)
    .eq('assigned_donor_id', donorId);

  if (error) throw error;
  return (data as StudentResponse[]).map(transformStudentResponse);
}

export async function createSponsorshipRequest(studentId: string, donorId: string) {
  // Check if there's already a pending request
  const { data: existingRequest } = await supabase
    .from('sponsorships')
    .select('*')
    .eq('student_id', studentId)
    .eq('donor_id', donorId)
    .eq('status', 'pending')
    .single();

  if (existingRequest) {
    throw new Error('You already have a pending request for this student');
  }

  // Create new request
  const { error } = await supabase
    .from('sponsorships')
    .insert([
      {
        student_id: studentId,
        donor_id: donorId,
        status: 'pending',
      },
    ]);

  if (error) throw error;

  // Get student details for notification
  const { data: studentData } = await supabase
    .from('students')
    .select('user:users!inner(id, full_name)')
    .eq('id', studentId)
    .single();

  if (studentData) {
    const student = studentData as StudentWithInnerUser;
    // Notify student
    await createNotification(
      student.user[0].id,
      'A donor has requested to sponsor you. Admin will review the request.'
    );

    // Notify admin
    const { data: admin } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .single();

    if (admin) {
      await createNotification(
        admin.id,
        `New sponsorship request pending approval for student ${student.user[0].full_name}`
      );
    }
  }
}

export async function getStudentReports(studentId: string) {
  const { data, error } = await supabase
    .from('reports')
    .select(`
      id,
      type,
      file_url,
      status,
      submitted_at,
      feedback
    `)
    .eq('student_id', studentId)
    .eq('status', 'approved')
    .order('submitted_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getStudentReceipts(studentId: string) {
  const { data, error } = await supabase
    .from('receipts')
    .select(`
      id,
      file_url,
      status,
      uploaded_at,
      feedback
    `)
    .eq('student_id', studentId)
    .eq('status', 'approved')
    .order('uploaded_at', { ascending: false });

  if (error) throw error;
  return data;
} 