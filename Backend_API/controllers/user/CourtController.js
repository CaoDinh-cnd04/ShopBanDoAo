const express = require('express');
const router = express.Router();
const BaseController = require('../base/BaseController');

class CourtController extends BaseController {
    async getCourts(req, res, next) {
        try {
            const { page = 1, limit = 20, courtTypeId, search, sortBy = 'courtName', sortOrder = 'asc' } = req.query;
            const db = this.getDb();

            const skip = (parseInt(page) - 1) * parseInt(limit);
            const match = { isActive: true };
            if (courtTypeId) match.courtTypeId = new this.ObjectId(courtTypeId);
            if (search) {
                match.$or = [
                    { courtName: new RegExp(search, 'i') },
                    { location: new RegExp(search, 'i') }
                ];
            }

            const sortOpt = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

            const courts = await db.collection('courts').aggregate([
                { $match: match },
                { $lookup: { from: 'courtTypes', localField: 'courtTypeId', foreignField: '_id', as: 'ct' } },
                { $unwind: '$ct' },
                {
                    $lookup: {
                        from: 'courtImages',
                        let: { cid: '$_id' },
                        pipeline: [
                            { $match: { $expr: { $eq: ['$courtId', '$$cid'] }, isPrimary: true } },
                            { $limit: 1 }
                        ],
                        as: 'img'
                    }
                },
                {
                    $addFields: {
                        courtTypeName: '$ct.typeName',
                        primaryImage: { $arrayElemAt: ['$img.imageUrl', 0] }
                    }
                },
                { $sort: sortOpt },
                { $skip: skip },
                { $limit: parseInt(limit) },
                { $project: { ct: 0, img: 0 } }
            ]).toArray();

            const total = await db.collection('courts').countDocuments(match);

            res.json({
                success: true,
                data: courts.map(c => ({ ...c, courtId: c._id.toString(), courtTypeId: c.courtTypeId?.toString() })),
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async getCourtById(req, res, next) {
        try {
            const { id } = req.params;
            const db = this.getDb();

            const court = await db.collection('courts').findOne({
                _id: new this.ObjectId(id),
                isActive: true
            });

            if (!court) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy sân' });
            }

            const courtType = await db.collection('courtTypes').findOne({ _id: court.courtTypeId });
            const images = await db.collection('courtImages').find({ courtId: court._id }).sort({ isPrimary: -1, displayOrder: 1 }).toArray();
            const reviews = await db.collection('courtReviews').aggregate([
                { $match: { courtId: court._id, isApproved: true } },
                { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
                { $unwind: '$user' },
                {
                    $project: {
                        reviewId: '$_id',
                        rating: 1,
                        reviewTitle: 1,
                        reviewContent: 1,
                        isVerifiedBooking: 1,
                        createdDate: 1,
                        userId: '$user._id',
                        username: '$user.username',
                        fullName: '$user.fullName',
                        avatar: '$user.avatar'
                    }
                },
                { $sort: { createdDate: -1 } }
            ]).toArray();

            const courtTypes = await db.collection('courtTypes').find({ isActive: true }).sort({ typeName: 1 }).toArray();

            res.json({
                success: true,
                data: {
                    ...court,
                    courtId: court._id.toString(),
                    courtTypeId: court.courtTypeId?.toString(),
                    courtTypeName: courtType?.typeName,
                    courtTypeDescription: courtType?.description,
                    images,
                    reviews: reviews.map(r => ({ ...r, reviewId: r.reviewId?.toString(), userId: r.userId?.toString() })),
                    courtTypes: courtTypes.map(ct => ({ ...ct, courtTypeId: ct._id.toString() }))
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async getCourtTypes(req, res, next) {
        try {
            const db = this.getDb();
            const courtTypes = await db.collection('courtTypes').find({ isActive: true }).sort({ typeName: 1 }).toArray();

            res.json({
                success: true,
                data: courtTypes.map(ct => ({ ...ct, courtTypeId: ct._id.toString() }))
            });
        } catch (error) {
            next(error);
        }
    }
}

const courtController = new CourtController();

router.get('/', (req, res, next) => courtController.getCourts(req, res, next));
router.get('/types', (req, res, next) => courtController.getCourtTypes(req, res, next));
router.get('/:id', (req, res, next) => courtController.getCourtById(req, res, next));

module.exports = router;
