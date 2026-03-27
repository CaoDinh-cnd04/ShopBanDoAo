import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

/**
 * Chuyển cart document từ backend thành state thân thiện với UI.
 * Backend trả: { userId, items: [{ productId: { _id, productName, defaultPrice }, quantity }] }
 */
const normalizeCart = (payload) => {
  // payload có thể là cart document hoặc { cart } (sau add/update/remove)
  const cart = payload?.cart ?? payload;
  const rawItems = Array.isArray(cart?.items) ? cart.items : [];

  const items = rawItems.map((item) => {
    const product =
      item.productId && typeof item.productId === 'object' ? item.productId : {};
    const productId =
      product._id?.toString() || product.id?.toString() || item.productId?.toString() || '';
    const price = product.defaultPrice ?? item.price ?? 0;
    const images = product.images;
    const image = Array.isArray(images) && images.length > 0 ? images[0] : null;

    return {
      productId,
      productName: product.productName ?? item.productName ?? 'Sản phẩm',
      price,
      quantity: item.quantity ?? 1,
      image,
    };
  });

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return { items, totalItems, subtotal };
};

// ── Thunks ──────────────────────────────────────────────────────────────────

export const fetchCart = createAsyncThunk('cart/fetchCart', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/cart');
    return normalizeCart(res.data?.data);
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Lỗi tải giỏ hàng');
  }
});

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ productId, quantity = 1 }, { rejectWithValue }) => {
    try {
      // Backend: POST /api/cart/items  body: { productId, quantity }
      const res = await api.post('/cart/items', { productId, quantity });
      return normalizeCart(res.data?.data);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Lỗi thêm vào giỏ hàng');
    }
  }
);

export const updateCartItem = createAsyncThunk(
  'cart/updateCartItem',
  async ({ productId, quantity }, { rejectWithValue }) => {
    try {
      // Backend: PUT /api/cart/items/:productId  body: { quantity }
      const res = await api.put(`/cart/items/${productId}`, { quantity });
      return normalizeCart(res.data?.data);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Lỗi cập nhật giỏ hàng');
    }
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async (productId, { rejectWithValue }) => {
    try {
      // Backend: DELETE /api/cart/items/:productId
      const res = await api.delete(`/cart/items/${productId}`);
      return normalizeCart(res.data?.data);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Lỗi xoá khỏi giỏ hàng');
    }
  }
);

export const clearCart = createAsyncThunk('cart/clearCart', async (_, { rejectWithValue }) => {
  try {
    // Backend: DELETE /api/cart
    await api.delete('/cart');
    return { items: [], totalItems: 0, subtotal: 0 };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Lỗi xoá giỏ hàng');
  }
});

// ── Slice ────────────────────────────────────────────────────────────────────

const initialState = {
  items: [],
  totalItems: 0,
  subtotal: 0,
  isLoading: false,
  error: null,
};

const applyCart = (state, normalized) => {
  state.items = normalized.items;
  state.totalItems = normalized.totalItems;
  state.subtotal = normalized.subtotal;
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchCart
      .addCase(fetchCart.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.isLoading = false;
        applyCart(state, action.payload);
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // addToCart
      .addCase(addToCart.pending, (state) => { state.isLoading = true; })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.isLoading = false;
        applyCart(state, action.payload);
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // updateCartItem
      .addCase(updateCartItem.fulfilled, (state, action) => {
        applyCart(state, action.payload);
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.error = action.payload;
      })
      // removeFromCart
      .addCase(removeFromCart.fulfilled, (state, action) => {
        applyCart(state, action.payload);
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.error = action.payload;
      })
      // clearCart
      .addCase(clearCart.fulfilled, (state, action) => {
        applyCart(state, action.payload);
      });
  },
});

export default cartSlice.reducer;
