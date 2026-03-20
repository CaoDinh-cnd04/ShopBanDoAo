const express = require('express');
const router = express.Router();
const adminUserController = require('../../controllers/admin/UserController');
const { authenticate, authorize } = require('../../middleware/auth');

router.use(authenticate);
router.use(authorize('Admin'));

router.get('/', (req, res, next) => adminUserController.getAllUsers(req, res, next));
router.get('/stats', (req, res, next) => adminUserController.getUserStats(req, res, next));
router.get('/roles', (req, res, next) => adminUserController.getRolesList(req, res, next));
router.get('/:id', (req, res, next) => adminUserController.getUserById(req, res, next));
router.put('/:id/status', (req, res, next) => adminUserController.toggleUserStatus(req, res, next));
router.put('/:id', (req, res, next) => adminUserController.updateUser(req, res, next));
router.delete('/:id', (req, res, next) => adminUserController.deleteUser(req, res, next));

module.exports = router;
