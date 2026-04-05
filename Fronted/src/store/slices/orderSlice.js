import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

function apiErrorMessage(error, fallback) {
  const m = error.response?.data?.message;
  if (Array.isArray(m)) return m.join('. ');
  if (typeof m === 'string' && m.trim()) return m;
  return fallback;
}

export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await api.post('/orders', orderData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        apiErrorMessage(error, 'Đặt hàng thất bại — kiểm tra thông tin và thử lại'),
      );
    }
  }
);

export const fetchUserOrders = createAsyncThunk(
  'orders/fetchUserOrders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/orders/my-orders');
      const data = response.data.data;
      return Array.isArray(data) ? data : (data?.orders ?? []);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch orders'
      );
    }
  }
);

export const fetchOrderById = createAsyncThunk(
  'orders/fetchOrderById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/orders/${id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch order'
      );
    }
  }
);

export const cancelOrder = createAsyncThunk(
  'orders/cancelOrder',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await api.put(`/orders/cancel/${orderId}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        apiErrorMessage(error, 'Không thể hủy đơn'),
      );
    }
  }
);

const initialState = {
  orders: [],
  currentOrder: null,
  isLoading: false,
  error: null,
};

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
    // Optimistic: đánh dấu cancelled ngay khi user bấm hủy (trước khi API trả về)
    optimisticCancelOrder: (state, action) => {
      const id = action.payload;
      if (Array.isArray(state.orders)) {
        state.orders = state.orders.map((o) =>
          String(o._id || o.id) === String(id)
            ? { ...o, orderStatus: 'Cancelled' }
            : o,
        );
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createOrder.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        const p = action.payload;
        const order = p?.order ?? p;
        state.currentOrder = order;
        if (order) state.orders.unshift(order);
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchUserOrders.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchUserOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchUserOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.currentOrder = action.payload;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        const ord = action.payload?.order;
        if (ord && Array.isArray(state.orders)) {
          const id = ord._id || ord.id;
          state.orders = state.orders.map((o) =>
            String(o._id || o.id) === String(id) ? { ...o, orderStatus: ord.orderStatus ?? 'Cancelled' } : o
          );
        }
      });
  },
});

export const { clearCurrentOrder, optimisticCancelOrder } = orderSlice.actions;
export default orderSlice.reducer;
