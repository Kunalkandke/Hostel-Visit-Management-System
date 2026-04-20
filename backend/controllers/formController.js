const db = require('../data/db');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

exports.submitForm = async (req, res, next) => {
  try {
    const { formType, data } = req.body;
    if (!formType || !data) return res.status(400).json({ success: false, message: 'formType and data required' });
    const visit = await db.findVisitById(req.params.id);
    if (!visit) return res.status(404).json({ success: false, message: 'Visit not found' });
    const facultyId = visit.faculty?._id || visit.faculty;
    if (req.user.role === 'faculty' && String(facultyId) !== String(req.user.id))
      return res.status(403).json({ success: false, message: 'Access denied' });
    const updated = await db.updateVisitForm(req.params.id, formType, data);
    res.json({ success: true, message: 'Form saved', data: updated.formSubmissions });
  } catch (err) { next(err); }
};

exports.getForms = async (req, res, next) => {
  try {
    const visit = await db.findVisitById(req.params.id, { includeRelations: true });
    if (!visit) return res.status(404).json({ success: false, message: 'Visit not found' });
    if (req.user.role === 'faculty' && String(visit.faculty._id) !== String(req.user.id))
      return res.status(403).json({ success: false, message: 'Access denied' });
    res.json({
      success: true,
      data: {
        visit: {
          id: visit._id, faculty: visit.faculty, hostel: visit.hostel,
          purpose: visit.purpose, checkIn: visit.checkIn,
          checkOut: visit.checkOut, duration: visit.duration,
          facultyRemarks: visit.facultyRemarks,
        },
        forms: visit.formSubmissions || [],
      },
    });
  } catch (err) { next(err); }
};

exports.downloadForm = async (req, res, next) => {
  try {
    const { formType } = req.params;
    const visit = await db.findVisitById(req.params.id, { includeRelations: true });
    
    if (!visit) {
      console.log(`❌ Visit not found: ${req.params.id}`);
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }
    
    const submission = visit.formSubmissions.find(f => f.formType === formType);
    if (!submission) {
      console.log(`❌ Form not submitted: ${formType} for visit ${req.params.id}`);
      return res.status(404).json({ success: false, message: 'Form not submitted yet' });
    }

    const visitData = {
      checkIn: visit.checkIn,
      faculty_name: visit.faculty?.name || '',
      faculty_dept: visit.faculty?.department || '',
      faculty_phone: visit.faculty?.phone || '',
      hostel_name: visit.hostel?.name || '',
      hostel_type: visit.hostel?.type || 'boys',
      year: new Date(visit.checkIn).getFullYear(),
    };

    const payload = JSON.stringify({ visit: visitData, formData: submission.data });
    const tmpFile = path.join(os.tmpdir(), `hvms_${visit._id}_${formType}_${Date.now()}.docx`);
    const scriptPath = path.join(__dirname, '../utils/generate_form.py');
    
    // Try multiple Python paths
    const pythonPaths = [
      'python3',
      'python',
      '/usr/bin/python3',
      '/usr/local/bin/python3',
      'C:\\Program Files\\Python314\\python.exe',
      'C:\\Python39\\python.exe'
    ];
    
    let pythonPath = 'python3'; // default
    
    // Check if Python is available
    const { exec } = require('child_process');
    exec('which python3 || which python', (error, stdout) => {
      if (stdout) pythonPath = stdout.trim();
    });
    
    console.log(`📝 Generating Word document: ${formType} for visit ${visit._id}`);
    console.log(`   Python path: ${pythonPath}`);
    console.log(`   Script: ${scriptPath}`);
    console.log(`   Output: ${tmpFile}`);
    
    const py = spawn(pythonPath, [scriptPath, formType, payload, tmpFile]);
    
    let stderr = '';
    let stdout = '';
    
    py.stdout.on('data', d => { 
      stdout += d.toString();
      console.log(`   Python stdout: ${d.toString().trim()}`);
    });
    
    py.stderr.on('data', d => { 
      stderr += d.toString();
      console.error(`   Python stderr: ${d.toString().trim()}`);
    });
    
    py.on('close', (code) => {
      if (code !== 0) {
        console.error(`❌ Form generation failed with code ${code}`);
        console.error(`   stderr: ${stderr}`);
        console.error(`   stdout: ${stdout}`);
        
        // Provide helpful error message
        let errorMsg = 'Document generation failed';
        if (stderr.includes('ModuleNotFoundError') || stderr.includes('No module named')) {
          errorMsg = 'Python docx library not installed. Please install: pip3 install python-docx';
        } else if (stderr.includes('python') || code === 127) {
          errorMsg = 'Python not found on server. Please install Python 3 and python-docx library.';
        }
        
        return res.status(500).json({ success: false, message: errorMsg });
      }
      
      // Check if file was created
      if (!fs.existsSync(tmpFile)) {
        console.error(`❌ Output file not created: ${tmpFile}`);
        return res.status(500).json({ success: false, message: 'Document file not created' });
      }
      
      console.log(`✅ Word document generated successfully: ${tmpFile}`);
      
      const label = formType === 'anti_ragging' ? 'AntiRagging_Form' : 'MessFeedback_Form';
      const fname = `MIT_${label}_${(visit.faculty?.name||'Faculty').replace(/\s+/g,'_')}.docx`;
      
      res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${fname}"`);
      
      const stream = fs.createReadStream(tmpFile);
      stream.pipe(res);
      
      stream.on('end', () => {
        fs.unlink(tmpFile, (err) => {
          if (err) console.error(`   Warning: Could not delete temp file: ${err.message}`);
        });
      });
      
      stream.on('error', (err) => {
        console.error(`❌ Stream error: ${err.message}`);
        res.status(500).end();
      });
    });
    
    py.on('error', (err) => {
      console.error(`❌ Python spawn error: ${err.message}`);
      res.status(500).json({ 
        success: false, 
        message: 'Python not found on server. Please install Python 3 and python-docx library.' 
      });
    });
    
  } catch (err) {
    console.error(`❌ Download form error: ${err.message}`);
    next(err);
  }
};
