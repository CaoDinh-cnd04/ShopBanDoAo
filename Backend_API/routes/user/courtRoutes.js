const express = require('express');
const router = express.Router();
const courtController = require('../../controllers/user/CourtController');

router.get('/', (req, res, next) => courtController.getCourts(req, res, next));
router.get('/types', (req, res, next) => courtController.getCourtTypes(req, res, next));
router.get('/:id', (req, res, next) => courtController.getCourtById(req, res, next));

module.exports = router;
