const { getPool } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

/**
 * Admin Court Management Controller
 */

// Lấy tất cả courts (admin)
exports.getAllCourts = async (req, res) => {
    try {
        const pool = await getPool();
        const { courtType, isActive } = req.query;

        let whereConditions = [];
        const request = pool.request();

        if (courtType) {
            whereConditions.push('ct.TypeName = @courtType');
            request.input('courtType', courtType);
        }

        if (isActive !== undefined) {
            whereConditions.push('c.IsActive = @isActive');
            request.input('isActive', isActive === 'true' ? 1 : 0);
        }

        const whereClause = whereConditions.length > 0
            ? `WHERE ${whereConditions.join(' AND ')}`
            : '';

        const query = `
            SELECT 
                c.*,
                ct.TypeName as CourtType,
                (SELECT COUNT(*) FROM Bookings WHERE CourtID = c.CourtID) as TotalBookings,
                (SELECT COUNT(*) FROM CourtReviews WHERE CourtID = c.CourtID) as ReviewCount
            FROM Courts c
            INNER JOIN CourtTypes ct ON c.CourtTypeID = ct.CourtTypeID
            ${whereClause}
            ORDER BY c.CourtName
        `;

        const result = await request.query(query);

        return successResponse(res, result.recordset, 'Lấy danh sách sân thành công');

    } catch (error) {
        console.error('Get all courts error:', error);
        return errorResponse(res, 'Lỗi khi lấy danh sách sân', 500);
    }
};

// Tạo court mới
exports.createCourt = async (req, res) => {
    try {
        const pool = await getPool();
        const {
            courtTypeId,
            courtName,
            courtCode,
            location,
            address,
            description,
            facilities,
            capacity,
            openTime,
            closeTime
        } = req.body;

        if (!courtTypeId || !courtName || !courtCode || !location || !openTime || !closeTime) {
            return errorResponse(res, 'Vui lòng cung cấp đầy đủ thông tin', 400);
        }

        // Check if court code already exists
        const checkCourt = await pool.request()
            .input('courtCode', courtCode)
            .query('SELECT CourtID FROM Courts WHERE CourtCode = @courtCode');

        if (checkCourt.recordset.length > 0) {
            return errorResponse(res, 'Mã sân đã tồn tại', 400);
        }

        // Insert new court
        const result = await pool.request()
            .input('courtTypeId', courtTypeId)
            .input('courtName', courtName)
            .input('courtCode', courtCode)
            .input('location', location)
            .input('address', address || null)
            .input('description', description || null)
            .input('facilities', facilities || null)
            .input('capacity', capacity || null)
            .input('openTime', openTime)
            .input('closeTime', closeTime)
            .query(`
                INSERT INTO Courts (
                    CourtTypeID, CourtName, CourtCode, Location, Address,
                    Description, Facilities, Capacity, OpenTime, CloseTime
                )
                OUTPUT INSERTED.CourtID
                VALUES (
                    @courtTypeId, @courtName, @courtCode, @location, @address,
                    @description, @facilities, @capacity, @openTime, @closeTime
                )
            `);

        return successResponse(res, {
            courtId: result.recordset[0].CourtID
        }, 'Tạo sân thành công', 201);

    } catch (error) {
        console.error('Create court error:', error);
        return errorResponse(res, 'Lỗi khi tạo sân', 500);
    }
};

// Cập nhật court
exports.updateCourt = async (req, res) => {
    try {
        const pool = await getPool();
        const { id } = req.params;
        const {
            courtTypeId,
            courtName,
            courtCode,
            location,
            address,
            description,
            facilities,
            capacity,
            openTime,
            closeTime,
            isActive
        } = req.body;

        // Check if court exists
        const checkCourt = await pool.request()
            .input('courtId', id)
            .query('SELECT CourtID FROM Courts WHERE CourtID = @courtId');

        if (checkCourt.recordset.length === 0) {
            return errorResponse(res, 'Không tìm thấy sân', 404);
        }

        // Update court
        await pool.request()
            .input('courtId', id)
            .input('courtTypeId', courtTypeId || null)
            .input('courtName', courtName || null)
            .input('courtCode', courtCode || null)
            .input('location', location || null)
            .input('address', address || null)
            .input('description', description || null)
            .input('facilities', facilities || null)
            .input('capacity', capacity || null)
            .input('openTime', openTime || null)
            .input('closeTime', closeTime || null)
            .input('isActive', isActive !== undefined ? isActive : null)
            .query(`
                UPDATE Courts
                SET 
                    CourtTypeID = COALESCE(@courtTypeId, CourtTypeID),
                    CourtName = COALESCE(@courtName, CourtName),
                    CourtCode = COALESCE(@courtCode, CourtCode),
                    Location = COALESCE(@location, Location),
                    Address = COALESCE(@address, Address),
                    Description = COALESCE(@description, Description),
                    Facilities = COALESCE(@facilities, Facilities),
                    Capacity = COALESCE(@capacity, Capacity),
                    OpenTime = COALESCE(@openTime, OpenTime),
                    CloseTime = COALESCE(@closeTime, CloseTime),
                    IsActive = COALESCE(@isActive, IsActive)
                WHERE CourtID = @courtId
            `);

        return successResponse(res, null, 'Cập nhật sân thành công');

    } catch (error) {
        console.error('Update court error:', error);
        return errorResponse(res, 'Lỗi khi cập nhật sân', 500);
    }
};

// Xóa court
exports.deleteCourt = async (req, res) => {
    try {
        const pool = await getPool();
        const { id } = req.params;

        // Check if court exists
        const checkCourt = await pool.request()
            .input('courtId', id)
            .query('SELECT CourtID FROM Courts WHERE CourtID = @courtId');

        if (checkCourt.recordset.length === 0) {
            return errorResponse(res, 'Không tìm thấy sân', 404);
        }

        // Check if court has bookings
        const checkBookings = await pool.request()
            .input('courtId', id)
            .query('SELECT COUNT(*) as Count FROM Bookings WHERE CourtID = @courtId');

        if (checkBookings.recordset[0].Count > 0) {
            return errorResponse(res, 'Không thể xóa sân có booking', 400);
        }

        // Soft delete
        await pool.request()
            .input('courtId', id)
            .query('UPDATE Courts SET IsActive = 0 WHERE CourtID = @courtId');

        return successResponse(res, null, 'Xóa sân thành công');

    } catch (error) {
        console.error('Delete court error:', error);
        return errorResponse(res, 'Lỗi khi xóa sân', 500);
    }
};

// Tạo court type
exports.createCourtType = async (req, res) => {
    try {
        const pool = await getPool();
        const { typeName, description } = req.body;

        if (!typeName) {
            return errorResponse(res, 'Vui lòng cung cấp tên loại sân', 400);
        }

        // Check if type already exists
        const checkType = await pool.request()
            .input('typeName', typeName)
            .query('SELECT CourtTypeID FROM CourtTypes WHERE TypeName = @typeName');

        if (checkType.recordset.length > 0) {
            return errorResponse(res, 'Loại sân đã tồn tại', 400);
        }

        // Insert new court type
        const result = await pool.request()
            .input('typeName', typeName)
            .input('description', description || null)
            .query(`
                INSERT INTO CourtTypes (TypeName, Description)
                OUTPUT INSERTED.CourtTypeID
                VALUES (@typeName, @description)
            `);

        return successResponse(res, {
            courtTypeId: result.recordset[0].CourtTypeID
        }, 'Tạo loại sân thành công', 201);

    } catch (error) {
        console.error('Create court type error:', error);
        return errorResponse(res, 'Lỗi khi tạo loại sân', 500);
    }
};

// Lấy court statistics
exports.getCourtStats = async (req, res) => {
    try {
        const pool = await getPool();

        const statsQuery = `
            SELECT 
                COUNT(*) as TotalCourts,
                SUM(CASE WHEN IsActive = 1 THEN 1 ELSE 0 END) as ActiveCourts,
                SUM(CASE WHEN IsActive = 0 THEN 1 ELSE 0 END) as InactiveCourts
            FROM Courts
        `;

        const result = await pool.request().query(statsQuery);

        // Get courts by type
        const typeStatsQuery = `
            SELECT 
                ct.TypeName,
                COUNT(c.CourtID) as CourtCount
            FROM CourtTypes ct
            LEFT JOIN Courts c ON ct.CourtTypeID = c.CourtTypeID
            GROUP BY ct.TypeName
        `;

        const typeStatsResult = await pool.request().query(typeStatsQuery);

        return successResponse(res, {
            overview: result.recordset[0],
            byType: typeStatsResult.recordset
        }, 'Lấy thống kê sân thành công');

    } catch (error) {
        console.error('Get court stats error:', error);
        return errorResponse(res, 'Lỗi khi lấy thống kê sân', 500);
    }
};
