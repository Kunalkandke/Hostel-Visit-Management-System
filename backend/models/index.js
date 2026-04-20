const mongoose = require('mongoose');

const hostelSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  type: { type: String, enum: ['boys', 'girls'], required: true },
  capacity: { type: Number, required: true, min: 1 },
  location: { type: String, required: true, trim: true },
  warden: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const visitSchema = new mongoose.Schema({
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hostel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true },
  purpose: { type: String, enum: ['inspection', 'student_meeting', 'routine_check', 'emergency', 'other'], required: true },
  purposeDetail: { type: String, trim: true, default: null },
  checkIn: { type: Date, default: Date.now },
  checkOut: { type: Date, default: null },
  duration: { type: Number, default: null },
  status: { type: String, enum: ['active', 'completed'], default: 'active' },
  facultyRemarks: { type: String, trim: true, default: null },
  wardenRemarks: { type: String, trim: true, default: null },
  isVerified: { type: Boolean, default: false },
  // Form submissions after visit completion
  formSubmissions: [{
    formType: { type: String, enum: ['anti_ragging', 'mess_feedback'] },
    submittedAt: { type: Date, default: Date.now },
    data: { type: mongoose.Schema.Types.Mixed },
  }],
}, { timestamps: true });

visitSchema.index({ faculty: 1, status: 1 });
visitSchema.index({ hostel: 1, status: 1 });
visitSchema.index({ checkIn: -1 });

module.exports = {
  Hostel: mongoose.model('Hostel', hostelSchema),
  Visit: mongoose.model('Visit', visitSchema),
};