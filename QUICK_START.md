# ⚡ Quick Start Guide

Get HVMS up and running in 5 minutes!

## 🎯 For Local Development

### 1. Clone & Install

```bash
# Clone the repository
git clone <your-repo-url>
cd hvms

# Install backend
cd backend
npm install

# Install frontend
cd ../frontend
npm install
```

### 2. Setup Backend

```bash
cd backend

# Copy environment file
cp .env.example .env

# Edit .env with your credentials
# Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET

# Initialize database and create sample data
npm run setup

# Start backend
npm run dev
```

Backend runs on: `http://localhost:5000`

### 3. Setup Frontend

```bash
cd frontend

# Copy environment file
cp .env.local.example .env.local

# Edit .env.local (should already be correct for local dev)
# NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1

# Start frontend
npm run dev
```

Frontend runs on: `http://localhost:3000`

### 4. Login

Open `http://localhost:3000` and login with:

**Admin:**
- Email: `admin@college.edu.in`
- Password: `Admin@2026`

**Faculty (created by setup):**
- Email: `rajesh.kumar@college.edu.in`
- Password: `Faculty@123`

**Warden (created by setup):**
- Email: `suresh.reddy@college.edu.in`
- Password: `Warden@123`

---

## 🚀 For Production Deployment

### Backend (Render)

1. Create new Web Service on Render
2. Connect your Git repository
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variables from `.env.example`
6. **Important:** Set `FRONTEND_URL` to your Vercel URL
7. Deploy
8. Run `npm run setup` in Render Shell (one time)

### Frontend (Vercel)

1. Create new project on Vercel
2. Connect your Git repository
3. Set root directory: `frontend`
4. Add environment variable:
   - `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api/v1`
5. Deploy

### Test Deployment

1. Visit your Vercel URL
2. Login with admin credentials
3. Check browser console (F12) for `🔗 API URL: ...`
4. If issues, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

---

## 🧪 Verify Everything Works

### Backend Health Check
```bash
curl https://your-backend.onrender.com/api/health
```

Should return:
```json
{"success":true,"message":"HVMS API running","time":"..."}
```

### Test Login System
```bash
cd backend
npm run test-login
```

### Run Diagnostics
```bash
cd backend
npm run diagnose
```

---

## 📚 Next Steps

- Read [README.md](./README.md) for full documentation
- Check [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for troubleshooting
- Use [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for deployment

---

## 🆘 Common Issues

### "Cannot connect to server"
- Backend not running? Check `http://localhost:5000/api/health`
- Wrong API URL? Check `frontend/.env.local`
- CORS issue? Check backend logs

### "Invalid credentials"
- Run `npm run test-login` to verify accounts
- Check user exists and is active
- Verify password is correct

### Faculty can't login
- Run `npm run setup` to create sample accounts
- Or login as admin and create users manually

---

## 🎉 You're Ready!

Start building with HVMS:
1. Create hostels (Admin → Hostels)
2. Create users (Admin → Users)
3. Assign wardens to hostels
4. Faculty can start visits
5. Wardens can verify visits
6. View reports and analytics

For detailed feature documentation, see [README.md](./README.md)
