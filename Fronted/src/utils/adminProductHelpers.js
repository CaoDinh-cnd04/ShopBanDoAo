const fmt = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(n) || 0);

/** URL ảnh đầu tiên hoặc null */
export function productPrimaryImageUrl(product) {
  const list = product?.images;
  if (!Array.isArray(list) || !list.length) return null;
  const u = list[0]?.imageUrl;
  return typeof u === 'string' && u.trim() ? u.trim() : null;
}

export function productPriceMin(product) {
  const def = Number(product?.defaultPrice ?? 0);
  const vars = Array.isArray(product?.variants) ? product.variants : [];
  const prices = vars.map((v) => Number(v?.price)).filter((x) => !Number.isNaN(x));
  if (!prices.length) return def;
  return Math.min(def, ...prices);
}

export function productPriceMax(product) {
  const def = Number(product?.defaultPrice ?? 0);
  const vars = Array.isArray(product?.variants) ? product.variants : [];
  const prices = vars.map((v) => Number(v?.price)).filter((x) => !Number.isNaN(x));
  if (!prices.length) return def;
  return Math.max(def, ...prices);
}

/** Hiển thị khoảng giá nếu nhiều biến thể */
export function productPriceLabel(product) {
  const min = productPriceMin(product);
  const max = productPriceMax(product);
  if (min === max) return fmt(min);
  return `${fmt(min)} – ${fmt(max)}`;
}

/** Tổng tồn: cộng biến thể hoặc tồn sản phẩm */
export function productStockTotal(product) {
  const vars = Array.isArray(product?.variants) ? product.variants : [];
  if (vars.length) {
    return vars.reduce((s, v) => s + (Number(v?.stockQuantity) || 0), 0);
  }
  return Number(product?.stockQuantity ?? 0);
}

export function categoryLabel(product) {
  const c = product?.categoryId;
  if (c && typeof c === 'object') {
    return c.categoryName || c.CategoryName || '—';
  }
  return '—';
}

export function variantCount(product) {
  const v = product?.variants;
  return Array.isArray(v) ? v.length : 0;
}

export { fmt };
