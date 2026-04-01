import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (params = {}, { rejectWithValue, signal }) => {
    try {
      const response = await api.get('/products', { params, signal });
      return response.data.data;
    } catch (error) {
      if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') {
        return rejectWithValue(null);
      }
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch products'
      );
    }
  }
);

export const fetchProductById = createAsyncThunk(
  'products/fetchProductById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/products/${id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch product'
      );
    }
  }
);

/** Trang chủ — sản phẩm bán chạy (theo đơn hàng), không dùng isFeatured tĩnh */
export const fetchTopSellingProducts = createAsyncThunk(
  'products/fetchTopSellingProducts',
  async (params = {}, { rejectWithValue, signal }) => {
    try {
      const response = await api.get('/products/featured/top-selling', {
        params: { limit: params.limit ?? 8 },
        signal,
      });
      return response.data.data;
    } catch (error) {
      if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') {
        return rejectWithValue(null);
      }
      return rejectWithValue(
        error.response?.data?.message || 'Không tải được sản phẩm bán chạy'
      );
    }
  }
);

const initialState = {
  products: [],
  product: null,
  featuredProducts: [],
  pagination: {
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  },
  filters: {
    category: null,
    categories: null,
    brand: null,
    brands: null,
    minPrice: null,
    maxPrice: null,
    search: '',
  },
  isLoading: false,
  error: null,
};

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Products
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        const payload = action.payload;
        const list = payload?.products ?? (Array.isArray(payload) ? payload : []);
        const arg = action.meta.arg || {};
        const isFeaturedRequest =
          arg.isFeatured === 1 ||
          arg.isFeatured === '1' ||
          arg.isFeatured === true;
        if (isFeaturedRequest) {
          state.featuredProducts = Array.isArray(list) ? list : [];
          return;
        }
        state.products = Array.isArray(list) ? list : [];
        if (payload?.pagination) {
          state.pagination = payload.pagination;
        }
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        if (action.payload != null) state.error = action.payload;
      })
      // Fetch Product by ID
      .addCase(fetchProductById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.product = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchTopSellingProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTopSellingProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        const payload = action.payload;
        const list = payload?.products ?? [];
        state.featuredProducts = Array.isArray(list) ? list : [];
      })
      .addCase(fetchTopSellingProducts.rejected, (state, action) => {
        state.isLoading = false;
        if (action.payload != null) state.error = action.payload;
      });
  },
});

export const { setFilters, clearFilters, setPagination } = productSlice.actions;
export default productSlice.reducer;
