const BaseController = require('../base/BaseController');
const { validationResult } = require('express-validator');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');
const { HTTP_STATUS, MESSAGES } = require('../../utils/constants');

class ReviewController extends BaseController {
    async createProductReview(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return errorResponse(res, MESSAGES?.INVALID_INPUT || 'Dữ liệu không hợp lệ', HTTP_STATUS.BAD_REQUEST, errors.array());
            }

            const userId = req.user.userId;
            const { productId, rating, reviewTitle, reviewContent } = req.body;
            const db = this.getDb();

            const pid = new this.ObjectId(productId);
            const product = await db.collection('products').findOne({ _id: pid, isActive: true });
            if (!product) {
                return errorResponse(res, MESSAGES?.PRODUCT_NOT_FOUND || 'Không tìm thấy sản phẩm', HTTP_STATUS.NOT_FOUND);
            }

            const uid = new this.ObjectId(userId);
            const existing = await db.collection('productReviews').findOne({ productId: pid, userId: uid });
            if (existing) {
                return errorResponse(res, 'Bạn đã đánh giá sản phẩm này rồi', HTTP_STATUS.CONFLICT);
            }

            const doneStatus = await db.collection('orderStatus').findOne({ statusName: 'Hoàn thành' });
            let hasPurchased = false;
            if (doneStatus) {
                const orderWithProduct = await db.collection('orders').aggregate([
                    { $match: { userId: uid, statusId: doneStatus._id } },
                    { $lookup: { from: 'orderItems', localField: '_id', foreignField: 'orderId', as: 'items' } },
                    { $unwind: '$items' },
                    { $lookup: { from: 'productVariants', localField: 'items.variantId', foreignField: '_id', as: 'pv' } },
                    { $unwind: '$pv' },
                    { $match: { 'pv.productId': pid } },
                    { $limit: 1 }
                ]).toArray();
                hasPurchased = orderWithProduct.length > 0;
            }

            const now = new Date();
            const result = await db.collection('productReviews').insertOne({
                productId: pid,
                userId: uid,
                rating: parseInt(rating),
                reviewTitle: reviewTitle || null,
                reviewContent: reviewContent || null,
                isVerifiedPurchase: hasPurchased,
                isApproved: false,
                createdDate: now,
                updatedDate: now
            });

            return successResponse(res, { reviewId: result.insertedId.toString() }, 'Đánh giá thành công', HTTP_STATUS.CREATED);
        } catch (error) {
            next(error);
        }
    }

    async createCourtReview(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return errorResponse(res, MESSAGES?.INVALID_INPUT || 'Dữ liệu không hợp lệ', HTTP_STATUS.BAD_REQUEST, errors.array());
            }

            const userId = req.user.userId;
            const { courtId, bookingId, rating, reviewTitle, reviewContent } = req.body;
            const db = this.getDb();

            const cid = new this.ObjectId(courtId);
            const court = await db.collection('courts').findOne({ _id: cid, isActive: true });
            if (!court) {
                return errorResponse(res, 'Không tìm thấy sân', HTTP_STATUS.NOT_FOUND);
            }

            const uid = new this.ObjectId(userId);
            if (bookingId) {
                const booking = await db.collection('bookings').findOne({
                    _id: new this.ObjectId(bookingId),
                    userId: uid,
                    courtId: cid
                });
                if (!booking) {
                    return errorResponse(res, 'Booking không hợp lệ', HTTP_STATUS.BAD_REQUEST);
                }
            }

            const now = new Date();
            const result = await db.collection('courtReviews').insertOne({
                courtId: cid,
                userId: uid,
                bookingId: bookingId ? new this.ObjectId(bookingId) : null,
                rating: parseInt(rating),
                reviewTitle: reviewTitle || null,
                reviewContent: reviewContent || null,
                isVerifiedBooking: !!bookingId,
                isApproved: false,
                createdDate: now,
                updatedDate: now
            });

            return successResponse(res, { reviewId: result.insertedId.toString() }, 'Đánh giá thành công', HTTP_STATUS.CREATED);
        } catch (error) {
            next(error);
        }
    }

    async getProductReviews(req, res, next) {
        try {
            const { productId } = req.params;
            const { page = 1, limit = 10 } = req.query;
            const db = this.getDb();

            const skip = (parseInt(page) - 1) * parseInt(limit);
            const pid = new this.ObjectId(productId);

            const reviews = await db.collection('productReviews').aggregate([
                { $match: { productId: pid, isApproved: true } },
                { $sort: { createdDate: -1 } },
                { $skip: skip },
                { $limit: parseInt(limit) },
                { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
                { $unwind: '$user' },
                {
                    $project: {
                        reviewId: '$_id',
                        rating: 1,
                        reviewTitle: 1,
                        reviewContent: 1,
                        isVerifiedPurchase: 1,
                        createdDate: 1,
                        userId: '$user._id',
                        username: '$user.username',
                        fullName: '$user.fullName',
                        avatar: '$user.avatar'
                    }
                }
            ]).toArray();

            const total = await db.collection('productReviews').countDocuments({ productId: pid, isApproved: true });

            res.json({
                success: true,
                data: reviews.map(r => ({ ...r, reviewId: r.reviewId?.toString(), userId: r.userId?.toString() })),
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
}

module.exports = new ReviewController();
