import api from './api';

// Token + JSON: dùng chung axios instance `api` (interceptor 401 → logout + redirect có returnUrl)

// ==================== USER MANAGEMENT ====================
export const adminUserService = {
    getAllUsers: (params) => api.get('/admin/users', { params }),
    getRolesList: () => api.get('/admin/users/roles'),
    getUserById: (id) => api.get(`/admin/users/${id}`),
    updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
    deleteUser: (id) => api.delete(`/admin/users/${id}`),
    toggleUserStatus: (id, isActive) => api.put(`/admin/users/${id}/status`, { isActive }),
    getUserStats: () => api.get('/admin/users/stats')
};

// ==================== ORDER MANAGEMENT ====================
export const adminOrderService = {
    getAllOrders: (params) => api.get('/admin/orders', { params }),
    getOrderById: (id) => api.get(`/admin/orders/${id}`),
    updateOrderStatus: (id, statusName) => api.put(`/admin/orders/${id}/status`, { statusName }),
    cancelOrder: (id, reason) => api.put(`/admin/orders/${id}/cancel`, { reason }),
    getOrderStats: (params) => api.get('/admin/orders/stats', { params })
};

// ==================== BOOKING MANAGEMENT ====================
export const adminBookingService = {
    getAllBookings: (params) => api.get('/admin/bookings', { params }),
    getBookingById: (id) => api.get(`/admin/bookings/${id}`),
    updateBookingStatus: (id, statusName) => api.put(`/admin/bookings/${id}/status`, { statusName }),
    cancelBooking: (id, reason) => api.put(`/admin/bookings/${id}/cancel`, { reason }),
    getBookingStats: (params) => api.get('/admin/bookings/stats', { params })
};

// ==================== ADMIN PRODUCT (chi tiết + tạo/sửa qua /products) ====================
export const adminProductService = {
    getProductById: (id) => api.get(`/admin/products/${id}`),
    createProduct: (data) => api.post('/products', data),
    updateProduct: (id, data) => api.put(`/products/${id}`, data)
};

// ==================== CATEGORY & BRAND MANAGEMENT ====================
export const adminCategoryService = {
    createCategory: (data) => api.post('/admin/categories', data),
    updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data),
    deleteCategory: (id) => api.delete(`/admin/categories/${id}`),
    createSubCategory: (data) => api.post('/admin/categories/subcategories', data),
    updateSubCategory: (id, data) => api.put(`/admin/categories/subcategories/${id}`, data),
    deleteSubCategory: (id) => api.delete(`/admin/categories/subcategories/${id}`),

    getAllBrands: () => api.get('/admin/categories/brands'),
    createBrand: (data) => api.post('/admin/categories/brands', data),
    updateBrand: (id, data) => api.put(`/admin/categories/brands/${id}`, data),
    deleteBrand: (id) => api.delete(`/admin/categories/brands/${id}`)
};

// ==================== COURT MANAGEMENT ====================
export const adminCourtService = {
    getAllCourts: (params) => api.get('/admin/courts', { params }),
    createCourt: (data) => api.post('/admin/courts', data),
    updateCourt: (id, data) => api.put(`/admin/courts/${id}`, data),
    deleteCourt: (id) => api.delete(`/admin/courts/${id}`),
    createCourtType: (data) => api.post('/admin/courts/types', data),
    getCourtStats: () => api.get('/admin/courts/stats')
};

// ==================== VOUCHER MANAGEMENT ====================
export const adminVoucherService = {
    getAllVouchers: (params) => api.get('/admin/vouchers', { params }),
    createVoucher: (data) => api.post('/admin/vouchers', data),
    updateVoucher: (id, data) => api.put(`/admin/vouchers/${id}`, data),
    deleteVoucher: (id) => api.delete(`/admin/vouchers/${id}`),
    getVoucherStats: () => api.get('/admin/vouchers/stats')
};

// ==================== REVIEW MANAGEMENT ====================
export const adminReviewService = {
    getAllReviews: (params) => api.get('/admin/reviews', { params }),
    updateReviewStatus: (id, type, isApproved) =>
        api.put(`/admin/reviews/${id}/status`, { type, isApproved }),
    deleteReview: (id, type) => api.delete(`/admin/reviews/${id}`, { data: { type } }),
    getReviewStats: () => api.get('/admin/reviews/stats')
};

// ==================== DASHBOARD STATS ====================
export const adminDashboardService = {
    getDashboardStats: async () => {
        const [userStats, orderStats, bookingStats, courtStats, voucherStats, reviewStats] = await Promise.all([
            adminUserService.getUserStats(),
            adminOrderService.getOrderStats(),
            adminBookingService.getBookingStats(),
            adminCourtService.getCourtStats(),
            adminVoucherService.getVoucherStats(),
            adminReviewService.getReviewStats()
        ]);

        return {
            users: userStats.data.data,
            orders: orderStats.data.data,
            bookings: bookingStats.data.data,
            courts: courtStats.data.data,
            vouchers: voucherStats.data.data,
            reviews: reviewStats.data.data
        };
    }
};

export default {
    users: adminUserService,
    orders: adminOrderService,
    bookings: adminBookingService,
    products: adminProductService,
    categories: adminCategoryService,
    courts: adminCourtService,
    vouchers: adminVoucherService,
    reviews: adminReviewService,
    dashboard: adminDashboardService
};
