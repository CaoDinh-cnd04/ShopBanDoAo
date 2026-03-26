const express = require('express');
const router = express.Router();
const BaseController = require('../base/BaseController');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');
const { authenticate, authorize } = require('../../middleware/auth');

class AdminOrderController extends BaseController {
    async getAllOrders(req, res, next) {
        try {
            const db = this.getDb();
            const { page = 1, limit = 20, search = '', status = '', startDate = '', endDate = '', sortBy = 'orderDate', sortOrder = 'DESC' } = req.query;
            const skip = (parseInt(page) - 1) * parseInt(limit);

            const lookup = [
                { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'u' } },
                { $unwind: '$u' },
                { $lookup: { from: 'orderStatus', localField: 'statusId', foreignField: '_id', as: 'os' } },
                { $unwind: '$os' },
                { $lookup: { from: 'shippingMethods', localField: 'shippingMethodId', foreignField: '_id', as: 'sm' } },
                { $unwind: '$sm' }
            ];
            const match = {};
            if (search) match.$or = [{ orderCode: new RegExp(search, 'i') }, { 'u.fullName': new RegExp(search, 'i') }, { 'u.email': new RegExp(search, 'i') }];
            if (status) match['os.statusName'] = status;
            if (startDate) match.orderDate = { ...match.orderDate, $gte: new Date(startDate) };
            if (endDate) match.orderDate = { ...match.orderDate, $lte: new Date(endDate) };

            const pipeline = [...lookup];
            if (Object.keys(match).length) pipeline.push({ $match: match });

            const countResult = await db.collection('orders').aggregate([...pipeline, { $count: 'total' }]).toArray();
            const totalOrders = countResult[0]?.total || 0;

            const orders = await db.collection('orders').aggregate([
                ...pipeline,
                { $sort: { [sortBy]: sortOrder === 'ASC' ? 1 : -1 } },
                { $skip: skip },
                { $limit: parseInt(limit) },
                { $lookup: { from: 'orderItems', localField: '_id', foreignField: 'orderId', as: 'items' } },
                { $addFields: { itemCount: { $size: '$items' }, customerName: '$u.fullName', customerEmail: '$u.email', customerPhone: '$u.phoneNumber', status: '$os.statusName', shippingMethod: '$sm.methodName' } },
                { $project: { u: 0, os: 0, sm: 0, items: 0 } }
            ]).toArray();

            const data = orders.map(o => ({ ...o, orderId: o._id.toString(), userId: o.userId?.toString() }));
            return successResponse(res, { orders: data, pagination: { currentPage: parseInt(page), totalPages: Math.ceil(totalOrders / limit), totalOrders, limit: parseInt(limit) } }, 'Lấy danh sách đơn hàng thành công');
        } catch (error) {
            return errorResponse(res, 'Lỗi khi lấy danh sách đơn hàng', 500);
        }
    }

    async updateOrderStatus(req, res, next) {
        try {
            const db = this.getDb();
            const { id } = req.params;
            const { statusName } = req.body;
            if (!statusName) return errorResponse(res, 'Vui lòng cung cấp trạng thái đơn hàng', 400);

            const status = await db.collection('orderStatus').findOne({ statusName });
            if (!status) return errorResponse(res, 'Trạng thái không hợp lệ', 400);

            const result = await db.collection('orders').updateOne(
                { _id: new this.ObjectId(id) },
                { $set: { statusId: status._id, updatedDate: new Date() } }
            );
            if (result.matchedCount === 0) return errorResponse(res, 'Không tìm thấy đơn hàng', 404);
            return successResponse(res, null, 'Cập nhật trạng thái đơn hàng thành công');
        } catch (error) {
            return errorResponse(res, 'Lỗi khi cập nhật trạng thái đơn hàng', 500);
        }
    }

    async cancelOrder(req, res, next) {
        try {
            const db = this.getDb();
            const { id } = req.params;
            const { reason } = req.body;

            const cancelStatus = await db.collection('orderStatus').findOne({ statusName: 'Đã hủy' });
            if (!cancelStatus) return errorResponse(res, 'Không tìm thấy trạng thái "Đã hủy"', 500);

            const order = await db.collection('orders').aggregate([
                { $match: { _id: new this.ObjectId(id) } },
                { $lookup: { from: 'orderStatus', localField: 'statusId', foreignField: '_id', as: 'os' } },
                { $unwind: '$os' },
                { $limit: 1 }
            ]).toArray();

            if (!order.length) return errorResponse(res, 'Không tìm thấy đơn hàng', 404);
            const currentStatus = order[0].os.statusName;
            if (currentStatus === 'Hoàn thành' || currentStatus === 'Đã hủy') return errorResponse(res, `Không thể hủy đơn hàng đã ${currentStatus.toLowerCase()}`, 400);

            const newNote = (order[0].note || '') + (reason ? ' | Lý do hủy: ' + reason : '');
            await db.collection('orders').updateOne(
                { _id: new this.ObjectId(id) },
                { $set: { statusId: cancelStatus._id, updatedDate: new Date(), note: newNote } }
            );
            return successResponse(res, null, 'Hủy đơn hàng thành công');
        } catch (error) {
            return errorResponse(res, 'Lỗi khi hủy đơn hàng', 500);
        }
    }

    async getOrderById(req, res, next) {
        try {
            const { id } = req.params;
            const db = this.getDb();

            const order = await db.collection('orders').aggregate([
                { $match: { _id: new this.ObjectId(id) } },
                { $lookup: { from: 'orderStatus', localField: 'statusId', foreignField: '_id', as: 'status' } },
                { $unwind: '$status' },
                { $lookup: { from: 'shippingMethods', localField: 'shippingMethodId', foreignField: '_id', as: 'sm' } },
                { $unwind: '$sm' },
                { $lookup: { from: 'userAddresses', localField: 'addressId', foreignField: '_id', as: 'ua' } },
                { $unwind: { path: '$ua', preserveNullAndEmptyArrays: true } },
                { $lookup: { from: 'vouchers', localField: 'voucherId', foreignField: '_id', as: 'v' } },
                { $unwind: { path: '$v', preserveNullAndEmptyArrays: true } },
                { $limit: 1 }
            ]).toArray();

            if (!order?.length) {
                return errorResponse(res, 'Không tìm thấy đơn hàng', 404);
            }

            const o = order[0];
            o.statusName = o.status.statusName;
            o.shippingMethodName = o.sm.methodName;
            o.shippingMethodDescription = o.sm.description;
            o.receiverName = o.ua?.receiverName;
            o.receiverPhone = o.ua?.receiverPhone;
            o.addressLine = o.ua?.addressLine;
            o.ward = o.ua?.ward;
            o.district = o.ua?.district;
            o.city = o.ua?.city;
            o.voucherCode = o.v?.voucherCode;
            o.voucherName = o.v?.voucherName;

            const items = await db.collection('orderItems').find({ orderId: o._id }).toArray();
            o.items = items.map(i => ({ ...i, orderItemId: i._id.toString(), variantId: i.variantId?.toString() }));

            const payments = await db.collection('orderPayments').aggregate([
                { $match: { orderId: o._id } },
                { $lookup: { from: 'paymentMethods', localField: 'paymentMethodId', foreignField: '_id', as: 'pm' } },
                { $unwind: '$pm' },
                { $project: { paymentMethodName: '$pm.methodName', amount: 1, paidAt: 1 } }
            ]).toArray();
            o.payments = payments;

            delete o.status;
            delete o.sm;
            delete o.ua;
            delete o.v;
            o.orderId = o._id.toString();

            return successResponse(res, o, 'Lấy đơn hàng thành công');
        } catch (error) {
            next(error);
        }
    }

    async getOrderStats(req, res, next) {
        try {
            const db = this.getDb();
            const { startDate, endDate } = req.query;
            const match = {};
            if (startDate && endDate) match.orderDate = { $gte: new Date(startDate), $lte: new Date(endDate) };

            const orders = await db.collection('orders').aggregate([
                { $match: Object.keys(match).length ? match : {} },
                { $lookup: { from: 'orderStatus', localField: 'statusId', foreignField: '_id', as: 'os' } },
                { $unwind: '$os' },
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        totalRevenue: { $sum: '$totalAmount' },
                        pending: { $sum: { $cond: [{ $eq: ['$os.statusName', 'Chờ xử lý'] }, 1, 0] } },
                        confirmed: { $sum: { $cond: [{ $eq: ['$os.statusName', 'Đã xác nhận'] }, 1, 0] } },
                        shipping: { $sum: { $cond: [{ $eq: ['$os.statusName', 'Đang giao'] }, 1, 0] } },
                        completed: { $sum: { $cond: [{ $eq: ['$os.statusName', 'Hoàn thành'] }, 1, 0] } },
                        cancelled: { $sum: { $cond: [{ $eq: ['$os.statusName', 'Đã hủy'] }, 1, 0] } }
                    }
                }
            ]).toArray();

            const overview = orders[0] ? { totalOrders: orders[0].totalOrders, totalRevenue: orders[0].totalRevenue || 0, averageOrderValue: orders[0].totalOrders ? (orders[0].totalRevenue || 0) / orders[0].totalOrders : 0, pendingOrders: orders[0].pending, confirmedOrders: orders[0].confirmed, shippingOrders: orders[0].shipping, completedOrders: orders[0].completed, cancelledOrders: orders[0].cancelled } : { totalOrders: 0, totalRevenue: 0, averageOrderValue: 0, pendingOrders: 0, confirmedOrders: 0, shippingOrders: 0, completedOrders: 0, cancelledOrders: 0 };

            let orderIds = [];
            if (match.orderDate) {
                orderIds = (await db.collection('orders').find(match).project({ _id: 1 }).toArray()).map(o => o._id);
            }
            const topProductsMatch = orderIds.length ? { orderId: { $in: orderIds } } : {};
            const topProducts = await db.collection('orderItems').aggregate([
                { $match: topProductsMatch },
                { $group: { _id: '$productName', totalQuantity: { $sum: '$quantity' }, totalRevenue: { $sum: '$totalPrice' } } },
                { $sort: { totalQuantity: -1 } },
                { $limit: 10 },
                { $project: { productName: '$_id', totalQuantity: 1, totalRevenue: 1, _id: 0 } }
            ]).toArray();

            const monthAgo = new Date();
            monthAgo.setDate(monthAgo.getDate() - 30);
            const revenueByDay = await db.collection('orders').aggregate([
                { $match: { orderDate: { $gte: monthAgo } } },
                { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$orderDate' } }, orderCount: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
                { $sort: { _id: -1 } }
            ]).toArray();

            return successResponse(res, { overview, topProducts, revenueByDay: revenueByDay.map(r => ({ date: r._id, orderCount: r.orderCount, revenue: r.revenue })) }, 'Lấy thống kê đơn hàng thành công');
        } catch (error) {
            return errorResponse(res, 'Lỗi khi lấy thống kê đơn hàng', 500);
        }
    }
}

const adminOrderController = new AdminOrderController();

router.use(authenticate);
router.use(authorize('Admin'));

// Phải đặt /stats lên trước /:id để tránh nhầm ID
router.get('/', (req, res, next) => adminOrderController.getAllOrders(req, res, next));
router.get('/stats', (req, res, next) => adminOrderController.getOrderStats(req, res, next));
router.get('/:id', (req, res, next) => adminOrderController.getOrderById(req, res, next));
router.put('/:id/status', (req, res, next) => adminOrderController.updateOrderStatus(req, res, next));
router.put('/:id/cancel', (req, res, next) => adminOrderController.cancelOrder(req, res, next));

module.exports = router;
