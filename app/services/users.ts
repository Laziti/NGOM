import { supabase } from '../lib/supabase';
import { createNotification, createNotifications } from './notifications';
import { UserFormData } from '../components/forms/UserForm';

interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  gender: string;
  role: string;
}

interface Student {
  id: string;
  user_id: string;
  university: string;
  about?: string;
  extra_docs?: string[];
  assigned_mentor_id?: string;
  assigned_donor_id?: string;
  user?: User;
}

interface StudentWithUser extends Student {
  user: User;
}

interface StudentWithInnerUser {
  id: string;
  user: {
    id: string;
    full_name: string;
  };
}

interface UserBasic {
  id: string;
  full_name: string;
}

type DatabaseUser = Omit<User, 'role'> & {
  role: 'admin' | 'donor' | 'mentor' | 'student';
};

export async function createUser(userData: UserFormData) {
  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: userData.email,
    password: 'temp' + Math.random().toString(36).slice(-8), // Temporary password
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error('User creation failed');

  // Create user profile
  const { error: profileError } = await supabase.from('users').insert([
    {
      id: authData.user.id,
      email: userData.email,
      full_name: userData.full_name,
      phone: userData.phone,
      gender: userData.gender,
      role: userData.role,
    },
  ]);

  if (profileError) throw profileError;

  // If it's a student, create student profile
  if (userData.role === 'student' && userData.university) {
    const { error: studentError } = await supabase.from('students').insert([
      {
        user_id: authData.user.id,
        university: userData.university,
        about: userData.about,
        extra_docs: userData.extra_docs,
      },
    ]);

    if (studentError) throw studentError;
  }

  return authData.user;
}

export async function updateUser(userId: string, userData: Partial<UserFormData>) {
  // Update user profile
  const { error: profileError } = await supabase
    .from('users')
    .update({
      full_name: userData.full_name,
      phone: userData.phone,
      gender: userData.gender,
    })
    .eq('id', userId);

  if (profileError) throw profileError;

  // If it's a student, update student profile
  if (userData.role === 'student') {
    const { error: studentError } = await supabase
      .from('students')
      .update({
        university: userData.university,
        about: userData.about,
      })
      .eq('user_id', userId);

    if (studentError) throw studentError;
  }
}

export async function deleteUser(userId: string) {
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) throw error;
}

export async function getUsers(role?: string) {
  let query = supabase.from('users').select('*');
  
  if (role) {
    query = query.eq('role', role);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as DatabaseUser[];
}

export async function getStudentsWithDetails() {
  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      user:users(*)
    `);

  if (error) throw error;
  return data as StudentWithUser[];
}

export async function assignStudentToMentor(studentId: string, mentorId: string) {
  // Update student record
  const { error } = await supabase
    .from('students')
    .update({ assigned_mentor_id: mentorId })
    .eq('id', studentId);

  if (error) throw error;

  // Get student and mentor details for notification
  const { data: studentData } = await supabase
    .from('students')
    .select(`
      id,
      user:users!inner(
        id,
        full_name
      )
    `)
    .eq('id', studentId)
    .single();

  const { data: mentorData } = await supabase
    .from('users')
    .select('id, full_name')
    .eq('id', mentorId)
    .single();

  if (studentData && mentorData) {
    const student = {
      id: studentData.id,
      user: {
        id: studentData.user[0].id,
        full_name: studentData.user[0].full_name,
      },
    };
    const mentor = {
      id: mentorData.id,
      full_name: mentorData.full_name,
    };

    // Notify both student and mentor
    await createNotifications([
      {
        user_id: student.user.id,
        message: `You have been assigned to mentor ${mentor.full_name}`,
      },
      {
        user_id: mentorId,
        message: `You have been assigned as a mentor to ${student.user.full_name}`,
      },
    ]);
  }
}

export async function assignStudentToDonor(studentId: string, donorId: string) {
  // Update student record
  const { error } = await supabase
    .from('students')
    .update({ assigned_donor_id: donorId })
    .eq('id', studentId);

  if (error) throw error;

  // Get student and donor details for notification
  const { data: studentData } = await supabase
    .from('students')
    .select(`
      id,
      user:users!inner(
        id,
        full_name
      )
    `)
    .eq('id', studentId)
    .single();

  const { data: donorData } = await supabase
    .from('users')
    .select('id, full_name')
    .eq('id', donorId)
    .single();

  if (studentData && donorData) {
    const student = {
      id: studentData.id,
      user: {
        id: studentData.user[0].id,
        full_name: studentData.user[0].full_name,
      },
    };
    const donor = {
      id: donorData.id,
      full_name: donorData.full_name,
    };

    // Notify both student and donor
    await createNotifications([
      {
        user_id: student.user.id,
        message: `You have been assigned to donor ${donor.full_name}`,
      },
      {
        user_id: donorId,
        message: `You have been assigned as a donor to ${student.user.full_name}`,
      },
    ]);
  }
}

export async function getUnassignedStudents() {
  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      user:users(*)
    `)
    .is('assigned_donor_id', null);

  if (error) throw error;
  return data as StudentWithUser[];
}

export async function getMentorStudents(mentorId: string) {
  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      user:users(*)
    `)
    .eq('assigned_mentor_id', mentorId);

  if (error) throw error;
  return data as StudentWithUser[];
}

export async function getDonorStudents(donorId: string) {
  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      user:users(*)
    `)
    .eq('assigned_donor_id', donorId);

  if (error) throw error;
  return data as StudentWithUser[];
} 