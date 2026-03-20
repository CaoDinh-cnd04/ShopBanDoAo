const express = require('express');
const router = express.Router();
const adminOrderController = require('../../controllers/admin/OrderController');
const { authenticate, authorize } = require('../../middleware/auth');

router.use(authenticate);
router.use(authorize('Admin'));

router.get('/', (req, res, next) => adminOrderController.getAllOrders(req, res, next));
router.get('/stats', (req, res, next) => adminOrderController.getOrderStats(req, res, next));
router.get('/:id', (req, res, next) => adminOrderController.getOrderById(req, res, next));
router.put('/:id/status', (req, res, next) => adminOrderController.updateOrderStatus(req, res, next));
router.put('/:id/cancel', (req, res, next) => adminOrderController.cancelOrder(req, res, next));

module.exports = router;
