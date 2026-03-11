/**
 * Custom Validation Helpers
 */

const { body, param, query } = require('express-validator');
const { VALIDATION } = require('./constants');

// Common validators
const paginationValidator = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page phải là số nguyên dương'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit phải từ 1-100')
];

const idValidator = [
    param('id').isInt({ min: 1 }).withMessage('ID không hợp lệ')
];

// Auth validators
const registerValidator = [
    body('username')
        .trim()
        .isLength({ min: VALIDATION.USERNAME_MIN_LENGTH, max: VALIDATION.USERNAME_MAX_LENGTH })
        .withMessage(`Username phải từ ${VALIDATION.USERNAME_MIN_LENGTH}-${VALIDATION.USERNAME_MAX_LENGTH} ký tự`)
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username chỉ được chứa chữ cái, số và dấu gạch dưới'),
    body('email')
        .trim()
        .isEmail()
        .withMessage('Email không hợp lệ')
        .isLength({ max: VALIDATION.EMAIL_MAX_LENGTH })
        .withMessage(`Email không được quá ${VALIDATION.EMAIL_MAX_LENGTH} ký tự`),
    body('password')
        .isLength({ min: VALIDATION.PASSWORD_MIN_LENGTH })
        .withMessage(`Mật khẩu phải có ít nhất ${VALIDATION.PASSWORD_MIN_LENGTH} ký tự`)
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Mật khẩu phải chứa chữ hoa, chữ thường và số'),
    body('fullName')
        .trim()
        .notEmpty()
        .withMessage('Họ tên không được để trống')
        .isLength({ max: VALIDATION.NAME_MAX_LENGTH })
        .withMessage(`Họ tên không được quá ${VALIDATION.NAME_MAX_LENGTH} ký tự`),
    body('phoneNumber')
        .optional()
        .trim()
        .matches(/^[0-9]{10,11}$/)
        .withMessage('Số điện thoại không hợp lệ')
];

const loginValidator = [
    body('username').trim().notEmpty().withMessage('Username không được để trống'),
    body('password').notEmpty().withMessage('Mật khẩu không được để trống')
];

// Product validators
const productValidator = [
    body('productCode').trim().notEmpty().withMessage('Mã sản phẩm không được để trống'),
    body('productName').trim().notEmpty().withMessage('Tên sản phẩm không được để trống'),
    body('productSlug').trim().notEmpty().withMessage('Slug không được để trống'),
    body('subCategoryId').isInt({ min: 1 }).withMessage('Danh mục con không hợp lệ'),
    body('brandId').isInt({ min: 1 }).withMessage('Thương hiệu không hợp lệ')
];

// Order validators
const orderValidator = [
    body('addressId').isInt({ min: 1 }).withMessage('Địa chỉ không hợp lệ'),
    body('shippingMethodId').isInt({ min: 1 }).withMessage('Phương thức vận chuyển không hợp lệ'),
    body('items').isArray({ min: 1 }).withMessage('Giỏ hàng không được trống'),
    body('items.*.variantId').isInt({ min: 1 }).withMessage('Variant ID không hợp lệ'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Số lượng phải lớn hơn 0')
];

// Address validators
const addressValidator = [
    body('receiverName').trim().notEmpty().withMessage('Tên người nhận không được để trống'),
    body('receiverPhone').trim().matches(/^[0-9]{10,11}$/).withMessage('Số điện thoại không hợp lệ'),
    body('addressLine').trim().notEmpty().withMessage('Địa chỉ không được để trống'),
    body('district').trim().notEmpty().withMessage('Quận/Huyện không được để trống'),
    body('city').trim().notEmpty().withMessage('Thành phố không được để trống')
];

// Booking validators
const bookingValidator = [
    body('courtId').isInt({ min: 1 }).withMessage('Court ID không hợp lệ'),
    body('bookingDate').isISO8601().withMessage('Ngày đặt không hợp lệ'),
    body('timeSlotIds').isArray({ min: 1 }).withMessage('Vui lòng chọn ít nhất một khung giờ'),
    body('timeSlotIds.*').isInt({ min: 1 }).withMessage('Time slot ID không hợp lệ')
];

module.exports = {
    paginationValidator,
    idValidator,
    registerValidator,
    loginValidator,
    productValidator,
    orderValidator,
    addressValidator,
    bookingValidator
};
