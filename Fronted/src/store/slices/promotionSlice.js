import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import promotionService from '../../services/promotionService';
import { getDiscountForCategory, calcSalePrice } from '../../services/promotionService';

export const fetchActivePromotions = createAsyncThunk(
  'promotions/fetchActive',
  async (_, { rejectWithValue }) => {
    try {
      return await promotionService.getActive();
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message ?? 'Lỗi tải khuyến mãi');
    }
  },
);

const promotionSlice = createSlice({
  name: 'promotions',
  initialState: {
    active: [],       // chương trình đang chạy
    isLoading: false,
    lastFetched: null,
  },
  reducers: {
    clearPromotions: (state) => { state.active = []; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActivePromotions.pending,   (state) => { state.isLoading = true; })
      .addCase(fetchActivePromotions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.active = Array.isArray(action.payload) ? action.payload : [];
        state.lastFetched = Date.now();
      })
      .addCase(fetchActivePromotions.rejected,  (state) => { state.isLoading = false; });
  },
});

export const { clearPromotions } = promotionSlice.actions;
export default promotionSlice.reducer;

/**
 * Selector: cart items với giá đã áp dụng chương trình khuyến mãi.
 * finalPrice = giá tính vào đơn hàng (có thể thấp hơn price gốc)
 */
export const selectCartWithPromo = createSelector(
  (state) => state.cart.items,
  (state) => state.promotions?.active ?? [],
  (cartItems, promotions) =>
    cartItems.map((item) => {
      const discount = getDiscountForCategory(promotions, item.categoryId);
      const finalPrice = discount > 0 ? calcSalePrice(item.price, discount) : item.price;
      return { ...item, finalPrice, promoDiscount: discount };
    }),
);
