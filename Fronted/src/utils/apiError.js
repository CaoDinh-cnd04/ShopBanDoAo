/**
 * Thông báo lỗi từ response API (axios) — dùng trong catch để toast thống nhất.
 */
export function getApiErrorMessage(error, fallback = 'Có lỗi xảy ra') {
  const msg =
    error?.response?.data?.message ||
    error?.response?.data?.errors?.[0]?.msg ||
    error?.message;
  return typeof msg === 'string' && msg.trim() ? msg.trim() : fallback;
}
