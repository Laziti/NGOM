import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase-admin';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

async function verifyAdmin(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return false;
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();

  return userData?.role === 'admin';
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userData = await request.json();
    
    // Create auth user using admin client
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: 'temp' + Math.random().toString(36).slice(-8), // Temporary password
      email_confirm: true, // Auto-confirm email for admin-created users
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('User creation failed');

    // Create user profile
    const { error: profileError } = await supabaseAdmin.from('users').insert([
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
      const { error: studentError } = await supabaseAdmin.from('students').insert([
        {
          user_id: authData.user.id,
          university: userData.university,
          about: userData.about,
          extra_docs: userData.extra_docs,
        },
      ]);

      if (studentError) throw studentError;
    }

    return NextResponse.json({ success: true, user: authData.user });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create user' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify admin access
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete user' },
      { status: 500 }
    );
  }
}