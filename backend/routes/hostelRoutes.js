// hostelRoutes.js
const express = require('express');
const r1 = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/helpers');
const h = require('../controllers/hostelController');

r1.use(authMiddleware);
r1.get('/', h.getAll);
r1.get('/:id', h.getById);
r1.post('/', authorizeRoles('admin'), h.create);
r1.put('/:id', authorizeRoles('admin'), h.update);
r1.patch('/:id/warden', authorizeRoles('admin'), h.assignWarden);
r1.delete('/:id', authorizeRoles('admin'), h.remove);
module.exports = r1;
