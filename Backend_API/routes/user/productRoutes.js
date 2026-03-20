const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userProductController = require('../../controllers/user/ProductController');
const adminProductController = require('../../controllers/admin/ProductController');
const { authenticate, authorize } = require('../../middleware/auth');

// Public routes (user)
router.get('/', (req, res, next) => userProductController.getProducts(req, res, next));
router.get('/:id', (req, res, next) => userProductController.getProductById(req, res, next));

// Admin routes
router.post('/', authenticate, authorize('Admin'), [
    body('productCode').trim().notEmpty().withMessage('Mã sản phẩm không được để trống'),
    body('productName').trim().notEmpty().withMessage('Tên sản phẩm không được để trống'),
    body('productSlug').trim().notEmpty().withMessage('Slug không được để trống'),
    body('subCategoryId').notEmpty().withMessage('Danh mục con không hợp lệ'),
    body('brandId').notEmpty().withMessage('Thương hiệu không hợp lệ')
], (req, res, next) => adminProductController.createProduct(req, res, next));

router.put('/:id', authenticate, authorize('Admin'), (req, res, next) => adminProductController.updateProduct(req, res, next));
router.delete('/:id', authenticate, authorize('Admin'), (req, res, next) => adminProductController.deleteProduct(req, res, next));

module.exports = router;
