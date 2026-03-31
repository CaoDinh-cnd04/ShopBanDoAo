import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

/**
 * Backend (NestJS + TransformInterceptor) trả về:
 *   { success, message, data: <service_return> }
 * Đọc: response.data.data = giá trị từ service
 */

/** Chuẩn hóa role: DB/API đôi khi trả "admin", "ADMIN" — AdminRoute cần 'Admin'. */
const canonicalRole = (value) => {
  if (value == null || value === '') return 'User';
  const s = String(value).trim();
  if (s === '') return 'User';
  const lower = s.toLowerCase();
  if (lower === 'admin') return 'Admin';
  if (lower === 'user') return 'User';
  return s;
};

const roleFromRolesArray = (roles) => {
  if (!Array.isArray(roles) || !roles.length) return 'User';
  const hasAdmin = roles.some((r) => {
    const name = typeof r === 'string' ? r : r?.RoleName;
    return name != null && String(name).toLowerCase() === 'admin';
  });
  if (hasAdmin) return 'Admin';
  const first = roles[0];
  return canonicalRole(typeof first === 'string' ? first : first?.RoleName) || 'User';
};

export const isAdminUser = (user) => {
  if (!user) return false;
  if (canonicalRole(user.role) === 'Admin') return true;
  const roles = user.roles;
  if (Array.isArray(roles) && roles.length) {
    return roles.some((r) => {
      const name = typeof r === 'string' ? r : r?.RoleName;
      return name != null && String(name).toLowerCase() === 'admin';
    });
  }
  return false;
};

const normalizeUser = (user) => {
  if (!user) return user;
  const u = { ...user };
  if (u.role != null && u.role !== '') {
    u.role = canonicalRole(u.role);
    return u;
  }
  const roles = u.roles;
  if (Array.isArray(roles) && roles.length) {
    u.role = roleFromRolesArray(roles);
  } else {
    u.role = 'User';
  }
  return u;
};

// ─── Async thunks ───────────────────────────────────────────────────────────

function messageFromApiError(error, fallback) {
  const m = error.response?.data?.message;
  if (m != null) {
    return Array.isArray(m) ? m.join(', ') : String(m);
  }
  if (!error.response && (error.code === 'ECONNABORTED' || error.message === 'Network Error')) {
    return 'Không kết nối được server API. Kiểm tra mạng hoặc thử lại (Render có thể đang khởi động).';
  }
  return fallback;
}

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      // TransformInterceptor: response.data = { success, message, data: { token, user } }
      const { token, user } = response.data.data;
      const normalized = normalizeUser(user);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(normalized));
      return { token, user: normalized };
    } catch (error) {
      return rejectWithValue(messageFromApiError(error, 'Đăng nhập thất bại'));
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
      return rejectWithValue(messageFromApiError(error, 'Đăng ký thất bại'));
    }
  }
);

/** JWT credential từ nút GoogleLogin (Sign In With Google) — POST /api/auth/google-id-token */
export const googleIdTokenLogin = createAsyncThunk(
  'auth/googleIdTokenLogin',
  async (idToken, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/google-id-token', { idToken });
      const { token, user } = response.data.data;
      const normalized = normalizeUser(user);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(normalized));
      return { token, user: normalized };
    } catch (error) {
      return rejectWithValue(messageFromApiError(error, 'Đăng nhập Google thất bại'));
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
      return rejectWithValue(error.response?.data?.message || 'Failed to get profile');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await api.put('/auth/profile', profileData);
      const user = normalizeUser(response.data.data);
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async ({ currentPassword, newPassword, oldPassword }, { rejectWithValue }) => {
    try {
      const response = await api.put('/auth/change-password', {
        oldPassword: oldPassword ?? currentPassword,
        newPassword,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to change password');
    }
  }
);

export const checkAuth = createAsyncThunk('auth/checkAuth', async (_) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  if (!token || token === 'undefined' || !userStr || userStr === 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return null;
  }

  try {
    let user = JSON.parse(userStr);
    const profileRes = await api.get('/auth/profile');
    const profile = profileRes.data?.data;
    if (profile) {
      user = normalizeUser({ ...user, ...profile });
    } else if (!user.role) {
      user = normalizeUser(user);
    }
    localStorage.setItem('user', JSON.stringify(user));
    return { token, user };
  } catch {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return null;
  }
});

// ─── Initial state từ localStorage (sync, để AdminRoute/ProtectedRoute không flicker) ──

const getInitialAuthState = () => {
  try {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && token !== 'undefined' && userStr && userStr !== 'undefined') {
      const user = normalizeUser(JSON.parse(userStr));
      return { user, token, isAuthenticated: true, isLoading: false, error: null };
    }
  } catch {
    // ignore
  }
  return { user: null, token: null, isAuthenticated: false, isLoading: false, error: null };
};

const initialState = getInitialAuthState();

// ─── Slice ───────────────────────────────────────────────────────────────────

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
      .addCase(login.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })

      // Register
      .addCase(register.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })

      .addCase(googleIdTokenLogin.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(googleIdTokenLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(googleIdTokenLogin.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })

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
        const normalized = normalizeUser({ ...state.user, ...action.payload });
        state.user = normalized;
        localStorage.setItem('user', JSON.stringify(normalized));
      })

      // Update Profile
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = normalizeUser(action.payload);
      })

      // Change Password
      .addCase(changePassword.pending, (state) => { state.isLoading = true; })
      .addCase(changePassword.fulfilled, (state) => { state.isLoading = false; state.error = null; })
      .addCase(changePassword.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
