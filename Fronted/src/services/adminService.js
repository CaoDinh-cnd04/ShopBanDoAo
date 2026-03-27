import api from './api';

// ==================== USER MANAGEMENT ====================
export const adminUserService = {
    getAllUsers: (params) => api.get('/admin/users', { params }),
    getRolesList: () => Promise.resolve({ data: { data: ['Admin', 'User'] } }),
    getUserById: (id) => api.get(`/admin/users/${id}`),
    updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
    deleteUser: (id) => api.delete(`/admin/users/${id}`),
    toggleUserStatus: (id, isActive) => api.put(`/admin/users/${id}`, { isActive }),
    getUserStats: () => api.get('/admin/users/stats'),
};

// ==================== ORDER MANAGEMENT ====================
export const adminOrderService = {
    getAllOrders: (params) => api.get('/admin/orders', { params }),
    getOrderById: (id) => api.get(`/admin/orders/${id}`),
    // Gửi { orderStatus } để khớp với backend UpdateOrderStatusDto
    updateOrderStatus: (id, statusName) =>
        api.put(`/admin/orders/${id}/status`, { orderStatus: statusName }),
    cancelOrder: (id, _reason) =>
        api.put(`/admin/orders/${id}/status`, { orderStatus: 'Cancelled' }),
    getOrderStats: (params) => api.get('/admin/orders/stats', { params }),
};

// ==================== BOOKING MANAGEMENT ====================
export const adminBookingService = {
    getAllBookings: (params) => api.get('/admin/bookings', { params }),
    getBookingById: (id) => api.get(`/admin/bookings/${id}`),
    updateBookingStatus: (id, statusName) =>
        api.put(`/admin/bookings/${id}/status`, { bookingStatus: statusName }),
    cancelBooking: (id, _reason) =>
        api.put(`/admin/bookings/${id}/status`, { bookingStatus: 'Cancelled' }),
    getBookingStats: (params) => api.get('/admin/bookings/stats', { params }),
};

// ==================== PRODUCT MANAGEMENT ====================
export const adminProductService = {
    getProductById: (id) => api.get(`/products/${id}`),
    createProduct: (data) => api.post('/products', data),
    updateProduct: (id, data) => api.put(`/products/${id}`, data),
};

// ==================== CATEGORY & BRAND MANAGEMENT ====================
export const adminCategoryService = {
    createCategory: (data) => api.post('/categories', data),
    updateCategory: (id, data) => api.put(`/categories/${id}`, data),
    deleteCategory: (id) => api.delete(`/categories/${id}`),

    // Sub-categories: fallback no-op (not implemented yet)
    createSubCategory: () => Promise.resolve({ data: { data: null } }),
    updateSubCategory: () => Promise.resolve({ data: { data: null } }),
    deleteSubCategory: () => Promise.resolve({ data: { data: null } }),

    // Brands: trả về mảng rỗng (chưa có backend)
    getAllBrands: () => Promise.resolve({ data: { data: [] } }),
    createBrand: () => Promise.resolve({ data: { data: null } }),
    updateBrand: () => Promise.resolve({ data: { data: null } }),
    deleteBrand: () => Promise.resolve({ data: { data: null } }),
};

// ==================== COURT MANAGEMENT ====================
export const adminCourtService = {
    getAllCourts: (params) => api.get('/courts', { params }),
    createCourt: (data) => api.post('/courts', data),
    updateCourt: (id, data) => api.put(`/courts/${id}`, data),
    deleteCourt: (id) => api.delete(`/courts/${id}`),
    createCourtType: () => Promise.resolve({ data: { data: null } }),
    getCourtStats: () => api.get('/admin/courts/stats'),
};

// ==================== VOUCHER MANAGEMENT ====================
// Map Vietnamese UI labels → backend enum values
const mapDiscountType = (t) => {
    if (!t) return 'percent';
    if (t === 'Phần trăm' || t === 'percent') return 'percent';
    if (t === 'Số tiền' || t === 'fixed') return 'fixed';
    return t;
};

const normalizeVoucherCreate = (data) => ({
    code: (data.code || data.voucherCode || '').trim().toUpperCase(),
    discountType: mapDiscountType(data.discountType),
    discountValue: Number(data.discountValue),
    minOrderValue:
        data.minOrderValue !== undefined
            ? Number(data.minOrderValue)
            : data.minOrderAmount !== undefined
            ? Number(data.minOrderAmount)
            : 0,
    ...(data.maxDiscountAmount ? { maxDiscountAmount: Number(data.maxDiscountAmount) } : {}),
    startDate: data.startDate,
    endDate: data.endDate,
    usageLimit: Number(data.usageLimit ?? 999),
});

const normalizeVoucherUpdate = (data) => {
    const payload = {};
    if (data.discountType !== undefined) payload.discountType = mapDiscountType(data.discountType);
    if (data.discountValue !== undefined) payload.discountValue = Number(data.discountValue);
    const minVal = data.minOrderValue ?? data.minOrderAmount;
    if (minVal !== undefined) payload.minOrderValue = Number(minVal);
    if (data.maxDiscountAmount) payload.maxDiscountAmount = Number(data.maxDiscountAmount);
    if (data.startDate) payload.startDate = data.startDate;
    if (data.endDate) payload.endDate = data.endDate;
    if (data.usageLimit !== undefined) payload.usageLimit = Number(data.usageLimit);
    if (data.isActive !== undefined) payload.isActive = data.isActive;
    return payload;
};

export const adminVoucherService = {
    getAllVouchers: (params) => api.get('/vouchers', { params }),
    createVoucher: (data) => api.post('/vouchers', normalizeVoucherCreate(data)),
    updateVoucher: (id, data) => api.put(`/vouchers/${id}`, normalizeVoucherUpdate(data)),
    deleteVoucher: (id) => api.delete(`/vouchers/${id}`),
    getVoucherStats: () => api.get('/admin/vouchers/stats'),
};

// ==================== REVIEW MANAGEMENT ====================
export const adminReviewService = {
    getAllReviews: (params) => api.get('/reviews', { params }),
    updateReviewStatus: (id, _type, isApproved) =>
        api.put(`/reviews/${id}/visibility`, { isVisible: isApproved }),
    deleteReview: (id, _type) => api.delete(`/reviews/admin/${id}`),
    getReviewStats: () => api.get('/admin/reviews/stats'),
};

// ==================== DASHBOARD STATS ====================
export const adminDashboardService = {
    getDashboardStats: async () => {
        const [userStats, orderStats, bookingStats, courtStats, voucherStats, reviewStats] =
            await Promise.all([
                adminUserService.getUserStats(),
                adminOrderService.getOrderStats(),
                adminBookingService.getBookingStats(),
                adminCourtService.getCourtStats(),
                adminVoucherService.getVoucherStats(),
                adminReviewService.getReviewStats(),
            ]);

        return {
            users: userStats.data?.data ?? userStats.data,
            orders: orderStats.data?.data ?? orderStats.data,
            bookings: bookingStats.data?.data ?? bookingStats.data,
            courts: courtStats.data?.data ?? courtStats.data,
            vouchers: voucherStats.data?.data ?? voucherStats.data,
            reviews: reviewStats.data?.data ?? reviewStats.data,
        };
    },
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
    dashboard: adminDashboardService,
};
