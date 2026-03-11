const { getPool } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

/**
 * Admin Voucher Management Controller
 */

// Lấy tất cả vouchers (admin)
exports.getAllVouchers = async (req, res) => {
    try {
        const pool = await getPool();
        const { isActive, isExpired } = req.query;

        let whereConditions = [];
        const request = pool.request();

        if (isActive !== undefined) {
            whereConditions.push('IsActive = @isActive');
            request.input('isActive', isActive === 'true' ? 1 : 0);
        }

        if (isExpired === 'true') {
            whereConditions.push('EndDate < GETDATE()');
        } else if (isExpired === 'false') {
            whereConditions.push('EndDate >= GETDATE()');
        }

        const whereClause = whereConditions.length > 0
            ? `WHERE ${whereConditions.join(' AND ')}`
            : '';

        const query = `
            SELECT 
                v.*,
                (SELECT COUNT(*) FROM UserVouchers WHERE VoucherID = v.VoucherID) as TotalReceived,
                (SELECT COUNT(*) FROM UserVouchers WHERE VoucherID = v.VoucherID AND IsUsed = 1) as TotalUsed,
                CASE 
                    WHEN EndDate < GETDATE() THEN N'Đã hết hạn'
                    WHEN StartDate > GETDATE() THEN N'Chưa bắt đầu'
                    ELSE N'Đang hoạt động'
                END as Status
            FROM Vouchers v
            ${whereClause}
            ORDER BY v.CreatedDate DESC
        `;

        const result = await request.query(query);

        return successResponse(res, result.recordset, 'Lấy danh sách vouchers thành công');

    } catch (error) {
        console.error('Get all vouchers error:', error);
        return errorResponse(res, 'Lỗi khi lấy danh sách vouchers', 500);
    }
};

// Tạo voucher mới
exports.createVoucher = async (req, res) => {
    try {
        const pool = await getPool();
        const {
            voucherCode,
            voucherName,
            description,
            discountType,
            discountValue,
            maxDiscountAmount,
            minOrderAmount,
            usageLimit,
            startDate,
            endDate
        } = req.body;

        if (!voucherCode || !voucherName || !discountType || !discountValue || !startDate || !endDate) {
            return errorResponse(res, 'Vui lòng cung cấp đầy đủ thông tin', 400);
        }

        // Validate discount type
        if (discountType !== 'Phần trăm' && discountType !== 'Số tiền') {
            return errorResponse(res, 'Loại giảm giá không hợp lệ', 400);
        }

        // Check if voucher code already exists
        const checkVoucher = await pool.request()
            .input('voucherCode', voucherCode)
            .query('SELECT VoucherID FROM Vouchers WHERE VoucherCode = @voucherCode');

        if (checkVoucher.recordset.length > 0) {
            return errorResponse(res, 'Mã voucher đã tồn tại', 400);
        }

        // Insert new voucher
        const result = await pool.request()
            .input('voucherCode', voucherCode)
            .input('voucherName', voucherName)
            .input('description', description || null)
            .input('discountType', discountType)
            .input('discountValue', discountValue)
            .input('maxDiscountAmount', maxDiscountAmount || null)
            .input('minOrderAmount', minOrderAmount || 0)
            .input('usageLimit', usageLimit || null)
            .input('startDate', startDate)
            .input('endDate', endDate)
            .query(`
                INSERT INTO Vouchers (
                    VoucherCode, VoucherName, Description, DiscountType,
                    DiscountValue, MaxDiscountAmount, MinOrderAmount,
                    UsageLimit, StartDate, EndDate
                )
                OUTPUT INSERTED.VoucherID
                VALUES (
                    @voucherCode, @voucherName, @description, @discountType,
                    @discountValue, @maxDiscountAmount, @minOrderAmount,
                    @usageLimit, @startDate, @endDate
                )
            `);

        return successResponse(res, {
            voucherId: result.recordset[0].VoucherID
        }, 'Tạo voucher thành công', 201);

    } catch (error) {
        console.error('Create voucher error:', error);
        return errorResponse(res, 'Lỗi khi tạo voucher', 500);
    }
};

// Cập nhật voucher
exports.updateVoucher = async (req, res) => {
    try {
        const pool = await getPool();
        const { id } = req.params;
        const {
            voucherCode,
            voucherName,
            description,
            discountType,
            discountValue,
            maxDiscountAmount,
            minOrderAmount,
            usageLimit,
            startDate,
            endDate,
            isActive
        } = req.body;

        // Check if voucher exists
        const checkVoucher = await pool.request()
            .input('voucherId', id)
            .query('SELECT VoucherID FROM Vouchers WHERE VoucherID = @voucherId');

        if (checkVoucher.recordset.length === 0) {
            return errorResponse(res, 'Không tìm thấy voucher', 404);
        }

        // Update voucher
        await pool.request()
            .input('voucherId', id)
            .input('voucherCode', voucherCode || null)
            .input('voucherName', voucherName || null)
            .input('description', description || null)
            .input('discountType', discountType || null)
            .input('discountValue', discountValue || null)
            .input('maxDiscountAmount', maxDiscountAmount || null)
            .input('minOrderAmount', minOrderAmount || null)
            .input('usageLimit', usageLimit || null)
            .input('startDate', startDate || null)
            .input('endDate', endDate || null)
            .input('isActive', isActive !== undefined ? isActive : null)
            .query(`
                UPDATE Vouchers
                SET 
                    VoucherCode = COALESCE(@voucherCode, VoucherCode),
                    VoucherName = COALESCE(@voucherName, VoucherName),
                    Description = COALESCE(@description, Description),
                    DiscountType = COALESCE(@discountType, DiscountType),
                    DiscountValue = COALESCE(@discountValue, DiscountValue),
                    MaxDiscountAmount = COALESCE(@maxDiscountAmount, MaxDiscountAmount),
                    MinOrderAmount = COALESCE(@minOrderAmount, MinOrderAmount),
                    UsageLimit = COALESCE(@usageLimit, UsageLimit),
                    StartDate = COALESCE(@startDate, StartDate),
                    EndDate = COALESCE(@endDate, EndDate),
                    IsActive = COALESCE(@isActive, IsActive)
                WHERE VoucherID = @voucherId
            `);

        return successResponse(res, null, 'Cập nhật voucher thành công');

    } catch (error) {
        console.error('Update voucher error:', error);
        return errorResponse(res, 'Lỗi khi cập nhật voucher', 500);
    }
};

// Xóa voucher
exports.deleteVoucher = async (req, res) => {
    try {
        const pool = await getPool();
        const { id } = req.params;

        // Check if voucher exists
        const checkVoucher = await pool.request()
            .input('voucherId', id)
            .query('SELECT VoucherID FROM Vouchers WHERE VoucherID = @voucherId');

        if (checkVoucher.recordset.length === 0) {
            return errorResponse(res, 'Không tìm thấy voucher', 404);
        }

        // Soft delete
        await pool.request()
            .input('voucherId', id)
            .query('UPDATE Vouchers SET IsActive = 0 WHERE VoucherID = @voucherId');

        return successResponse(res, null, 'Xóa voucher thành công');

    } catch (error) {
        console.error('Delete voucher error:', error);
        return errorResponse(res, 'Lỗi khi xóa voucher', 500);
    }
};

// Lấy thống kê vouchers
exports.getVoucherStats = async (req, res) => {
    try {
        const pool = await getPool();

        const statsQuery = `
            SELECT 
                COUNT(*) as TotalVouchers,
                SUM(CASE WHEN IsActive = 1 AND EndDate >= GETDATE() THEN 1 ELSE 0 END) as ActiveVouchers,
                SUM(CASE WHEN EndDate < GETDATE() THEN 1 ELSE 0 END) as ExpiredVouchers,
                SUM(UsedCount) as TotalUsed,
                (SELECT COUNT(*) FROM UserVouchers) as TotalDistributed
            FROM Vouchers
        `;

        const result = await pool.request().query(statsQuery);

        // Get top vouchers by usage
        const topVouchersQuery = `
            SELECT TOP 10
                v.VoucherCode,
                v.VoucherName,
                v.UsedCount,
                (SELECT COUNT(*) FROM UserVouchers WHERE VoucherID = v.VoucherID) as Distributed
            FROM Vouchers v
            ORDER BY v.UsedCount DESC
        `;

        const topVouchersResult = await pool.request().query(topVouchersQuery);

        return successResponse(res, {
            overview: result.recordset[0],
            topVouchers: topVouchersResult.recordset
        }, 'Lấy thống kê vouchers thành công');

    } catch (error) {
        console.error('Get voucher stats error:', error);
        return errorResponse(res, 'Lỗi khi lấy thống kê vouchers', 500);
    }
};
