import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const normalizeList = (data) =>
  Array.isArray(data) ? data : (data?.addresses ?? []);

export const fetchAddresses = createAsyncThunk(
  'addresses/fetchAddresses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/addresses');
      return normalizeList(response.data.data);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch addresses'
      );
    }
  }
);

export const createAddress = createAsyncThunk(
  'addresses/createAddress',
  async (addressData, { rejectWithValue }) => {
    try {
      const response = await api.post('/addresses', addressData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create address'
      );
    }
  }
);

export const updateAddress = createAsyncThunk(
  'addresses/updateAddress',
  async ({ id, addressData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/addresses/${id}`, addressData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update address'
      );
    }
  }
);

export const deleteAddress = createAsyncThunk(
  'addresses/deleteAddress',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/addresses/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete address'
      );
    }
  }
);

export const setDefaultAddress = createAsyncThunk(
  'addresses/setDefault',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/addresses/${id}/set-default`);
      return response.data?.data ?? response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Không thể đặt mặc định'
      );
    }
  }
);

const initialState = {
  addresses: [],
  isLoading: false,
  error: null,
};

const addressSlice = createSlice({
  name: 'addresses',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAddresses.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAddresses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.addresses = normalizeList(action.payload);
      })
      .addCase(fetchAddresses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(createAddress.fulfilled, (state, action) => {
        const addr = action.payload?.address ?? action.payload;
        if (addr) state.addresses.push(addr);
      })
      .addCase(updateAddress.fulfilled, (state, action) => {
        const updated = action.payload?.address ?? action.payload;
        if (!updated) return;
        const uid = updated._id?.toString() || updated.id?.toString();
        const index = state.addresses.findIndex(
          (a) => (a._id || a.id)?.toString() === uid
        );
        if (index !== -1) state.addresses[index] = updated;
      })
      .addCase(deleteAddress.fulfilled, (state, action) => {
        const id = action.payload?.toString();
        state.addresses = state.addresses.filter(
          (a) => (a._id || a.id)?.toString() !== id
        );
      })
      .addCase(setDefaultAddress.fulfilled, (state, action) => {
        const payload = action.payload;
        const updated = payload?.address ?? payload;
        const uid = updated?._id?.toString() || updated?.id?.toString();
        if (!uid) return;
        state.addresses = state.addresses.map((a) => {
          const id = (a._id || a.id)?.toString();
          if (id === uid) return { ...a, ...updated, isDefault: true };
          return { ...a, isDefault: false };
        });
      });
  },
});

export const { clearError } = addressSlice.actions;
export default addressSlice.reducer;
