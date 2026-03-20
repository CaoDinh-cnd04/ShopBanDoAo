const BaseController = require('../base/BaseController');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');

class AdminUserController extends BaseController {
    async getAllUsers(req, res, next) {
        try {
            const db = this.getDb();
            const { page = 1, limit = 20, search = '', role = '', isActive = '', sortBy = 'createdDate', sortOrder = 'DESC' } = req.query;
            const skip = (parseInt(page) - 1) * parseInt(limit);
            const match = {};
            if (search) {
                match.$or = [
                    { username: new RegExp(search, 'i') },
                    { email: new RegExp(search, 'i') },
                    { fullName: new RegExp(search, 'i') }
                ];
            }
            if (isActive !== '') match.isActive = isActive === 'true';

            let pipeline = [
                { $lookup: { from: 'userRoles', localField: '_id', foreignField: 'userId', as: 'ur' } },
                { $lookup: { from: 'roles', localField: 'ur.roleId', foreignField: '_id', as: 'roles' } },
                { $addFields: { roleNames: { $map: { input: '$roles', as: 'r', in: '$$r.roleName' } } } }
            ];
            if (Object.keys(match).length) pipeline.unshift({ $match: match });
            if (role) pipeline.push({ $match: { roleNames: role } });

            const countPipeline = [...pipeline, { $count: 'total' }];
            const countResult = await db.collection('users').aggregate(countPipeline).toArray();
            const totalUsers = countResult[0]?.total || 0;

            const sortOpt = { [sortBy]: sortOrder === 'ASC' ? 1 : -1 };
            const users = await db.collection('users').aggregate([
                ...pipeline,
                { $sort: sortOpt },
                { $skip: skip },
                { $limit: parseInt(limit) },
                { $project: { passwordHash: 0, roles: 0, ur: 0 } },
                { $addFields: { roles: { $reduce: { input: '$roleNames', initialValue: '', in: { $cond: [{ $eq: ['$$value', ''] }, '$$this', { $concat: ['$$value', ', ', '$$this'] }] } } } } }
            ]).toArray();

            const data = users.map(u => ({ ...u, userId: u._id.toString() }));
            return successResponse(res, { users: data, pagination: { currentPage: parseInt(page), totalPages: Math.ceil(totalUsers / limit), totalUsers, limit: parseInt(limit) } }, 'Lấy danh sách users thành công');
        } catch (error) {
            return errorResponse(res, 'Lỗi khi lấy danh sách users', 500);
        }
    }

    async getRolesList(req, res, next) {
        try {
            const db = this.getDb();
            const roles = await db.collection('roles').find({}).sort({ roleName: 1 }).toArray();
            const data = roles.map((r) => ({ roleId: r._id.toString(), roleName: r.roleName, description: r.description }));
            return successResponse(res, data, 'Lấy danh sách roles thành công');
        } catch (error) {
            return errorResponse(res, 'Lỗi khi lấy roles', 500);
        }
    }

    async getUserById(req, res, next) {
        try {
            const db = this.getDb();
            const { id } = req.params;
            const user = await db.collection('users').findOne({ _id: new this.ObjectId(id) }, { projection: { passwordHash: 0 } });
            if (!user) return errorResponse(res, 'Không tìm thấy user', 404);

            const userRoles = await db.collection('userRoles').aggregate([
                { $match: { userId: user._id } },
                { $lookup: { from: 'roles', localField: 'roleId', foreignField: '_id', as: 'r' } },
                { $unwind: '$r' },
                { $project: { roleId: '$r._id', roleName: '$r.roleName', description: '$r.description' } }
            ]).toArray();
            const addresses = await db.collection('userAddresses').find({ userId: user._id }).sort({ isDefault: -1, createdDate: -1 }).toArray();

            const [totalOrders, totalBookings, totalReviews, totalWishlist] = await Promise.all([
                db.collection('orders').countDocuments({ userId: user._id }),
                db.collection('bookings').countDocuments({ userId: user._id }),
                db.collection('productReviews').countDocuments({ userId: user._id }),
                db.collection('wishlists').findOne({ userId: user._id }).then(w => w ? db.collection('wishlistItems').countDocuments({ wishlistId: w._id }) : 0)
            ]);

            const result = { ...user, userId: user._id.toString(), Roles: userRoles, Addresses: addresses.map(a => ({ ...a, addressId: a._id.toString() })), Statistics: { totalOrders, totalBookings, totalReviews, totalWishlistItems: totalWishlist } };
            return successResponse(res, result, 'Lấy thông tin user thành công');
        } catch (error) {
            return errorResponse(res, 'Lỗi khi lấy thông tin user', 500);
        }
    }

    async updateUser(req, res, next) {
        try {
            const db = this.getDb();
            const { id } = req.params;
            const { fullName, phoneNumber, dateOfBirth, gender, bio, facebookLink, instagramLink, favoriteSports, isActive, isEmailVerified, isPhoneVerified, roles } = req.body;

            const user = await db.collection('users').findOne({ _id: new this.ObjectId(id) });
            if (!user) return errorResponse(res, 'Không tìm thấy user', 404);

            const update = {};
            if (fullName !== undefined) update.fullName = fullName;
            if (phoneNumber !== undefined) update.phoneNumber = phoneNumber;
            if (dateOfBirth !== undefined) update.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
            if (gender !== undefined) update.gender = gender;
            if (bio !== undefined) update.bio = bio;
            if (facebookLink !== undefined) update.facebookLink = facebookLink;
            if (instagramLink !== undefined) update.instagramLink = instagramLink;
            if (favoriteSports !== undefined) update.favoriteSports = favoriteSports;
            if (isActive !== undefined) update.isActive = isActive;
            if (isEmailVerified !== undefined) update.isEmailVerified = isEmailVerified;
            if (isPhoneVerified !== undefined) update.isPhoneVerified = isPhoneVerified;

            if (Object.keys(update).length) await db.collection('users').updateOne({ _id: user._id }, { $set: update });

            if (roles && Array.isArray(roles)) {
                await db.collection('userRoles').deleteMany({ userId: user._id });
                for (const roleId of roles) {
                    await db.collection('userRoles').insertOne({ userId: user._id, roleId: new this.ObjectId(roleId), assignedDate: new Date() });
                }
            }
            return successResponse(res, null, 'Cập nhật user thành công');
        } catch (error) {
            return errorResponse(res, 'Lỗi khi cập nhật user', 500);
        }
    }

    async deleteUser(req, res, next) {
        try {
            const db = this.getDb();
            const { id } = req.params;
            const result = await db.collection('users').updateOne({ _id: new this.ObjectId(id) }, { $set: { isActive: false } });
            if (result.matchedCount === 0) return errorResponse(res, 'Không tìm thấy user', 404);
            return successResponse(res, null, 'Xóa user thành công');
        } catch (error) {
            return errorResponse(res, 'Lỗi khi xóa user', 500);
        }
    }

    async toggleUserStatus(req, res, next) {
        try {
            const db = this.getDb();
            const { id } = req.params;
            const { isActive } = req.body;
            if (isActive === undefined) return errorResponse(res, 'Vui lòng cung cấp trạng thái isActive', 400);
            const result = await db.collection('users').updateOne({ _id: new this.ObjectId(id) }, { $set: { isActive } });
            if (result.matchedCount === 0) return errorResponse(res, 'Không tìm thấy user', 404);
            return successResponse(res, null, isActive ? 'Kích hoạt user thành công' : 'Vô hiệu hóa user thành công');
        } catch (error) {
            return errorResponse(res, 'Lỗi khi cập nhật trạng thái user', 500);
        }
    }

    async getUserStats(req, res, next) {
        try {
            const db = this.getDb();
            const total = await db.collection('users').countDocuments();
            const active = await db.collection('users').countDocuments({ isActive: true });
            const verified = await db.collection('users').countDocuments({ isEmailVerified: true });
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            const newThisMonth = await db.collection('users').countDocuments({ createdDate: { $gte: monthAgo } });

            const byRole = await db.collection('userRoles').aggregate([
                { $lookup: { from: 'roles', localField: 'roleId', foreignField: '_id', as: 'r' } },
                { $unwind: '$r' },
                { $group: { _id: '$r.roleName', userCount: { $sum: 1 } } },
                { $project: { roleName: '$_id', userCount: 1, _id: 0 } }
            ]).toArray();

            return successResponse(res, { overview: { totalUsers: total, activeUsers: active, inactiveUsers: total - active, verifiedUsers: verified, newUsersThisMonth: newThisMonth }, byRole }, 'Lấy thống kê users thành công');
        } catch (error) {
            return errorResponse(res, 'Lỗi khi lấy thống kê users', 500);
        }
    }
}

module.exports = new AdminUserController();
