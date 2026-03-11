const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');

// Verify JWT token
const authenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Không có token xác thực' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verify user still exists and is active
        const users = await executeQuery(
            `SELECT UserID, Username, Email, IsActive FROM Users WHERE UserID = @userID`,
            { userID: decoded.userId }
        );

        if (!users || users.length === 0 || !users[0].IsActive) {
            return res.status(401).json({ 
                success: false, 
                message: 'Người dùng không hợp lệ' 
            });
        }

        req.user = {
            userId: decoded.userId,
            username: decoded.username,
            email: decoded.email
        };
        
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Token đã hết hạn' 
            });
        }
        return res.status(401).json({ 
            success: false, 
            message: 'Token không hợp lệ' 
        });
    }
};

// Check if user has specific role
const authorize = (...roles) => {
    return async (req, res, next) => {
        try {
            const userId = req.user.userId;
            
            const userRoles = await executeQuery(
                `SELECT r.RoleName 
                 FROM UserRoles ur
                 INNER JOIN Roles r ON ur.RoleID = r.RoleID
                 WHERE ur.UserID = @userId AND r.IsActive = 1`,
                { userId }
            );

            const userRoleNames = userRoles.map(ur => ur.RoleName);
            const hasRole = roles.some(role => userRoleNames.includes(role));

            if (!hasRole) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Không có quyền truy cập' 
                });
            }

            req.user.roles = userRoleNames;
            next();
        } catch (error) {
            return res.status(500).json({ 
                success: false, 
                message: 'Lỗi kiểm tra quyền' 
            });
        }
    };
};

module.exports = {
    authenticate,
    authorize
};
