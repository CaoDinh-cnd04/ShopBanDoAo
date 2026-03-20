const express = require('express');
const router = express.Router();
const adminProductController = require('../../controllers/admin/ProductController');
const { authenticate, authorize } = require('../../middleware/auth');

router.use(authenticate);
router.use(authorize('Admin'));

router.get('/:id', (req, res, next) => adminProductController.getProductById(req, res, next));

module.exports = router;
