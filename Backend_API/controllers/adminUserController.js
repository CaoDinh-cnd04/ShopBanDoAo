const { getPool } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const bcrypt = require('bcryptjs');

/**
 * Admin User Management Controller
 * Quản lý users cho admin
 */

// Lấy danh sách tất cả users với phân trang và filter
exports.getAllUsers = async (req, res) => {
    try {
        const pool = await getPool();
        const { 
            page = 1, 
            limit = 20, 
            search = '', 
            role = '', 
            isActive = '',
            sortBy = 'CreatedDate',
            sortOrder = 'DESC'
        } = req.query;

        const offset = (page - 1) * limit;

        // Build WHERE clause
        let whereConditions = [];
        let queryParams = [];
        let paramIndex = 1;

        if (search) {
            whereConditions.push(`(u.Username LIKE @search OR u.Email LIKE @search OR u.FullName LIKE @search)`);
        }

        if (role) {
            whereConditions.push(`r.RoleName = @role`);
        }

        if (isActive !== '') {
            whereConditions.push(`u.IsActive = @isActive`);
        }

        const whereClause = whereConditions.length > 0 
            ? `WHERE ${whereConditions.join(' AND ')}` 
            : '';

        // Get total count
        const countQuery = `
            SELECT COUNT(DISTINCT u.UserID) as Total
            FROM Users u
            LEFT JOIN UserRoles ur ON u.UserID = ur.UserID
            LEFT JOIN Roles r ON ur.RoleID = r.RoleID
            ${whereClause}
        `;

        const countRequest = pool.request();
        if (search) countRequest.input('search', `%${search}%`);
        if (role) countRequest.input('role', role);
        if (isActive !== '') countRequest.input('isActive', isActive === 'true' ? 1 : 0);

        const countResult = await countRequest.query(countQuery);
        const totalUsers = countResult.recordset[0].Total;

        // Get users with pagination
        const usersQuery = `
            SELECT DISTINCT
                u.UserID,
                u.Username,
                u.Email,
                u.FullName,
                u.PhoneNumber,
                u.Avatar,
                u.DateOfBirth,
                u.Gender,
                u.CreatedDate,
                u.LastLoginDate,
                u.IsActive,
                u.IsEmailVerified,
                u.IsPhoneVerified,
                STRING_AGG(r.RoleName, ', ') as Roles
            FROM Users u
            LEFT JOIN UserRoles ur ON u.UserID = ur.UserID
            LEFT JOIN Roles r ON ur.RoleID = r.RoleID
            ${whereClause}
            GROUP BY 
                u.UserID, u.Username, u.Email, u.FullName, u.PhoneNumber,
                u.Avatar, u.DateOfBirth, u.Gender, u.CreatedDate, 
                u.LastLoginDate, u.IsActive, u.IsEmailVerified, u.IsPhoneVerified
            ORDER BY u.${sortBy} ${sortOrder}
            OFFSET @offset ROWS
            FETCH NEXT @limit ROWS ONLY
        `;

        const usersRequest = pool.request();
        if (search) usersRequest.input('search', `%${search}%`);
        if (role) usersRequest.input('role', role);
        if (isActive !== '') usersRequest.input('isActive', isActive === 'true' ? 1 : 0);
        usersRequest.input('offset', offset);
        usersRequest.input('limit', parseInt(limit));

        const usersResult = await usersRequest.query(usersQuery);

        return successResponse(res, {
            users: usersResult.recordset,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalUsers / limit),
                totalUsers: totalUsers,
                limit: parseInt(limit)
            }
        }, 'Lấy danh sách users thành công');

    } catch (error) {
        console.error('Get all users error:', error);
        return errorResponse(res, 'Lỗi khi lấy danh sách users', 500);
    }
};

// Lấy chi tiết user theo ID
exports.getUserById = async (req, res) => {
    try {
        const pool = await getPool();
        const { id } = req.params;

        // Get user info
        const userQuery = `
            SELECT 
                u.UserID,
                u.Username,
                u.Email,
                u.FullName,
                u.PhoneNumber,
                u.Avatar,
                u.DateOfBirth,
                u.Gender,
                u.Bio,
                u.FacebookLink,
                u.InstagramLink,
                u.FavoriteSports,
                u.CreatedDate,
                u.LastLoginDate,
                u.IsActive,
                u.IsEmailVerified,
                u.IsPhoneVerified
            FROM Users u
            WHERE u.UserID = @userId
        `;

        const userResult = await pool.request()
            .input('userId', id)
            .query(userQuery);

        if (userResult.recordset.length === 0) {
            return errorResponse(res, 'Không tìm thấy user', 404);
        }

        const user = userResult.recordset[0];

        // Get user roles
        const rolesQuery = `
            SELECT r.RoleID, r.RoleName, r.Description
            FROM UserRoles ur
            INNER JOIN Roles r ON ur.RoleID = r.RoleID
            WHERE ur.UserID = @userId
        `;

        const rolesResult = await pool.request()
            .input('userId', id)
            .query(rolesQuery);

        user.Roles = rolesResult.recordset;

        // Get user addresses
        const addressesQuery = `
            SELECT * FROM UserAddresses
            WHERE UserID = @userId
            ORDER BY IsDefault DESC, CreatedDate DESC
        `;

        const addressesResult = await pool.request()
            .input('userId', id)
            .query(addressesQuery);

        user.Addresses = addressesResult.recordset;

        // Get user statistics
        const statsQuery = `
            SELECT 
                (SELECT COUNT(*) FROM Orders WHERE UserID = @userId) as TotalOrders,
                (SELECT COUNT(*) FROM Bookings WHERE UserID = @userId) as TotalBookings,
                (SELECT COUNT(*) FROM ProductReviews WHERE UserID = @userId) as TotalReviews,
                (SELECT COUNT(*) FROM WishlistItems wi 
                 INNER JOIN Wishlists w ON wi.WishlistID = w.WishlistID 
                 WHERE w.UserID = @userId) as TotalWishlistItems
        `;

        const statsResult = await pool.request()
            .input('userId', id)
            .query(statsQuery);

        user.Statistics = statsResult.recordset[0];

        return successResponse(res, user, 'Lấy thông tin user thành công');

    } catch (error) {
        console.error('Get user by ID error:', error);
        return errorResponse(res, 'Lỗi khi lấy thông tin user', 500);
    }
};

// Cập nhật user
exports.updateUser = async (req, res) => {
    try {
        const pool = await getPool();
        const { id } = req.params;
        const {
            fullName,
            phoneNumber,
            dateOfBirth,
            gender,
            bio,
            facebookLink,
            instagramLink,
            favoriteSports,
            isActive,
            isEmailVerified,
            isPhoneVerified,
            roles
        } = req.body;

        // Check if user exists
        const checkUser = await pool.request()
            .input('userId', id)
            .query('SELECT UserID FROM Users WHERE UserID = @userId');

        if (checkUser.recordset.length === 0) {
            return errorResponse(res, 'Không tìm thấy user', 404);
        }

        // Update user info
        const updateQuery = `
            UPDATE Users
            SET 
                FullName = COALESCE(@fullName, FullName),
                PhoneNumber = COALESCE(@phoneNumber, PhoneNumber),
                DateOfBirth = COALESCE(@dateOfBirth, DateOfBirth),
                Gender = COALESCE(@gender, Gender),
                Bio = COALESCE(@bio, Bio),
                FacebookLink = COALESCE(@facebookLink, FacebookLink),
                InstagramLink = COALESCE(@instagramLink, InstagramLink),
                FavoriteSports = COALESCE(@favoriteSports, FavoriteSports),
                IsActive = COALESCE(@isActive, IsActive),
                IsEmailVerified = COALESCE(@isEmailVerified, IsEmailVerified),
                IsPhoneVerified = COALESCE(@isPhoneVerified, IsPhoneVerified)
            WHERE UserID = @userId
        `;

        const request = pool.request()
            .input('userId', id)
            .input('fullName', fullName || null)
            .input('phoneNumber', phoneNumber || null)
            .input('dateOfBirth', dateOfBirth || null)
            .input('gender', gender || null)
            .input('bio', bio || null)
            .input('facebookLink', facebookLink || null)
            .input('instagramLink', instagramLink || null)
            .input('favoriteSports', favoriteSports || null)
            .input('isActive', isActive !== undefined ? isActive : null)
            .input('isEmailVerified', isEmailVerified !== undefined ? isEmailVerified : null)
            .input('isPhoneVerified', isPhoneVerified !== undefined ? isPhoneVerified : null);

        await request.query(updateQuery);

        // Update roles if provided
        if (roles && Array.isArray(roles)) {
            // Delete existing roles
            await pool.request()
                .input('userId', id)
                .query('DELETE FROM UserRoles WHERE UserID = @userId');

            // Insert new roles
            for (const roleId of roles) {
                await pool.request()
                    .input('userId', id)
                    .input('roleId', roleId)
                    .query('INSERT INTO UserRoles (UserID, RoleID) VALUES (@userId, @roleId)');
            }
        }

        return successResponse(res, null, 'Cập nhật user thành công');

    } catch (error) {
        console.error('Update user error:', error);
        return errorResponse(res, 'Lỗi khi cập nhật user', 500);
    }
};

// Xóa user (soft delete)
exports.deleteUser = async (req, res) => {
    try {
        const pool = await getPool();
        const { id } = req.params;

        // Check if user exists
        const checkUser = await pool.request()
            .input('userId', id)
            .query('SELECT UserID FROM Users WHERE UserID = @userId');

        if (checkUser.recordset.length === 0) {
            return errorResponse(res, 'Không tìm thấy user', 404);
        }

        // Soft delete - set IsActive = 0
        await pool.request()
            .input('userId', id)
            .query('UPDATE Users SET IsActive = 0 WHERE UserID = @userId');

        return successResponse(res, null, 'Xóa user thành công');

    } catch (error) {
        console.error('Delete user error:', error);
        return errorResponse(res, 'Lỗi khi xóa user', 500);
    }
};

// Kích hoạt/Vô hiệu hóa user
exports.toggleUserStatus = async (req, res) => {
    try {
        const pool = await getPool();
        const { id } = req.params;
        const { isActive } = req.body;

        if (isActive === undefined) {
            return errorResponse(res, 'Vui lòng cung cấp trạng thái isActive', 400);
        }

        // Check if user exists
        const checkUser = await pool.request()
            .input('userId', id)
            .query('SELECT UserID, IsActive FROM Users WHERE UserID = @userId');

        if (checkUser.recordset.length === 0) {
            return errorResponse(res, 'Không tìm thấy user', 404);
        }

        // Update status
        await pool.request()
            .input('userId', id)
            .input('isActive', isActive)
            .query('UPDATE Users SET IsActive = @isActive WHERE UserID = @userId');

        const message = isActive ? 'Kích hoạt user thành công' : 'Vô hiệu hóa user thành công';
        return successResponse(res, null, message);

    } catch (error) {
        console.error('Toggle user status error:', error);
        return errorResponse(res, 'Lỗi khi cập nhật trạng thái user', 500);
    }
};

// Lấy thống kê users
exports.getUserStats = async (req, res) => {
    try {
        const pool = await getPool();

        const statsQuery = `
            SELECT 
                COUNT(*) as TotalUsers,
                SUM(CASE WHEN IsActive = 1 THEN 1 ELSE 0 END) as ActiveUsers,
                SUM(CASE WHEN IsActive = 0 THEN 1 ELSE 0 END) as InactiveUsers,
                SUM(CASE WHEN IsEmailVerified = 1 THEN 1 ELSE 0 END) as VerifiedUsers,
                SUM(CASE WHEN DATEDIFF(day, CreatedDate, GETDATE()) <= 30 THEN 1 ELSE 0 END) as NewUsersThisMonth
            FROM Users
        `;

        const result = await pool.request().query(statsQuery);

        // Get users by role
        const roleStatsQuery = `
            SELECT 
                r.RoleName,
                COUNT(DISTINCT ur.UserID) as UserCount
            FROM Roles r
            LEFT JOIN UserRoles ur ON r.RoleID = ur.RoleID
            GROUP BY r.RoleName
        `;

        const roleStatsResult = await pool.request().query(roleStatsQuery);

        return successResponse(res, {
            overview: result.recordset[0],
            byRole: roleStatsResult.recordset
        }, 'Lấy thống kê users thành công');

    } catch (error) {
        console.error('Get user stats error:', error);
        return errorResponse(res, 'Lỗi khi lấy thống kê users', 500);
    }
};
