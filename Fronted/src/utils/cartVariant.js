/**
 * Sản phẩm có biến thể — backend bắt buộc variantId.
 * Chọn biến thể còn hàng đầu tiên (hoặc biến thể đầu) khi thêm nhanh từ danh sách.
 */
export function getDefaultVariantIdForProduct(product) {
  const vars = product?.variants;
  if (!Array.isArray(vars) || vars.length === 0) return undefined;
  const withStock = vars.find((v) => Number(v.stockQuantity) > 0);
  const v = withStock || vars[0];
  return v?._id?.toString() || v?.id?.toString() || undefined;
}
