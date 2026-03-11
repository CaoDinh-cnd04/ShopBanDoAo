const { executeQuery } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { HTTP_STATUS, MESSAGES } = require('../utils/constants');

// Get available vouchers for user
const getAvailableVouchers = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        const vouchers = await executeQuery(
            `SELECT 
                v.VoucherID,
                v.VoucherCode,
                v.VoucherName,
                v.Description,
                v.DiscountType,
                v.DiscountValue,
                v.MaxDiscountAmount,
                v.MinOrderAmount,
                v.StartDate,
                v.EndDate,
                CASE 
                    WHEN uv.UserVoucherID IS NOT NULL THEN 1 
                    ELSE 0 
                END as IsReceived
             FROM Vouchers v
             LEFT JOIN UserVouchers uv ON v.VoucherID = uv.VoucherID AND uv.UserID = @userId AND uv.IsUsed = 0
             WHERE v.IsActive = 1
             AND v.StartDate <= GETDATE()
             AND v.EndDate >= GETDATE()
             AND (v.UsageLimit IS NULL OR v.UsedCount < v.UsageLimit)
             ORDER BY v.EndDate ASC`,
            { userId }
        );

        return successResponse(res, vouchers);
    } catch (error) {
        next(error);
    }
};

// Get user vouchers
const getUserVouchers = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { isUsed } = req.query;

        let whereClause = 'WHERE uv.UserID = @userId';
        const params = { userId };

        if (isUsed !== undefined) {
            whereClause += ' AND uv.IsUsed = @isUsed';
            params.isUsed = isUsed === 'true' ? 1 : 0;
        }

        const vouchers = await executeQuery(
            `SELECT 
                uv.UserVoucherID,
                uv.IsUsed,
                uv.UsedDate,
                uv.ReceivedDate,
                v.VoucherID,
                v.VoucherCode,
                v.VoucherName,
                v.Description,
                v.DiscountType,
                v.DiscountValue,
                v.MaxDiscountAmount,
                v.MinOrderAmount,
                v.StartDate,
                v.EndDate
             FROM UserVouchers uv
             INNER JOIN Vouchers v ON uv.VoucherID = v.VoucherID
             ${whereClause}
             ORDER BY uv.ReceivedDate DESC`,
            params
        );

        return successResponse(res, vouchers);
    } catch (error) {
        next(error);
    }
};

// Receive voucher
const receiveVoucher = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { voucherId } = req.body;

        // Check if voucher exists and is available
        const vouchers = await executeQuery(
            `SELECT VoucherID, UsageLimit, UsedCount 
             FROM Vouchers 
             WHERE VoucherID = @voucherId 
             AND IsActive = 1
             AND StartDate <= GETDATE()
             AND EndDate >= GETDATE()
             AND (UsageLimit IS NULL OR UsedCount < UsageLimit)`,
            { voucherId: parseInt(voucherId) }
        );

        if (!vouchers || vouchers.length === 0) {
            return errorResponse(res, 'Voucher không khả dụng', HTTP_STATUS.BAD_REQUEST);
        }

        // Check if user already received this voucher
        const existing = await executeQuery(
            `SELECT UserVoucherID FROM UserVouchers 
             WHERE UserID = @userId AND VoucherID = @voucherId`,
            { userId, voucherId: parseInt(voucherId) }
        );

        if (existing && existing.length > 0) {
            return errorResponse(res, 'Bạn đã nhận voucher này rồi', HTTP_STATUS.CONFLICT);
        }

        // Add voucher to user
        const result = await executeQuery(
            `INSERT INTO UserVouchers (UserID, VoucherID, ReceivedDate)
             OUTPUT INSERTED.UserVoucherID
             VALUES (@userId, @voucherId, GETDATE())`,
            { userId, voucherId: parseInt(voucherId) }
        );

        return successResponse(res, { userVoucherId: result[0].UserVoucherID }, 'Nhận voucher thành công', HTTP_STATUS.CREATED);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAvailableVouchers,
    getUserVouchers,
    receiveVoucher
};
