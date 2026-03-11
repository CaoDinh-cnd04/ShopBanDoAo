const express = require('express');
const router = express.Router();
const courtController = require('../controllers/courtController');

// Public routes
router.get('/', courtController.getCourts);
router.get('/types', courtController.getCourtTypes);
router.get('/:id', courtController.getCourtById);

module.exports = router;
