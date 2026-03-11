const { getPool } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

/**
 * Admin Order Management Controller
 * Quản lý đơn hàng cho admin
 */

// Lấy tất cả đơn hàng với phân trang và filter
exports.getAllOrders = async (req, res) => {
    try {
        const pool = await getPool();
        const {
            page = 1,
            limit = 20,
            search = '',
            status = '',
            startDate = '',
            endDate = '',
            sortBy = 'OrderDate',
            sortOrder = 'DESC'
        } = req.query;

        const offset = (page - 1) * limit;

        // Build WHERE clause
        let whereConditions = [];

        if (search) {
            whereConditions.push(`(o.OrderCode LIKE @search OR u.FullName LIKE @search OR u.Email LIKE @search)`);
        }

        if (status) {
            whereConditions.push(`os.StatusName = @status`);
        }

        if (startDate) {
            whereConditions.push(`o.OrderDate >= @startDate`);
        }

        if (endDate) {
            whereConditions.push(`o.OrderDate <= @endDate`);
        }

        const whereClause = whereConditions.length > 0
            ? `WHERE ${whereConditions.join(' AND ')}`
            : '';

        // Get total count
        const countQuery = `
            SELECT COUNT(*) as Total
            FROM Orders o
            INNER JOIN Users u ON o.UserID = u.UserID
            INNER JOIN OrderStatus os ON o.StatusID = os.StatusID
            ${whereClause}
        `;

        const countRequest = pool.request();
        if (search) countRequest.input('search', `%${search}%`);
        if (status) countRequest.input('status', status);
        if (startDate) countRequest.input('startDate', startDate);
        if (endDate) countRequest.input('endDate', endDate);

        const countResult = await countRequest.query(countQuery);
        const totalOrders = countResult.recordset[0].Total;

        // Get orders with pagination
        const ordersQuery = `
            SELECT 
                o.OrderID,
                o.OrderCode,
                o.UserID,
                u.FullName as CustomerName,
                u.Email as CustomerEmail,
                u.PhoneNumber as CustomerPhone,
                os.StatusName as Status,
                o.SubTotal,
                o.DiscountAmount,
                o.ShippingFee,
                o.TaxAmount,
                o.TotalAmount,
                o.CurrencyCode,
                o.OrderDate,
                o.UpdatedDate,
                sm.MethodName as ShippingMethod,
                (SELECT COUNT(*) FROM OrderItems WHERE OrderID = o.OrderID) as ItemCount
            FROM Orders o
            INNER JOIN Users u ON o.UserID = u.UserID
            INNER JOIN OrderStatus os ON o.StatusID = os.StatusID
            INNER JOIN ShippingMethods sm ON o.ShippingMethodID = sm.ShippingMethodID
            ${whereClause}
            ORDER BY o.${sortBy} ${sortOrder}
            OFFSET @offset ROWS
            FETCH NEXT @limit ROWS ONLY
        `;

        const ordersRequest = pool.request();
        if (search) ordersRequest.input('search', `%${search}%`);
        if (status) ordersRequest.input('status', status);
        if (startDate) ordersRequest.input('startDate', startDate);
        if (endDate) ordersRequest.input('endDate', endDate);
        ordersRequest.input('offset', offset);
        ordersRequest.input('limit', parseInt(limit));

        const ordersResult = await ordersRequest.query(ordersQuery);

        return successResponse(res, {
            orders: ordersResult.recordset,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalOrders / limit),
                totalOrders: totalOrders,
                limit: parseInt(limit)
            }
        }, 'Lấy danh sách đơn hàng thành công');

    } catch (error) {
        console.error('Get all orders error:', error);
        return errorResponse(res, 'Lỗi khi lấy danh sách đơn hàng', 500);
    }
};

// Cập nhật trạng thái đơn hàng
exports.updateOrderStatus = async (req, res) => {
    try {
        const pool = await getPool();
        const { id } = req.params;
        const { statusName } = req.body;

        if (!statusName) {
            return errorResponse(res, 'Vui lòng cung cấp trạng thái đơn hàng', 400);
        }

        // Get status ID
        const statusResult = await pool.request()
            .input('statusName', statusName)
            .query('SELECT StatusID FROM OrderStatus WHERE StatusName = @statusName');

        if (statusResult.recordset.length === 0) {
            return errorResponse(res, 'Trạng thái không hợp lệ', 400);
        }

        const statusId = statusResult.recordset[0].StatusID;

        // Check if order exists
        const checkOrder = await pool.request()
            .input('orderId', id)
            .query('SELECT OrderID FROM Orders WHERE OrderID = @orderId');

        if (checkOrder.recordset.length === 0) {
            return errorResponse(res, 'Không tìm thấy đơn hàng', 404);
        }

        // Update order status
        await pool.request()
            .input('orderId', id)
            .input('statusId', statusId)
            .query(`
                UPDATE Orders 
                SET StatusID = @statusId, UpdatedDate = GETDATE()
                WHERE OrderID = @orderId
            `);

        return successResponse(res, null, 'Cập nhật trạng thái đơn hàng thành công');

    } catch (error) {
        console.error('Update order status error:', error);
        return errorResponse(res, 'Lỗi khi cập nhật trạng thái đơn hàng', 500);
    }
};

// Hủy đơn hàng
exports.cancelOrder = async (req, res) => {
    try {
        const pool = await getPool();
        const { id } = req.params;
        const { reason } = req.body;

        // Get "Đã hủy" status ID
        const statusResult = await pool.request()
            .query(`SELECT StatusID FROM OrderStatus WHERE StatusName = N'Đã hủy'`);

        if (statusResult.recordset.length === 0) {
            return errorResponse(res, 'Không tìm thấy trạng thái "Đã hủy"', 500);
        }

        const cancelStatusId = statusResult.recordset[0].StatusID;

        // Check if order exists and can be cancelled
        const orderResult = await pool.request()
            .input('orderId', id)
            .query(`
                SELECT o.OrderID, os.StatusName
                FROM Orders o
                INNER JOIN OrderStatus os ON o.StatusID = os.StatusID
                WHERE o.OrderID = @orderId
            `);

        if (orderResult.recordset.length === 0) {
            return errorResponse(res, 'Không tìm thấy đơn hàng', 404);
        }

        const currentStatus = orderResult.recordset[0].StatusName;

        // Check if order can be cancelled
        if (currentStatus === 'Hoàn thành' || currentStatus === 'Đã hủy') {
            return errorResponse(res, `Không thể hủy đơn hàng đã ${currentStatus.toLowerCase()}`, 400);
        }

        // Update order status
        await pool.request()
            .input('orderId', id)
            .input('statusId', cancelStatusId)
            .query(`
                UPDATE Orders 
                SET StatusID = @statusId, 
                    Note = CONCAT(COALESCE(Note, ''), ' | Lý do hủy: ', @reason),
                    UpdatedDate = GETDATE()
                WHERE OrderID = @orderId
            `)
            .input('reason', reason || 'Không có lý do');

        return successResponse(res, null, 'Hủy đơn hàng thành công');

    } catch (error) {
        console.error('Cancel order error:', error);
        return errorResponse(res, 'Lỗi khi hủy đơn hàng', 500);
    }
};

// Lấy thống kê đơn hàng
exports.getOrderStats = async (req, res) => {
    try {
        const pool = await getPool();
        const { startDate, endDate } = req.query;

        let dateFilter = '';
        const request = pool.request();

        if (startDate && endDate) {
            dateFilter = 'WHERE OrderDate BETWEEN @startDate AND @endDate';
            request.input('startDate', startDate);
            request.input('endDate', endDate);
        }

        const statsQuery = `
            SELECT 
                COUNT(*) as TotalOrders,
                SUM(TotalAmount) as TotalRevenue,
                AVG(TotalAmount) as AverageOrderValue,
                SUM(CASE WHEN os.StatusName = N'Chờ xử lý' THEN 1 ELSE 0 END) as PendingOrders,
                SUM(CASE WHEN os.StatusName = N'Đã xác nhận' THEN 1 ELSE 0 END) as ConfirmedOrders,
                SUM(CASE WHEN os.StatusName = N'Đang giao' THEN 1 ELSE 0 END) as ShippingOrders,
                SUM(CASE WHEN os.StatusName = N'Hoàn thành' THEN 1 ELSE 0 END) as CompletedOrders,
                SUM(CASE WHEN os.StatusName = N'Đã hủy' THEN 1 ELSE 0 END) as CancelledOrders
            FROM Orders o
            INNER JOIN OrderStatus os ON o.StatusID = os.StatusID
            ${dateFilter}
        `;

        const result = await request.query(statsQuery);

        // Get top selling products
        const topProductsQuery = `
            SELECT TOP 10
                p.ProductID,
                p.ProductName,
                SUM(oi.Quantity) as TotalQuantity,
                SUM(oi.TotalPrice) as TotalRevenue
            FROM OrderItems oi
            INNER JOIN ProductVariants pv ON oi.VariantID = pv.VariantID
            INNER JOIN Products p ON pv.ProductID = p.ProductID
            INNER JOIN Orders o ON oi.OrderID = o.OrderID
            ${dateFilter.replace('OrderDate', 'o.OrderDate')}
            GROUP BY p.ProductID, p.ProductName
            ORDER BY TotalQuantity DESC
        `;

        const topProductsRequest = pool.request();
        if (startDate && endDate) {
            topProductsRequest.input('startDate', startDate);
            topProductsRequest.input('endDate', endDate);
        }

        const topProductsResult = await topProductsRequest.query(topProductsQuery);

        // Get revenue by day (last 30 days)
        const revenueByDayQuery = `
            SELECT 
                CAST(OrderDate AS DATE) as Date,
                COUNT(*) as OrderCount,
                SUM(TotalAmount) as Revenue
            FROM Orders
            WHERE OrderDate >= DATEADD(day, -30, GETDATE())
            GROUP BY CAST(OrderDate AS DATE)
            ORDER BY Date DESC
        `;

        const revenueByDayResult = await pool.request().query(revenueByDayQuery);

        return successResponse(res, {
            overview: result.recordset[0],
            topProducts: topProductsResult.recordset,
            revenueByDay: revenueByDayResult.recordset
        }, 'Lấy thống kê đơn hàng thành công');

    } catch (error) {
        console.error('Get order stats error:', error);
        return errorResponse(res, 'Lỗi khi lấy thống kê đơn hàng', 500);
    }
};
