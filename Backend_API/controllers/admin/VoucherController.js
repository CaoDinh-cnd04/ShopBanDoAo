const express = require('express');
const router = express.Router();
const BaseController = require('../base/BaseController');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');
const { authenticate, authorize } = require('../../middleware/auth');

class AdminVoucherController extends BaseController {
    async getAllVouchers(req, res, next) {
        try {
            const db = this.getDb();
            const { isActive, isExpired } = req.query;
            const match = {};
            if (isActive !== undefined) match.isActive = isActive === 'true';
            if (isExpired === 'true') match.endDate = { $lt: new Date() };
            else if (isExpired === 'false') match.endDate = { $gte: new Date() };

            const vouchers = await db.collection('vouchers').find(match).sort({ createdDate: -1 }).toArray();
            const now = new Date();
            const data = vouchers.map(v => {
                let status = 'Đang hoạt động';
                if (v.endDate < now) status = 'Đã hết hạn';
                else if (v.startDate > now) status = 'Chưa bắt đầu';
                return { ...v, voucherId: v._id.toString(), status };
            });
            return successResponse(res, data, 'Lấy danh sách vouchers thành công');
        } catch (error) {
            return errorResponse(res, 'Lỗi khi lấy danh sách vouchers', 500);
        }
    }

    async getVoucherStats(req, res, next) {
        try {
            const db = this.getDb();
            const total = await db.collection('vouchers').countDocuments();
            const active = await db.collection('vouchers').countDocuments({ isActive: true, startDate: { $lte: new Date() }, endDate: { $gte: new Date() } });
            return successResponse(res, { totalVouchers: total, activeVouchers: active }, 'Lấy thống kê voucher thành công');
        } catch (error) {
            return errorResponse(res, 'Lỗi khi lấy thống kê voucher', 500);
        }
    }

    async createVoucher(req, res, next) {
        try {
            const db = this.getDb();
            const { voucherCode, voucherName, description, discountType, discountValue, maxDiscountAmount, minOrderAmount, usageLimit, startDate, endDate } = req.body;
            if (!voucherCode || !voucherName || !discountType || !discountValue || !startDate || !endDate) return errorResponse(res, 'Vui lòng cung cấp đầy đủ thông tin', 400);
            if (discountType !== 'Phần trăm' && discountType !== 'Số tiền') return errorResponse(res, 'Loại giảm giá không hợp lệ', 400);
            const existing = await db.collection('vouchers').findOne({ voucherCode });
            if (existing) return errorResponse(res, 'Mã voucher đã tồn tại', 400);
            const now = new Date();
            const result = await db.collection('vouchers').insertOne({
                voucherCode, voucherName, description: description || null, discountType, discountValue,
                maxDiscountAmount: maxDiscountAmount || null, minOrderAmount: minOrderAmount || 0, usageLimit: usageLimit || 999, usedCount: 0,
                startDate: new Date(startDate), endDate: new Date(endDate), isActive: true, createdDate: now
            });
            return successResponse(res, { voucherId: result.insertedId.toString() }, 'Tạo voucher thành công', 201);
        } catch (error) {
            return errorResponse(res, 'Lỗi khi tạo voucher', 500);
        }
    }

    async updateVoucher(req, res, next) {
        try {
            const db = this.getDb();
            const { id } = req.params;
            const { voucherName, description, discountType, discountValue, maxDiscountAmount, minOrderAmount, usageLimit, startDate, endDate, isActive } = req.body;
            const voucher = await db.collection('vouchers').findOne({ _id: new this.ObjectId(id) });
            if (!voucher) return errorResponse(res, 'Không tìm thấy voucher', 404);
            const update = {};
            if (voucherName !== undefined) update.voucherName = voucherName;
            if (description !== undefined) update.description = description;
            if (discountType !== undefined) update.discountType = discountType;
            if (discountValue !== undefined) update.discountValue = discountValue;
            if (maxDiscountAmount !== undefined) update.maxDiscountAmount = maxDiscountAmount;
            if (minOrderAmount !== undefined) update.minOrderAmount = minOrderAmount;
            if (usageLimit !== undefined) update.usageLimit = usageLimit;
            if (startDate !== undefined) update.startDate = new Date(startDate);
            if (endDate !== undefined) update.endDate = new Date(endDate);
            if (isActive !== undefined) update.isActive = isActive;
            if (Object.keys(update).length) await db.collection('vouchers').updateOne({ _id: voucher._id }, { $set: update });
            return successResponse(res, null, 'Cập nhật voucher thành công');
        } catch (error) {
            return errorResponse(res, 'Lỗi khi cập nhật voucher', 500);
        }
    }

    async deleteVoucher(req, res, next) {
        try {
            const db = this.getDb();
            const { id } = req.params;
            const result = await db.collection('vouchers').updateOne({ _id: new this.ObjectId(id) }, { $set: { isActive: false } });
            if (result.matchedCount === 0) return errorResponse(res, 'Không tìm thấy voucher', 404);
            return successResponse(res, null, 'Xóa voucher thành công');
        } catch (error) {
            return errorResponse(res, 'Lỗi khi xóa voucher', 500);
        }
    }
}

const adminVoucherController = new AdminVoucherController();

router.use(authenticate);
router.use(authorize('Admin'));

router.get('/', (req, res, next) => adminVoucherController.getAllVouchers(req, res, next));
router.get('/stats', (req, res, next) => adminVoucherController.getVoucherStats(req, res, next));
router.post('/', (req, res, next) => adminVoucherController.createVoucher(req, res, next));
router.put('/:id', (req, res, next) => adminVoucherController.updateVoucher(req, res, next));
router.delete('/:id', (req, res, next) => adminVoucherController.deleteVoucher(req, res, next));

module.exports = router;
