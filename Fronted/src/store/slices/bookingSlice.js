import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchAvailableSlots = createAsyncThunk(
  'bookings/fetchAvailableSlots',
  async ({ courtId, date }, { rejectWithValue }) => {
    try {
      const response = await api.get('/bookings/available-slots', {
        params: { courtId, date },
      });
      const d = response.data?.data;
      const slots = Array.isArray(d?.slots) ? d.slots : [];
      return { slots, pricePerHour: d?.pricePerHour ?? 0 };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Không tải được khung giờ',
      );
    }
  },
);

export const createBooking = createAsyncThunk(
  'bookings/createBooking',
  async (bookingData, { rejectWithValue }) => {
    try {
      const response = await api.post('/bookings', bookingData);
      return response.data?.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Đặt sân thất bại',
      );
    }
  },
);

export const fetchUserBookings = createAsyncThunk(
  'bookings/fetchUserBookings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/bookings/my-bookings');
      const data = response.data.data;
      return Array.isArray(data) ? data : data?.bookings ?? [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Không tải được lịch đặt',
      );
    }
  },
);

export const cancelBooking = createAsyncThunk(
  'bookings/cancelBooking',
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await api.put(`/bookings/${bookingId}/cancel`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Hủy lịch thất bại',
      );
    }
  },
);

const initialState = {
  availableSlots: [],
  slotMeta: { pricePerHour: 0 },
  bookings: [],
  currentBooking: null,
  isLoading: false,
  error: null,
};

const bookingSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    clearAvailableSlots: (state) => {
      state.availableSlots = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAvailableSlots.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAvailableSlots.fulfilled, (state, action) => {
        state.isLoading = false;
        state.availableSlots = Array.isArray(action.payload?.slots)
          ? action.payload.slots
          : [];
        state.slotMeta = {
          pricePerHour: action.payload?.pricePerHour ?? 0,
        };
      })
      .addCase(fetchAvailableSlots.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        const payload = action.payload;
        state.currentBooking = payload?.booking ?? payload;
        if (state.currentBooking && payload?.booking) {
          state.bookings.unshift(payload.booking);
        }
      })
      .addCase(fetchUserBookings.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchUserBookings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.bookings = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchUserBookings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        const booking = action.payload?.booking;
        if (!booking) return;
        const id = booking._id ?? booking.id;
        const index = state.bookings.findIndex(
          (b) => String(b._id ?? b.id) === String(id),
        );
        if (index !== -1) state.bookings[index] = booking;
      });
  },
});

export const { clearAvailableSlots } = bookingSlice.actions;
export default bookingSlice.reducer;
