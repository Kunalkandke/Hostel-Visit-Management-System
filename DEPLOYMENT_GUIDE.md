# Deployment Guide - HVMS

## 🚀 Quick Fix for Current Issue

### Problem
Frontend can't connect to backend - CORS or network errors during login.

### Solution

#### 1. Backend (Render) - Environment Variables

Go to your Render dashboard → Backend service → Environment tab and add:

```env
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-vercel-app.vercel.app
FRONTEND_URLS=https://your-vercel-app.vercel.app,https://hvms-system.vercel.app

# Database (Supabase)
SUPABASE_URL=https://nqfapldnhbvskegodyef.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_key_here

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_in_production

# Admin Account
ADMIN_EMAIL=admin@college.edu.in
ADMIN_PASSWORD=Admin@2026
ADMIN_NAME=System Administrator

# Email (Gmail)
SMTP_EMAIL=kunalkandke@gmail.com
SMTP_APP_PASSWORD=brvwaisigqpquuyb
SMTP_FROM_NAME=Hostel Visit Management System
```

**Important:** Replace `your-vercel-app.vercel.app` with your actual Vercel URL!

#### 2. Frontend (Vercel) - Environment Variables

Go to Vercel dashboard → Your project → Settings → Environment Variables:

```env
NEXT_PUBLIC_API_URL=https://hostel-visit-management-system.onrender.com/api/v1
```

Make sure it's set for **Production** environment!

#### 3. Deploy Changes

**Backend:**
```bash
git add .
git commit -m "Fix CORS and add logging"
git push
```

**Frontend:**
```bash
git add .
git commit -m "Fix API connection"
git push
```

Both will auto-deploy on push.

---

## 🧪 Testing

### 1. Test Backend Health

Open in browser:
```
https://hostel-visit-management-system.onrender.com/api/health
```

Should return:
```json
{"success":true,"message":"HVMS API running","time":"..."}
```

### 2. Test Login System

Run the test script locally:
```bash
cd backend
node test-login.js
```

This will:
- ✅ Test database connection
- ✅ Verify admin account
- ✅ List all users
- ✅ Create test faculty/warden if needed

### 3. Test Frontend

1. Open your Vercel app
2. Press F12 (Developer Console)
3. Look for: `🔗 API URL: https://...`
4. Try to login
5. Check Network tab for failed requests

---

## 👥 Default Accounts

### Admin
- Email: `admin@college.edu.in`
- Password: `Admin@2026`
- Role: Admin (full access)

### Test Faculty (created by test script)
- Email: `faculty@college.edu.in`
- Password: `Faculty@123`
- Role: Faculty

### Test Warden (created by test script)
- Email: `warden@college.edu.in`
- Password: `Warden@123`
- Role: Warden

---

## 🔧 Common Issues

### Issue 1: "Cannot connect to server"
**Cause:** CORS blocking or backend not running
**Fix:** 
1. Check backend logs on Render
2. Verify FRONTEND_URL matches your Vercel URL
3. Redeploy backend after changing env vars

### Issue 2: "Invalid credentials"
**Cause:** User doesn't exist or wrong password
**Fix:**
1. Run `node test-login.js` to verify accounts
2. Check Render logs for login attempts
3. Create users via admin panel

### Issue 3: "Token expired"
**Cause:** JWT token expired (24h default)
**Fix:** Just login again

### Issue 4: Faculty can't login
**Cause:** No faculty accounts created
**Fix:** 
1. Login as admin
2. Go to Users → Create User
3. Set role to "Faculty"
4. Or run `node test-login.js` to create test accounts

---

## 📊 Monitoring

### Backend Logs (Render)
Go to: Render Dashboard → Your Service → Logs

Look for:
- `🔐 Allowed CORS origins: [...]` - Shows allowed domains
- `✅ Login successful: email (role)` - Successful logins
- `❌ Login failed: reason` - Failed login attempts
- `❌ CORS blocked for origin: ...` - CORS issues

### Frontend Logs (Browser)
Press F12 → Console tab

Look for:
- `🔗 API URL: https://...` - Shows which backend URL is being used
- Network errors or CORS errors

---

## 🎯 Features Checklist

### Authentication ✅
- [x] Admin login
- [x] Faculty login
- [x] Warden login
- [x] Role-based access control
- [x] JWT token authentication
- [x] Password change

### Faculty Features ✅
- [x] Start visit
- [x] End visit
- [x] View visit history
- [x] Fill visit forms
- [x] Update profile

### Warden Features ✅
- [x] View active visits
- [x] Verify visits
- [x] Add remarks
- [x] View hostel visits

### Admin Features ✅
- [x] User management (CRUD)
- [x] Hostel management (CRUD)
- [x] Assign wardens to hostels
- [x] View all visits
- [x] Generate reports
- [x] Dashboard statistics

### Reports ✅
- [x] Daily reports
- [x] Monthly reports
- [x] By hostel reports
- [x] By faculty reports
- [x] Dashboard stats

### Email Notifications ✅
- [x] Visit start notification
- [x] Visit end notification
- [x] Warden verification notification

---

## 🔐 Security

- ✅ JWT authentication
- ✅ Password hashing (bcrypt)
- ✅ Role-based authorization
- ✅ CORS protection
- ✅ Rate limiting on auth routes
- ✅ Helmet security headers
- ✅ Input validation

---

## 📝 Creating Users

### Via Admin Panel
1. Login as admin
2. Navigate to Admin → Users
3. Click "Create User"
4. Fill in details:
   - Name
   - Email
   - Password (min 8 chars)
   - Role (faculty/warden/admin)
   - Department
   - Phone
5. Click "Create"

### Via Test Script
```bash
cd backend
node test-login.js
```

This automatically creates test faculty and warden accounts if they don't exist.

---

## 🆘 Support

If issues persist:

1. **Check Backend Logs** on Render
2. **Check Browser Console** (F12)
3. **Verify Environment Variables** on both platforms
4. **Test Backend Health** endpoint
5. **Run Test Script** locally

For CORS issues, the backend now allows ALL `.vercel.app` domains automatically.
