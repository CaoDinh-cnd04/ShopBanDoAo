import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Col, Form, InputGroup, Row, Table } from 'react-bootstrap';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import {
  profileAttributeKeys,
  resolveVariantProfile,
  type VariantProfileDef,
} from '../../../config/variantProfileConfig';
import { useProductVariants } from '../../../hooks/useProductVariants';
import type { ProductVariantRow } from '../../../types/productVariant';
import { fmt } from '../../../utils/adminProductHelpers';
import { hexFromColorName } from '../../../utils/productVariantUtils';
import './ProductVariantEditor.css';

function parseCommaValues(text: string): string[] {
  return text
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function getExtras(
  attrs: Record<string, string> | undefined,
  excluded: Set<string>,
): [string, string][] {
  if (!attrs) return [];
  return Object.entries(attrs).filter(([k]) => !excluded.has(k));
}

function readDim1(attrs: Record<string, string>, def: VariantProfileDef): string {
  const k = def.dim1.key;
  const v = attrs[k];
  if (v != null && String(v).trim() !== '') return String(v);
  if (k === 'shoeSize' && attrs.size) return String(attrs.size);
  if (k === 'size' && attrs.shoeSize) return String(attrs.shoeSize);
  return '';
}

function readColor(attrs: Record<string, string>): string {
  return String(attrs.color ?? attrs.Color ?? '');
}

export interface ProductVariantEditorProps {
  variants: ProductVariantRow[];
  onVariantsChange: (next: ProductVariantRow[]) => void;
  basePrice: number;
  skuPrefix: string;
  stockQuantity: number;
  onStockQuantityChange: (n: number) => void;
  /** Theo Category.variantProfile (backend) */
  variantProfile?: string | null;
}

export function ProductVariantEditor({
  variants,
  onVariantsChange,
  basePrice,
  skuPrefix,
  stockQuantity,
  onStockQuantityChange,
  variantProfile,
}: ProductVariantEditorProps) {
  const def = useMemo(
    () => resolveVariantProfile(variantProfile),
    [variantProfile],
  );

  const excludedKeys = useMemo(() => profileAttributeKeys(def), [def]);

  const {
    priceRange,
    validationError,
    updateRow,
    removeRow,
    addEmptyRow,
    bulkSetPrice,
    bulkSetStock,
    generateFromMatrix,
    appendGenerated,
  } = useProductVariants({
    variants,
    onChange: onVariantsChange,
    basePrice,
    skuPrefix,
  });

  const [genDim1, setGenDim1] = useState('S, M, L');
  const [genDim2, setGenDim2] = useState('Đỏ, Xanh, Đen');
  const [replaceAll, setReplaceAll] = useState(true);
  const [bulkPriceInput, setBulkPriceInput] = useState('');
  const [bulkStockInput, setBulkStockInput] = useState('');

  useEffect(() => {
    const d = resolveVariantProfile(variantProfile);
    if (d.dim1.key === 'shoeSize') {
      setGenDim1('39, 40, 41, 42');
    } else if (d.dim1.key === 'type') {
      setGenDim1('Loại A, Loại B');
    } else if (d.dim1.key === 'spec') {
      setGenDim1('5kg, 10kg');
    } else {
      setGenDim1('S, M, L');
    }
    setGenDim2('Đỏ, Xanh, Đen');
  }, [variantProfile]);

  const handleGenerate = useCallback(() => {
    const d1 = parseCommaValues(genDim1);
    const d2 = parseCommaValues(genDim2);
    if (!d1.length || !d2.length) {
      window.alert(
        `Nhập ít nhất một giá trị cho "${def.dim1.label}" và "${def.dim2.label}" (phân tách bằng dấu phẩy).`,
      );
      return;
    }
    const matrix: Record<string, string[]> = {
      [def.dim1.key]: d1,
      [def.dim2.key]: d2,
    };
    const res = replaceAll ? generateFromMatrix(matrix) : appendGenerated(matrix);
    if (!res.ok && 'error' in res) {
      window.alert(res.error);
    }
  }, [
    genDim1,
    genDim2,
    replaceAll,
    generateFromMatrix,
    appendGenerated,
    def.dim1.key,
    def.dim2.key,
    def.dim1.label,
    def.dim2.label,
  ]);

  const handleBulkPrice = useCallback(() => {
    const n = Number(bulkPriceInput);
    if (Number.isNaN(n) || n < 0) return;
    bulkSetPrice(n);
  }, [bulkPriceInput, bulkSetPrice]);

  const handleBulkStock = useCallback(() => {
    const n = Number(bulkStockInput);
    if (Number.isNaN(n) || n < 0) return;
    bulkSetStock(n);
  }, [bulkStockInput, bulkSetStock]);

  const setDim1 = useCallback(
    (index: number, v: ProductVariantRow, val: string) => {
      const key = def.dim1.key;
      updateRow(index, {
        attributes: { ...(v.attributes || {}), [key]: val.trim() },
      });
    },
    [updateRow, def.dim1.key],
  );

  const setColorText = useCallback(
    (index: number, v: ProductVariantRow, text: string) => {
      const t = text.trim();
      const hex = hexFromColorName(t);
      updateRow(index, {
        attributes: { ...(v.attributes || {}), color: t },
        colorHexLocked: false,
        ...(hex ? { colorHex: hex } : {}),
      });
    },
    [updateRow],
  );

  const hasExtras = useMemo(
    () => variants.some((v) => getExtras(v.attributes, excludedKeys).length > 0),
    [variants, excludedKeys],
  );

  /** Ưu tiên hex suy từ tên màu; colorHex lưu chỉ dùng khi chưa suy ra được hoặc đã khóa bằng picker */
  const swatchHex = (v: ProductVariantRow, colorText: string) => {
    const derived = hexFromColorName(colorText);
    if (v.colorHexLocked) return v.colorHex || derived || '#94a3b8';
    return derived ?? v.colorHex ?? '#94a3b8';
  };

  const colorInputValue = (hex: string) =>
    /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : '#94a3b8';

  return (
    <div className="product-variant-editor pve-simple">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
        <div>
          <h5 className="mb-1">Biến thể &amp; tồn kho</h5>
          <p className="text-muted small mb-0 pve-lead">
            <strong>Loại danh mục:</strong> {def.title} — {def.description}
            <br />
            <strong>Không có biến thể:</strong> nhập tồn kho ở dưới — bán một giá (ô &quot;Giá bán chính&quot; ở
            trên).
            <br />
            <strong>Có biến thể:</strong> mỗi dòng một {def.dim1.label.toLowerCase()} / {def.dim2.label.toLowerCase()}{' '}
            (hoặc sinh tự động), giá và tồn theo từng dòng.
          </p>
        </div>
        <Button type="button" size="sm" variant="primary" onClick={addEmptyRow}>
          <FiPlus className="me-1" /> Thêm dòng
        </Button>
      </div>

      {variants.length > 0 && priceRange && (
        <p className="pve-price-hint small text-muted mb-2">
          Giá hiển thị (min – max): <strong>{fmt(priceRange.min)}</strong> —{' '}
          <strong>{fmt(priceRange.max)}</strong>
        </p>
      )}

      {validationError && (
        <div className="text-danger small mb-2">{validationError}</div>
      )}

      <details className="pve-details mb-3">
        <summary className="pve-summary">
          Sinh tự động từ {def.dim1.label} &amp; {def.dim2.label}
        </summary>
        <div className="pve-details-body mt-2">
          <p className="small text-muted mb-2">
            Điền danh sách cách nhau bằng dấu phẩy. Hệ thống tạo mọi tổ hợp với giá ={' '}
            <strong>giá gốc</strong> ô phía trên. Ô màu (swatch) khớp theo chữ màu khi có thể.
          </p>
          <Row className="g-2 mb-2">
            <Col xs={12} md={6}>
              <Form.Label className="small mb-0">{def.dim1.label}</Form.Label>
              <Form.Control
                size="sm"
                placeholder={def.dim1.genPlaceholder}
                value={genDim1}
                onChange={(e) => setGenDim1(e.target.value)}
              />
            </Col>
            <Col xs={12} md={6}>
              <Form.Label className="small mb-0">{def.dim2.label}</Form.Label>
              <Form.Control
                size="sm"
                placeholder={def.dim2.genPlaceholder}
                value={genDim2}
                onChange={(e) => setGenDim2(e.target.value)}
              />
            </Col>
          </Row>
          <div className="d-flex flex-wrap align-items-center gap-2">
            <Form.Check
              type="checkbox"
              id="pv-replace-all"
              label="Xóa biến thể cũ và tạo lại từ đầu"
              checked={replaceAll}
              onChange={(e) => setReplaceAll(e.target.checked)}
              className="small"
            />
            <Button type="button" size="sm" variant="success" onClick={handleGenerate}>
              Tạo biến thể
            </Button>
          </div>
        </div>
      </details>

      <Row className="g-2 mb-3 align-items-end">
        <Col xs={12} sm={6} md={4}>
          <Form.Label className="small mb-0">Giá cho mọi dòng (₫)</Form.Label>
          <InputGroup size="sm">
            <Form.Control
              type="number"
              min={0}
              step={1000}
              value={bulkPriceInput}
              onChange={(e) => setBulkPriceInput(e.target.value)}
              placeholder="299000"
            />
            <Button type="button" variant="outline-primary" onClick={handleBulkPrice}>
              Áp dụng
            </Button>
          </InputGroup>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Form.Label className="small mb-0">Tồn cho mọi dòng</Form.Label>
          <InputGroup size="sm">
            <Form.Control
              type="number"
              min={0}
              value={bulkStockInput}
              onChange={(e) => setBulkStockInput(e.target.value)}
              placeholder="0"
            />
            <Button type="button" variant="outline-primary" onClick={handleBulkStock}>
              Áp dụng
            </Button>
          </InputGroup>
        </Col>
      </Row>

      {!variants.length ? (
        <Form.Group className="mb-0">
          <Form.Label>Số lượng tồn kho (sản phẩm không có biến thể)</Form.Label>
          <Form.Control
            type="number"
            min={0}
            value={stockQuantity}
            onChange={(e) => onStockQuantityChange(Number(e.target.value))}
            style={{ maxWidth: 220 }}
          />
        </Form.Group>
      ) : (
        <>
          <p className="small text-muted mb-2">
            Tổng tồn các biến thể:{' '}
            <strong>
              {variants.reduce((s, v) => s + (Number(v.stockQuantity) || 0), 0)}
            </strong>
          </p>

          <div className="table-responsive admin-variant-table-wrap">
            <Table size="sm" bordered className="admin-variant-table mb-0 pve-table">
              <thead>
                <tr>
                  <th style={{ minWidth: 120 }}>SKU</th>
                  <th style={{ minWidth: 72 }}>{def.dim1.label}</th>
                  <th style={{ minWidth: 100 }}>{def.dim2.label}</th>
                  {hasExtras && <th>Khác</th>}
                  <th style={{ minWidth: 110 }}>Giá (₫)</th>
                  <th style={{ minWidth: 72 }}>Tồn</th>
                  <th style={{ width: 44 }} />
                </tr>
              </thead>
              <tbody>
                {variants.map((v, index) => {
                  const attrs = v.attributes || {};
                  const dim1Val = readDim1(attrs, def);
                  const colorVal = readColor(attrs);
                  const extras = getExtras(attrs, excludedKeys);
                  return (
                    <tr key={v.tempKey}>
                      <td>
                        <Form.Control
                          size="sm"
                          value={v.sku}
                          onChange={(e) =>
                            updateRow(index, { sku: e.target.value })
                          }
                          placeholder="VD: SP-001-M-DO"
                        />
                      </td>
                      <td>
                        <Form.Control
                          size="sm"
                          value={dim1Val}
                          onChange={(e) => setDim1(index, v, e.target.value)}
                          placeholder={def.dim1.placeholder}
                        />
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-1">
                          <Form.Control
                            size="sm"
                            value={colorVal}
                            onChange={(e) => setColorText(index, v, e.target.value)}
                            placeholder={def.dim2.placeholder}
                            className="flex-grow-1"
                          />
                          <input
                            type="color"
                            className="pve-swatch"
                            value={colorInputValue(swatchHex(v, colorVal))}
                            onChange={(e) =>
                              updateRow(index, {
                                colorHex: e.target.value,
                                colorHexLocked: true,
                              })
                            }
                            title="Tinh chỉnh màu hiển thị (shop)"
                            aria-label="Màu hiển thị"
                          />
                        </div>
                      </td>
                      {hasExtras && (
                        <td className="small text-muted pve-extras">
                          {extras.length ? (
                            extras.map(([k, val]) => (
                              <span key={k} className="d-block">
                                {k}: {val}
                              </span>
                            ))
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                      )}
                      <td>
                        <Form.Control
                          size="sm"
                          type="number"
                          min={0}
                          step={1000}
                          value={v.price}
                          onChange={(e) =>
                            updateRow(index, {
                              price: Number(e.target.value),
                            })
                          }
                        />
                      </td>
                      <td>
                        <Form.Control
                          size="sm"
                          type="number"
                          min={0}
                          value={v.stockQuantity}
                          onChange={(e) =>
                            updateRow(index, {
                              stockQuantity: Number(e.target.value),
                            })
                          }
                        />
                      </td>
                      <td className="text-center p-0">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline-danger"
                          className="border-0"
                          onClick={() => removeRow(index)}
                        >
                          <FiTrash2 />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>

          <Form.Group className="mt-3 mb-0">
            <Form.Label className="small text-muted">
              Tồn kho ghi trên sản phẩm (tuỳ chọn — thường để 0)
            </Form.Label>
            <Form.Control
              type="number"
              min={0}
              value={stockQuantity}
              onChange={(e) => onStockQuantityChange(Number(e.target.value))}
              style={{ maxWidth: 220 }}
            />
          </Form.Group>
        </>
      )}
    </div>
  );
}

export default ProductVariantEditor;
