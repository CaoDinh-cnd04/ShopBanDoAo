/** returnUrl từ query — chỉ cho phép path nội bộ, tránh open redirect */
export function safeReturnUrl(raw) {
  if (!raw || typeof raw !== 'string') return null;
  try {
    const d = decodeURIComponent(raw);
    return d.startsWith('/') && !d.startsWith('//') ? d : null;
  } catch {
    return null;
  }
}
