const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/helpers');
const u = require('../controllers/userController');

router.use(authMiddleware);
router.use(authorizeRoles('admin'));
router.get('/', u.getAllUsers);
router.get('/:id', u.getUserById);
router.post('/', u.createUser);
router.put('/:id', u.updateUser);
router.patch('/:id/role', u.changeUserRole);
router.patch('/:id/status', u.toggleUserStatus);
router.patch('/:id/reset-password', u.resetPassword);

module.exports = router;
