import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchAvailableVouchers = createAsyncThunk(
  'vouchers/fetchAvailableVouchers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/vouchers/available');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch available vouchers'
      );
    }
  }
);

export const fetchUserVouchers = createAsyncThunk(
  'vouchers/fetchUserVouchers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/vouchers');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch user vouchers'
      );
    }
  }
);

export const receiveVoucher = createAsyncThunk(
  'vouchers/receiveVoucher',
  async (voucherId, { rejectWithValue }) => {
    try {
      const response = await api.post('/vouchers/receive', { voucherId });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to receive voucher'
      );
    }
  }
);

const initialState = {
  availableVouchers: [],
  userVouchers: [],
  isLoading: false,
  error: null,
};

const voucherSlice = createSlice({
  name: 'vouchers',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAvailableVouchers.fulfilled, (state, action) => {
        state.availableVouchers = action.payload;
      })
      .addCase(fetchUserVouchers.fulfilled, (state, action) => {
        state.userVouchers = action.payload;
      })
      .addCase(receiveVoucher.fulfilled, (state, action) => {
        state.userVouchers.push(action.payload);
        // Remove from available if needed
        state.availableVouchers = state.availableVouchers.filter(
          (v) => v.id !== action.payload.voucherId
        );
      });
  },
});

export const { clearError } = voucherSlice.actions;
export default voucherSlice.reducer;
