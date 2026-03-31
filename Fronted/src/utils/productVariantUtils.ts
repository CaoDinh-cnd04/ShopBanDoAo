import type { ProductVariantRow } from '../types/productVariant';

/** Chuẩn hóa tên màu để tra bảng (bỏ dấu, thường, đ→d) */
function normalizeColorName(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/đ/g, 'd') // tiếng Việt: Đen/đen → den (NFD không luôn tách được đ)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

/** Tên màu tiếng Việt / Anh → hex (màn hình shop) */
const COLOR_NAME_HEX: Record<string, string> = {
  do: '#dc2626',
  red: '#dc2626',
  'do den': '#7f1d1d',
  'do tươi': '#ef4444',
  hong: '#ec4899',
  pink: '#ec4899',
  cam: '#ea580c',
  orange: '#ea580c',
  vang: '#eab308',
  'vang kem': '#fde047',
  yellow: '#eab308',
  xanh: '#16a34a',
  'xanh la': '#22c55e',
  'xanh lá': '#22c55e',
  green: '#16a34a',
  'xanh duong': '#2563eb',
  'xanh dương': '#2563eb',
  blue: '#2563eb',
  'xanh navy': '#1e3a8a',
  navy: '#1e3a8a',
  'xanh ngoc': '#14b8a6',
  teal: '#14b8a6',
  tim: '#9333ea',
  purple: '#9333ea',
  den: '#171717',
  black: '#171717',
  trang: '#f5f5f5',
  white: '#ffffff',
  xam: '#6b7280',
  grey: '#6b7280',
  gray: '#6b7280',
  nau: '#78350f',
  brown: '#78350f',
  be: '#d6d3d1',
  beige: '#d6d3d1',
  bac: '#9ca3af',
  silver: '#9ca3af',
  'vang dong': '#ca8a04',
  gold: '#eab308',
};

/** Gợi ý hex từ chữ màu (ô "Màu"); không khớp → null */
export function hexFromColorName(text: string): string | null {
  const raw = normalizeColorName(text);
  if (!raw) return null;
  if (COLOR_NAME_HEX[raw]) return COLOR_NAME_HEX[raw];
  for (const key of Object.keys(COLOR_NAME_HEX).sort((a, b) => b.length - a.length)) {
    if (raw === key || raw.includes(key) || key.includes(raw)) {
      return COLOR_NAME_HEX[key];
    }
  }
  return null;
}

/** Hex mặc định cho biến thể mới / sinh từ tổ hợp (theo chữ màu nếu có) */
export function defaultColorHexForAttributes(attrs: Record<string, string>): string {
  const colorText = attrs.color ?? attrs.Color ?? '';
  return hexFromColorName(String(colorText)) ?? '#94a3b8';
}

/** Tích Descartes: [['S','M'], ['Red']] → [['S','Red'], ['M','Red']] */
export function cartesianCombinations<T>(groups: T[][]): T[][] {
  if (!groups.length) return [[]];
  return groups.reduce<T[][]>(
    (acc, group) => acc.flatMap((prefix) => group.map((g) => [...prefix, g])),
    [[]],
  );
}

/** Chuẩn hóa key để so trùng: sort theo tên thuộc tính */
export function variantSignature(attrs: Record<string, string>): string {
  return Object.keys(attrs)
    .sort()
    .map((k) => `${k.trim().toLowerCase()}=${String(attrs[k] ?? '').trim().toLowerCase()}`)
    .join('|');
}

export function computePriceRange(
  variants: Pick<ProductVariantRow, 'price'>[],
): { min: number; max: number } | null {
  const prices = variants
    .map((v) => Number(v.price))
    .filter((n) => !Number.isNaN(n) && n >= 0);
  if (!prices.length) return null;
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export function validateVariants(
  variants: ProductVariantRow[],
): string | null {
  const sigs = new Set<string>();
  const skus = new Set<string>();

  for (const v of variants) {
    const sku = (v.sku || '').trim();
    if (!sku) return 'Mỗi biến thể cần có SKU.';
    if (skus.has(sku)) return `SKU trùng: ${sku}`;
    skus.add(sku);

    const sig = variantSignature(v.attributes || {});
    if (sigs.has(sig)) return 'Có biến thể trùng thuộc tính.';
    sigs.add(sig);

    const p = Number(v.price);
    if (Number.isNaN(p) || p < 0) return 'Giá biến thể phải ≥ 0.';
    const s = Number(v.stockQuantity);
    if (Number.isNaN(s) || s < 0) return 'Tồn kho biến thể phải ≥ 0.';
  }
  return null;
}

/** SKU gợi ý: PREFIX-abc-def */
export function suggestSku(
  prefix: string,
  attrs: Record<string, string>,
  index: number,
): string {
  const slug = Object.entries(attrs)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, val]) =>
      String(val)
        .trim()
        .toUpperCase()
        .replace(/\s+/g, '-')
        .replace(/[^A-Z0-9-]/g, '')
        .slice(0, 12),
    )
    .filter(Boolean)
    .join('-');
  const base = (prefix || 'VAR').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
  return [base, slug || `I${index + 1}`, String(index + 1).padStart(2, '0')]
    .filter(Boolean)
    .join('-')
    .slice(0, 64);
}

export function newTempKey(): string {
  return `v-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function emptyVariantRow(basePrice = 0): ProductVariantRow {
  return {
    tempKey: newTempKey(),
    sku: '',
    attributes: {},
    colorHex: '#94a3b8',
    price: basePrice,
    stockQuantity: 0,
  };
}
