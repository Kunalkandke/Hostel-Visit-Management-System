const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_APP_PASSWORD,
    },
  });
};

const fromAddress = () => `"${process.env.SMTP_FROM_NAME || 'HVMS'}" <${process.env.SMTP_EMAIL}>`;

// ─── Welcome Email ─────────────────────────────────────────────────────────
exports.sendWelcomeEmail = async ({ name, email, password, role, department }) => {
  try {
    const transporter = createTransporter();
    const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
    const roleColor = role === 'warden' ? '#f59e0b' : '#3b82f6';
    const roleBg = role === 'warden' ? '#fef3c7' : '#dbeafe';

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e3a8a 0%,#1d4ed8 100%);padding:40px 48px;text-align:center;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center" style="padding-bottom:16px;">
                <div style="width:56px;height:56px;background:rgba(255,255,255,0.15);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;margin:0 auto;">
                  <span style="font-size:28px;">🏫</span>
                </div>
              </td></tr>
              <tr><td align="center">
                <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">Hostel Visit Management System</h1>
                <p style="margin:8px 0 0;color:rgba(255,255,255,0.75);font-size:14px;">Welcome to HVMS</p>
              </td></tr>
            </table>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:48px;">
            <p style="margin:0 0 8px;font-size:13px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Hello,</p>
            <h2 style="margin:0 0 24px;font-size:26px;font-weight:700;color:#0f172a;">${name} 👋</h2>
            <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.7;">
              Your account has been successfully created on the <strong>Hostel Visit Management System</strong>. You can now log in and access your dashboard.
            </p>

            <!-- Role Badge -->
            <div style="display:inline-block;background:${roleBg};color:${roleColor};font-weight:700;font-size:13px;padding:6px 16px;border-radius:100px;margin-bottom:28px;border:1px solid ${roleColor}22;">
              ${roleLabel} Account
            </div>

            <!-- Credentials Card -->
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin-bottom:28px;">
              <p style="margin:0 0 16px;font-size:13px;font-weight:700;color:#0f172a;text-transform:uppercase;letter-spacing:0.8px;">Your Login Credentials</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">
                    <span style="font-size:13px;color:#64748b;font-weight:600;">Email Address</span><br>
                    <span style="font-size:15px;color:#1e3a8a;font-weight:700;font-family:monospace;">${email}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">
                    <span style="font-size:13px;color:#64748b;font-weight:600;">Temporary Password</span><br>
                    <span style="font-size:18px;color:#dc2626;font-weight:700;font-family:monospace;letter-spacing:2px;">${password}</span>
                  </td>
                </tr>
                ${department ? `<tr><td style="padding:10px 0;">
                  <span style="font-size:13px;color:#64748b;font-weight:600;">Department</span><br>
                  <span style="font-size:15px;color:#0f172a;font-weight:600;">${department}</span>
                </td></tr>` : ''}
              </table>
            </div>

            <!-- Warning -->
            <div style="background:#fef9c3;border-left:4px solid #eab308;border-radius:8px;padding:16px 20px;margin-bottom:28px;">
              <p style="margin:0;font-size:13px;color:#854d0e;font-weight:600;">⚠ Important Security Notice</p>
              <p style="margin:6px 0 0;font-size:13px;color:#a16207;line-height:1.6;">Please log in and change your password immediately. This temporary password should not be shared with anyone.</p>
            </div>

            <!-- CTA -->
            <div style="text-align:center;margin-bottom:32px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
                 style="display:inline-block;background:linear-gradient(135deg,#1e3a8a,#1d4ed8);color:#ffffff;font-weight:700;font-size:15px;padding:14px 40px;border-radius:10px;text-decoration:none;letter-spacing:0.3px;">
                Login to Your Account →
              </a>
            </div>

            <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">If you have any issues accessing your account, please contact your system administrator.</p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:24px 48px;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">© ${new Date().getFullYear()} Hostel Visit Management System · All rights reserved</p>
            <p style="margin:6px 0 0;font-size:12px;color:#cbd5e1;">This is an automated message. Please do not reply to this email.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    await transporter.sendMail({
      from: fromAddress(),
      to: email,
      subject: `🎉 Welcome to HVMS – Your ${roleLabel} Account is Ready`,
      html,
    });
    console.log(`📧 Welcome email sent to ${email}`);
    return true;
  } catch (err) {
    console.error('❌ Welcome email error:', err.message);
    return false;
  }
};

// ─── Visit Completed Notification (to Warden) ──────────────────────────────
exports.sendVisitCompletedEmail = async ({ wardenEmail, wardenName, facultyName, facultyDept, hostelName, checkIn, checkOut, duration, purpose, facultyRemarks }) => {
  try {
    const transporter = createTransporter();
    const purposeLabels = { inspection: 'Inspection', student_meeting: 'Student Meeting', routine_check: 'Routine Check', emergency: 'Emergency', other: 'Other' };

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#065f46 0%,#059669 100%);padding:36px 48px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <p style="margin:0 0 4px;font-size:12px;color:rgba(255,255,255,0.7);font-weight:600;text-transform:uppercase;letter-spacing:1px;">Visit Completed</p>
                  <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Faculty Visit Summary</h1>
                </td>
                <td align="right">
                  <div style="background:rgba(255,255,255,0.15);border-radius:12px;padding:10px 16px;text-align:center;">
                    <span style="font-size:32px;">✅</span>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px 48px;">
            <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.7;">
              Dear <strong>${wardenName}</strong>, a faculty visit to <strong>${hostelName}</strong> has been completed. Here are the details:
            </p>

            <!-- Visit Details Grid -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:24px;">
              <tr style="background:#f8fafc;">
                <td colspan="2" style="padding:14px 20px;border-bottom:1px solid #e2e8f0;">
                  <span style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.8px;">Faculty Information</span>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 20px;border-bottom:1px solid #f1f5f9;width:40%;">
                  <span style="font-size:13px;color:#64748b;">Faculty Name</span>
                </td>
                <td style="padding:14px 20px;border-bottom:1px solid #f1f5f9;">
                  <span style="font-size:14px;font-weight:700;color:#0f172a;">${facultyName}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 20px;border-bottom:1px solid #f1f5f9;background:#fafbfc;">
                  <span style="font-size:13px;color:#64748b;">Department</span>
                </td>
                <td style="padding:14px 20px;border-bottom:1px solid #f1f5f9;background:#fafbfc;">
                  <span style="font-size:14px;color:#0f172a;">${facultyDept || '—'}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 20px;border-bottom:1px solid #f1f5f9;">
                  <span style="font-size:13px;color:#64748b;">Visit Purpose</span>
                </td>
                <td style="padding:14px 20px;border-bottom:1px solid #f1f5f9;">
                  <span style="display:inline-block;background:#dbeafe;color:#1d4ed8;font-size:12px;font-weight:700;padding:3px 12px;border-radius:100px;">${purposeLabels[purpose] || purpose}</span>
                </td>
              </tr>
              <tr style="background:#fafbfc;">
                <td colspan="2" style="padding:14px 20px;border-bottom:1px solid #e2e8f0;">
                  <span style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.8px;">Visit Timing</span>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 20px;border-bottom:1px solid #f1f5f9;">
                  <span style="font-size:13px;color:#64748b;">Check-in</span>
                </td>
                <td style="padding:14px 20px;border-bottom:1px solid #f1f5f9;">
                  <span style="font-size:14px;color:#0f172a;">${new Date(checkIn).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </td>
              </tr>
              <tr style="background:#fafbfc;">
                <td style="padding:14px 20px;border-bottom:1px solid #f1f5f9;">
                  <span style="font-size:13px;color:#64748b;">Check-out</span>
                </td>
                <td style="padding:14px 20px;border-bottom:1px solid #f1f5f9;">
                  <span style="font-size:14px;color:#0f172a;">${new Date(checkOut).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 20px;">
                  <span style="font-size:13px;color:#64748b;">Duration</span>
                </td>
                <td style="padding:14px 20px;">
                  <span style="font-size:16px;font-weight:700;color:#059669;">${duration < 60 ? duration + ' minutes' : Math.floor(duration/60) + 'h ' + (duration%60) + 'm'}</span>
                </td>
              </tr>
            </table>

            ${facultyRemarks ? `
            <div style="background:#eff6ff;border-left:4px solid #3b82f6;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
              <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:0.5px;">Faculty Remarks</p>
              <p style="margin:0;font-size:14px;color:#1e40af;line-height:1.6;">"${facultyRemarks}"</p>
            </div>` : ''}

            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 20px;">
              <p style="margin:0;font-size:13px;color:#166534;line-height:1.6;">
                <strong>Action Required:</strong> Please verify this visit and add your remarks in the HVMS warden dashboard.
              </p>
            </div>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:24px 48px;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">© ${new Date().getFullYear()} Hostel Visit Management System · ${hostelName}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    await transporter.sendMail({
      from: fromAddress(),
      to: wardenEmail,
      subject: `📋 Visit Completed – ${facultyName} at ${hostelName}`,
      html,
    });
    console.log(`📧 Visit notification sent to warden: ${wardenEmail}`);
    return true;
  } catch (err) {
    console.error('❌ Visit notification email error:', err.message);
    return false;
  }
};
