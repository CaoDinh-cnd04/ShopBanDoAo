import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchCourts = createAsyncThunk(
  'courts/fetchCourts',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/courts', { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch courts'
      );
    }
  }
);

export const fetchCourtById = createAsyncThunk(
  'courts/fetchCourtById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/courts/${id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch court'
      );
    }
  }
);

export const fetchCourtTypes = createAsyncThunk(
  'courts/fetchCourtTypes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/courts/types');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch court types'
      );
    }
  }
);

const initialState = {
  courts: [],
  court: null,
  courtTypes: [],
  isLoading: false,
  error: null,
};

const courtSlice = createSlice({
  name: 'courts',
  initialState,
  extraReducers: (builder) => {
    builder
      .addCase(fetchCourts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCourts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.courts = action.payload;
      })
      .addCase(fetchCourts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchCourtById.fulfilled, (state, action) => {
        state.court = action.payload;
      })
      .addCase(fetchCourtTypes.fulfilled, (state, action) => {
        state.courtTypes = action.payload;
      });
  },
});

export default courtSlice.reducer;
