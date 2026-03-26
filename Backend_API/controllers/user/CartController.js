const express = require('express');
const router = express.Router();
const BaseController = require('../base/BaseController');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../../middleware/auth');

class CartController extends BaseController {
    async getCart(req, res, next) {
        try {
            const userId = req.user.userId;
            const db = this.getDb();

            let cart = await db.collection('carts').findOne({ userId: new this.ObjectId(userId) });
            if (!cart) {
                const now = new Date();
                await db.collection('carts').insertOne({ userId: new this.ObjectId(userId), createdDate: now, updatedDate: now });
                cart = await db.collection('carts').findOne({ userId: new this.ObjectId(userId) });
            }

            const items = await db.collection('cartItems').aggregate([
                { $match: { cartId: cart._id } },
                { $lookup: { from: 'productVariants', localField: 'variantId', foreignField: '_id', as: 'pv' } },
                { $unwind: '$pv' },
                { $lookup: { from: 'products', localField: 'pv.productId', foreignField: '_id', as: 'p' } },
                { $unwind: '$p' },
                { $match: { 'p.isActive': true, 'pv.isActive': true } },
                { $lookup: { from: 'sizes', localField: 'pv.sizeId', foreignField: '_id', as: 's' } },
                { $unwind: '$s' },
                { $lookup: { from: 'colors', localField: 'pv.colorId', foreignField: '_id', as: 'c' } },
                { $unwind: '$c' },
                { $lookup: { from: 'productInventory', localField: 'pv._id', foreignField: 'variantId', as: 'pi' } },
                { $unwind: { path: '$pi', preserveNullAndEmptyArrays: true } },
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
                    $project: {
                        cartItemId: '$_id',
                        quantity: '$quantity',
                        addedDate: 1,
                        variantId: '$pv._id',
                        sku: '$pv.sku',
                        originalPrice: '$pv.originalPrice',
                        salePrice: '$pv.salePrice',
                        productId: '$p._id',
                        productName: '$p.productName',
                        productSlug: '$p.productSlug',
                        sizeName: '$s.sizeName',
                        colorName: '$c.colorName',
                        colorCode: '$c.colorCode',
                        stockQuantity: '$pi.stockQuantity',
                        productImage: { $arrayElemAt: ['$img.imageUrl', 0] }
                    }
                },
                { $sort: { addedDate: -1 } }
            ]).toArray();

            let total = 0;
            items.forEach(item => {
                const price = item.salePrice || item.originalPrice;
                total += (price || 0) * (item.quantity || 0);
            });

            res.json({
                success: true,
                data: {
                    cartId: cart._id.toString(),
                    items: items.map(i => ({ ...i, cartItemId: i.cartItemId?.toString(), variantId: i.variantId?.toString(), productId: i.productId?.toString() })),
                    total,
                    itemCount: items.length
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async addToCart(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const userId = req.user.userId;
            const { variantId, quantity } = req.body;
            const db = this.getDb();

            const uid = new this.ObjectId(userId);
            let cart = await db.collection('carts').findOne({ userId: uid });
            if (!cart) {
                const now = new Date();
                await db.collection('carts').insertOne({ userId: uid, createdDate: now, updatedDate: now });
                cart = await db.collection('carts').findOne({ userId: uid });
            }

            const vid = new this.ObjectId(variantId);
            const qty = parseInt(quantity) || 1;

            const existing = await db.collection('cartItems').findOne({ cartId: cart._id, variantId: vid });
            if (existing) {
                await db.collection('cartItems').updateOne(
                    { _id: existing._id },
                    { $inc: { quantity: qty } }
                );
            } else {
                await db.collection('cartItems').insertOne({
                    cartId: cart._id,
                    variantId: vid,
                    quantity: qty,
                    addedDate: new Date()
                });
            }

            await db.collection('carts').updateOne(
                { _id: cart._id },
                { $set: { updatedDate: new Date() } }
            );

            res.json({
                success: true,
                message: 'Thêm vào giỏ hàng thành công'
            });
        } catch (error) {
            next(error);
        }
    }

    async updateCartItem(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const userId = req.user.userId;
            const { id } = req.params;
            const { quantity } = req.body;
            const db = this.getDb();

            const cart = await db.collection('carts').findOne({ userId: new this.ObjectId(userId) });
            if (!cart) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm trong giỏ hàng' });
            }

            const item = await db.collection('cartItems').findOne({ _id: new this.ObjectId(id), cartId: cart._id });
            if (!item) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm trong giỏ hàng' });
            }

            const qty = parseInt(quantity);
            if (qty <= 0) {
                await db.collection('cartItems').deleteOne({ _id: item._id });
            } else {
                await db.collection('cartItems').updateOne(
                    { _id: item._id },
                    { $set: { quantity: qty } }
                );
            }

            res.json({
                success: true,
                message: 'Cập nhật giỏ hàng thành công'
            });
        } catch (error) {
            next(error);
        }
    }

    async removeFromCart(req, res, next) {
        try {
            const userId = req.user.userId;
            const { id } = req.params;
            const db = this.getDb();

            const cart = await db.collection('carts').findOne({ userId: new this.ObjectId(userId) });
            if (!cart) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm trong giỏ hàng' });
            }

            const result = await db.collection('cartItems').deleteOne({ _id: new this.ObjectId(id), cartId: cart._id });
            if (result.deletedCount === 0) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm trong giỏ hàng' });
            }

            res.json({
                success: true,
                message: 'Xóa sản phẩm khỏi giỏ hàng thành công'
            });
        } catch (error) {
            next(error);
        }
    }

    async clearCart(req, res, next) {
        try {
            const userId = req.user.userId;
            const db = this.getDb();

            const cart = await db.collection('carts').findOne({ userId: new this.ObjectId(userId) });
            if (cart) {
                await db.collection('cartItems').deleteMany({ cartId: cart._id });
            }

            res.json({
                success: true,
                message: 'Xóa giỏ hàng thành công'
            });
        } catch (error) {
            next(error);
        }
    }
}

const cartController = new CartController();

const addToCartValidation = [
    body('variantId').notEmpty().withMessage('Variant ID không hợp lệ'),
    body('quantity').isInt({ min: 1 }).withMessage('Số lượng phải lớn hơn 0')
];

const updateCartItemValidation = [
    body('quantity').isInt({ min: 0 }).withMessage('Số lượng không hợp lệ')
];

router.get('/', authenticate, (req, res, next) => cartController.getCart(req, res, next));
router.post('/', authenticate, addToCartValidation, (req, res, next) => cartController.addToCart(req, res, next));
router.put('/:id', authenticate, updateCartItemValidation, (req, res, next) => cartController.updateCartItem(req, res, next));
router.delete('/:id', authenticate, (req, res, next) => cartController.removeFromCart(req, res, next));
router.delete('/', authenticate, (req, res, next) => cartController.clearCart(req, res, next));

module.exports = router;
