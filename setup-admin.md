# Authentication Setup Guide

## Issues Fixed

1. **Environment Variables**: Added `.env.local` file with Supabase configuration
2. **Admin Registration**: Added admin option to registration form
3. **Middleware Logic**: Fixed redirect logic for admin users
4. **Auth Context**: Removed manual redirects to let middleware handle routing
5. **Admin Operations**: Created secure API routes for admin user operations
6. **Service Role**: Added admin Supabase client for privileged operations

## Setup Instructions

### 1. Configure Environment Variables

Update the `.env.local` file with your actual Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_actual_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_actual_supabase_service_role_key
```

### 2. Database Schema

Ensure your Supabase database has the following tables:

```sql
-- Users table
CREATE TABLE users (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  gender TEXT,
  role TEXT CHECK (role IN ('admin', 'donor', 'mentor', 'student')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Students table
CREATE TABLE students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  university TEXT,
  about TEXT,
  extra_docs TEXT[],
  assigned_mentor_id UUID REFERENCES users(id),
  assigned_donor_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can manage all users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### 3. Create First Admin User

#### Option A: Direct Database Insert (Recommended)
1. Go to your Supabase dashboard
2. Navigate to Authentication > Users
3. Create a new user with email and password
4. Copy the user ID
5. Go to Database > Table Editor > users
6. Insert a new row with:
   - id: [copied user ID]
   - email: [admin email]
   - full_name: [admin name]
   - role: 'admin'

#### Option B: Use Registration Form
1. Start the application: `npm run dev`
2. Navigate to `/register`
3. Fill out the form and select "Admin" as role
4. Register the user

### 4. Test Authentication

1. Try logging in with the admin user at `/login`
2. Verify you're redirected to `/admin/dashboard`
3. Test creating new users from the admin dashboard
4. Test role-based access by trying to access other role dashboards

## Authentication Flow

1. **Login**: User enters credentials → AuthContext validates → Middleware redirects to role-specific dashboard
2. **Registration**: User registers → Profile created in database → Middleware handles routing
3. **Admin Operations**: Admin creates/deletes users → API routes verify admin role → Supabase admin client performs operations
4. **Route Protection**: Middleware checks session and role → Redirects unauthorized users

## Troubleshooting

- **Environment Variables Not Loading**: Restart the development server after updating `.env.local`
- **Unauthorized API Calls**: Ensure the user has admin role in the database
- **Redirect Loops**: Check middleware logic and ensure user role is properly set
- **Database Errors**: Verify RLS policies allow the operations being performed