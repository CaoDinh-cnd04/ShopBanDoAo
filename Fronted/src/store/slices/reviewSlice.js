import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchProductReviews = createAsyncThunk(
  'reviews/fetchProductReviews',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/reviews/products/${productId}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch reviews'
      );
    }
  }
);

export const createProductReview = createAsyncThunk(
  'reviews/createProductReview',
  async ({ productId, reviewData }, { rejectWithValue }) => {
    try {
      const response = await api.post('/reviews/products', {
        productId,
        ...reviewData,
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create review'
      );
    }
  }
);

export const createCourtReview = createAsyncThunk(
  'reviews/createCourtReview',
  async ({ courtId, reviewData }, { rejectWithValue }) => {
    try {
      const response = await api.post('/reviews/courts', {
        courtId,
        ...reviewData,
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create review'
      );
    }
  }
);

const initialState = {
  productReviews: [],
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
        state.productReviews = action.payload;
      })
      .addCase(fetchProductReviews.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(createProductReview.fulfilled, (state, action) => {
        state.productReviews.unshift(action.payload);
      })
      .addCase(createCourtReview.fulfilled, (state) => {
        // Court reviews handled separately if needed
      });
  },
});

export const { clearReviews, clearError } = reviewSlice.actions;
export default reviewSlice.reducer;
