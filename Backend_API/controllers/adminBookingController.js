const { getPool } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

/**
 * Admin Booking Management Controller
 * Quản lý đặt sân cho admin
 */

// Lấy tất cả bookings với phân trang và filter
exports.getAllBookings = async (req, res) => {
    try {
        const pool = await getPool();
        const {
            page = 1,
            limit = 20,
            search = '',
            status = '',
            courtId = '',
            startDate = '',
            endDate = '',
            sortBy = 'BookingDate',
            sortOrder = 'DESC'
        } = req.query;

        const offset = (page - 1) * limit;

        // Build WHERE clause
        let whereConditions = [];

        if (search) {
            whereConditions.push(`(b.BookingCode LIKE @search OR u.FullName LIKE @search OR u.Email LIKE @search OR c.CourtName LIKE @search)`);
        }

        if (status) {
            whereConditions.push(`bs.StatusName = @status`);
        }

        if (courtId) {
            whereConditions.push(`b.CourtID = @courtId`);
        }

        if (startDate) {
            whereConditions.push(`b.BookingDate >= @startDate`);
        }

        if (endDate) {
            whereConditions.push(`b.BookingDate <= @endDate`);
        }

        const whereClause = whereConditions.length > 0
            ? `WHERE ${whereConditions.join(' AND ')}`
            : '';

        // Get total count
        const countQuery = `
            SELECT COUNT(*) as Total
            FROM Bookings b
            INNER JOIN Users u ON b.UserID = u.UserID
            INNER JOIN Courts c ON b.CourtID = c.CourtID
            INNER JOIN BookingStatus bs ON b.StatusID = bs.StatusID
            ${whereClause}
        `;

        const countRequest = pool.request();
        if (search) countRequest.input('search', `%${search}%`);
        if (status) countRequest.input('status', status);
        if (courtId) countRequest.input('courtId', courtId);
        if (startDate) countRequest.input('startDate', startDate);
        if (endDate) countRequest.input('endDate', endDate);

        const countResult = await countRequest.query(countQuery);
        const totalBookings = countResult.recordset[0].Total;

        // Get bookings with pagination
        const bookingsQuery = `
            SELECT 
                b.BookingID,
                b.BookingCode,
                b.UserID,
                u.FullName as CustomerName,
                u.Email as CustomerEmail,
                u.PhoneNumber as CustomerPhone,
                b.CourtID,
                c.CourtName,
                ct.TypeName as CourtType,
                bs.StatusName as Status,
                b.BookingDate,
                b.TotalAmount,
                b.DiscountAmount,
                b.TaxAmount,
                b.CurrencyCode,
                b.Note,
                b.CreatedDate,
                b.UpdatedDate,
                (SELECT COUNT(*) FROM BookingDetails WHERE BookingID = b.BookingID) as TimeSlotCount
            FROM Bookings b
            INNER JOIN Users u ON b.UserID = u.UserID
            INNER JOIN Courts c ON b.CourtID = c.CourtID
            INNER JOIN CourtTypes ct ON c.CourtTypeID = ct.CourtTypeID
            INNER JOIN BookingStatus bs ON b.StatusID = bs.StatusID
            ${whereClause}
            ORDER BY b.${sortBy} ${sortOrder}
            OFFSET @offset ROWS
            FETCH NEXT @limit ROWS ONLY
        `;

        const bookingsRequest = pool.request();
        if (search) bookingsRequest.input('search', `%${search}%`);
        if (status) bookingsRequest.input('status', status);
        if (courtId) bookingsRequest.input('courtId', courtId);
        if (startDate) bookingsRequest.input('startDate', startDate);
        if (endDate) bookingsRequest.input('endDate', endDate);
        bookingsRequest.input('offset', offset);
        bookingsRequest.input('limit', parseInt(limit));

        const bookingsResult = await bookingsRequest.query(bookingsQuery);

        return successResponse(res, {
            bookings: bookingsResult.recordset,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalBookings / limit),
                totalBookings: totalBookings,
                limit: parseInt(limit)
            }
        }, 'Lấy danh sách booking thành công');

    } catch (error) {
        console.error('Get all bookings error:', error);
        return errorResponse(res, 'Lỗi khi lấy danh sách booking', 500);
    }
};

// Cập nhật trạng thái booking
exports.updateBookingStatus = async (req, res) => {
    try {
        const pool = await getPool();
        const { id } = req.params;
        const { statusName } = req.body;

        if (!statusName) {
            return errorResponse(res, 'Vui lòng cung cấp trạng thái booking', 400);
        }

        // Get status ID
        const statusResult = await pool.request()
            .input('statusName', statusName)
            .query('SELECT StatusID FROM BookingStatus WHERE StatusName = @statusName');

        if (statusResult.recordset.length === 0) {
            return errorResponse(res, 'Trạng thái không hợp lệ', 400);
        }

        const statusId = statusResult.recordset[0].StatusID;

        // Check if booking exists
        const checkBooking = await pool.request()
            .input('bookingId', id)
            .query('SELECT BookingID FROM Bookings WHERE BookingID = @bookingId');

        if (checkBooking.recordset.length === 0) {
            return errorResponse(res, 'Không tìm thấy booking', 404);
        }

        // Update booking status
        await pool.request()
            .input('bookingId', id)
            .input('statusId', statusId)
            .query(`
                UPDATE Bookings 
                SET StatusID = @statusId, UpdatedDate = GETDATE()
                WHERE BookingID = @bookingId
            `);

        return successResponse(res, null, 'Cập nhật trạng thái booking thành công');

    } catch (error) {
        console.error('Update booking status error:', error);
        return errorResponse(res, 'Lỗi khi cập nhật trạng thái booking', 500);
    }
};

// Hủy booking
exports.cancelBooking = async (req, res) => {
    try {
        const pool = await getPool();
        const { id } = req.params;
        const { reason } = req.body;

        // Get "Đã hủy" status ID
        const statusResult = await pool.request()
            .query(`SELECT StatusID FROM BookingStatus WHERE StatusName = N'Đã hủy'`);

        if (statusResult.recordset.length === 0) {
            return errorResponse(res, 'Không tìm thấy trạng thái "Đã hủy"', 500);
        }

        const cancelStatusId = statusResult.recordset[0].StatusID;

        // Check if booking exists and can be cancelled
        const bookingResult = await pool.request()
            .input('bookingId', id)
            .query(`
                SELECT b.BookingID, bs.StatusName, b.BookingDate
                FROM Bookings b
                INNER JOIN BookingStatus bs ON b.StatusID = bs.StatusID
                WHERE b.BookingID = @bookingId
            `);

        if (bookingResult.recordset.length === 0) {
            return errorResponse(res, 'Không tìm thấy booking', 404);
        }

        const currentStatus = bookingResult.recordset[0].StatusName;

        // Check if booking can be cancelled
        if (currentStatus === 'Hoàn thành' || currentStatus === 'Đã hủy') {
            return errorResponse(res, `Không thể hủy booking đã ${currentStatus.toLowerCase()}`, 400);
        }

        // Update booking status
        await pool.request()
            .input('bookingId', id)
            .input('statusId', cancelStatusId)
            .input('reason', reason || 'Không có lý do')
            .query(`
                UPDATE Bookings 
                SET StatusID = @statusId, 
                    Note = CONCAT(COALESCE(Note, ''), ' | Lý do hủy: ', @reason),
                    UpdatedDate = GETDATE()
                WHERE BookingID = @bookingId
            `);

        return successResponse(res, null, 'Hủy booking thành công');

    } catch (error) {
        console.error('Cancel booking error:', error);
        return errorResponse(res, 'Lỗi khi hủy booking', 500);
    }
};

// Lấy thống kê booking
exports.getBookingStats = async (req, res) => {
    try {
        const pool = await getPool();
        const { startDate, endDate } = req.query;

        let dateFilter = '';
        const request = pool.request();

        if (startDate && endDate) {
            dateFilter = 'WHERE BookingDate BETWEEN @startDate AND @endDate';
            request.input('startDate', startDate);
            request.input('endDate', endDate);
        }

        const statsQuery = `
            SELECT 
                COUNT(*) as TotalBookings,
                SUM(TotalAmount) as TotalRevenue,
                AVG(TotalAmount) as AverageBookingValue,
                SUM(CASE WHEN bs.StatusName = N'Chờ xác nhận' THEN 1 ELSE 0 END) as PendingBookings,
                SUM(CASE WHEN bs.StatusName = N'Đã xác nhận' THEN 1 ELSE 0 END) as ConfirmedBookings,
                SUM(CASE WHEN bs.StatusName = N'Đang sử dụng' THEN 1 ELSE 0 END) as InUseBookings,
                SUM(CASE WHEN bs.StatusName = N'Hoàn thành' THEN 1 ELSE 0 END) as CompletedBookings,
                SUM(CASE WHEN bs.StatusName = N'Đã hủy' THEN 1 ELSE 0 END) as CancelledBookings
            FROM Bookings b
            INNER JOIN BookingStatus bs ON b.StatusID = bs.StatusID
            ${dateFilter}
        `;

        const result = await request.query(statsQuery);

        // Get top courts by bookings
        const topCourtsQuery = `
            SELECT TOP 10
                c.CourtID,
                c.CourtName,
                ct.TypeName as CourtType,
                COUNT(*) as TotalBookings,
                SUM(b.TotalAmount) as TotalRevenue
            FROM Bookings b
            INNER JOIN Courts c ON b.CourtID = c.CourtID
            INNER JOIN CourtTypes ct ON c.CourtTypeID = ct.CourtTypeID
            ${dateFilter.replace('BookingDate', 'b.BookingDate')}
            GROUP BY c.CourtID, c.CourtName, ct.TypeName
            ORDER BY TotalBookings DESC
        `;

        const topCourtsRequest = pool.request();
        if (startDate && endDate) {
            topCourtsRequest.input('startDate', startDate);
            topCourtsRequest.input('endDate', endDate);
        }

        const topCourtsResult = await topCourtsRequest.query(topCourtsQuery);

        // Get bookings by day (last 30 days)
        const bookingsByDayQuery = `
            SELECT 
                CAST(BookingDate AS DATE) as Date,
                COUNT(*) as BookingCount,
                SUM(TotalAmount) as Revenue
            FROM Bookings
            WHERE BookingDate >= DATEADD(day, -30, GETDATE())
            GROUP BY CAST(BookingDate AS DATE)
            ORDER BY Date DESC
        `;

        const bookingsByDayResult = await pool.request().query(bookingsByDayQuery);

        return successResponse(res, {
            overview: result.recordset[0],
            topCourts: topCourtsResult.recordset,
            bookingsByDay: bookingsByDayResult.recordset
        }, 'Lấy thống kê booking thành công');

    } catch (error) {
        console.error('Get booking stats error:', error);
        return errorResponse(res, 'Lỗi khi lấy thống kê booking', 500);
    }
};
