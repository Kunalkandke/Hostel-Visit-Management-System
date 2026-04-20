# 🏫 HVMS v2 — Hostel Visit Management System

HVMS is a full-stack web application for managing hostel visit workflows with role-based access for **Admin**, **Faculty**, and **Warden** users.

## 🚀 Tech Stack

### Frontend (`frontend`)
- Next.js 14 (App Router)
- React 18
- Tailwind CSS
- Recharts

### Backend (`backend`)
- Node.js + Express
- Supabase (PostgreSQL)
- JWT Authentication
- Nodemailer (email notifications)

---

## ✅ Requirements
- Node.js 18+ (recommended)
- Supabase project (URL + service role key)
- Gmail App Password (only if you want email notifications)

---

## 📁 Project Structure

```text
HVM System(WEBSITE)/
├─ backend/
│  ├─ config/
│  │  └─ db.js
│  ├─ controllers/
│  │  ├─ authController.js
│  │  ├─ hostelController.js
│  │  ├─ reportController.js
│  │  ├─ userController.js
│  │  └─ visitController.js
│  ├─ middleware/
│  │  ├─ authMiddleware.js
│  │  └─ helpers.js
│  ├─ data/
│  │  └─ db.js
│  ├─ routes/
│  │  ├─ authRoutes.js
│  │  ├─ hostelRoutes.js
│  │  ├─ reportRoutes.js
│  │  ├─ userRoutes.js
│  │  └─ visitRoutes.js
│  ├─ services/
│  │  └─ emailService.js
│  ├─ utils/
│  │  ├─ helpers.js
│  │  └─ seedAdmin.js
│  ├─ app.js
│  ├─ server.js
│  ├─ package.json
│  ├─ .env.example
│  └─ config/supabase.js
├─ frontend/
│  ├─ app/
│  │  ├─ admin/
│  │  ├─ dashboard/
│  │  ├─ login/
│  │  ├─ profile/
│  │  ├─ visits/
│  │  ├─ warden/
│  │  ├─ layout.js
│  │  └─ page.js
│  ├─ components/
│  │  ├─ common/
│  │  └─ layout/
│  ├─ context/
│  │  └─ index.js
│  ├─ services/
│  │  ├─ api.js
│  │  └─ index.js
│  ├─ styles/
│  │  └─ globals.css
│  ├─ utils/
│  │  ├─ constants.js
│  │  └─ withAuth.js
│  ├─ next.config.js
│  └─ package.json
├─ .gitignore
├─ LICENSE
└─ README.md
```

---

## ⚡ Quick Start (Local Development)

### 1) Backend setup
```bash
cd backend
npm install
```

Create `backend/.env` (you can copy from `backend/.env.example`) and then run:

```bash
npm run dev
```

### 2) Frontend setup
```bash
cd frontend
npm install
```

(Optional but recommended) Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

Then run:

```bash
npm run dev
```

Frontend runs on: `http://localhost:3000`  
Backend runs on: `http://localhost:5000` (default)

---

## 🔐 Backend `.env` Setup

Create `backend/.env`:

```env
PORT=5000
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=change_this_to_something_long_and_random
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Admin credentials (only account that can login initially)
ADMIN_EMAIL=admin@college.edu.in
ADMIN_PASSWORD=Admin@2026
ADMIN_NAME=System Administrator

# Email (optional, for notifications)
SMTP_EMAIL=your_gmail@gmail.com
SMTP_APP_PASSWORD=your_16_char_app_password
SMTP_FROM_NAME=Hostel Visit Management System
```

> Admin account is auto-created from `.env` on first startup.

### Supabase SQL bootstrap (required once)
Run this SQL in **Supabase SQL Editor**:

```sql
create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password text not null,
  role text not null check (role in ('admin','faculty','warden')),
  department text default '',
  phone text default '',
  profile_photo text default '',
  assigned_hostel uuid null,
  is_active boolean not null default true,
  must_change_password boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hostels (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  type text not null check (type in ('boys','girls')),
  capacity integer not null check (capacity > 0),
  location text not null,
  warden uuid null references public.users(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users
  add constraint if not exists users_assigned_hostel_fkey
  foreign key (assigned_hostel) references public.hostels(id) on delete set null;

create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  faculty uuid not null references public.users(id) on delete cascade,
  hostel uuid not null references public.hostels(id) on delete cascade,
  purpose text not null check (purpose in ('inspection','student_meeting','routine_check','emergency','other')),
  purpose_detail text,
  check_in timestamptz not null default now(),
  check_out timestamptz,
  duration integer,
  status text not null default 'active' check (status in ('active','completed')),
  faculty_remarks text,
  warden_remarks text,
  is_verified boolean not null default false,
  form_submissions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_visits_faculty_status on public.visits (faculty, status);
create index if not exists idx_visits_hostel_status on public.visits (hostel, status);
create index if not exists idx_visits_check_in on public.visits (check_in desc);
create index if not exists idx_users_role on public.users (role);
```

---

## 👥 Roles & Access

| Role    | Access |
|---------|--------|
| Admin   | Full system management, users/hostels CRUD, analytics, reports |
| Faculty | Start/end visits, view own history, manage profile |
| Warden  | View active visits in assigned hostel, verify with remarks, reports |

---

## ✅ Core Features

- JWT auth (8h token validity) + bcrypt password hashing
- Role-based route protection across backend and frontend
- Admin user creation with automated welcome email
- Faculty visit flow with warden notification
- Warden verification workflow
- Reports and CSV export
- Dashboard visualizations (Recharts)
- Profile update and password change for all roles

---

## 🔗 API (Backend)

Base URL (default): `http://localhost:5000/api/v1`

Routes:
- `POST /auth/*` (rate-limited)
- `/visits/*`
- `/hostels/*`
- `/users/*`
- `/reports/*`

Health check:
- `GET http://localhost:5000/api/health`

---

## 📜 Useful Scripts

### Backend
```bash
npm run dev         # start with nodemon
npm start           # start server
npm run seed        # seed admin (from backend/.env)
npm run setup       # initialize database with sample data
npm run test-login  # test login system and verify accounts
```

### Frontend
```bash
npm run dev
npm run build
npm start
```

---

## 🧪 Testing & Debugging

### Test Login System
```bash
cd backend
npm run test-login
```

This diagnostic script will:
- ✅ Test database connection
- ✅ Verify admin account exists
- ✅ List all users in the system
- ✅ Create test faculty/warden accounts if needed
- ✅ Verify password hashing

### Setup Production Data
```bash
cd backend
npm run setup
```

This will create:
- Admin account
- 3 sample faculty accounts
- 2 sample warden accounts
- 4 sample hostels

**Default Test Accounts:**
- Faculty: `rajesh.kumar@college.edu.in` / `Faculty@123`
- Warden: `suresh.reddy@college.edu.in` / `Warden@123`

---

## 🏗️ Production Notes

### Deployment Checklist

**Backend (Render/Railway/Heroku):**
1. Set environment variables (see `.env.example`)
2. Ensure `NODE_ENV=production`
3. Set `FRONTEND_URL` to your Vercel URL
4. Run `npm run setup` after first deploy (creates sample data)
5. Check logs for CORS and connection issues

**Frontend (Vercel/Netlify):**
1. Set `NEXT_PUBLIC_API_URL` to your backend URL
2. Example: `https://your-backend.onrender.com/api/v1`
3. Redeploy after changing environment variables

### CORS Configuration
The backend automatically allows:
- All `.vercel.app` domains
- Domains specified in `FRONTEND_URL` env variable
- Domains in `FRONTEND_URLS` (comma-separated)

### Common Issues

**"Cannot connect to server"**
- Check backend is running: Visit `https://your-backend.com/api/health`
- Verify `NEXT_PUBLIC_API_URL` in Vercel matches your backend URL
- Check CORS settings in backend logs
- See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed troubleshooting

**"Invalid credentials"**
- Run `npm run test-login` to verify accounts exist
- Check user is active in database
- Verify password is correct

**Faculty can't login**
- Login as admin first
- Create faculty users via Admin → Users page
- Or run `npm run setup` to create sample accounts

### Monitoring
- Backend logs show all login attempts with success/failure reasons
- Look for `✅ Login successful` or `❌ Login failed` messages
- CORS issues show as `❌ CORS blocked for origin: ...`

For detailed deployment instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

---

## 📧 Gmail SMTP (App Password)

1. Enable 2FA on your Gmail account
2. Open **Google Account → Security → App Passwords**
3. Generate app password for **Mail**
4. Put the 16-character value into `SMTP_APP_PASSWORD`

---

## 🔒 License

This project is proprietary. See the [`LICENSE`](./LICENSE) file.
