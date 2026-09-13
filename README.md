# GudangApp — Warehouse Management System

A web-based warehouse management system built to solve a real problem: most SME and FMCG warehouses in Indonesia still manage stock data through disconnected Excel files with no access control, no audit trail, and no role separation. GudangApp replaces that with a proper digital system.

---

## Features

- **Stock management** — track inventory in and out, with transaction history
- **Role-based access control** — three permission levels that enforce themselves at the database level, not just the UI
  - `superadmin` — full access including user and role management
  - `admin` — manage data, categories, and regular users
  - `staff` — transactional read + write only, no system access
- **Category management** — admin-controlled master list prevents inconsistent free-text entries
- **User management** — superadmin and admin can create, edit, and assign roles to users
- **Clean, professional UI** — Odoo-inspired light mode, sidebar navigation, Inter font, readable forms and tables

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | JavaScript, HTML, CSS, TypeScript |
| Build tool | Vite |
| Backend & Database | Supabase (PostgreSQL + Row-Level Security + Auth) |
| Deployment | Vercel |
| Version control | Git / GitHub |

---

## Architecture Note: Why RLS?

Most beginner projects enforce access control in the frontend — if the user is not an admin, don't show the button. That is not secure. GudangApp uses Supabase Row-Level Security (RLS), which means the **database itself** enforces who can read, write, or modify each table — regardless of what the frontend sends. A staff user cannot access the Users or Categories tables even if they bypass the UI entirely.

---

## Demo Credentials

You can test the three permission levels with these accounts:

| Role | Email | Password |
|---|---|---|
| Superadmin | superadmin@gudangapp.com | Super123! |
| Admin | admin@gudangapp.com | Admin123! |
| Staff | staff@gudangapp.com | Staff123! |

---

## Local Setup

```bash
# 1. Clone the repo
git clone https://github.com/farfar2/gudangapp-claudever.git
cd gudangapp-claudever

# 2. Install dependencies
bun install   # or: npm install

# 3. Set up environment variables
# Create a .env file in the root with:
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# 4. Run the database schema
# In your Supabase dashboard, run supabase/schema_additions.sql

# 5. Start the dev server
bun run dev   # or: npm run dev
```

---

## Deploy to Vercel

1. Push to GitHub
2. Connect the repo to [Vercel](https://vercel.com)
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy

---

## Version History

See [CHANGELOG.md](./CHANGELOG.md) for a full breakdown of changes from v1 to v2.

**v2 highlights:**
- Rebuilt with Claude as a vibe coding collaborator
- New professional UI (light mode, Inter font, clean sidebar)
- Role hierarchy extended to superadmin → admin → staff
- RLS policies updated for all three roles
- Category management system added (admin-controlled, not free-text)

---

## About This Project

This app was built as a personal project while working full-time in logistics and supply chain administration. I noticed how much of warehouse data management still relied on manual Excel files and wanted to build something better. It is also my primary portfolio project for my application to the Apple Developer Academy — Engineering Track.

Built with vibe coding + AI assistance (Claude), with a focus on understanding what the code actually does rather than just generating it.
