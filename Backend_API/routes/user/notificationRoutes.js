const express = require('express');
const router = express.Router();
const notificationController = require('../../controllers/user/NotificationController');
const { authenticate } = require('../../middleware/auth');

router.get('/', authenticate, (req, res, next) => notificationController.getNotifications(req, res, next));
router.get('/unread-count', authenticate, (req, res, next) => notificationController.getUnreadCount(req, res, next));
router.put('/:id/read', authenticate, (req, res, next) => notificationController.markAsRead(req, res, next));
router.put('/read-all', authenticate, (req, res, next) => notificationController.markAllAsRead(req, res, next));

module.exports = router;
