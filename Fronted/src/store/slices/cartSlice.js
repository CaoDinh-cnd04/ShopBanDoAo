import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

/**
 * Chuẩn hoá cart từ API (có thể có variantId → giá theo biến thể).
 */
const normalizeCart = (payload) => {
  const cart = payload?.cart ?? payload;
  const rawItems = Array.isArray(cart?.items) ? cart.items : [];

  const items = rawItems.map((item) => {
    const product =
      item.productId && typeof item.productId === 'object' ? item.productId : {};
    const productId =
      product._id?.toString() || product.id?.toString() || item.productId?.toString() || '';
    const variantId = item.variantId?.toString() || '';

    let price = Number(product.defaultPrice) || 0;
    let variantLabel = '';
    const vars = Array.isArray(product.variants) ? product.variants : [];

    if (variantId && vars.length) {
      const v = vars.find((x) => x._id?.toString() === variantId);
      if (v) {
        price = Number(v.price) || price;
        variantLabel = [v.size, v.color].filter(Boolean).join(' · ');
      }
    }

    const images = product.images;
    let image = null;
    if (Array.isArray(images) && images.length > 0) {
      const first = images[0];
      image = typeof first === 'string' ? first : first?.imageUrl || null;
    }

    const rawCat = product.categoryId;
    const categoryId =
      (rawCat && typeof rawCat === 'object'
        ? rawCat._id?.toString() || rawCat.id?.toString()
        : String(rawCat || '')) || '';

    return {
      productId,
      variantId: variantId || undefined,
      variantLabel,
      productName: product.productName ?? item.productName ?? 'Sản phẩm',
      price,           // base price (no promo discount)
      originalPrice: product.originalPrice || null,
      categoryId,
      quantity: item.quantity ?? 1,
      image,
    };
  });

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return { items, totalItems, subtotal };
};

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
  async ({ productId, quantity = 1, variantId }, { rejectWithValue }) => {
    try {
      const body = { productId, quantity };
      if (variantId) body.variantId = variantId;
      const res = await api.post('/cart/items', body);
      return normalizeCart(res.data?.data);
    } catch (err) {
      const m = err.response?.data?.message;
      const msg = Array.isArray(m) ? m.join(', ') : m;
      return rejectWithValue(msg || 'Lỗi thêm vào giỏ hàng');
    }
  }
);

export const updateCartItem = createAsyncThunk(
  'cart/updateCartItem',
  async ({ productId, quantity, variantId }, { rejectWithValue }) => {
    try {
      const body = { quantity };
      if (variantId) body.variantId = variantId;
      const res = await api.put(`/cart/items/${productId}`, body);
      return normalizeCart(res.data?.data);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Lỗi cập nhật giỏ hàng');
    }
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async (payload, { rejectWithValue }) => {
    try {
      const productId = typeof payload === 'string' ? payload : payload.productId;
      const variantId = typeof payload === 'object' ? payload.variantId : undefined;
      const q = variantId ? `?variantId=${encodeURIComponent(variantId)}` : '';
      const res = await api.delete(`/cart/items/${productId}${q}`);
      return normalizeCart(res.data?.data);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Lỗi xoá khỏi giỏ hàng');
    }
  }
);

export const clearCart = createAsyncThunk('cart/clearCart', async (_, { rejectWithValue }) => {
  try {
    await api.delete('/cart');
    return { items: [], totalItems: 0, subtotal: 0 };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Lỗi xoá giỏ hàng');
  }
});

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
      .addCase(fetchCart.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.isLoading = false;
        applyCart(state, action.payload);
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(addToCart.pending, (state) => { state.isLoading = true; })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.isLoading = false;
        applyCart(state, action.payload);
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        applyCart(state, action.payload);
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        applyCart(state, action.payload);
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(clearCart.fulfilled, (state, action) => {
        applyCart(state, action.payload);
      });
  },
});

export default cartSlice.reducer;
