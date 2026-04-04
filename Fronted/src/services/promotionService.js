import api from './api';

const unwrap = (res) => {
  const d = res.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data;
  if (d && typeof d === 'object' && !Array.isArray(d)) return d.data ?? d;
  return d;
};

const promotionService = {
  /** Lấy tất cả chương trình đang active (công khai) */
  getActive: async () => {
    try {
      const res = await api.get('/promotions/active');
      return unwrap(res) ?? [];
    } catch { return []; }
  },

  /** Active theo danh mục cụ thể */
  getActiveForCategory: async (categoryId) => {
    try {
      const res = await api.get(`/promotions/active/category/${categoryId}`);
      return unwrap(res) ?? [];
    } catch { return []; }
  },

  // ── Admin ──
  getAll:  () => api.get('/promotions'),
  create:  (data) => api.post('/promotions', data),
  update:  (id, data) => api.put(`/promotions/${id}`, data),
  remove:  (id) => api.delete(`/promotions/${id}`),
};

export default promotionService;

/** Helper: tìm discount% cao nhất cho một categoryId từ mảng promotions */
export const getDiscountForCategory = (promotions, categoryId) => {
  if (!Array.isArray(promotions) || !categoryId) return 0;
  const catStr = String(categoryId);
  let best = 0;
  for (const p of promotions) {
    if (p.targetType === 'all') {
      best = Math.max(best, p.discountPercent ?? 0);
    } else if (p.targetType === 'category') {
      const ids = (p.targetCategoryIds ?? []).map(String);
      if (ids.includes(catStr)) best = Math.max(best, p.discountPercent ?? 0);
    }
  }
  return best;
};

/** Tính giá sau giảm */
export const calcSalePrice = (price, discountPercent) => {
  if (!discountPercent) return price;
  return Math.round(price * (1 - discountPercent / 100));
};
