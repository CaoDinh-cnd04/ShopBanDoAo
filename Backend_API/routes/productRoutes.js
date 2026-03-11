const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const productController = require('../controllers/productController');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);

// Admin routes
router.post('/', authenticate, authorize('Admin'), [
    body('productCode').trim().notEmpty().withMessage('Mã sản phẩm không được để trống'),
    body('productName').trim().notEmpty().withMessage('Tên sản phẩm không được để trống'),
    body('productSlug').trim().notEmpty().withMessage('Slug không được để trống'),
    body('subCategoryId').isInt().withMessage('Danh mục con không hợp lệ'),
    body('brandId').isInt().withMessage('Thương hiệu không hợp lệ')
], productController.createProduct);

router.put('/:id', authenticate, authorize('Admin'), productController.updateProduct);
router.delete('/:id', authenticate, authorize('Admin'), productController.deleteProduct);

module.exports = router;
