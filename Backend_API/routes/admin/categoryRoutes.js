const express = require('express');
const router = express.Router();
const adminCategoryController = require('../../controllers/admin/CategoryController');
const { authenticate, authorize } = require('../../middleware/auth');

router.use(authenticate);
router.use(authorize('Admin'));

// Cụ thể trước /:id để không khớp nhầm (vd. :id = "brands")
router.get('/brands', (req, res, next) => adminCategoryController.getAllBrands(req, res, next));
router.post('/brands', (req, res, next) => adminCategoryController.createBrand(req, res, next));
router.put('/brands/:id', (req, res, next) => adminCategoryController.updateBrand(req, res, next));
router.delete('/brands/:id', (req, res, next) => adminCategoryController.deleteBrand(req, res, next));

router.post('/subcategories', (req, res, next) => adminCategoryController.createSubCategory(req, res, next));
router.put('/subcategories/:id', (req, res, next) => adminCategoryController.updateSubCategory(req, res, next));
router.delete('/subcategories/:id', (req, res, next) => adminCategoryController.deleteSubCategory(req, res, next));

router.post('/', (req, res, next) => adminCategoryController.createCategory(req, res, next));
router.put('/:id', (req, res, next) => adminCategoryController.updateCategory(req, res, next));
router.delete('/:id', (req, res, next) => adminCategoryController.deleteCategory(req, res, next));

module.exports = router;
