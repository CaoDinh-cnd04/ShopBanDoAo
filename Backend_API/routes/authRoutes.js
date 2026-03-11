const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Validation rules
const registerValidation = [
    body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username phải từ 3-50 ký tự'),
    body('email').isEmail().withMessage('Email không hợp lệ'),
    body('password').isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
    body('fullName').trim().notEmpty().withMessage('Họ tên không được để trống')
];

const loginValidation = [
    body('password').notEmpty().withMessage('Mật khẩu không được để trống'),
    body().custom((value, { req }) => {
        const username = req.body?.username?.trim?.();
        const email = req.body?.email?.trim?.();
        if (!username && !email) {
            throw new Error('Username hoặc Email không được để trống');
        }
        return true;
    })
];

const changePasswordValidation = [
    body('oldPassword').notEmpty().withMessage('Mật khẩu cũ không được để trống'),
    body('newPassword').isLength({ min: 6 }).withMessage('Mật khẩu mới phải có ít nhất 6 ký tự')
];

// Routes
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/firebase-login', [
    body('idToken').notEmpty().withMessage('Firebase ID token không được để trống')
], authController.firebaseLogin);
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);
router.put('/change-password', authenticate, changePasswordValidation, authController.changePassword);

module.exports = router;
