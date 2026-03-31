/** Một dòng biến thể trong form admin */
export interface ProductVariantRow {
  tempKey: string;
  sku: string;
  /** Thuộc tính động (size, color, …) */
  attributes: Record<string, string>;
  /** Chỉ dùng khi có thuộc tính "color" — swatch */
  colorHex: string;
  /** true = đã chỉnh bằng color picker; không ghi đè bởi tự động từ tên màu */
  colorHexLocked?: boolean;
  price: number;
  stockQuantity: number;
}

/** Cấu hình để sinh tổ hợp: mỗi key → danh sách giá trị */
export type AttributeValueMatrix = Record<string, string[]>;
