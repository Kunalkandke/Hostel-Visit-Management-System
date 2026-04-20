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
    if (!visit) return res.status(404).json({ success: false, message: 'Visit not found' });
    const submission = visit.formSubmissions.find(f => f.formType === formType);
    if (!submission) return res.status(404).json({ success: false, message: 'Form not submitted yet' });

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
    const pythonPath = process.platform === 'win32' ? 'C:\\Program Files\\Python314\\python.exe' : 'python3';
    const py = spawn(pythonPath, [scriptPath, formType, payload, tmpFile]);
    let stderr = '';
    py.stderr.on('data', d => { stderr += d.toString(); });
    py.on('close', (code) => {
      if (code !== 0) {
        console.error('Form gen error:', stderr);
        return res.status(500).json({ success: false, message: 'Document generation failed' });
      }
      const label = formType === 'anti_ragging' ? 'AntiRagging_Form' : 'MessFeedback_Form';
      const fname = `MIT_${label}_${(visit.faculty?.name||'Faculty').replace(/\s+/g,'_')}.docx`;
      res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${fname}"`);
      const stream = fs.createReadStream(tmpFile);
      stream.pipe(res);
      stream.on('end', () => fs.unlink(tmpFile, ()=>{}));
      stream.on('error', () => res.status(500).end());
    });
    py.on('error', () => res.status(500).json({ success: false, message: 'python not found on server' }));
  } catch (err) { next(err); }
};
