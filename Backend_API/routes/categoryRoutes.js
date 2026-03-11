const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// Public routes
router.get('/', categoryController.getCategories);
router.get('/brands', categoryController.getBrands);
router.get('/:id', categoryController.getCategoryById);

module.exports = router;
