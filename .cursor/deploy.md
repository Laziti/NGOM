# Deployment Instructions

- Deploy frontend on **Vercel**.
- Keep Supabase as backend (no extra server).
- Set environment variables in Vercel:
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
- Enable Supabase RLS (Row Level Security) for all tables.
