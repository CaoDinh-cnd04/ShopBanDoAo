const jwt = require('jsonwebtoken');
const { getDb, ObjectId } = require('../config/database.mongodb');

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
        const db = getDb();

        const user = await db.collection('users').findOne({
            _id: new ObjectId(decoded.userId),
            isActive: true
        }, { projection: { _id: 1, username: 1, email: 1, isActive: 1 } });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Người dùng không hợp lệ'
            });
        }

        req.user = {
            userId: user._id.toString(),
            username: user.username,
            email: user.email
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

const authorize = (...roles) => {
    return async (req, res, next) => {
        try {
            const userId = req.user.userId;
            const db = getDb();

            const userRoles = await db.collection('userRoles').aggregate([
                { $match: { userId: new ObjectId(userId) } },
                { $lookup: { from: 'roles', localField: 'roleId', foreignField: '_id', as: 'role' } },
                { $unwind: '$role' },
                { $match: { 'role.isActive': true } },
                { $project: { roleName: '$role.roleName' } }
            ]).toArray();

            const userRoleNames = userRoles.map(ur => ur.roleName);
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
