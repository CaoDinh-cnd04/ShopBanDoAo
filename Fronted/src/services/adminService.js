import api from './api';
import { DEFAULT_BANNER } from '../config/bannerDefaults';
import { uploadProductImages as uploadProductImagesFetch, uploadSingleImage } from './uploadService';

// ==================== UPLOAD (fetch — không dùng axios cho multipart) ====================
export const uploadImage = async (file) => {
    const res = await uploadSingleImage(file);
    const inner = res.data?.data;
    if (typeof inner === 'string') return inner;
    return inner?.url ?? inner?.path ?? inner?.filename ?? '';
};

// ==================== USER MANAGEMENT ====================
export const adminUserService = {
    getAllUsers: (params) => api.get('/admin/users', { params }),
    getRolesList: () => Promise.resolve({ data: { data: ['Admin', 'User'] } }),
    getUserById: (id) => api.get(`/admin/users/${id}`),
    updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
    deleteUser: (id) => api.delete(`/admin/users/${id}`),
    /** Xóa bản ghi user khỏi DB (không hoàn tác) — DELETE /api/admin/users/permanent/:id */
    permanentDeleteUser: (id) => api.delete(`/admin/users/permanent/${id}`),
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
    deleteOrder: (id) => api.delete(`/admin/orders/${id}`),
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
    /** Thương hiệu đang có trên sản phẩm (distinct) */
    getDistinctBrands: () => api.get('/products/meta/brands'),
    /** Admin: upload nhiều ảnh — field `files`, tối đa 20 file, ≤5MB/ảnh */
    uploadProductImages: (files) => uploadProductImagesFetch(files),
};

// ==================== CATEGORY & BRAND MANAGEMENT ====================
export const adminCategoryService = {
    // Categories
    createCategory: (data) => api.post('/categories', data),
    updateCategory: (id, data) => api.put(`/categories/${id}`, data),
    deleteCategory: (id) => api.delete(`/categories/${id}`),

    // Sub-categories — backend: POST/PUT/DELETE /api/categories/sub
    createSubCategory: (data) => api.post('/categories/sub', data),
    updateSubCategory: (subId, data) => api.put(`/categories/sub/${subId}`, data),
    deleteSubCategory: (subId, categoryId) =>
        api.delete(`/categories/sub/${subId}`, { params: categoryId ? { categoryId } : {} }),

    // Brands — backend: GET/POST/PUT/DELETE /api/brands
    getAllBrands: () => api.get('/brands'),
    createBrand: (data) => api.post('/brands', data),
    updateBrand: (id, data) => api.put(`/brands/${id}`, data),
    deleteBrand: (id) => api.delete(`/brands/${id}`),
};

// ==================== COURT MANAGEMENT ====================
export const adminCourtService = {
    getAllCourts: (params) => api.get('/courts', { params }),
    createCourt: (data) => api.post('/courts', data),
    updateCourt: (id, data) => api.put(`/courts/${id}`, data),
    deleteCourt: (id) => api.delete(`/courts/${id}`),
    createCourtType: (data) => api.post('/courts/types', data),
    updateCourtType: (id, data) => api.put(`/courts/types/${id}`, data),
    deleteCourtType: (id) => api.delete(`/courts/types/${id}`),
    getCourtStats: () => api.get('/admin/courts/stats'),
};

// ==================== BANNER (MongoDB qua API + cache localStorage) ====================
const BANNER_KEY = 'siteSettings:banner';

const dispatchBannerUpdated = (detail) => {
    try {
        window.dispatchEvent(new CustomEvent('site-banner-updated', { detail }));
    } catch {
        /* ignore */
    }
};

export const adminBannerService = {
    /** Đọc banner: API trước, fallback localStorage (bản cũ) */
    getBanner: async () => {
        try {
            const res = await api.get('/site-settings/banner');
            const data = res.data?.data;
            if (data && typeof data === 'object' && Object.keys(data).length > 0) {
                try {
                    localStorage.setItem(BANNER_KEY, JSON.stringify(data));
                } catch {
                    /* ignore */
                }
                return data;
            }
        } catch {
            /* offline hoặc API lỗi */
        }
        try {
            const raw = localStorage.getItem(BANNER_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    },
    saveBanner: async (data) => {
        await api.put('/site-settings/banner', data);
        try {
            localStorage.setItem(BANNER_KEY, JSON.stringify(data));
        } catch {
            /* ignore */
        }
        dispatchBannerUpdated(data);
        return { success: true };
    },
    resetBanner: async () => {
        await api.put('/site-settings/banner', DEFAULT_BANNER);
        try {
            localStorage.setItem(BANNER_KEY, JSON.stringify(DEFAULT_BANNER));
        } catch {
            /* ignore */
        }
        dispatchBannerUpdated(DEFAULT_BANNER);
        return { success: true };
    },
};

// ==================== VOUCHER MANAGEMENT ====================
// Map Vietnamese UI labels → backend enum values
const mapDiscountType = (t) => {
    if (!t) return 'percent';
    if (t === 'Phần trăm' || t === 'percent') return 'percent';
    if (t === 'Số tiền' || t === 'fixed') return 'fixed';
    return t;
};

const normalizeVoucherCreate = (data) => {
    const payload = {
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
    };
    if (data.voucherName?.trim()) payload.voucherName = data.voucherName.trim();
    if (data.description?.trim()) payload.description = data.description.trim();
    return payload;
};

const normalizeVoucherUpdate = (data) => {
    const payload = {};
    if (data.voucherName !== undefined) payload.voucherName = data.voucherName?.trim?.() ?? '';
    if (data.description !== undefined) payload.description = data.description?.trim?.() ?? '';
    if (data.discountType !== undefined) payload.discountType = mapDiscountType(data.discountType);
    if (data.discountValue !== undefined) payload.discountValue = Number(data.discountValue);
    const minVal = data.minOrderValue ?? data.minOrderAmount;
    if (minVal !== undefined) payload.minOrderValue = Number(minVal);
    if (data.maxDiscountAmount !== undefined && data.maxDiscountAmount !== '')
        payload.maxDiscountAmount = Number(data.maxDiscountAmount);
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
    /** GET /api/reviews/admin — tránh 404 với một số bản Nest/@Get() rỗng */
    getAllReviews: (params) => api.get('/reviews/admin', { params }),
    updateReviewStatus: (id, _type, isApproved) =>
        api.put(`/reviews/${id}/visibility`, { isVisible: isApproved }),
    deleteReview: (id) => api.delete(`/reviews/admin/${id}`),
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
    banner: adminBannerService,
};

