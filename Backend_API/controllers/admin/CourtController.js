const express = require('express');
const router = express.Router();
const BaseController = require('../base/BaseController');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');
const { authenticate, authorize } = require('../../middleware/auth');

class AdminCourtController extends BaseController {
    async getAllCourts(req, res, next) {
        try {
            const db = this.getDb();
            const { courtType, isActive } = req.query;
            const match = {};
            if (courtType) match['ct.typeName'] = courtType;
            if (isActive !== undefined) match.isActive = isActive === 'true';

            const courts = await db.collection('courts').aggregate([
                { $lookup: { from: 'courtTypes', localField: 'courtTypeId', foreignField: '_id', as: 'ct' } },
                { $unwind: '$ct' },
                ...(Object.keys(match).length ? [{ $match: match }] : []),
                { $lookup: { from: 'bookings', localField: '_id', foreignField: 'courtId', as: 'bks' } },
                { $lookup: { from: 'courtReviews', localField: '_id', foreignField: 'courtId', as: 'revs' } },
                { $addFields: { courtType: '$ct.typeName', totalBookings: { $size: '$bks' }, reviewCount: { $size: '$revs' } } },
                { $project: { ct: 0, bks: 0, revs: 0 } },
                { $sort: { courtName: 1 } }
            ]).toArray();

            const data = courts.map(c => ({ ...c, courtId: c._id.toString(), courtTypeId: c.courtTypeId?.toString() }));
            return successResponse(res, data, 'Lấy danh sách sân thành công');
        } catch (error) {
            return errorResponse(res, 'Lỗi khi lấy danh sách sân', 500);
        }
    }

    async getCourtStats(req, res, next) {
        try {
            const db = this.getDb();
            const totalCourts = await db.collection('courts').countDocuments();
            const activeCourts = await db.collection('courts').countDocuments({ isActive: true });
            const totalBookings = await db.collection('bookings').countDocuments();
            return successResponse(res, { totalCourts, activeCourts, totalBookings }, 'Lấy thống kê sân thành công');
        } catch (error) {
            return errorResponse(res, 'Lỗi khi lấy thống kê sân', 500);
        }
    }

    async createCourt(req, res, next) {
        try {
            const db = this.getDb();
            const { courtTypeId, courtName, courtCode, location, address, description, facilities, capacity, openTime, closeTime } = req.body;
            if (!courtTypeId || !courtName || !courtCode || !location || !openTime || !closeTime) return errorResponse(res, 'Vui lòng cung cấp đầy đủ thông tin', 400);
            const existing = await db.collection('courts').findOne({ courtCode });
            if (existing) return errorResponse(res, 'Mã sân đã tồn tại', 400);
            const now = new Date();
            const result = await db.collection('courts').insertOne({ courtTypeId: new this.ObjectId(courtTypeId), courtName, courtCode, location, address: address || null, description: description || null, facilities: facilities || null, capacity: capacity || null, openTime, closeTime, avgRating: null, reviewCount: 0, isActive: true, createdDate: now });
            return successResponse(res, { courtId: result.insertedId.toString() }, 'Tạo sân thành công', 201);
        } catch (error) {
            return errorResponse(res, 'Lỗi khi tạo sân', 500);
        }
    }

    async updateCourt(req, res, next) {
        try {
            const db = this.getDb();
            const { id } = req.params;
            const { courtTypeId, courtName, courtCode, location, address, description, facilities, capacity, openTime, closeTime, isActive } = req.body;
            const court = await db.collection('courts').findOne({ _id: new this.ObjectId(id) });
            if (!court) return errorResponse(res, 'Không tìm thấy sân', 404);
            const update = {};
            if (courtTypeId !== undefined) update.courtTypeId = new this.ObjectId(courtTypeId);
            if (courtName !== undefined) update.courtName = courtName;
            if (courtCode !== undefined) update.courtCode = courtCode;
            if (location !== undefined) update.location = location;
            if (address !== undefined) update.address = address;
            if (description !== undefined) update.description = description;
            if (facilities !== undefined) update.facilities = facilities;
            if (capacity !== undefined) update.capacity = capacity;
            if (openTime !== undefined) update.openTime = openTime;
            if (closeTime !== undefined) update.closeTime = closeTime;
            if (isActive !== undefined) update.isActive = isActive;
            if (Object.keys(update).length) await db.collection('courts').updateOne({ _id: court._id }, { $set: update });
            return successResponse(res, null, 'Cập nhật sân thành công');
        } catch (error) {
            return errorResponse(res, 'Lỗi khi cập nhật sân', 500);
        }
    }

    async deleteCourt(req, res, next) {
        try {
            const db = this.getDb();
            const { id } = req.params;
            const result = await db.collection('courts').updateOne({ _id: new this.ObjectId(id) }, { $set: { isActive: false } });
            if (result.matchedCount === 0) return errorResponse(res, 'Không tìm thấy sân', 404);
            return successResponse(res, null, 'Xóa sân thành công');
        } catch (error) {
            return errorResponse(res, 'Lỗi khi xóa sân', 500);
        }
    }

    async createCourtType(req, res, next) {
        try {
            const db = this.getDb();
            const { typeName, description } = req.body;
            if (!typeName) return errorResponse(res, 'Vui lòng cung cấp tên loại sân', 400);
            const result = await db.collection('courtTypes').insertOne({ typeName, description: description || null, isActive: true });
            return successResponse(res, { courtTypeId: result.insertedId.toString() }, 'Tạo loại sân thành công', 201);
        } catch (error) {
            return errorResponse(res, 'Lỗi khi tạo loại sân', 500);
        }
    }
}

const adminCourtController = new AdminCourtController();

router.use(authenticate);
router.use(authorize('Admin'));

router.get('/', (req, res, next) => adminCourtController.getAllCourts(req, res, next));
router.get('/stats', (req, res, next) => adminCourtController.getCourtStats(req, res, next));
router.post('/', (req, res, next) => adminCourtController.createCourt(req, res, next));
router.put('/:id', (req, res, next) => adminCourtController.updateCourt(req, res, next));
router.delete('/:id', (req, res, next) => adminCourtController.deleteCourt(req, res, next));
router.post('/types', (req, res, next) => adminCourtController.createCourtType(req, res, next));

module.exports = router;
