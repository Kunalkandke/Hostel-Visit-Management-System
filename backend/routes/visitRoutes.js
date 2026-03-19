const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/helpers');
const v = require('../controllers/visitController');

router.use(authMiddleware);
router.post('/start', authorizeRoles('faculty'), v.startVisit);
router.patch('/:id/end', authorizeRoles('faculty'), v.endVisit);
router.get('/my', v.getMyVisits);
router.get('/active', authorizeRoles('warden', 'admin'), v.getActiveVisits);
router.get('/', authorizeRoles('admin'), v.getAllVisits);
router.get('/:id', v.getVisitById);
router.patch('/:id/verify', authorizeRoles('warden'), v.verifyVisit);

module.exports = router;
