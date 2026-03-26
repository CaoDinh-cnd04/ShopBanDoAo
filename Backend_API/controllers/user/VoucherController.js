const express = require('express');
const router = express.Router();
const BaseController = require('../base/BaseController');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');
const { HTTP_STATUS } = require('../../utils/constants');
const { body } = require('express-validator');
const { authenticate } = require('../../middleware/auth');

class VoucherController extends BaseController {
    async getAvailableVouchers(req, res, next) {
        try {
            const userId = req.user.userId;
            const db = this.getDb();
            const now = new Date();

            const vouchers = await db.collection('vouchers').find({
                isActive: true,
                startDate: { $lte: now },
                endDate: { $gte: now },
                $expr: { $lt: ['$usedCount', '$usageLimit'] }
            }).sort({ endDate: 1 }).toArray();

            const userVouchers = await db.collection('userVouchers').find({
                userId: new this.ObjectId(userId),
                isUsed: false
            }).toArray();
            const receivedIds = new Set(userVouchers.map(uv => uv.voucherId?.toString()));

            const data = vouchers.map(v => ({
                ...v,
                voucherId: v._id.toString(),
                isReceived: receivedIds.has(v._id.toString())
            }));

            return successResponse(res, data);
        } catch (error) {
            next(error);
        }
    }

    async getUserVouchers(req, res, next) {
        try {
            const userId = req.user.userId;
            const { isUsed } = req.query;
            const db = this.getDb();

            const match = { userId: new this.ObjectId(userId) };
            if (isUsed !== undefined) match.isUsed = isUsed === 'true';

            const list = await db.collection('userVouchers').aggregate([
                { $match: match },
                { $lookup: { from: 'vouchers', localField: 'voucherId', foreignField: '_id', as: 'v' } },
                { $unwind: '$v' },
                { $sort: { receivedDate: -1 } },
                {
                    $project: {
                        userVoucherId: '$_id',
                        isUsed: 1,
                        usedDate: 1,
                        receivedDate: 1,
                        voucherId: '$v._id',
                        voucherCode: '$v.voucherCode',
                        voucherName: '$v.voucherName',
                        description: '$v.description',
                        discountType: '$v.discountType',
                        discountValue: '$v.discountValue',
                        maxDiscountAmount: '$v.maxDiscountAmount',
                        minOrderAmount: '$v.minOrderAmount',
                        startDate: '$v.startDate',
                        endDate: '$v.endDate'
                    }
                }
            ]).toArray();

            const data = list.map(l => ({ ...l, userVoucherId: l.userVoucherId?.toString(), voucherId: l.voucherId?.toString() }));
            return successResponse(res, data);
        } catch (error) {
            next(error);
        }
    }

    async receiveVoucher(req, res, next) {
        try {
            const userId = req.user.userId;
            const { voucherId } = req.body;
            const db = this.getDb();

            const vid = new this.ObjectId(voucherId);
            const voucher = await db.collection('vouchers').findOne({
                _id: vid,
                isActive: true,
                startDate: { $lte: new Date() },
                endDate: { $gte: new Date() },
                $expr: { $lt: ['$usedCount', '$usageLimit'] }
            });

            if (!voucher) {
                return errorResponse(res, 'Voucher không khả dụng', HTTP_STATUS.BAD_REQUEST);
            }

            const existing = await db.collection('userVouchers').findOne({
                userId: new this.ObjectId(userId),
                voucherId: vid
            });

            if (existing) {
                return errorResponse(res, 'Bạn đã nhận voucher này rồi', HTTP_STATUS.CONFLICT);
            }

            const result = await db.collection('userVouchers').insertOne({
                userId: new this.ObjectId(userId),
                voucherId: vid,
                receivedDate: new Date(),
                isUsed: false
            });

            return successResponse(res, { userVoucherId: result.insertedId.toString() }, 'Nhận voucher thành công', HTTP_STATUS.CREATED);
        } catch (error) {
            next(error);
        }
    }
}

const voucherController = new VoucherController();

router.get('/available', authenticate, (req, res, next) => voucherController.getAvailableVouchers(req, res, next));
router.get('/', authenticate, (req, res, next) => voucherController.getUserVouchers(req, res, next));
router.post('/receive', authenticate, [body('voucherId').notEmpty().withMessage('Voucher ID không hợp lệ')], (req, res, next) => voucherController.receiveVoucher(req, res, next));

module.exports = router;
