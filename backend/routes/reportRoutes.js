const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/helpers');
const r = require('../controllers/reportController');

router.use(authMiddleware);

// Both admin and warden can access all report endpoints
// Controllers scope data by role internally
router.get('/dashboard-stats', authorizeRoles('admin', 'warden'), r.getDashboardStats);
router.get('/daily',           authorizeRoles('admin', 'warden'), r.getDaily);
router.get('/monthly',         authorizeRoles('admin', 'warden'), r.getMonthly);
router.get('/by-hostel',       authorizeRoles('admin', 'warden'), r.getByHostel);
router.get('/by-faculty',      authorizeRoles('admin', 'warden'), r.getByFaculty);

module.exports = router;