const express = require('express');
const router = express.Router();
const adminVoucherController = require('../../controllers/admin/VoucherController');
const { authenticate, authorize } = require('../../middleware/auth');

router.use(authenticate);
router.use(authorize('Admin'));

router.get('/', (req, res, next) => adminVoucherController.getAllVouchers(req, res, next));
router.get('/stats', (req, res, next) => adminVoucherController.getVoucherStats(req, res, next));
router.post('/', (req, res, next) => adminVoucherController.createVoucher(req, res, next));
router.put('/:id', (req, res, next) => adminVoucherController.updateVoucher(req, res, next));
router.delete('/:id', (req, res, next) => adminVoucherController.deleteVoucher(req, res, next));

module.exports = router;
