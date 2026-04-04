import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import productReducer from './slices/productSlice';
import categoryReducer from './slices/categorySlice';
import orderReducer from './slices/orderSlice';
import bookingReducer from './slices/bookingSlice';
import courtReducer from './slices/courtSlice';
import themeReducer from './slices/themeSlice';
import wishlistReducer from './slices/wishlistSlice';
import addressReducer from './slices/addressSlice';
import reviewReducer from './slices/reviewSlice';
import voucherReducer from './slices/voucherSlice';
import notificationReducer from './slices/notificationSlice';
import promotionReducer from './slices/promotionSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    products: productReducer,
    categories: categoryReducer,
    orders: orderReducer,
    bookings: bookingReducer,
    courts: courtReducer,
    theme: themeReducer,
    wishlist: wishlistReducer,
    addresses: addressReducer,
    reviews: reviewReducer,
    vouchers: voucherReducer,
    notifications: notificationReducer,
    promotions: promotionReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

// TypeScript types (uncomment if using TypeScript)
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;
