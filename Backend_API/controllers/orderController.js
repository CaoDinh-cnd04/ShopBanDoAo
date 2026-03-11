const { executeQuery } = require('../config/database');
const { validationResult } = require('express-validator');
const moment = require('moment');

// Generate order code
const generateOrderCode = () => {
    return 'ORD' + moment().format('YYYYMMDDHHmmss') + Math.floor(Math.random() * 1000);
};

// Create order
const createOrder = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const userId = req.user.userId;
        const { addressId, shippingMethodId, voucherId, note, items } = req.body;

        // Validate items
        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Giỏ hàng trống'
            });
        }

        // Get address
        const addresses = await executeQuery(
            `SELECT * FROM UserAddresses WHERE AddressID = @addressId AND UserID = @userId`,
            { addressId: parseInt(addressId), userId }
        );

        if (!addresses || addresses.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Địa chỉ không tồn tại'
            });
        }

        // Get shipping method
        const shippingMethods = await executeQuery(
            `SELECT * FROM ShippingMethods WHERE ShippingMethodID = @shippingMethodId AND IsActive = 1`,
            { shippingMethodId: parseInt(shippingMethodId) }
        );

        if (!shippingMethods || shippingMethods.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Phương thức vận chuyển không hợp lệ'
            });
        }

        const shippingFee = shippingMethods[0].ShippingFee || 0;

        // Calculate subtotal and validate inventory
        let subTotal = 0;
        const orderItems = [];

        for (const item of items) {
            const variants = await executeQuery(
                `SELECT 
                    pv.VariantID,
                    pv.OriginalPrice,
                    pv.SalePrice,
                    p.ProductID,
                    p.ProductName,
                    s.SizeName,
                    c.ColorName,
                    pi.StockQuantity
                 FROM ProductVariants pv
                 INNER JOIN Products p ON pv.ProductID = p.ProductID
                 INNER JOIN Sizes s ON pv.SizeID = s.SizeID
                 INNER JOIN Colors c ON pv.ColorID = c.ColorID
                 LEFT JOIN ProductInventory pi ON pv.VariantID = pi.VariantID
                 WHERE pv.VariantID = @variantId AND pv.IsActive = 1`,
                { variantId: item.variantId }
            );

            if (!variants || variants.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: `Sản phẩm variant ${item.variantId} không tồn tại`
                });
            }

            const variant = variants[0];
            const stockQuantity = variant.StockQuantity || 0;

            if (stockQuantity < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Sản phẩm ${variant.ProductName} (${variant.SizeName}, ${variant.ColorName}) không đủ số lượng`
                });
            }

            const price = variant.SalePrice || variant.OriginalPrice;
            const itemTotal = price * item.quantity;
            subTotal += itemTotal;

            orderItems.push({
                variant,
                quantity: item.quantity,
                price,
                itemTotal
            });
        }

        // Calculate discount from voucher
        let discountAmount = 0;
        if (voucherId) {
            const vouchers = await executeQuery(
                `SELECT * FROM Vouchers 
                 WHERE VoucherID = @voucherId 
                 AND IsActive = 1 
                 AND StartDate <= GETDATE() 
                 AND EndDate >= GETDATE()
                 AND (UsageLimit IS NULL OR UsedCount < UsageLimit)`,
                { voucherId: parseInt(voucherId) }
            );

            if (vouchers && vouchers.length > 0) {
                const voucher = vouchers[0];
                if (subTotal >= voucher.MinOrderAmount) {
                    if (voucher.DiscountType === 'Phần trăm') {
                        discountAmount = (subTotal * voucher.DiscountValue) / 100;
                        if (voucher.MaxDiscountAmount && discountAmount > voucher.MaxDiscountAmount) {
                            discountAmount = voucher.MaxDiscountAmount;
                        }
                    } else {
                        discountAmount = voucher.DiscountValue;
                    }
                }
            }
        }

        // Calculate tax (10% VAT)
        const taxAmount = (subTotal - discountAmount) * 0.1;

        // Calculate total
        const totalAmount = subTotal - discountAmount + shippingFee + taxAmount;

        // Get default status (Chờ xử lý)
        const statuses = await executeQuery(
            `SELECT StatusID FROM OrderStatus WHERE StatusName = N'Chờ xử lý'`
        );
        const statusId = statuses[0].StatusID;

        // Create order
        const orderCode = generateOrderCode();
        const orderResult = await executeQuery(
            `INSERT INTO Orders (
                OrderCode, UserID, AddressID, StatusID, ShippingMethodID, VoucherID,
                SubTotal, DiscountAmount, ShippingFee, TaxAmount, TotalAmount, Note, OrderDate
            )
            OUTPUT INSERTED.OrderID
            VALUES (
                @orderCode, @userId, @addressId, @statusId, @shippingMethodId, @voucherId,
                @subTotal, @discountAmount, @shippingFee, @taxAmount, @totalAmount, @note, GETDATE()
            )`,
            {
                orderCode,
                userId,
                addressId: parseInt(addressId),
                statusId,
                shippingMethodId: parseInt(shippingMethodId),
                voucherId: voucherId ? parseInt(voucherId) : null,
                subTotal,
                discountAmount,
                shippingFee,
                taxAmount,
                totalAmount,
                note: note || null
            }
        );

        const orderId = orderResult[0].OrderID;

        // Create order items and update inventory
        for (const item of orderItems) {
            await executeQuery(
                `INSERT INTO OrderItems (
                    OrderID, VariantID, ProductName, SizeName, ColorName, Quantity, UnitPrice, TotalPrice
                )
                VALUES (
                    @orderId, @variantId, @productName, @sizeName, @colorName, @quantity, @unitPrice, @totalPrice
                )`,
                {
                    orderId,
                    variantId: item.variant.VariantID,
                    productName: item.variant.ProductName,
                    sizeName: item.variant.SizeName,
                    colorName: item.variant.ColorName,
                    quantity: item.quantity,
                    unitPrice: item.price,
                    totalPrice: item.itemTotal
                }
            );

            // Update inventory
            await executeQuery(
                `UPDATE ProductInventory 
                 SET StockQuantity = StockQuantity - @quantity,
                     UpdatedDate = GETDATE()
                 WHERE VariantID = @variantId`,
                {
                    variantId: item.variant.VariantID,
                    quantity: item.quantity
                }
            );
        }

        // Update voucher used count
        if (voucherId) {
            await executeQuery(
                `UPDATE Vouchers SET UsedCount = UsedCount + 1 WHERE VoucherID = @voucherId`,
                { voucherId: parseInt(voucherId) }
            );
        }

        // Clear cart
        await executeQuery(
            `DELETE FROM CartItems WHERE CartID = (SELECT CartID FROM Carts WHERE UserID = @userId)`,
            { userId }
        );

        res.status(201).json({
            success: true,
            message: 'Đặt hàng thành công',
            data: { orderId, orderCode }
        });
    } catch (error) {
        next(error);
    }
};

// Get user orders
const getUserOrders = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { page = 1, limit = 10, statusId } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let whereClause = 'WHERE o.UserID = @userId';
        const params = { userId, limit: parseInt(limit), offset };

        if (statusId) {
            whereClause += ' AND o.StatusID = @statusId';
            params.statusId = parseInt(statusId);
        }

        const orders = await executeQuery(
            `SELECT 
                o.OrderID,
                o.OrderCode,
                o.SubTotal,
                o.DiscountAmount,
                o.ShippingFee,
                o.TaxAmount,
                o.TotalAmount,
                o.Note,
                o.OrderDate,
                o.UpdatedDate,
                os.StatusID,
                os.StatusName,
                sm.MethodName as ShippingMethodName,
                ua.ReceiverName,
                ua.ReceiverPhone,
                ua.AddressLine,
                ua.Ward,
                ua.District,
                ua.City
             FROM Orders o
             INNER JOIN OrderStatus os ON o.StatusID = os.StatusID
             INNER JOIN ShippingMethods sm ON o.ShippingMethodID = sm.ShippingMethodID
             INNER JOIN UserAddresses ua ON o.AddressID = ua.AddressID
             ${whereClause}
             ORDER BY o.OrderDate DESC
             OFFSET @offset ROWS
             FETCH NEXT @limit ROWS ONLY`,
            params
        );

        // Get order items for each order
        for (let order of orders) {
            const items = await executeQuery(
                `SELECT 
                    oi.OrderItemID,
                    oi.ProductName,
                    oi.SizeName,
                    oi.ColorName,
                    oi.Quantity,
                    oi.UnitPrice,
                    oi.TotalPrice,
                    pv.VariantID,
                    (SELECT TOP 1 ImageUrl FROM ProductImages WHERE ProductID = pv.ProductID) as ProductImage
                 FROM OrderItems oi
                 INNER JOIN ProductVariants pv ON oi.VariantID = pv.VariantID
                 WHERE oi.OrderID = @orderId`,
                { orderId: order.OrderID }
            );
            order.items = items;
        }

        // Get total count
        const countResult = await executeQuery(
            `SELECT COUNT(*) as Total FROM Orders o ${whereClause}`,
            params
        );
        const total = countResult[0].Total;

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
};

// Get order by ID
const getOrderById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const orders = await executeQuery(
            `SELECT 
                o.*,
                os.StatusName,
                sm.MethodName as ShippingMethodName,
                sm.Description as ShippingMethodDescription,
                ua.*,
                v.VoucherCode,
                v.VoucherName
             FROM Orders o
             INNER JOIN OrderStatus os ON o.StatusID = os.StatusID
             INNER JOIN ShippingMethods sm ON o.ShippingMethodID = sm.ShippingMethodID
             INNER JOIN UserAddresses ua ON o.AddressID = ua.AddressID
             LEFT JOIN Vouchers v ON o.VoucherID = v.VoucherID
             WHERE o.OrderID = @id AND o.UserID = @userId`,
            { id: parseInt(id), userId }
        );

        if (!orders || orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        const order = orders[0];

        // Get order items
        const items = await executeQuery(
            `SELECT 
                oi.*,
                (SELECT TOP 1 ImageUrl FROM ProductImages pi 
                 INNER JOIN ProductVariants pv ON pi.ProductID = pv.ProductID 
                 WHERE pv.VariantID = oi.VariantID) as ProductImage
             FROM OrderItems oi
             WHERE oi.OrderID = @orderId`,
            { orderId: order.OrderID }
        );
        order.items = items;

        // Get payment info
        const payments = await executeQuery(
            `SELECT 
                op.*,
                pm.MethodName as PaymentMethodName
             FROM OrderPayments op
             INNER JOIN PaymentMethods pm ON op.PaymentMethodID = pm.PaymentMethodID
             WHERE op.OrderID = @orderId`,
            { orderId: order.OrderID }
        );
        order.payments = payments;

        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createOrder,
    getUserOrders,
    getOrderById
};
