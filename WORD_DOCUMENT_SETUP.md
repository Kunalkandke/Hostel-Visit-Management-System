# 📝 Word Document Generation Setup

## Overview

The HVMS system generates Word documents (.docx) for visit forms using a Python script. This requires Python 3 and the `python-docx` library to be installed on the server.

## Problem

If you see "Document generation failed" error, it means:
- Python is not installed on the server
- OR the `python-docx` library is not installed
- OR Python is not in the system PATH

## Solution for Render Deployment

### Option 1: Install Python on Render (Recommended)

1. **Create a build script** (`backend/build.sh`):

```bash
#!/bin/bash
# Install Python and dependencies
apt-get update
apt-get install -y python3 python3-pip
pip3 install -r requirements.txt
npm install
```

2. **Update Render Build Command:**
   - Go to Render Dashboard → Your Service → Settings
   - Change Build Command to: `chmod +x build.sh && ./build.sh`

3. **Redeploy** your service

### Option 2: Use Render's Python Environment

1. **Add Python buildpack:**
   - Go to Render Dashboard → Your Service → Settings
   - Add environment variable: `PYTHON_VERSION=3.11`
   - Render will automatically install Python

2. **Install dependencies:**
   - Render will automatically run `pip install -r requirements.txt`

3. **Redeploy** your service

### Option 3: Disable Word Document Feature (Temporary)

If you want to deploy quickly without Word documents:

1. Comment out the Word download button in frontend
2. Or show a message: "Word documents temporarily unavailable"

## Local Development Setup

### Windows:

```bash
# Install Python 3 from python.org
# Then install dependencies:
pip install python-docx
```

### Mac/Linux:

```bash
# Install Python 3 (if not already installed)
sudo apt-get install python3 python3-pip  # Ubuntu/Debian
brew install python3                       # Mac

# Install dependencies
pip3 install python-docx
```

## Testing

### Test Python Installation:

```bash
# Check Python is installed
python3 --version

# Check python-docx is installed
python3 -c "import docx; print('python-docx installed')"
```

### Test Document Generation:

1. Login to your app
2. Start a visit
3. Fill out a form (Anti-Ragging or Mess Feedback)
4. Save the form
5. Click "Word (.doc)" button
6. Document should download

## Troubleshooting

### Error: "Python not found on server"

**Cause:** Python is not installed or not in PATH

**Fix:**
1. Install Python on Render (see Option 1 above)
2. Or use Render's Python buildpack (see Option 2)
3. Check Render logs for Python installation errors

### Error: "Python docx library not installed"

**Cause:** `python-docx` package is missing

**Fix:**
1. Ensure `requirements.txt` exists in backend folder
2. Run: `pip3 install -r requirements.txt`
3. On Render, this should happen automatically during build

### Error: "Document file not created"

**Cause:** Python script failed to generate the file

**Fix:**
1. Check Render logs for Python errors
2. Look for stderr output from Python script
3. Verify form data is complete

### Error: "ModuleNotFoundError: No module named 'docx'"

**Cause:** `python-docx` not installed

**Fix:**
```bash
pip3 install python-docx
```

## Render Build Configuration

### Method 1: Using build.sh script

**File: `backend/build.sh`**
```bash
#!/bin/bash
set -e

echo "📦 Installing Python..."
apt-get update
apt-get install -y python3 python3-pip

echo "📦 Installing Python dependencies..."
pip3 install -r requirements.txt

echo "📦 Installing Node dependencies..."
npm install

echo "✅ Build complete!"
```

**Render Settings:**
- Build Command: `chmod +x build.sh && ./build.sh`
- Start Command: `npm start`

### Method 2: Using Render's Native Python Support

**File: `render.yaml`** (optional)
```yaml
services:
  - type: web
    name: hvms-backend
    env: node
    buildCommand: |
      apt-get update && apt-get install -y python3 python3-pip
      pip3 install -r requirements.txt
      npm install
    startCommand: npm start
```

## Checking Logs

### Render Logs:

Look for these messages:

**Success:**
```
📝 Generating Word document: anti_ragging for visit 123...
   Python path: /usr/bin/python3
   Python stdout: Saved: /tmp/hvms_123_anti_ragging_1234567890.docx
✅ Word document generated successfully
```

**Failure:**
```
❌ Form generation failed with code 1
   stderr: ModuleNotFoundError: No module named 'docx'
```

### Backend Console:

The improved error handling now shows:
- Python path being used
- Script path
- Output file path
- Python stdout/stderr
- Specific error messages

## Alternative: Node.js Solution (Future)

If Python setup is too complex, consider using a Node.js library like:
- `docx` (npm package)
- `officegen`
- `docxtemplater`

This would eliminate the Python dependency entirely.

## Files Involved

- `backend/controllers/formController.js` - Handles Word generation
- `backend/utils/generate_form.py` - Python script that creates .docx
- `backend/requirements.txt` - Python dependencies
- `frontend/components/VisitFormModal.js` - Word download button

## Summary

**For Production (Render):**
1. Create `backend/build.sh` with Python installation
2. Update Render build command
3. Redeploy
4. Test Word document download

**For Local Development:**
1. Install Python 3
2. Run `pip3 install python-docx`
3. Test document generation

**Quick Fix:**
- Temporarily disable Word download feature
- Focus on CSV exports instead
- Add Python support later

## Support

If issues persist:
1. Check Render logs for Python errors
2. Verify `requirements.txt` exists
3. Test Python installation: `python3 --version`
4. Test python-docx: `python3 -c "import docx"`
5. Check backend logs for detailed error messages
