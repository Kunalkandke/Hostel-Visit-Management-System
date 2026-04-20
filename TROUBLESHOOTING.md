# 🔧 Troubleshooting Guide

Quick solutions to common HVMS issues.

## 🚨 Connection Issues

### "Cannot connect to server"

**Symptoms:**
- Login fails immediately
- Error message about server connection
- Network error in browser console

**Solutions:**

1. **Check backend is running:**
   ```bash
   # Visit in browser:
   https://your-backend.onrender.com/api/health
   
   # Should return:
   {"success":true,"message":"HVMS API running",...}
   ```

2. **Verify frontend API URL:**
   - Open browser console (F12)
   - Look for: `🔗 API URL: https://...`
   - Should match your backend URL
   - If wrong, update `NEXT_PUBLIC_API_URL` in Vercel

3. **Check CORS configuration:**
   - Check Render logs for: `🔐 Allowed CORS origins: [...]`
   - Verify your Vercel URL is listed
   - Update `FRONTEND_URL` in Render if needed
   - Redeploy backend after changing

4. **Run diagnostics:**
   ```bash
   cd backend
   npm run diagnose
   ```

---

## 🔐 Login Issues

### "Invalid credentials"

**Symptoms:**
- Login fails with "Invalid credentials" message
- Correct password doesn't work

**Solutions:**

1. **Verify account exists:**
   ```bash
   cd backend
   npm run test-login
   ```
   This will list all users and their status.

2. **Check account is active:**
   - Login as admin
   - Go to Admin → Users
   - Find the user
   - Ensure "Active" status is enabled

3. **Reset password:**
   - Login as admin
   - Go to Admin → Users
   - Click on user → Reset Password
   - New password will be emailed

4. **Create test accounts:**
   ```bash
   cd backend
   npm run setup
   ```
   This creates sample faculty and warden accounts.

### Faculty/Warden can't login

**Symptoms:**
- Admin login works
- Faculty/Warden login fails

**Solutions:**

1. **Check if accounts exist:**
   ```bash
   cd backend
   npm run test-login
   ```

2. **Create accounts:**
   - **Option A:** Login as admin → Users → Create User
   - **Option B:** Run `npm run setup` to create sample accounts

3. **Verify role is correct:**
   - Login as admin
   - Check user's role is set to "faculty" or "warden"

---

## 🌐 CORS Errors

### "CORS policy blocked"

**Symptoms:**
- Browser console shows CORS error
- Network request fails with CORS message

**Solutions:**

1. **Check backend logs:**
   - Go to Render → Your Service → Logs
   - Look for: `❌ CORS blocked for origin: ...`
   - Note the blocked origin

2. **Update FRONTEND_URL:**
   - Go to Render → Environment
   - Set `FRONTEND_URL` to your Vercel URL
   - Example: `https://your-app.vercel.app`
   - **Important:** No trailing slash!

3. **Verify CORS config:**
   - Backend logs should show: `🔐 Allowed CORS origins: [...]`
   - Your Vercel URL should be in the list
   - All `.vercel.app` domains are automatically allowed

4. **Redeploy backend:**
   - After changing environment variables
   - Render should auto-redeploy
   - Or manually trigger redeploy

---

## 📧 Email Issues

### Emails not sending

**Symptoms:**
- No emails received
- Backend logs show email errors

**Solutions:**

1. **Verify Gmail setup:**
   - 2FA must be enabled on Gmail
   - App password must be generated
   - Use 16-character app password (no spaces)

2. **Check environment variables:**
   ```bash
   cd backend
   npm run diagnose
   ```
   Should show: `SMTP_EMAIL: ✅ Set`

3. **Test email manually:**
   - Start a visit as faculty
   - Check backend logs for email errors
   - Check spam folder

4. **Generate new app password:**
   - Google Account → Security → App Passwords
   - Generate new password for Mail
   - Update `SMTP_APP_PASSWORD` in Render

---

## 📊 Report Issues

### "Document generation failed" (Word Documents)

**Symptoms:**
- Word document download fails
- Error: "Document generation failed"
- Error: "Python not found on server"
- Error: "Python docx library not installed"

**Cause:**
- Python is not installed on Render
- OR `python-docx` library is missing

**Solutions:**

1. **Install Python on Render:**
   
   **Method A - Using build script (Recommended):**
   - File `backend/build.sh` has been created
   - Go to Render Dashboard → Your Service → Settings
   - Change Build Command to: `chmod +x build.sh && ./build.sh`
   - Redeploy your service
   
   **Method B - Manual installation:**
   - Add to Render build command:
   ```bash
   apt-get update && apt-get install -y python3 python3-pip && pip3 install -r requirements.txt && npm install
   ```

2. **Verify installation:**
   - Check Render logs after deployment
   - Look for: `✅ Python version: 3.x.x`
   - Look for: `✅ Python dependencies installed`

3. **Test Word generation:**
   - Start a visit
   - Fill and save a form
   - Click "Word (.doc)" button
   - Check backend logs for detailed error messages

4. **Temporary workaround:**
   - Use PDF export instead (print to PDF)
   - Use CSV export for reports
   - Add Python support later

**See [WORD_DOCUMENT_SETUP.md](./WORD_DOCUMENT_SETUP.md) for detailed instructions**

### "Document generation failed" (CSV Reports)

**Symptoms:**
- CSV export fails
- Error toast when clicking "Export CSV"
- No file downloads

**Solutions:**

1. **Generate report first:**
   - Click "Generate" button
   - Wait for data to load
   - Then click "Export CSV"

2. **Check if data exists:**
   - Look for table or chart with data
   - If empty, adjust date range or filters
   - Export only works when data is present

3. **Check browser console:**
   - Press F12 → Console tab
   - Look for export errors
   - Check if downloads are blocked

4. **Try different report type:**
   - Daily report
   - Monthly report
   - By Hostel report
   - By Faculty report

5. **Check browser settings:**
   - Allow downloads from your site
   - Disable popup blocker
   - Check download folder permissions

### Report shows no data

**Symptoms:**
- Empty state message
- No visits in report
- Charts are empty

**Solutions:**

1. **Adjust date range:**
   - Try different dates
   - Expand date range
   - Check if visits exist for that period

2. **Remove filters:**
   - Clear department filter
   - Reset sort options
   - Try "All" options

3. **Verify visits exist:**
   - Go to Visits page
   - Check if any visits are recorded
   - Create test visit if needed

4. **Check role permissions:**
   - Wardens only see their hostel
   - Admins see all data
   - Verify correct role

---

## 🗄️ Database Issues

### "Database connection failed"

**Symptoms:**
- Backend won't start
- Database errors in logs

**Solutions:**

1. **Verify Supabase credentials:**
   ```bash
   cd backend
   npm run diagnose
   ```

2. **Check Supabase project:**
   - Login to Supabase
   - Verify project is active
   - Check service role key is correct

3. **Run SQL schema:**
   - Go to Supabase SQL Editor
   - Run the schema from README.md
   - Verify tables are created

4. **Test connection:**
   ```bash
   cd backend
   npm run test-login
   ```

---

## 🎨 Frontend Issues

### Page won't load

**Symptoms:**
- Blank page
- Loading forever
- Console errors

**Solutions:**

1. **Check browser console (F12):**
   - Look for error messages
   - Check Network tab for failed requests

2. **Verify API URL:**
   - Console should show: `🔗 API URL: https://...`
   - Should match your backend URL

3. **Clear cache:**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or clear browser cache

4. **Check Vercel deployment:**
   - Go to Vercel dashboard
   - Check deployment status
   - Look for build errors

### Styles not loading

**Symptoms:**
- Page loads but looks broken
- No styling

**Solutions:**

1. **Check Tailwind:**
   - Verify `tailwind.config.js` exists
   - Check `globals.css` imports Tailwind

2. **Rebuild:**
   ```bash
   cd frontend
   npm run build
   ```

3. **Redeploy on Vercel:**
   - Push to Git
   - Vercel will auto-deploy

---

## 🔑 Token Issues

### "Token expired" or "Invalid token"

**Symptoms:**
- Logged out unexpectedly
- "Unauthorized" errors

**Solutions:**

1. **Just login again:**
   - Tokens expire after 24 hours
   - This is normal behavior

2. **Check JWT_SECRET:**
   - Must be set in backend environment
   - Must be the same across all backend instances

3. **Clear local storage:**
   - Browser console: `localStorage.clear()`
   - Then login again

---

## 🚀 Deployment Issues

### Backend won't deploy

**Symptoms:**
- Render deployment fails
- Build errors

**Solutions:**

1. **Check Render logs:**
   - Look for specific error messages
   - Common: Missing dependencies

2. **Verify package.json:**
   - All dependencies listed
   - Start command is correct: `npm start`

3. **Check environment variables:**
   - All required vars are set
   - No typos in variable names

### Frontend won't deploy

**Symptoms:**
- Vercel deployment fails
- Build errors

**Solutions:**

1. **Check Vercel logs:**
   - Look for build errors
   - Common: Missing dependencies or syntax errors

2. **Test build locally:**
   ```bash
   cd frontend
   npm run build
   ```

3. **Check environment variables:**
   - `NEXT_PUBLIC_API_URL` is set
   - Correct backend URL

---

## 🧪 Testing Commands

### Quick Diagnostics

```bash
# Check backend configuration
cd backend
npm run diagnose

# Test login system
npm run test-login

# Setup sample data
npm run setup

# Test backend health
curl https://your-backend.onrender.com/api/health
```

### Check Logs

**Backend (Render):**
- Dashboard → Your Service → Logs
- Look for ✅ and ❌ messages

**Frontend (Browser):**
- Press F12
- Console tab for errors
- Network tab for failed requests

---

## 📊 Common Log Messages

### Backend Logs

**Good Signs:**
- `🚀 HVMS Server → http://...`
- `✅ Admin account ensured: ...`
- `🔐 Allowed CORS origins: [...]`
- `✅ Login successful: email (role)`

**Warning Signs:**
- `❌ Login failed: reason`
- `❌ CORS blocked for origin: ...`
- `❌ Error: ...`

### Frontend Console

**Good Signs:**
- `🔗 API URL: https://...`
- No errors in console
- Network requests succeed (200 status)

**Warning Signs:**
- CORS errors
- Network errors
- 401/403 errors
- API URL is wrong

---

## 🆘 Still Having Issues?

### 1. Run Full Diagnostics

```bash
cd backend
npm run diagnose
npm run test-login
```

### 2. Check All Logs

- Render backend logs
- Vercel deployment logs
- Browser console (F12)

### 3. Verify Configuration

- Backend environment variables on Render
- Frontend environment variables on Vercel
- Database credentials in Supabase

### 4. Test Each Component

- Backend health: `/api/health`
- Database: `npm run test-login`
- Frontend: Check console for API URL

### 5. Review Documentation

- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Full deployment guide
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Step-by-step checklist
- [QUICK_START.md](./QUICK_START.md) - Quick setup
- [README.md](./README.md) - Full documentation

---

## 📞 Getting Help

When asking for help, provide:

1. **Error message** (exact text)
2. **Backend logs** (from Render)
3. **Browser console** (F12 → Console tab)
4. **What you tried** (steps taken)
5. **Environment** (local or production)

**Diagnostic Output:**
```bash
cd backend
npm run diagnose > diagnostics.txt
npm run test-login > test-results.txt
```

Share these files when asking for help.

---

## ✅ Prevention Tips

1. **Always check logs** after deployment
2. **Test locally first** before deploying
3. **Keep environment variables** documented
4. **Run diagnostics** regularly
5. **Monitor backend health** endpoint
6. **Keep dependencies updated**
7. **Backup environment variables**

---

## 🎯 Quick Reference

| Issue | Quick Fix |
|-------|-----------|
| Can't connect | Check `/api/health` endpoint |
| Invalid credentials | Run `npm run test-login` |
| CORS error | Update `FRONTEND_URL` on Render |
| No emails | Check Gmail app password |
| Token expired | Just login again |
| Faculty can't login | Run `npm run setup` |
| Page won't load | Check browser console (F12) |
| Database error | Run `npm run diagnose` |

---

Remember: After changing environment variables, always redeploy!
