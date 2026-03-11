import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

/** Chuẩn hóa user từ API: backend trả về roles (mảng), frontend dùng role (chuỗi) cho Navbar/AdminRoute */
const normalizeUser = (user) => {
  if (!user) return user;
  const u = { ...user };
  if (u.role) return u;
  const roles = u.roles;
  if (Array.isArray(roles) && roles.length) {
    const hasAdmin = roles.some((r) => r === 'Admin' || (r && r.RoleName === 'Admin'));
    u.role = hasAdmin ? 'Admin' : (typeof roles[0] === 'string' ? roles[0] : roles[0]?.RoleName) || 'Customer';
  } else {
    u.role = 'Customer';
  }
  return u;
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data.data;
      const normalized = normalizeUser(user);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(normalized));
      return { token, user: normalized };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Login failed'
      );
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { token, user } = response.data.data;
      const normalized = normalizeUser(user);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(normalized));
      return { token, user: normalized };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Registration failed'
      );
    }
  }
);

export const firebaseLogin = createAsyncThunk(
  'auth/firebaseLogin',
  async (idToken, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/firebase-login', { idToken });
      const { token, user } = response.data.data;
      const normalized = normalizeUser(user);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(normalized));
      return { token, user: normalized };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Firebase login failed'
      );
    }
  }
);

export const getProfile = createAsyncThunk(
  'auth/getProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/auth/profile');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to get profile'
      );
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await api.put('/auth/profile', profileData);
      const user = response.data.data;
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update profile'
      );
    }
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async ({ currentPassword, newPassword }, { rejectWithValue }) => {
    try {
      const response = await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to change password'
      );
    }
  }
);

export const checkAuth = createAsyncThunk('auth/checkAuth', async (_, { rejectWithValue }) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  if (token && userStr) {
    try {
      let user = JSON.parse(userStr);
      const profileRes = await api.get('/auth/profile');
      const profile = profileRes.data?.data;
      if (profile) {
        user = normalizeUser({ ...user, ...profile, roles: profile.roles || [] });
      } else if (!user.role) {
        user = normalizeUser(user);
      }
      localStorage.setItem('user', JSON.stringify(user));
      return { token, user };
    } catch (error) {
      // Token invalid, clear storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return null;
    }
  }
  return null;
});

/** Khôi phục auth từ localStorage ngay khi load trang (F5) để AdminRoute/ProtectedRoute không redirect về login trước khi checkAuth chạy xong */
const getInitialAuthState = () => {
  try {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      const user = normalizeUser(JSON.parse(userStr));
      return {
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    }
  } catch (e) {
    // JSON parse lỗi hoặc localStorage lỗi -> bỏ qua
  }
  return {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  };
};

const initialState = getInitialAuthState();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Firebase Login
      .addCase(firebaseLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(firebaseLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(firebaseLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Check Auth
      .addCase(checkAuth.fulfilled, (state, action) => {
        if (action.payload) {
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.token = action.payload.token;
        } else {
          state.isAuthenticated = false;
          state.user = null;
          state.token = null;
        }
      })
      // Get Profile
      .addCase(getProfile.fulfilled, (state, action) => {
        const normalized = normalizeUser({ ...state.user, ...action.payload, roles: action.payload.roles });
        state.user = normalized;
        localStorage.setItem('user', JSON.stringify(normalized));
      })
      // Update Profile
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      // Change Password
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
