const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const wishlistController = require('../../controllers/user/WishlistController');
const { authenticate } = require('../../middleware/auth');

router.get('/', authenticate, (req, res, next) => wishlistController.getWishlist(req, res, next));
router.post('/', authenticate, body('productId').notEmpty().withMessage('Product ID không hợp lệ'), (req, res, next) => wishlistController.addToWishlist(req, res, next));
router.delete('/:id', authenticate, (req, res, next) => wishlistController.removeFromWishlist(req, res, next));

module.exports = router;
