const express = require('express');
const router = express.Router();
const categoryController = require('../../controllers/user/CategoryController');

router.get('/', (req, res, next) => categoryController.getCategories(req, res, next));
router.get('/brands', (req, res, next) => categoryController.getBrands(req, res, next));
router.get('/:id', (req, res, next) => categoryController.getCategoryById(req, res, next));

module.exports = router;
