import { supabase } from '../lib/supabase';
import { createNotification } from './notifications';

export interface MentorSession {
  id: string;
  mentor_id: string;
  student_id: string;
  date: string;
  notes: string;
  created_at: string;
}

export interface StudentReport {
  id: string;
  student_id: string;
  type: 'weekly' | 'academic';
  file_url: string;
  status: 'pending' | 'approved' | 'rejected';
  feedback?: string;
  submitted_at: string;
}

export interface AssignedStudent {
  id: string;
  university: string;
  about?: string;
  extra_docs?: string[];
  user: {
    id: string;
    full_name: string;
    email: string;
    gender: string;
  };
  reports: StudentReport[];
  sessions: MentorSession[];
}

export async function getAssignedStudents(mentorId: string): Promise<AssignedStudent[]> {
  const { data: students, error } = await supabase
    .from('students')
    .select(`
      id,
      university,
      about,
      extra_docs,
      user:users(
        id,
        full_name,
        email,
        gender
      )
    `)
    .eq('assigned_mentor_id', mentorId);

  if (error) throw error;

  // Get reports and sessions for each student
  const studentsWithDetails = await Promise.all(
    (students || []).map(async (student) => {
      const [reports, sessions] = await Promise.all([
        getStudentReports(student.id),
        getStudentSessions(student.id, mentorId),
      ]);

      return {
        ...student,
        user: student.user[0],
        reports,
        sessions,
      };
    })
  );

  return studentsWithDetails;
}

export async function getStudentReports(studentId: string): Promise<StudentReport[]> {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('student_id', studentId)
    .order('submitted_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getStudentSessions(
  studentId: string,
  mentorId: string
): Promise<MentorSession[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('student_id', studentId)
    .eq('mentor_id', mentorId)
    .order('date', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createSession(
  mentorId: string,
  studentId: string,
  date: string,
  notes: string
): Promise<MentorSession> {
  const { data, error } = await supabase
    .from('sessions')
    .insert([
      {
        mentor_id: mentorId,
        student_id: studentId,
        date,
        notes,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateSession(
  sessionId: string,
  mentorId: string,
  updates: Partial<MentorSession>
): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .update(updates)
    .eq('id', sessionId)
    .eq('mentor_id', mentorId); // Ensure mentor can only update their own sessions

  if (error) throw error;
}

export async function deleteSession(sessionId: string, mentorId: string): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', sessionId)
    .eq('mentor_id', mentorId); // Ensure mentor can only delete their own sessions

  if (error) throw error;
}

export async function validateReport(
  reportId: string,
  status: 'approved' | 'rejected',
  feedback?: string
): Promise<void> {
  const { error } = await supabase
    .from('reports')
    .update({
      status,
      feedback,
    })
    .eq('id', reportId);

  if (error) throw error;

  // Get report details for notification
  const { data: report } = await supabase
    .from('reports')
    .select(`
      *,
      student:students(
        user:users(
          id,
          full_name
        )
      )
    `)
    .eq('id', reportId)
    .single();

  if (report?.student?.user) {
    // Notify student
    await createNotification(
      report.student.user[0].id,
      `Your ${report.type} report has been ${status} by your mentor${
        feedback ? `. Feedback: ${feedback}` : ''
      }`
    );

    // Notify admin if approved
    if (status === 'approved') {
      const { data: admin } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin')
        .single();

      if (admin) {
        await createNotification(
          admin.id,
          `A ${report.type} report from ${report.student.user[0].full_name} has been approved by their mentor and is ready for review.`
        );
      }
    }
  }
}

export async function updateMentorProfile(
  mentorId: string,
  updates: {
    full_name?: string;
    email?: string;
    phone?: string;
    gender?: string;
  }
): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', mentorId)
    .eq('role', 'mentor'); // Extra safety check

  if (error) throw error;
}

export async function updateMentorPassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
} 