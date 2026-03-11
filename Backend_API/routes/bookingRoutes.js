const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const bookingController = require('../controllers/bookingController');
const { authenticate } = require('../middleware/auth');

// Validation
const createBookingValidation = [
    body('courtId').isInt().withMessage('Court ID không hợp lệ'),
    body('bookingDate').isISO8601().withMessage('Ngày đặt không hợp lệ'),
    body('timeSlotIds').isArray({ min: 1 }).withMessage('Vui lòng chọn ít nhất một khung giờ'),
    body('timeSlotIds.*').isInt().withMessage('Time slot ID không hợp lệ')
];

// Routes
router.get('/available-slots', bookingController.getAvailableTimeSlots);
router.post('/', authenticate, createBookingValidation, bookingController.createBooking);
router.get('/', authenticate, bookingController.getUserBookings);
router.get('/:id', authenticate, bookingController.getBookingById);
router.put('/:id/cancel', authenticate, bookingController.cancelBooking);

module.exports = router;
