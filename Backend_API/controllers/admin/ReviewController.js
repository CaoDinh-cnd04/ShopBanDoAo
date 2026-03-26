const express = require('express');
const router = express.Router();
const BaseController = require('../base/BaseController');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');
const { authenticate, authorize } = require('../../middleware/auth');

class AdminReviewController extends BaseController {
    async getAllReviews(req, res, next) {
        try {
            const db = this.getDb();
            const { page = 1, limit = 20, type = 'all', isApproved, rating } = req.query;
            const skip = (parseInt(page) - 1) * parseInt(limit);

            let productReviews = [];
            let courtReviews = [];
            const match = {};
            if (isApproved !== undefined) match.isApproved = isApproved === 'true';
            if (rating) match.rating = parseInt(rating);

            if (type === 'product' || type === 'all') {
                productReviews = await db.collection('productReviews').aggregate([
                    { $match: Object.keys(match).length ? match : {} },
                    { $lookup: { from: 'products', localField: 'productId', foreignField: '_id', as: 'p' } },
                    { $unwind: '$p' },
                    { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'u' } },
                    { $unwind: '$u' },
                    { $addFields: { reviewType: 'Product', itemId: '$productId', itemName: '$p.productName', userName: '$u.fullName', userEmail: '$u.email' } },
                    { $project: { reviewId: '$_id', rating: 1, reviewTitle: 1, reviewContent: 1, isVerifiedPurchase: 1, isApproved: 1, createdDate: 1, updatedDate: 1, reviewType: 1, itemId: 1, itemName: 1, userId: 1, userName: 1, userEmail: 1 } }
                ]).toArray();
            }
            if (type === 'court' || type === 'all') {
                courtReviews = await db.collection('courtReviews').aggregate([
                    { $match: Object.keys(match).length ? match : {} },
                    { $lookup: { from: 'courts', localField: 'courtId', foreignField: '_id', as: 'c' } },
                    { $unwind: '$c' },
                    { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'u' } },
                    { $unwind: '$u' },
                    { $addFields: { reviewType: 'Court', itemId: '$courtId', itemName: '$c.courtName', userName: '$u.fullName', userEmail: '$u.email', isVerifiedPurchase: '$isVerifiedBooking' } },
                    { $project: { reviewId: '$_id', rating: 1, reviewTitle: 1, reviewContent: 1, isVerifiedPurchase: 1, isApproved: 1, createdDate: 1, updatedDate: 1, reviewType: 1, itemId: 1, itemName: 1, userId: 1, userName: 1, userEmail: 1 } }
                ]).toArray();
            }

            const all = [...productReviews, ...courtReviews].map(r => ({ ...r, reviewId: r.reviewId?.toString(), itemId: r.itemId?.toString(), userId: r.userId?.toString() }));
            all.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
            const total = all.length;
            const paginated = all.slice(skip, skip + parseInt(limit));

            return successResponse(res, { reviews: paginated, pagination: { currentPage: parseInt(page), totalPages: Math.ceil(total / limit), total, limit: parseInt(limit) } }, 'Lấy danh sách đánh giá thành công');
        } catch (error) {
            return errorResponse(res, 'Lỗi khi lấy danh sách đánh giá', 500);
        }
    }

    async getReviewStats(req, res, next) {
        try {
            const db = this.getDb();
            const [
                productTotal,
                courtTotal,
                productApproved,
                courtApproved,
                pendingProduct,
                pendingCourt
            ] = await Promise.all([
                db.collection('productReviews').countDocuments(),
                db.collection('courtReviews').countDocuments(),
                db.collection('productReviews').countDocuments({ isApproved: true }),
                db.collection('courtReviews').countDocuments({ isApproved: true }),
                db.collection('productReviews').countDocuments({ isApproved: false }),
                db.collection('courtReviews').countDocuments({ isApproved: false })
            ]);
            return successResponse(
                res,
                {
                    totalProductReviews: productTotal,
                    totalCourtReviews: courtTotal,
                    approvedProductReviews: productApproved,
                    approvedCourtReviews: courtApproved,
                    pendingProductReviews: pendingProduct,
                    pendingCourtReviews: pendingCourt,
                    pendingTotal: pendingProduct + pendingCourt
                },
                'Lấy thống kê đánh giá thành công'
            );
        } catch (error) {
            return errorResponse(res, 'Lỗi khi lấy thống kê đánh giá', 500);
        }
    }

    async updateReviewStatus(req, res, next) {
        try {
            const db = this.getDb();
            const { id } = req.params;
            const { isApproved } = req.body;
            if (isApproved === undefined) return errorResponse(res, 'Vui lòng cung cấp isApproved', 400);

            let result = await db.collection('productReviews').updateOne({ _id: new this.ObjectId(id) }, { $set: { isApproved } });
            if (result.matchedCount === 0) {
                result = await db.collection('courtReviews').updateOne({ _id: new this.ObjectId(id) }, { $set: { isApproved } });
            }
            if (result.matchedCount === 0) return errorResponse(res, 'Không tìm thấy đánh giá', 404);
            return successResponse(res, null, 'Cập nhật trạng thái đánh giá thành công');
        } catch (error) {
            return errorResponse(res, 'Lỗi khi cập nhật trạng thái đánh giá', 500);
        }
    }

    async deleteReview(req, res, next) {
        try {
            const db = this.getDb();
            const { id } = req.params;
            let result = await db.collection('productReviews').deleteOne({ _id: new this.ObjectId(id) });
            if (result.deletedCount === 0) result = await db.collection('courtReviews').deleteOne({ _id: new this.ObjectId(id) });
            if (result.deletedCount === 0) return errorResponse(res, 'Không tìm thấy đánh giá', 404);
            return successResponse(res, null, 'Xóa đánh giá thành công');
        } catch (error) {
            return errorResponse(res, 'Lỗi khi xóa đánh giá', 500);
        }
    }
}

const adminReviewController = new AdminReviewController();

router.use(authenticate);
router.use(authorize('Admin'));

router.get('/', (req, res, next) => adminReviewController.getAllReviews(req, res, next));
router.get('/stats', (req, res, next) => adminReviewController.getReviewStats(req, res, next));
router.put('/:id/status', (req, res, next) => adminReviewController.updateReviewStatus(req, res, next));
router.delete('/:id', (req, res, next) => adminReviewController.deleteReview(req, res, next));

module.exports = router;
