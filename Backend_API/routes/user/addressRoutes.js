const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const addressController = require('../../controllers/user/AddressController');
const { authenticate } = require('../../middleware/auth');

const addressValidation = [
    body('receiverName').trim().notEmpty().withMessage('Tên người nhận không được để trống'),
    body('receiverPhone').trim().notEmpty().withMessage('Số điện thoại không được để trống'),
    body('addressLine').trim().notEmpty().withMessage('Địa chỉ không được để trống'),
    body('district').trim().notEmpty().withMessage('Quận/huyện không được để trống'),
    body('city').trim().notEmpty().withMessage('Thành phố không được để trống')
];

router.get('/', authenticate, (req, res, next) => addressController.getUserAddresses(req, res, next));
router.post('/', authenticate, addressValidation, (req, res, next) => addressController.createAddress(req, res, next));
router.put('/:id', authenticate, addressValidation, (req, res, next) => addressController.updateAddress(req, res, next));
router.delete('/:id', authenticate, (req, res, next) => addressController.deleteAddress(req, res, next));

module.exports = router;
