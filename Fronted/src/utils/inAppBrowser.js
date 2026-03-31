/**
 * Google chặn OAuth trong WebView / trình duyệt nhúng → 403 disallowed_useragent.
 * (Messenger, Facebook, Instagram, LINE, WebView Android…)
 */
export function isInAppBrowser() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /FBAN|FBAV|FB_IAB|Instagram|Messenger|Line\/|; wv\)|Snapchat/i.test(ua);
}

export const IN_APP_GOOGLE_HINT =
  'Google không cho đăng nhập trong Messenger/Facebook/Instagram. Hãy mở ⋮ (menu) → "Mở bằng trình duyệt" / "Open in browser" (Chrome hoặc Safari), rồi đăng nhập Google lại.';
