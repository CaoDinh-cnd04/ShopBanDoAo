const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const addressController = require('../controllers/addressController');
const { authenticate } = require('../middleware/auth');

// Validation
const addressValidation = [
    body('receiverName').trim().notEmpty().withMessage('Tên người nhận không được để trống'),
    body('receiverPhone').trim().notEmpty().withMessage('Số điện thoại không được để trống'),
    body('addressLine').trim().notEmpty().withMessage('Địa chỉ không được để trống'),
    body('district').trim().notEmpty().withMessage('Quận/Huyện không được để trống'),
    body('city').trim().notEmpty().withMessage('Thành phố không được để trống')
];

// Routes
router.get('/', authenticate, addressController.getUserAddresses);
router.post('/', authenticate, addressValidation, addressController.createAddress);
router.put('/:id', authenticate, addressValidation, addressController.updateAddress);
router.delete('/:id', authenticate, addressController.deleteAddress);

module.exports = router;
