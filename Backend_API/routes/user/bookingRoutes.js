const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const bookingController = require('../../controllers/user/BookingController');
const { authenticate } = require('../../middleware/auth');

const createBookingValidation = [
    body('courtId').notEmpty().withMessage('Court ID không hợp lệ'),
    body('bookingDate').notEmpty().withMessage('Ngày đặt không được để trống'),
    body('timeSlotIds').isArray({ min: 1 }).withMessage('Vui lòng chọn ít nhất một khung giờ')
];

router.get('/available-slots', (req, res, next) => bookingController.getAvailableTimeSlots(req, res, next));
router.post('/', authenticate, createBookingValidation, (req, res, next) => bookingController.createBooking(req, res, next));
router.get('/', authenticate, (req, res, next) => bookingController.getUserBookings(req, res, next));
router.get('/:id', authenticate, (req, res, next) => bookingController.getBookingById(req, res, next));
router.put('/:id/cancel', authenticate, (req, res, next) => bookingController.cancelBooking(req, res, next));

module.exports = router;
