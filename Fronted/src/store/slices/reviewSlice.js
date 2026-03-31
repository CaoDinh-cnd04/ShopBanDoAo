import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchProductReviews = createAsyncThunk(
  'reviews/fetchProductReviews',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/reviews/products/${productId}`);
      const d = response.data?.data;
      return Array.isArray(d) ? d : d?.reviews ?? [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Không tải được đánh giá',
      );
    }
  },
);

export const fetchSiteReviews = createAsyncThunk(
  'reviews/fetchSiteReviews',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/reviews/site');
      const d = response.data?.data;
      return Array.isArray(d) ? d : d?.reviews ?? [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Không tải được đánh giá trang web',
      );
    }
  },
);

export const createProductReview = createAsyncThunk(
  'reviews/createProductReview',
  async ({ productId, reviewData }, { rejectWithValue }) => {
    try {
      const response = await api.post('/reviews/products', {
        productId,
        reviewType: 'product',
        ...reviewData,
      });
      return response.data?.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Gửi đánh giá thất bại',
      );
    }
  },
);

export const createSiteReview = createAsyncThunk(
  'reviews/createSiteReview',
  async (reviewData, { rejectWithValue }) => {
    try {
      const response = await api.post('/reviews', {
        reviewType: 'site',
        ...reviewData,
      });
      return response.data?.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Gửi đánh giá thất bại',
      );
    }
  },
);

export const fetchCourtReviews = createAsyncThunk(
  'reviews/fetchCourtReviews',
  async (courtId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/reviews/courts/${courtId}`);
      const d = response.data?.data;
      return Array.isArray(d) ? d : d?.reviews ?? [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Không tải được đánh giá sân',
      );
    }
  },
);

export const createCourtReview = createAsyncThunk(
  'reviews/createCourtReview',
  async ({ courtId, bookingId, reviewData }, { rejectWithValue }) => {
    try {
      const response = await api.post('/reviews', {
        reviewType: 'court',
        courtId,
        bookingId,
        ...reviewData,
      });
      return response.data?.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Gửi đánh giá thất bại',
      );
    }
  },
);

const initialState = {
  productReviews: [],
  siteReviews: [],
  courtReviews: [],
  isLoading: false,
  error: null,
};

const reviewSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {
    clearReviews: (state) => {
      state.productReviews = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductReviews.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchProductReviews.fulfilled, (state, action) => {
        state.isLoading = false;
        state.productReviews = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchProductReviews.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchSiteReviews.fulfilled, (state, action) => {
        state.siteReviews = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchCourtReviews.fulfilled, (state, action) => {
        state.courtReviews = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(createProductReview.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(createSiteReview.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(createCourtReview.fulfilled, (state) => {
        state.isLoading = false;
      });
  },
});

export const { clearReviews, clearError } = reviewSlice.actions;
export default reviewSlice.reducer;
