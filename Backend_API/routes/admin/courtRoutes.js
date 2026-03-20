const express = require('express');
const router = express.Router();
const adminCourtController = require('../../controllers/admin/CourtController');
const { authenticate, authorize } = require('../../middleware/auth');

router.use(authenticate);
router.use(authorize('Admin'));

router.get('/', (req, res, next) => adminCourtController.getAllCourts(req, res, next));
router.get('/stats', (req, res, next) => adminCourtController.getCourtStats(req, res, next));
router.post('/', (req, res, next) => adminCourtController.createCourt(req, res, next));
router.put('/:id', (req, res, next) => adminCourtController.updateCourt(req, res, next));
router.delete('/:id', (req, res, next) => adminCourtController.deleteCourt(req, res, next));
router.post('/types', (req, res, next) => adminCourtController.createCourtType(req, res, next));

module.exports = router;
