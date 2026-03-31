import axios from 'axios';

import { getApiBaseUrl } from '../config/apiBase';

const API_URL = getApiBaseUrl();

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
};

export const notificationService = {
    // Get all notifications
    getNotifications: (params) =>
        axios.get(`${API_URL}/notifications`, { ...getAuthHeaders(), params }),

    // Get unread count
    getUnreadCount: () =>
        axios.get(`${API_URL}/notifications/unread-count`, getAuthHeaders()),

    // Mark as read
    markAsRead: (notificationId) =>
        axios.put(`${API_URL}/notifications/${notificationId}/read`, {}, getAuthHeaders()),

    // Mark all as read
    markAllAsRead: () =>
        axios.put(`${API_URL}/notifications/mark-all-read`, {}, getAuthHeaders()),

    // Delete notification
    deleteNotification: (notificationId) =>
        axios.delete(`${API_URL}/notifications/${notificationId}`, getAuthHeaders())
};

export default notificationService;
