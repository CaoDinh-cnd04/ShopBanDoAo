const BaseController = require('../base/BaseController');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');
const { HTTP_STATUS, MESSAGES } = require('../../utils/constants');

class WishlistController extends BaseController {
    async getWishlist(req, res, next) {
        try {
            const userId = req.user.userId;
            const db = this.getDb();

            let wishlist = await db.collection('wishlists').findOne({ userId: new this.ObjectId(userId) });
            if (!wishlist) {
                const now = new Date();
                await db.collection('wishlists').insertOne({ userId: new this.ObjectId(userId), createdDate: now, updatedDate: now });
                wishlist = await db.collection('wishlists').findOne({ userId: new this.ObjectId(userId) });
            }

            const items = await db.collection('wishlistItems').aggregate([
                { $match: { wishlistId: wishlist._id } },
                { $lookup: { from: 'products', localField: 'productId', foreignField: '_id', as: 'p' } },
                { $unwind: '$p' },
                { $match: { 'p.isActive': true } },
                {
                    $lookup: {
                        from: 'productImages',
                        let: { pid: '$p._id' },
                        pipeline: [
                            { $match: { $expr: { $eq: ['$productId', '$$pid'] }, isPrimary: true } },
                            { $limit: 1 }
                        ],
                        as: 'img'
                    }
                },
                {
                    $lookup: {
                        from: 'productVariants',
                        let: { pid: '$p._id' },
                        pipeline: [
                            { $match: { $expr: { $eq: ['$productId', '$$pid'] }, isActive: true } },
                            { $group: { _id: null, minPrice: { $min: '$salePrice' } } }
                        ],
                        as: 'pv'
                    }
                },
                {
                    $project: {
                        wishlistItemId: '$_id',
                        addedDate: 1,
                        productId: '$p._id',
                        productName: '$p.productName',
                        productSlug: '$p.productSlug',
                        shortDescription: '$p.shortDescription',
                        avgRating: '$p.avgRating',
                        reviewCount: '$p.reviewCount',
                        primaryImage: { $arrayElemAt: ['$img.imageUrl', 0] },
                        minPrice: { $arrayElemAt: ['$pv.minPrice', 0] }
                    }
                },
                { $sort: { addedDate: -1 } }
            ]).toArray();

            return successResponse(res, {
                wishlistId: wishlist._id.toString(),
                items: items.map(i => ({ ...i, wishlistItemId: i.wishlistItemId?.toString(), productId: i.productId?.toString() })),
                itemCount: items.length
            });
        } catch (error) {
            next(error);
        }
    }

    async addToWishlist(req, res, next) {
        try {
            const userId = req.user.userId;
            const { productId } = req.body;
            const db = this.getDb();

            const pid = new this.ObjectId(productId);
            const product = await db.collection('products').findOne({ _id: pid, isActive: true });
            if (!product) {
                return errorResponse(res, MESSAGES.PRODUCT_NOT_FOUND || 'Không tìm thấy sản phẩm', HTTP_STATUS.NOT_FOUND);
            }

            let wishlist = await db.collection('wishlists').findOne({ userId: new this.ObjectId(userId) });
            if (!wishlist) {
                const now = new Date();
                await db.collection('wishlists').insertOne({ userId: new this.ObjectId(userId), createdDate: now, updatedDate: now });
                wishlist = await db.collection('wishlists').findOne({ userId: new this.ObjectId(userId) });
            }

            const existing = await db.collection('wishlistItems').findOne({ wishlistId: wishlist._id, productId: pid });
            if (existing) {
                return errorResponse(res, 'Sản phẩm đã có trong wishlist', HTTP_STATUS.CONFLICT);
            }

            await db.collection('wishlistItems').insertOne({
                wishlistId: wishlist._id,
                productId: pid,
                addedDate: new Date()
            });

            return successResponse(res, null, 'Thêm vào wishlist thành công');
        } catch (error) {
            next(error);
        }
    }

    async removeFromWishlist(req, res, next) {
        try {
            const userId = req.user.userId;
            const { id } = req.params;
            const db = this.getDb();

            const wishlist = await db.collection('wishlists').findOne({ userId: new this.ObjectId(userId) });
            if (!wishlist) {
                return errorResponse(res, 'Không tìm thấy sản phẩm trong wishlist', HTTP_STATUS.NOT_FOUND);
            }

            const result = await db.collection('wishlistItems').deleteOne({
                _id: new this.ObjectId(id),
                wishlistId: wishlist._id
            });

            if (result.deletedCount === 0) {
                return errorResponse(res, 'Không tìm thấy sản phẩm trong wishlist', HTTP_STATUS.NOT_FOUND);
            }

            return successResponse(res, null, 'Xóa khỏi wishlist thành công');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new WishlistController();
