import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchWishlist = createAsyncThunk(
  'wishlist/fetchWishlist',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/wishlists');
      const data = response.data.data;
      return Array.isArray(data) ? data : (data?.wishlist ?? []);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch wishlist'
      );
    }
  }
);

/**
 * Toggle wishlist: thêm nếu chưa có, xóa nếu đã có.
 * Backend: POST /wishlists/toggle { productId } → { isAdded, wishlist? }
 */
export const toggleWishlist = createAsyncThunk(
  'wishlist/toggleWishlist',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await api.post('/wishlists/toggle', { productId });
      return response.data.data; // { isAdded, wishlist? }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to toggle wishlist'
      );
    }
  }
);

const initialState = {
  items: [],
  isLoading: false,
  error: null,
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.items = [];
      })
      .addCase(toggleWishlist.fulfilled, (state, action) => {
        const { isAdded, wishlist } = action.payload ?? {};
        if (isAdded && wishlist) {
          state.items.push(wishlist);
        } else if (!isAdded) {
          const productId = wishlist?.productId?._id?.toString()
            || wishlist?.productId?.toString()
            || action.meta?.arg?.toString();
          state.items = state.items.filter((item) => {
            const pid = item.productId?._id?.toString()
              || item.productId?.toString();
            return pid !== productId;
          });
        }
      });
  },
});

export default wishlistSlice.reducer;
