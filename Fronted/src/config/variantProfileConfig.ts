/**
 * Cấu hình biến thể theo danh mục (khớp backend Category.variantProfile).
 * dim1 + dim2 là hai trục khi sinh tổ hợp; dim2 luôn dùng key `color` để đồng bộ ô màu / API.
 */

export type VariantProfileId =
  | 'apparel'
  | 'footwear'
  | 'accessory'
  | 'equipment'
  | 'generic';

export interface VariantDimensionDef {
  key: string;
  label: string;
  placeholder: string;
  /** Gợi ý ô sinh tự động */
  genPlaceholder: string;
}

export interface VariantProfileDef {
  id: VariantProfileId;
  title: string;
  description: string;
  dim1: VariantDimensionDef;
  /** Luôn dùng key `color` để map ô màu & hex */
  dim2: VariantDimensionDef;
}

const COLOR_DIM: VariantDimensionDef = {
  key: 'color',
  label: 'Màu',
  placeholder: 'Đỏ',
  genPlaceholder: 'VD: Đỏ, Xanh navy, Đen',
};

export const VARIANT_PROFILES: Record<VariantProfileId, VariantProfileDef> = {
  generic: {
    id: 'generic',
    title: 'Chung (Size + Màu)',
    description: 'Giống áo quần: cột Size và Màu.',
    dim1: {
      key: 'size',
      label: 'Size',
      placeholder: 'M',
      genPlaceholder: 'VD: S, M, L, XL',
    },
    dim2: COLOR_DIM,
  },
  apparel: {
    id: 'apparel',
    title: 'Áo quần',
    description: 'Size (S/M/L) và màu sắc.',
    dim1: {
      key: 'size',
      label: 'Size',
      placeholder: 'M',
      genPlaceholder: 'VD: S, M, L, XL',
    },
    dim2: COLOR_DIM,
  },
  footwear: {
    id: 'footwear',
    title: 'Giày dép',
    description: 'Cỡ giày (VN/EU/US) và màu.',
    dim1: {
      key: 'shoeSize',
      label: 'Cỡ giày',
      placeholder: '42',
      genPlaceholder: 'VD: 39, 40, 41, 42',
    },
    dim2: COLOR_DIM,
  },
  accessory: {
    id: 'accessory',
    title: 'Phụ kiện',
    description: 'Loại / kiểu sản phẩm và màu (nếu có).',
    dim1: {
      key: 'type',
      label: 'Loại / Kiểu',
      placeholder: 'Tất',
      genPlaceholder: 'VD: Tất, Băng đô, Túi',
    },
    dim2: COLOR_DIM,
  },
  equipment: {
    id: 'equipment',
    title: 'Dụng cụ thể thao',
    description: 'Quy cách (trọng lượng, kích thước…) và màu/phiên bản.',
    dim1: {
      key: 'spec',
      label: 'Quy cách / Size',
      placeholder: '5kg',
      genPlaceholder: 'VD: 5kg, 10kg, Size M',
    },
    dim2: COLOR_DIM,
  },
};

export function resolveVariantProfile(id?: string | null): VariantProfileDef {
  const k = (id || 'generic') as VariantProfileId;
  return VARIANT_PROFILES[k] ?? VARIANT_PROFILES.generic;
}

/** Các key hiển thị trong cột chính — phần còn lại vào "Khác" */
export function profileAttributeKeys(def: VariantProfileDef): Set<string> {
  return new Set([
    def.dim1.key,
    def.dim2.key,
    def.dim1.key.charAt(0).toUpperCase() + def.dim1.key.slice(1),
    def.dim2.key.charAt(0).toUpperCase() + def.dim2.key.slice(1),
  ]);
}
