const BaseController = require('../base/BaseController');
const { successResponse, errorResponse, paginationResponse } = require('../../utils/responseFormatter');
const { HTTP_STATUS } = require('../../utils/constants');
const { getUserNotifications: getFirestoreNotifications, markNotificationAsRead: markFirestoreNotificationAsRead } = require('../../services/firestoreService');

class NotificationController extends BaseController {
    async getNotifications(req, res, next) {
        try {
            const userId = req.user.userId;
            const { page = 1, limit = 20, isRead, source = 'all' } = req.query;
            const db = this.getDb();

            let mongoNotifications = [];
            let firestoreNotifications = [];

            if (source === 'all' || source === 'sql' || source === 'mongo') {
                const match = { userId: new this.ObjectId(userId) };
                if (isRead !== undefined) match.isRead = isRead === 'true';

                mongoNotifications = await db.collection('notifications').find(match)
                    .sort({ createdDate: -1 })
                    .skip((parseInt(page) - 1) * parseInt(limit))
                    .limit(parseInt(limit))
                    .toArray();
            }

            if (source === 'all' || source === 'firestore') {
                firestoreNotifications = await getFirestoreNotifications(userId, parseInt(limit));
                if (isRead !== undefined) {
                    const readFilter = isRead === 'true';
                    firestoreNotifications = firestoreNotifications.filter(n => n.isRead === readFilter);
                }
            }

            const allNotifications = [
                ...mongoNotifications.map(n => ({ ...n, notificationId: n._id.toString(), source: source === 'all' ? 'mongo' : 'mongo' })),
                ...firestoreNotifications.map(n => ({ ...n, source: 'firestore' }))
            ].sort((a, b) => {
                const dateA = a.createdDate || a.createdAt?.toDate?.() || new Date(0);
                const dateB = b.createdDate || b.createdAt?.toDate?.() || new Date(0);
                return new Date(dateB) - new Date(dateA);
            });

            let total = allNotifications.length;
            if (source === 'mongo' || source === 'sql') {
                const match = { userId: new this.ObjectId(userId) };
                if (isRead !== undefined) match.isRead = isRead === 'true';
                total = await db.collection('notifications').countDocuments(match);
            }

            return paginationResponse(res, allNotifications.slice(0, parseInt(limit)), {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            });
        } catch (error) {
            next(error);
        }
    }

    async markAsRead(req, res, next) {
        try {
            const userId = req.user.userId;
            const { id } = req.params;
            const { source = 'mongo' } = req.query;
            const db = this.getDb();

            if (source === 'firestore') {
                const success = await markFirestoreNotificationAsRead(id);
                if (!success) {
                    return errorResponse(res, 'Không tìm thấy thông báo', HTTP_STATUS.NOT_FOUND);
                }
            } else {
                const result = await db.collection('notifications').updateOne(
                    { _id: new this.ObjectId(id), userId: new this.ObjectId(userId) },
                    { $set: { isRead: true } }
                );
                if (result.matchedCount === 0) {
                    return errorResponse(res, 'Không tìm thấy thông báo', HTTP_STATUS.NOT_FOUND);
                }
            }

            return successResponse(res, null, 'Đã đánh dấu đã đọc');
        } catch (error) {
            next(error);
        }
    }

    async markAllAsRead(req, res, next) {
        try {
            const userId = req.user.userId;
            const db = this.getDb();

            await db.collection('notifications').updateMany(
                { userId: new this.ObjectId(userId), isRead: false },
                { $set: { isRead: true } }
            );

            return successResponse(res, null, 'Đã đánh dấu tất cả là đã đọc');
        } catch (error) {
            next(error);
        }
    }

    async getUnreadCount(req, res, next) {
        try {
            const userId = req.user.userId;
            const db = this.getDb();

            const count = await db.collection('notifications').countDocuments({
                userId: new this.ObjectId(userId),
                isRead: false
            });

            return successResponse(res, { count });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new NotificationController();
