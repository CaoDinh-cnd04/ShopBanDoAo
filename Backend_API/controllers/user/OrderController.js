const BaseController = require('../base/BaseController');
const { validationResult } = require('express-validator');

class OrderController extends BaseController {
    generateOrderCode() {
        return 'ORD' + Date.now() + Math.floor(Math.random() * 1000);
    }

    async createOrder(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const userId = req.user.userId;
            const { addressId, shippingMethodId, voucherId, note, items } = req.body;
            const db = this.getDb();

            if (!items || items.length === 0) {
                return res.status(400).json({ success: false, message: 'Giỏ hàng trống' });
            }

            const uid = new this.ObjectId(userId);
            const address = await db.collection('userAddresses').findOne({ _id: new this.ObjectId(addressId), userId: uid });
            if (!address) {
                return res.status(404).json({ success: false, message: 'Địa chỉ không tồn tại' });
            }

            const shipping = await db.collection('shippingMethods').findOne({ _id: new this.ObjectId(shippingMethodId), isActive: true });
            if (!shipping) {
                return res.status(404).json({ success: false, message: 'Phương thức vận chuyển không hợp lệ' });
            }

            const shippingFee = shipping.shippingFee || 0;
            let subTotal = 0;
            const orderItems = [];

            for (const item of items) {
                const variant = await db.collection('productVariants').aggregate([
                    { $match: { _id: new this.ObjectId(item.variantId), isActive: true } },
                    { $lookup: { from: 'products', localField: 'productId', foreignField: '_id', as: 'p' } },
                    { $unwind: '$p' },
                    { $lookup: { from: 'sizes', localField: 'sizeId', foreignField: '_id', as: 's' } },
                    { $unwind: '$s' },
                    { $lookup: { from: 'colors', localField: 'colorId', foreignField: '_id', as: 'c' } },
                    { $unwind: '$c' },
                    { $lookup: { from: 'productInventory', localField: '_id', foreignField: 'variantId', as: 'pi' } },
                    { $unwind: { path: '$pi', preserveNullAndEmptyArrays: true } },
                    { $limit: 1 }
                ]).toArray();

                if (!variant || variant.length === 0) {
                    return res.status(404).json({ success: false, message: `Sản phẩm variant ${item.variantId} không tồn tại` });
                }

                const v = variant[0];
                const stock = v.pi?.stockQuantity || 0;
                const qty = parseInt(item.quantity) || 1;

                if (stock < qty) {
                    return res.status(400).json({
                        success: false,
                        message: `Sản phẩm ${v.p.productName} (${v.s.sizeName}, ${v.c.colorName}) không đủ số lượng`
                    });
                }

                const price = v.salePrice || v.originalPrice;
                const itemTotal = price * qty;
                subTotal += itemTotal;

                orderItems.push({
                    variantId: v._id,
                    productName: v.p.productName,
                    sizeName: v.s.sizeName,
                    colorName: v.c.colorName,
                    quantity: qty,
                    unitPrice: price,
                    totalPrice: itemTotal
                });
            }

            let discountAmount = 0;
            let voucherObjId = null;
            if (voucherId) {
                const voucher = await db.collection('vouchers').findOne({
                    _id: new this.ObjectId(voucherId),
                    isActive: true,
                    startDate: { $lte: new Date() },
                    endDate: { $gte: new Date() },
                    $expr: { $lt: ['$usedCount', '$usageLimit'] }
                });
                if (voucher && subTotal >= voucher.minOrderAmount) {
                    voucherObjId = voucher._id;
                    if (voucher.discountType === 'Phần trăm') {
                        discountAmount = (subTotal * voucher.discountValue) / 100;
                        if (voucher.maxDiscountAmount && discountAmount > voucher.maxDiscountAmount) {
                            discountAmount = voucher.maxDiscountAmount;
                        }
                    } else {
                        discountAmount = voucher.discountValue;
                    }
                }
            }

            const taxAmount = Math.round((subTotal - discountAmount) * 0.1);
            const totalAmount = subTotal - discountAmount + shippingFee + taxAmount;

            const status = await db.collection('orderStatus').findOne({ statusName: 'Chờ xử lý' });
            if (!status) {
                return res.status(500).json({ success: false, message: 'Trạng thái đơn hàng không tồn tại' });
            }

            const orderCode = this.generateOrderCode();
            const now = new Date();

            const orderResult = await db.collection('orders').insertOne({
                orderCode,
                userId: uid,
                addressId: address._id,
                statusId: status._id,
                shippingMethodId: shipping._id,
                voucherId: voucherObjId,
                subTotal,
                discountAmount,
                shippingFee,
                taxAmount,
                totalAmount,
                currencyCode: 'VND',
                note: note || '',
                orderDate: now,
                updatedDate: now
            });

            const orderId = orderResult.insertedId;

            for (const oi of orderItems) {
                await db.collection('orderItems').insertOne({
                    orderId,
                    variantId: oi.variantId,
                    productName: oi.productName,
                    sizeName: oi.sizeName,
                    colorName: oi.colorName,
                    quantity: oi.quantity,
                    unitPrice: oi.unitPrice,
                    totalPrice: oi.totalPrice
                });
                await db.collection('productInventory').updateOne(
                    { variantId: oi.variantId },
                    { $inc: { stockQuantity: -oi.quantity }, $set: { updatedDate: now } }
                );
            }

            if (voucherObjId) {
                await db.collection('vouchers').updateOne(
                    { _id: voucherObjId },
                    { $inc: { usedCount: 1 } }
                );
            }

            const cart = await db.collection('carts').findOne({ userId: uid });
            if (cart) {
                await db.collection('cartItems').deleteMany({ cartId: cart._id });
            }

            res.status(201).json({
                success: true,
                message: 'Đặt hàng thành công',
                data: { orderId: orderId.toString(), orderCode }
            });
        } catch (error) {
            next(error);
        }
    }

    async getUserOrders(req, res, next) {
        try {
            const userId = req.user.userId;
            const { page = 1, limit = 10, statusId } = req.query;
            const db = this.getDb();

            const skip = (parseInt(page) - 1) * parseInt(limit);
            const match = { userId: new this.ObjectId(userId) };
            if (statusId) match.statusId = new this.ObjectId(statusId);

            const orders = await db.collection('orders').aggregate([
                { $match: match },
                { $sort: { orderDate: -1 } },
                { $skip: skip },
                { $limit: parseInt(limit) },
                { $lookup: { from: 'orderStatus', localField: 'statusId', foreignField: '_id', as: 'status' } },
                { $unwind: '$status' },
                { $lookup: { from: 'shippingMethods', localField: 'shippingMethodId', foreignField: '_id', as: 'sm' } },
                { $unwind: '$sm' },
                { $lookup: { from: 'userAddresses', localField: 'addressId', foreignField: '_id', as: 'ua' } },
                { $unwind: '$ua' },
                {
                    $project: {
                        orderId: '$_id',
                        orderCode: 1,
                        subTotal: 1,
                        discountAmount: 1,
                        shippingFee: 1,
                        taxAmount: 1,
                        totalAmount: 1,
                        note: 1,
                        orderDate: 1,
                        updatedDate: 1,
                        statusId: '$status._id',
                        statusName: '$status.statusName',
                        shippingMethodName: '$sm.methodName',
                        receiverName: '$ua.receiverName',
                        receiverPhone: '$ua.receiverPhone',
                        addressLine: '$ua.addressLine',
                        ward: '$ua.ward',
                        district: '$ua.district',
                        city: '$ua.city'
                    }
                }
            ]).toArray();

            for (const order of orders) {
                const items = await db.collection('orderItems').find({ orderId: order._id }).toArray();
                order.items = items.map(i => ({ ...i, orderItemId: i._id.toString(), variantId: i.variantId?.toString() }));
                order.orderId = order._id.toString();
            }

            const total = await db.collection('orders').countDocuments(match);

            res.json({
                success: true,
                data: orders,
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

    async getOrderById(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.userId;
            const db = this.getDb();

            const order = await db.collection('orders').aggregate([
                { $match: { _id: new this.ObjectId(id), userId: new this.ObjectId(userId) } },
                { $lookup: { from: 'orderStatus', localField: 'statusId', foreignField: '_id', as: 'status' } },
                { $unwind: '$status' },
                { $lookup: { from: 'shippingMethods', localField: 'shippingMethodId', foreignField: '_id', as: 'sm' } },
                { $unwind: '$sm' },
                { $lookup: { from: 'userAddresses', localField: 'addressId', foreignField: '_id', as: 'ua' } },
                { $unwind: '$ua' },
                { $lookup: { from: 'vouchers', localField: 'voucherId', foreignField: '_id', as: 'v' } },
                { $unwind: { path: '$v', preserveNullAndEmptyArrays: true } },
                { $limit: 1 }
            ]).toArray();

            if (!order || order.length === 0) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
            }

            const o = order[0];
            o.statusName = o.status.statusName;
            o.shippingMethodName = o.sm.methodName;
            o.shippingMethodDescription = o.sm.description;
            o.receiverName = o.ua.receiverName;
            o.receiverPhone = o.ua.receiverPhone;
            o.addressLine = o.ua.addressLine;
            o.ward = o.ua.ward;
            o.district = o.ua.district;
            o.city = o.ua.city;
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

            res.json({
                success: true,
                data: o
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new OrderController();
