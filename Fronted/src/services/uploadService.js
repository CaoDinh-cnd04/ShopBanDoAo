/**
 * Upload ảnh — dùng fetch + FormData, KHÔNG set Content-Type (trình duyệt tự gắn boundary).
 */
import { getApiBaseUrl } from '../config/apiBase';

function getApiRoot() {
  const base = getApiBaseUrl();
  return base ? base.replace(/\/$/, '') : '';
}

function getToken() {
  return typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
}

/**
 * @param {FileList|File[]} files
 * @returns {Promise<{ data: { success?: boolean, message?: string, data: { urls: string[], message?: string } } }>}
 */
export async function uploadProductImages(files) {
  if (!files?.length) {
    throw new Error('Chưa chọn file');
  }
  const fd = new FormData();
  Array.from(files).forEach((f) => fd.append('files', f));

  const root = getApiRoot();
  const url = `${root}/upload/multiple`;

  const headers = {};
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: fd,
  });

  let json = {};
  try {
    json = await res.json();
  } catch {
    json = {};
  }

  if (!res.ok) {
    const msg =
      json.message ||
      json.error ||
      (Array.isArray(json.message) ? json.message[0] : null) ||
      `Upload thất bại (${res.status})`;
    const err = new Error(typeof msg === 'string' ? msg : 'Upload thất bại');
    err.status = res.status;
    err.response = { data: json, status: res.status };
    throw err;
  }

  // Khớp TransformInterceptor Nest: { success, message, data: { urls, ... } }
  return { data: json };
}

/**
 * @param {File} file
 * @returns {Promise<{ data: { data: { url?: string, message?: string } } }>}
 */
export async function uploadSingleImage(file) {
  if (!file) throw new Error('Chưa chọn file');
  const fd = new FormData();
  fd.append('file', file);

  const root = getApiRoot();
  const url = `${root}/upload/single`;

  const headers = {};
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: fd,
  });

  let json = {};
  try {
    json = await res.json();
  } catch {
    json = {};
  }

  if (!res.ok) {
    const msg =
      json.message ||
      json.error ||
      `Upload thất bại (${res.status})`;
    const err = new Error(typeof msg === 'string' ? msg : 'Upload thất bại');
    err.status = res.status;
    err.response = { data: json, status: res.status };
    throw err;
  }

  return { data: json };
}
