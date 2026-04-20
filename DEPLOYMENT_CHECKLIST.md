# 🚀 Deployment Checklist

Use this checklist to ensure smooth deployment of HVMS.

## ✅ Pre-Deployment

### Backend Preparation
- [ ] All code committed and pushed to Git
- [ ] `.env.example` file is up to date
- [ ] Database schema SQL is ready
- [ ] All dependencies in `package.json`

### Frontend Preparation
- [ ] All code committed and pushed to Git
- [ ] API endpoints tested locally
- [ ] Build succeeds locally (`npm run build`)
- [ ] No console errors in production build

---

## 🗄️ Database Setup (Supabase)

- [ ] Supabase project created
- [ ] SQL schema executed in Supabase SQL Editor
- [ ] Tables created: `users`, `hostels`, `visits`
- [ ] Indexes created
- [ ] Foreign keys configured
- [ ] Service role key copied

---

## 🔧 Backend Deployment (Render)

### 1. Create Service
- [ ] New Web Service created on Render
- [ ] Connected to Git repository
- [ ] Branch selected (usually `main`)
- [ ] Build command: `npm install`
- [ ] Start command: `npm start`

### 2. Environment Variables
Copy these to Render Environment tab:

```env
NODE_ENV=production
PORT=5000

# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_in_production

# Admin Account
ADMIN_EMAIL=admin@college.edu.in
ADMIN_PASSWORD=Admin@2026
ADMIN_NAME=System Administrator

# Frontend URL (IMPORTANT!)
FRONTEND_URL=https://your-app.vercel.app
FRONTEND_URLS=https://your-app.vercel.app

# Email (Gmail)
SMTP_EMAIL=your-email@gmail.com
SMTP_APP_PASSWORD=your_16_char_app_password
SMTP_FROM_NAME=Hostel Visit Management System
```

- [ ] All environment variables added
- [ ] `FRONTEND_URL` matches your Vercel URL
- [ ] JWT_SECRET is strong and unique
- [ ] Gmail app password is correct

### 3. Deploy & Test
- [ ] First deployment completed
- [ ] Check logs for errors
- [ ] Visit `https://your-backend.onrender.com/api/health`
- [ ] Should return: `{"success":true,"message":"HVMS API running",...}`
- [ ] Look for: `🔐 Allowed CORS origins: [...]` in logs
- [ ] Look for: `✅ Admin account ensured: ...` in logs

### 4. Initialize Data
Run in Render Shell or locally:
```bash
npm run setup
```

- [ ] Setup script completed successfully
- [ ] Admin account created
- [ ] Sample users created
- [ ] Sample hostels created

---

## 🎨 Frontend Deployment (Vercel)

### 1. Create Project
- [ ] New project created on Vercel
- [ ] Connected to Git repository
- [ ] Framework preset: Next.js
- [ ] Root directory: `frontend`

### 2. Environment Variables
Add in Vercel Project Settings → Environment Variables:

```env
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api/v1
```

- [ ] Environment variable added
- [ ] Set for **Production** environment
- [ ] URL ends with `/api/v1`
- [ ] No trailing slash

### 3. Deploy & Test
- [ ] First deployment completed
- [ ] Visit your Vercel URL
- [ ] Login page loads correctly
- [ ] No console errors (F12)
- [ ] Look for: `🔗 API URL: https://...` in console

---

## 🧪 Post-Deployment Testing

### Backend Health
- [ ] `GET /api/health` returns success
- [ ] Logs show no errors
- [ ] CORS origins logged correctly

### Authentication
- [ ] Admin login works
  - Email: `admin@college.edu.in`
  - Password: `Admin@2026`
- [ ] Faculty login works (if created)
- [ ] Warden login works (if created)
- [ ] JWT token generated correctly
- [ ] Protected routes require authentication

### Faculty Features
- [ ] Can view dashboard
- [ ] Can start a visit
- [ ] Can end a visit
- [ ] Can view visit history
- [ ] Can update profile
- [ ] Can change password

### Warden Features
- [ ] Can view active visits
- [ ] Can verify visits
- [ ] Can add remarks
- [ ] Can view hostel-specific visits

### Admin Features
- [ ] Can view all users
- [ ] Can create new users
- [ ] Can edit users
- [ ] Can deactivate users
- [ ] Can manage hostels
- [ ] Can assign wardens
- [ ] Can view all visits
- [ ] Can generate reports
- [ ] Dashboard shows statistics

### Email Notifications
- [ ] Visit start email sent
- [ ] Visit end email sent
- [ ] Warden notification sent
- [ ] User creation email sent

---

## 🔍 Monitoring

### Backend Logs (Render)
Check for these messages:
- ✅ `🚀 HVMS Server → http://...`
- ✅ `✅ Admin account ensured: ...`
- ✅ `🔐 Allowed CORS origins: [...]`
- ✅ `✅ Login successful: email (role)`
- ❌ `❌ Login failed: reason`
- ❌ `❌ CORS blocked for origin: ...`

### Frontend Console (Browser F12)
Check for:
- ✅ `🔗 API URL: https://...`
- ❌ Network errors
- ❌ CORS errors
- ❌ 401/403 errors

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to server"
**Symptoms:** Login fails with connection error

**Solutions:**
1. Check backend is running: Visit `/api/health`
2. Verify `NEXT_PUBLIC_API_URL` in Vercel
3. Check CORS settings in backend logs
4. Ensure `FRONTEND_URL` matches Vercel URL
5. Redeploy backend after env var changes

### Issue: "Invalid credentials"
**Symptoms:** Login fails even with correct password

**Solutions:**
1. Run `npm run test-login` to verify accounts
2. Check user exists in database
3. Verify user is active (`is_active = true`)
4. Check backend logs for specific error

### Issue: Faculty can't login
**Symptoms:** No faculty accounts exist

**Solutions:**
1. Login as admin
2. Go to Admin → Users → Create User
3. Set role to "Faculty"
4. Or run `npm run setup` to create sample accounts

### Issue: CORS errors
**Symptoms:** Browser shows CORS policy error

**Solutions:**
1. Check backend logs for blocked origin
2. Verify `FRONTEND_URL` env var on Render
3. Ensure Vercel URL is correct (no trailing slash)
4. Redeploy backend after fixing

### Issue: Email not sending
**Symptoms:** No emails received

**Solutions:**
1. Verify Gmail app password is correct
2. Check 2FA is enabled on Gmail
3. Check backend logs for email errors
4. Test with a different email address

---

## 📊 Success Criteria

- [ ] Backend health endpoint returns success
- [ ] Frontend loads without errors
- [ ] Admin can login
- [ ] Faculty can login (if created)
- [ ] Warden can login (if created)
- [ ] All role-specific features work
- [ ] Email notifications send successfully
- [ ] Reports generate correctly
- [ ] No CORS errors
- [ ] No console errors
- [ ] Mobile responsive
- [ ] All API endpoints working

---

## 🎉 Deployment Complete!

Once all items are checked:
1. Document your deployment URLs
2. Share credentials with stakeholders
3. Set up monitoring/alerts
4. Create backup of environment variables
5. Document any custom configurations

**Backend URL:** `https://your-backend.onrender.com`  
**Frontend URL:** `https://your-app.vercel.app`  
**Admin Email:** `admin@college.edu.in`  
**Admin Password:** `Admin@2026`

---

## 📞 Support

For issues:
1. Check [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
2. Run `npm run test-login` for diagnostics
3. Check backend logs on Render
4. Check browser console (F12)
5. Review this checklist

**Remember:** After changing environment variables, always redeploy!
