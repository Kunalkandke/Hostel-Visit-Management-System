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
- MongoDB + Mongoose
- JWT Authentication
- Nodemailer (email notifications)

---

## ✅ Requirements
- Node.js 18+ (recommended)
- MongoDB (local or Atlas)
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
│  ├─ models/
│  │  ├─ index.js
│  │  └─ User.js
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
│  └─ .env.example
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
MONGODB_URI=Your_MongoDB_URL
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
npm run dev     # start with nodemon
npm start       # start server
npm run seed    # seed admin (from backend/.env)
```

### Frontend
```bash
npm run dev
npm run build
npm start
```

---

## 🏗️ Production Notes
- Set `FRONTEND_URL` in `backend/.env` to your deployed frontend domain for CORS.
- Set `NEXT_PUBLIC_API_URL` in `frontend/.env.local` (or your hosting provider env vars) to your deployed backend, e.g. `https://api.example.com/api/v1`.
- Build frontend with `npm run build` and serve via `npm start`.

---

## 📧 Gmail SMTP (App Password)

1. Enable 2FA on your Gmail account
2. Open **Google Account → Security → App Passwords**
3. Generate app password for **Mail**
4. Put the 16-character value into `SMTP_APP_PASSWORD`

---

## 🔒 License

This project is proprietary. See the [`LICENSE`](./LICENSE) file.
