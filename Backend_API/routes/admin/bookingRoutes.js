const express = require('express');
const router = express.Router();
const adminBookingController = require('../../controllers/admin/BookingController');
const { authenticate, authorize } = require('../../middleware/auth');

router.use(authenticate);
router.use(authorize('Admin'));

router.get('/', (req, res, next) => adminBookingController.getAllBookings(req, res, next));
router.get('/stats', (req, res, next) => adminBookingController.getBookingStats(req, res, next));
router.get('/:id', (req, res, next) => adminBookingController.getBookingById(req, res, next));
router.put('/:id/status', (req, res, next) => adminBookingController.updateBookingStatus(req, res, next));
router.put('/:id/cancel', (req, res, next) => adminBookingController.cancelBooking(req, res, next));

module.exports = router;
