import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

/** Lấy danh sách voucher đang active, không cần đăng nhập */
export const fetchPublicVouchers = createAsyncThunk(
  'vouchers/fetchPublicVouchers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/vouchers/public');
      const data = response.data.data;
      return Array.isArray(data) ? data : (data?.vouchers ?? []);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch vouchers'
      );
    }
  }
);

/** Voucher còn dùng được (chưa dùng bởi user) + lịch sử đã dùng — cần đăng nhập */
export const fetchMyVouchers = createAsyncThunk(
  'vouchers/fetchMyVouchers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/vouchers/my');
      const data = response.data.data;
      return {
        available: Array.isArray(data?.available) ? data.available : [],
        used: Array.isArray(data?.used) ? data.used : [],
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Không tải được voucher'
      );
    }
  }
);

/** Áp dụng voucher khi checkout */
export const applyVoucher = createAsyncThunk(
  'vouchers/applyVoucher',
  async ({ code, orderValue }, { rejectWithValue }) => {
    try {
      const response = await api.post('/vouchers/apply', { code, orderValue });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Mã giảm giá không hợp lệ'
      );
    }
  }
);

const initialState = {
  vouchers: [],
  usedVouchers: [],
  appliedVoucher: null,
  isLoading: false,
  error: null,
};

const voucherSlice = createSlice({
  name: 'vouchers',
  initialState,
  reducers: {
    clearAppliedVoucher: (state) => {
      state.appliedVoucher = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPublicVouchers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPublicVouchers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.vouchers = Array.isArray(action.payload) ? action.payload : [];
        state.usedVouchers = [];
      })
      .addCase(fetchPublicVouchers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.vouchers = [];
        state.usedVouchers = [];
      })
      .addCase(fetchMyVouchers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyVouchers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.vouchers = action.payload.available ?? [];
        state.usedVouchers = action.payload.used ?? [];
      })
      .addCase(fetchMyVouchers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.vouchers = [];
        state.usedVouchers = [];
      })
      .addCase(applyVoucher.fulfilled, (state, action) => {
        state.appliedVoucher = action.payload;
      })
      .addCase(applyVoucher.rejected, (state, action) => {
        state.error = action.payload;
        state.appliedVoucher = null;
      });
  },
});

export const { clearAppliedVoucher, clearError } = voucherSlice.actions;
export default voucherSlice.reducer;
