const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const wishlistController = require('../controllers/wishlistController');
const { authenticate } = require('../middleware/auth');

// Routes
router.get('/', authenticate, wishlistController.getWishlist);
router.post('/', authenticate, [
    body('productId').isInt({ min: 1 }).withMessage('Product ID không hợp lệ')
], wishlistController.addToWishlist);
router.delete('/:id', authenticate, wishlistController.removeFromWishlist);

module.exports = router;
