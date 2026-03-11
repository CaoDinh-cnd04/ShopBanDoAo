import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
};

// ==================== USER MANAGEMENT ====================
export const adminUserService = {
    getAllUsers: (params) => axios.get(`${API_URL}/admin/users`, { ...getAuthHeaders(), params }),
    getUserById: (id) => axios.get(`${API_URL}/admin/users/${id}`, getAuthHeaders()),
    updateUser: (id, data) => axios.put(`${API_URL}/admin/users/${id}`, data, getAuthHeaders()),
    deleteUser: (id) => axios.delete(`${API_URL}/admin/users/${id}`, getAuthHeaders()),
    toggleUserStatus: (id, isActive) => axios.put(`${API_URL}/admin/users/${id}/status`, { isActive }, getAuthHeaders()),
    getUserStats: () => axios.get(`${API_URL}/admin/users/stats`, getAuthHeaders())
};

// ==================== ORDER MANAGEMENT ====================
export const adminOrderService = {
    getAllOrders: (params) => axios.get(`${API_URL}/admin/orders`, { ...getAuthHeaders(), params }),
    updateOrderStatus: (id, statusName) => axios.put(`${API_URL}/admin/orders/${id}/status`, { statusName }, getAuthHeaders()),
    cancelOrder: (id, reason) => axios.put(`${API_URL}/admin/orders/${id}/cancel`, { reason }, getAuthHeaders()),
    getOrderStats: (params) => axios.get(`${API_URL}/admin/orders/stats`, { ...getAuthHeaders(), params })
};

// ==================== BOOKING MANAGEMENT ====================
export const adminBookingService = {
    getAllBookings: (params) => axios.get(`${API_URL}/admin/bookings`, { ...getAuthHeaders(), params }),
    updateBookingStatus: (id, statusName) => axios.put(`${API_URL}/admin/bookings/${id}/status`, { statusName }, getAuthHeaders()),
    cancelBooking: (id, reason) => axios.put(`${API_URL}/admin/bookings/${id}/cancel`, { reason }, getAuthHeaders()),
    getBookingStats: (params) => axios.get(`${API_URL}/admin/bookings/stats`, { ...getAuthHeaders(), params })
};

// ==================== CATEGORY & BRAND MANAGEMENT ====================
export const adminCategoryService = {
    createCategory: (data) => axios.post(`${API_URL}/admin/categories`, data, getAuthHeaders()),
    updateCategory: (id, data) => axios.put(`${API_URL}/admin/categories/${id}`, data, getAuthHeaders()),
    deleteCategory: (id) => axios.delete(`${API_URL}/admin/categories/${id}`, getAuthHeaders()),
    createSubCategory: (data) => axios.post(`${API_URL}/admin/categories/subcategories`, data, getAuthHeaders()),

    getAllBrands: () => axios.get(`${API_URL}/admin/categories/brands`, getAuthHeaders()),
    createBrand: (data) => axios.post(`${API_URL}/admin/categories/brands`, data, getAuthHeaders()),
    updateBrand: (id, data) => axios.put(`${API_URL}/admin/categories/brands/${id}`, data, getAuthHeaders()),
    deleteBrand: (id) => axios.delete(`${API_URL}/admin/categories/brands/${id}`, getAuthHeaders())
};

// ==================== COURT MANAGEMENT ====================
export const adminCourtService = {
    getAllCourts: (params) => axios.get(`${API_URL}/admin/courts`, { ...getAuthHeaders(), params }),
    createCourt: (data) => axios.post(`${API_URL}/admin/courts`, data, getAuthHeaders()),
    updateCourt: (id, data) => axios.put(`${API_URL}/admin/courts/${id}`, data, getAuthHeaders()),
    deleteCourt: (id) => axios.delete(`${API_URL}/admin/courts/${id}`, getAuthHeaders()),
    createCourtType: (data) => axios.post(`${API_URL}/admin/courts/types`, data, getAuthHeaders()),
    getCourtStats: () => axios.get(`${API_URL}/admin/courts/stats`, getAuthHeaders())
};

// ==================== VOUCHER MANAGEMENT ====================
export const adminVoucherService = {
    getAllVouchers: (params) => axios.get(`${API_URL}/admin/vouchers`, { ...getAuthHeaders(), params }),
    createVoucher: (data) => axios.post(`${API_URL}/admin/vouchers`, data, getAuthHeaders()),
    updateVoucher: (id, data) => axios.put(`${API_URL}/admin/vouchers/${id}`, data, getAuthHeaders()),
    deleteVoucher: (id) => axios.delete(`${API_URL}/admin/vouchers/${id}`, getAuthHeaders()),
    getVoucherStats: () => axios.get(`${API_URL}/admin/vouchers/stats`, getAuthHeaders())
};

// ==================== REVIEW MANAGEMENT ====================
export const adminReviewService = {
    getAllReviews: (params) => axios.get(`${API_URL}/admin/reviews`, { ...getAuthHeaders(), params }),
    updateReviewStatus: (id, type, isApproved) => axios.put(`${API_URL}/admin/reviews/${id}/status`, { type, isApproved }, getAuthHeaders()),
    deleteReview: (id, type) => axios.delete(`${API_URL}/admin/reviews/${id}`, { ...getAuthHeaders(), data: { type } }),
    getReviewStats: () => axios.get(`${API_URL}/admin/reviews/stats`, getAuthHeaders())
};

// ==================== DASHBOARD STATS ====================
export const adminDashboardService = {
    getDashboardStats: async () => {
        try {
            const [userStats, orderStats, bookingStats] = await Promise.all([
                adminUserService.getUserStats(),
                adminOrderService.getOrderStats(),
                adminBookingService.getBookingStats()
            ]);

            return {
                users: userStats.data.data,
                orders: orderStats.data.data,
                bookings: bookingStats.data.data
            };
        } catch (error) {
            throw error;
        }
    }
};

export default {
    users: adminUserService,
    orders: adminOrderService,
    bookings: adminBookingService,
    categories: adminCategoryService,
    courts: adminCourtService,
    vouchers: adminVoucherService,
    reviews: adminReviewService,
    dashboard: adminDashboardService
};
