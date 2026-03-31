import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { store } from './store/store';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import { GOOGLE_CLIENT_ID } from './config/googleAuth';
import './i18n/config';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-datepicker/dist/react-datepicker.css';
import 'react-toastify/dist/ReactToastify.css';
import './styles/index.css';

/** Khớp Vite `base` (GitHub Pages / subpath hoặc domain gốc) */
const baseUrl = import.meta.env.BASE_URL || '/';
const routerBasename =
  baseUrl === '/' ? undefined : baseUrl.replace(/\/$/, '');

const appInner = (
  <Provider store={store}>
    <BrowserRouter
      basename={routerBasename}
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <App />
    </BrowserRouter>
  </Provider>
);

/**
 * GoogleOAuthProvider phải nằm NGOÀI React.StrictMode — nếu không,
 * StrictMode mount kép (dev) → google.accounts.id.initialize() gọi 2 lần.
 */
const appWithBoundary = (
  <ErrorBoundary>{appInner}</ErrorBoundary>
);

const rootTree =
  GOOGLE_CLIENT_ID ? (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <React.StrictMode>{appWithBoundary}</React.StrictMode>
    </GoogleOAuthProvider>
  ) : (
    <React.StrictMode>{appWithBoundary}</React.StrictMode>
);

ReactDOM.createRoot(document.getElementById('root')).render(rootTree);
