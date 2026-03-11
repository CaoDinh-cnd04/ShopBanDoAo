const { getFirestore } = require('../config/firebase');

/**
 * Firestore Service
 * Handles all Firestore operations
 */

// Collections
const COLLECTIONS = {
    NOTIFICATIONS: 'notifications',
    LOGS: 'logs',
    USER_ACTIVITY: 'user_activity',
    REAL_TIME_DATA: 'realtime_data'
};

/**
 * Save notification to Firestore
 */
const saveNotification = async (userId, notification) => {
    try {
        const firestore = getFirestore();
        if (!firestore) {
            console.warn('Firestore not available, skipping notification save');
            return null;
        }

        const notificationData = {
            userId: userId.toString(),
            title: notification.title,
            content: notification.content,
            type: notification.type || 'general',
            referenceId: notification.referenceId || null,
            isRead: false,
            createdAt: new Date(),
            readAt: null
        };

        const docRef = await firestore
            .collection(COLLECTIONS.NOTIFICATIONS)
            .add(notificationData);

        return docRef.id;
    } catch (error) {
        console.error('Error saving notification to Firestore:', error);
        return null;
    }
};

/**
 * Get user notifications from Firestore
 */
const getUserNotifications = async (userId, limit = 20) => {
    try {
        const firestore = getFirestore();
        if (!firestore) return [];

        const snapshot = await firestore
            .collection(COLLECTIONS.NOTIFICATIONS)
            .where('userId', '==', userId.toString())
            .orderBy('createdAt', 'desc')
            .limit(limit)
            .get();

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting notifications from Firestore:', error);
        return [];
    }
};

/**
 * Mark notification as read in Firestore
 */
const markNotificationAsRead = async (notificationId) => {
    try {
        const firestore = getFirestore();
        if (!firestore) return false;

        await firestore
            .collection(COLLECTIONS.NOTIFICATIONS)
            .doc(notificationId)
            .update({
                isRead: true,
                readAt: new Date()
            });

        return true;
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return false;
    }
};

/**
 * Save activity log to Firestore
 */
const saveActivityLog = async (activity) => {
    try {
        const firestore = getFirestore();
        if (!firestore) return null;

        const logData = {
            userId: activity.userId ? activity.userId.toString() : null,
            action: activity.action,
            resource: activity.resource || null,
            resourceId: activity.resourceId || null,
            ipAddress: activity.ipAddress || null,
            userAgent: activity.userAgent || null,
            metadata: activity.metadata || {},
            timestamp: new Date()
        };

        const docRef = await firestore
            .collection(COLLECTIONS.LOGS)
            .add(logData);

        return docRef.id;
    } catch (error) {
        console.error('Error saving activity log to Firestore:', error);
        return null;
    }
};

/**
 * Save real-time data to Firestore
 */
const saveRealtimeData = async (collection, documentId, data) => {
    try {
        const firestore = getFirestore();
        if (!firestore) return false;

        await firestore
            .collection(collection)
            .doc(documentId)
            .set({
                ...data,
                updatedAt: new Date()
            }, { merge: true });

        return true;
    } catch (error) {
        console.error('Error saving realtime data to Firestore:', error);
        return false;
    }
};

/**
 * Get real-time data from Firestore
 */
const getRealtimeData = async (collection, documentId) => {
    try {
        const firestore = getFirestore();
        if (!firestore) return null;

        const doc = await firestore
            .collection(collection)
            .doc(documentId)
            .get();

        if (!doc.exists) return null;

        return {
            id: doc.id,
            ...doc.data()
        };
    } catch (error) {
        console.error('Error getting realtime data from Firestore:', error);
        return null;
    }
};

/**
 * Listen to real-time updates
 */
const listenToRealtimeData = (collection, documentId, callback) => {
    try {
        const firestore = getFirestore();
        if (!firestore) return null;

        return firestore
            .collection(collection)
            .doc(documentId)
            .onSnapshot((doc) => {
                if (doc.exists) {
                    callback({
                        id: doc.id,
                        ...doc.data()
                    });
                } else {
                    callback(null);
                }
            });
    } catch (error) {
        console.error('Error listening to realtime data:', error);
        return null;
    }
};

/**
 * Delete document from Firestore
 */
const deleteDocument = async (collection, documentId) => {
    try {
        const firestore = getFirestore();
        if (!firestore) return false;

        await firestore
            .collection(collection)
            .doc(documentId)
            .delete();

        return true;
    } catch (error) {
        console.error('Error deleting document from Firestore:', error);
        return false;
    }
};

module.exports = {
    saveNotification,
    getUserNotifications,
    markNotificationAsRead,
    saveActivityLog,
    saveRealtimeData,
    getRealtimeData,
    listenToRealtimeData,
    deleteDocument,
    COLLECTIONS
};
