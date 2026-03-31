import { useCallback, useMemo } from 'react';
import type { ProductVariantRow } from '../types/productVariant';
import type { AttributeValueMatrix } from '../types/productVariant';
import {
  cartesianCombinations,
  computePriceRange,
  defaultColorHexForAttributes,
  emptyVariantRow,
  newTempKey,
  suggestSku,
  validateVariants,
  variantSignature,
} from '../utils/productVariantUtils';

export interface UseProductVariantsOptions {
  variants: ProductVariantRow[];
  onChange: (next: ProductVariantRow[]) => void;
  /** Giá gốc để điền khi sinh biến thể */
  basePrice: number;
  /** Tiền tố SKU (SKU sản phẩm hoặc slug) */
  skuPrefix: string;
}

export function useProductVariants({
  variants,
  onChange,
  basePrice,
  skuPrefix,
}: UseProductVariantsOptions) {
  const priceRange = useMemo(() => computePriceRange(variants), [variants]);

  const validationError = useMemo(
    () => (variants.length ? validateVariants(variants) : null),
    [variants],
  );

  const updateRow = useCallback(
    (index: number, patch: Partial<ProductVariantRow>) => {
      onChange(
        variants.map((row, i) => (i === index ? { ...row, ...patch } : row)),
      );
    },
    [variants, onChange],
  );

  const removeRow = useCallback(
    (index: number) => {
      onChange(variants.filter((_, i) => i !== index));
    },
    [variants, onChange],
  );

  const addEmptyRow = useCallback(() => {
    onChange([...variants, emptyVariantRow(basePrice)]);
  }, [variants, onChange, basePrice]);

  const bulkSetPrice = useCallback(
    (value: number) => {
      if (Number.isNaN(value) || value < 0) return;
      onChange(variants.map((v) => ({ ...v, price: value })));
    },
    [variants, onChange],
  );

  const bulkSetStock = useCallback(
    (value: number) => {
      if (Number.isNaN(value) || value < 0) return;
      onChange(variants.map((v) => ({ ...v, stockQuantity: value })));
    },
    [variants, onChange],
  );

  /**
   * matrix: { size: ['S','M'], color: ['Đỏ'] } → tổ hợp đủ
   * Bỏ qua key có mảng rỗng
   */
  const generateFromMatrix = useCallback(
    (matrix: AttributeValueMatrix) => {
      const keys = Object.keys(matrix).filter((k) => k.trim());
      const valueLists = keys.map((k) =>
        (matrix[k] || [])
          .map((x) => String(x).trim())
          .filter(Boolean),
      );
      if (valueLists.some((l) => !l.length)) {
        return { ok: false as const, error: 'Mỗi thuộc tính cần ít nhất một giá trị.' };
      }
      if (!keys.length) {
        return { ok: false as const, error: 'Thêm ít nhất một thuộc tính.' };
      }

      const combos = cartesianCombinations(valueLists);
      const seen = new Set<string>();
      const next: ProductVariantRow[] = [];

      combos.forEach((combo, idx) => {
        const attrs: Record<string, string> = {};
        keys.forEach((key, i) => {
          attrs[key] = combo[i];
        });
        const sig = variantSignature(attrs);
        if (seen.has(sig)) return;
        seen.add(sig);

        next.push({
          tempKey: newTempKey(),
          sku: suggestSku(skuPrefix, attrs, idx),
          attributes: attrs,
          colorHex: defaultColorHexForAttributes(attrs),
          price: Number.isFinite(basePrice) ? basePrice : 0,
          stockQuantity: 0,
        });
      });

      if (!next.length) {
        return { ok: false as const, error: 'Không tạo được tổ hợp nào.' };
      }

      onChange(next);
      return { ok: true as const };
    },
    [onChange, basePrice, skuPrefix],
  );

  const appendGenerated = useCallback(
    (matrix: AttributeValueMatrix) => {
      const keys = Object.keys(matrix).filter((k) => k.trim());
      const valueLists = keys.map((k) =>
        (matrix[k] || [])
          .map((x) => String(x).trim())
          .filter(Boolean),
      );
      if (valueLists.some((l) => !l.length) || !keys.length) {
        return { ok: false as const, error: 'Kiểm tra lại thuộc tính và giá trị.' };
      }
      const combos = cartesianCombinations(valueLists);
      const existingSigs = new Set(variants.map((v) => variantSignature(v.attributes || {})));
      const existingSkus = new Set(
        variants.map((v) => (v.sku || '').trim()).filter(Boolean),
      );

      const appended: ProductVariantRow[] = [];
      combos.forEach((combo) => {
        const attrs: Record<string, string> = {};
        keys.forEach((key, i) => {
          attrs[key] = combo[i];
        });
        const sig = variantSignature(attrs);
        if (existingSigs.has(sig)) return;
        existingSigs.add(sig);

        let sku = suggestSku(skuPrefix, attrs, variants.length + appended.length);
        while (existingSkus.has(sku)) {
          sku = `${sku}-X`;
        }
        existingSkus.add(sku);

        appended.push({
          tempKey: newTempKey(),
          sku,
          attributes: attrs,
          colorHex: defaultColorHexForAttributes(attrs),
          price: Number.isFinite(basePrice) ? basePrice : 0,
          stockQuantity: 0,
        });
      });

      if (!appended.length) {
        return { ok: false as const, error: 'Tất cả tổ hợp đã tồn tại.' };
      }
      onChange([...variants, ...appended]);
      return { ok: true as const };
    },
    [variants, onChange, basePrice, skuPrefix],
  );

  return {
    priceRange,
    validationError,
    updateRow,
    removeRow,
    addEmptyRow,
    bulkSetPrice,
    bulkSetStock,
    generateFromMatrix,
    appendGenerated,
  };
}
