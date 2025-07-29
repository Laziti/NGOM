# Coding Rules for NGO Sponsorship System (Supabase MCP)

- Use **Next.js 14 (App Router)**, **TypeScript**, **TailwindCSS** for frontend.
- Use **Supabase MCP** for all database, authentication, and storage operations.
- Do **not** build a custom Node.js backend or external API.
- Follow **role-based access**: Admin, Student, Donor, Mentor.
- Use **Supabase Auth** (email/password login) for all users.
- All database calls must go through `@supabase/supabase-js` client.
- Follow clean folder structure:
  /app
    /admin
    /student
    /donor
    /mentor
  /components
  /lib
  /context
- Use **React Server Components** where possible, Client Components only when necessary.
- Always validate forms before sending to Supabase.
- Use toast notifications for success/error messages.
- Follow a **simple and modern dashboard UI** (Tailwind + minimal design).
