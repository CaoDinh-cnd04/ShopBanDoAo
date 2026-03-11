const { executeQuery } = require('../config/database');
const { successResponse, errorResponse, paginationResponse } = require('../utils/responseFormatter');
const { HTTP_STATUS, MESSAGES } = require('../utils/constants');
const { saveNotification, getUserNotifications: getFirestoreNotifications, markNotificationAsRead: markFirestoreNotificationAsRead } = require('../services/firestoreService');

// Get user notifications (from both SQL and Firestore)
const getNotifications = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { page = 1, limit = 20, isRead, source = 'all' } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let sqlNotifications = [];
        let firestoreNotifications = [];

        // Get from SQL Server
        if (source === 'all' || source === 'sql') {
            let whereClause = 'WHERE n.UserID = @userId';
            const params = { userId, offset, limit: parseInt(limit) };

            if (isRead !== undefined) {
                whereClause += ' AND n.IsRead = @isRead';
                params.isRead = isRead === 'true' ? 1 : 0;
            }

            sqlNotifications = await executeQuery(
                `SELECT 
                    n.NotificationID,
                    n.Title,
                    n.Content,
                    n.NotificationType,
                    n.ReferenceID,
                    n.IsRead,
                    n.CreatedDate
                 FROM Notifications n
                 ${whereClause}
                 ORDER BY n.CreatedDate DESC
                 OFFSET @offset ROWS
                 FETCH NEXT @limit ROWS ONLY`,
                params
            );
        }

        // Get from Firestore
        if (source === 'all' || source === 'firestore') {
            firestoreNotifications = await getFirestoreNotifications(userId, parseInt(limit));
            
            // Filter by isRead if specified
            if (isRead !== undefined) {
                const readFilter = isRead === 'true';
                firestoreNotifications = firestoreNotifications.filter(n => n.isRead === readFilter);
            }
        }

        // Combine and sort
        const allNotifications = [
            ...sqlNotifications.map(n => ({ ...n, source: 'sql' })),
            ...firestoreNotifications.map(n => ({ ...n, source: 'firestore' }))
        ].sort((a, b) => {
            const dateA = a.CreatedDate || a.createdAt?.toDate() || new Date(0);
            const dateB = b.CreatedDate || b.createdAt?.toDate() || new Date(0);
            return dateB - dateA;
        });

        // Get total count
        let total = allNotifications.length;
        if (source === 'sql') {
            const countResult = await executeQuery(
                `SELECT COUNT(*) as Total FROM Notifications n WHERE n.UserID = @userId${isRead !== undefined ? ' AND n.IsRead = @isRead' : ''}`,
                { userId, isRead: isRead === 'true' ? 1 : 0 }
            );
            total = countResult[0].Total;
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
};

// Mark notification as read
const markAsRead = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const { source = 'sql' } = req.query;

        if (source === 'firestore') {
            // Mark in Firestore
            const success = await markFirestoreNotificationAsRead(id);
            if (!success) {
                return errorResponse(res, 'Không tìm thấy thông báo', HTTP_STATUS.NOT_FOUND);
            }
        } else {
            // Mark in SQL
            await executeQuery(
                `UPDATE Notifications 
                 SET IsRead = 1 
                 WHERE NotificationID = @id AND UserID = @userId`,
                { id: parseInt(id), userId }
            );
        }

        return successResponse(res, null, 'Đã đánh dấu đã đọc');
    } catch (error) {
        next(error);
    }
};

// Mark all as read
const markAllAsRead = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        await executeQuery(
            `UPDATE Notifications 
             SET IsRead = 1 
             WHERE UserID = @userId AND IsRead = 0`,
            { userId }
        );

        return successResponse(res, null, 'Đã đánh dấu tất cả là đã đọc');
    } catch (error) {
        next(error);
    }
};

// Get unread count
const getUnreadCount = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        const result = await executeQuery(
            `SELECT COUNT(*) as Count 
             FROM Notifications 
             WHERE UserID = @userId AND IsRead = 0`,
            { userId }
        );

        return successResponse(res, { count: result[0].Count });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount
};
