# Supabase Database Schema (via MCP)

Tables to create:

1. **users**
   - id (uuid, primary key)
   - full_name (text)
   - email (text, unique)
   - phone (text)
   - gender (text)
   - role (enum: admin, donor, mentor, student)

2. **students**
   - id (uuid, primary key)
   - user_id (uuid, FK → users.id)
   - university (text)
   - extra_docs (array of text, file URLs)
   - assigned_donor_id (uuid, FK → users.id)
   - assigned_mentor_id (uuid, FK → users.id)

3. **sponsorships**
   - id (uuid)
   - student_id (uuid, FK → students.id)
   - donor_id (uuid, FK → users.id)
   - status (enum: pending, approved, rejected)
   - created_at (timestamp)

4. **reports**
   - id (uuid)
   - student_id (uuid, FK → students.id)
   - type (enum: weekly, academic)
   - file_url (text)
   - status (enum: pending, approved, rejected)
   - feedback (text)
   - submitted_at (timestamp)

5. **receipts**
   - id (uuid)
   - student_id (uuid)
   - file_url (text)
   - status (enum: pending, approved, rejected)
   - feedback (text)
   - uploaded_at (timestamp)

6. **sessions**
   - id (uuid)
   - mentor_id (uuid, FK → users.id)
   - student_id (uuid)
   - date (timestamp)
   - notes (text)

7. **notifications**
   - id (uuid)
   - user_id (uuid, FK → users.id)
   - message (text)
   - is_read (boolean)
   - created_at (timestamp)
