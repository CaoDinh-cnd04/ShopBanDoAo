import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Card, Form, Button, Row, Col, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { FiArrowLeft } from 'react-icons/fi';
import api from '../../services/api';
import adminService from '../../services/adminService';
import { fmt } from '../../utils/adminProductHelpers';
import { ProductVariantEditor } from '../../components/Admin/ProductVariantEditor/ProductVariantEditor';
import { AdminProductImages } from '../../components/Admin/AdminProductImages';
import { validateVariants } from '../../utils/productVariantUtils';
import { resolveVariantProfile } from '../../config/variantProfileConfig';
import './AdminProductForm.css';

const emptyForm = {
  sku: '',
  productName: '',
  productSlug: '',
  categoryId: '',
  brand: '',
  defaultPrice: '',
  originalPrice: '',
  shortDescription: '',
  longDescription: '',
  material: '',
  origin: '',
  weight: '',
  stockQuantity: 0,
  isFeatured: false,
  isActive: true,
  images: [],
  variants: [],
};

const AdminProductForm = () => {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brandSuggestions, setBrandSuggestions] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const selectedCategory = useMemo(() => {
    const cid = form.categoryId;
    if (!cid) return null;
    return categories.find(
      (c) => String(c._id ?? c.categoryId ?? '') === String(cid),
    );
  }, [categories, form.categoryId]);

  const variantProfile = selectedCategory?.variantProfile ?? 'generic';

  const loadMeta = useCallback(async () => {
    try {
      const [catRes, brandRes] = await Promise.all([
        api.get('/categories'),
        adminService.products.getDistinctBrands(),
      ]);
      setCategories(Array.isArray(catRes.data?.data) ? catRes.data.data : []);
      const b = brandRes.data?.data;
      setBrandSuggestions(Array.isArray(b) ? b : []);
    } catch (e) {
      console.error(e);
      toast.error('Không tải được danh mục / thương hiệu');
    }
  }, []);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const res = await adminService.products.getProductById(id);
        const p = res.data?.data;
        if (cancelled || !p) return;
        const cid = p.categoryId?._id?.toString?.() || p.categoryId?.toString?.() || '';
        setForm({
          sku: p.sku ?? '',
          productName: p.productName ?? '',
          productSlug: p.productSlug ?? '',
          categoryId: cid,
          brand: p.brand ?? '',
          defaultPrice: p.defaultPrice != null ? String(p.defaultPrice) : '',
          originalPrice: p.originalPrice != null ? String(p.originalPrice) : '',
          shortDescription: p.shortDescription ?? '',
          longDescription: p.longDescription ?? '',
          material: p.material ?? '',
          origin: p.origin ?? '',
          weight: p.weight != null ? String(p.weight) : '',
          stockQuantity: Number(p.stockQuantity ?? 0),
          isFeatured: !!p.isFeatured,
          isActive: p.isActive !== false,
          images:
            Array.isArray(p.images) && p.images.length
              ? p.images.map((x) => ({
                  imageUrl: x.imageUrl || '',
                  color: x.color || '',
                }))
              : [],
          variants: Array.isArray(p.variants)
            ? p.variants.map((v) => {
                const attrs =
                  v.attributes && typeof v.attributes === 'object' && !Array.isArray(v.attributes)
                    ? { ...v.attributes }
                    : {};
                if (v.size != null && v.size !== '') attrs.size = String(v.size);
                if (v.color != null && v.color !== '') attrs.color = String(v.color);
                return {
                  tempKey: v._id?.toString?.() || `v-${Math.random().toString(36).slice(2)}`,
                  sku: v.sku ?? '',
                  attributes: attrs,
                  colorHex: v.colorHex || '#2563eb',
                  price: Number(v.price ?? 0),
                  stockQuantity: Number(v.stockQuantity ?? 0),
                };
              })
            : [],
        });
      } catch (e) {
        console.error(e);
        toast.error(e.response?.data?.message || 'Không tải được sản phẩm');
        navigate('/admin/products');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id, isNew, navigate]);

  const buildPayload = () => {
    const images = form.images
      .map((r) => {
        const imageUrl = (r.imageUrl || '').trim();
        if (!imageUrl) return null;
        const o = { imageUrl };
        const c = (r.color || '').trim();
        if (c) o.color = c;
        return o;
      })
      .filter(Boolean);

    const def = resolveVariantProfile(
      selectedCategory?.variantProfile ?? 'generic',
    );

    const variants = form.variants.map((v) => {
      const attrs = { ...(v.attributes || {}) };
      const dim1Key = def.dim1.key;
      const dim1Val = attrs[dim1Key] ?? attrs[dim1Key.charAt(0).toUpperCase() + dim1Key.slice(1)];
      const sizeVal =
        dim1Val ??
        attrs.size ??
        attrs.Size ??
        attrs.shoeSize ??
        attrs.spec ??
        attrs.type;
      const colorVal = attrs.color ?? attrs.Color;
      return {
        sku: (v.sku || '').trim() || undefined,
        attributes: Object.keys(attrs).length ? attrs : undefined,
        size: typeof sizeVal === 'string' ? sizeVal.trim() || undefined : undefined,
        color: typeof colorVal === 'string' ? colorVal.trim() || undefined : undefined,
        colorHex: v.colorHex?.trim() || undefined,
        price: Number(v.price),
        stockQuantity: Math.max(0, Number(v.stockQuantity ?? 0)),
      };
    });

    for (const v of variants) {
      if (Number.isNaN(v.price) || v.price < 0) {
        throw new Error('Mỗi biến thể cần giá hợp lệ (≥ 0)');
      }
    }

    let defaultPrice;
    if (variants.length) {
      const vErr = validateVariants(form.variants);
      if (vErr) throw new Error(vErr);
      const prices = variants.map((x) => x.price).filter((n) => !Number.isNaN(n));
      if (!prices.length) throw new Error('Cần ít nhất một biến thể có giá hợp lệ');
      defaultPrice = Math.min(...prices);
    } else {
      defaultPrice = Number(form.defaultPrice);
      if (Number.isNaN(defaultPrice) || defaultPrice < 0) {
        throw new Error('Giá mặc định không hợp lệ');
      }
    }

    const originalPrice =
      form.originalPrice === '' ? undefined : Number(form.originalPrice);
    if (originalPrice !== undefined && (Number.isNaN(originalPrice) || originalPrice < 0)) {
      throw new Error('Giá niêm yết không hợp lệ');
    }

    const weight = form.weight === '' ? undefined : Number(form.weight);
    if (weight !== undefined && Number.isNaN(weight)) throw new Error('Trọng lượng không hợp lệ');

    const stockQuantity = Math.max(0, Number(form.stockQuantity ?? 0));

    return {
      productName: form.productName.trim(),
      productSlug: form.productSlug.trim(),
      defaultPrice,
      categoryId: form.categoryId,
      brand: form.brand.trim() || undefined,
      sku: form.sku.trim() || undefined,
      shortDescription: form.shortDescription.trim() || undefined,
      longDescription: form.longDescription.trim() || undefined,
      originalPrice,
      isFeatured: form.isFeatured,
      material: form.material.trim() || undefined,
      origin: form.origin.trim() || undefined,
      weight,
      stockQuantity,
      images: images.length ? images : undefined,
      variants: variants.length ? variants : [],
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.categoryId) {
      toast.error('Chọn danh mục');
      return;
    }
    let payload;
    try {
      payload = buildPayload();
    } catch (err) {
      toast.error(err.message || 'Dữ liệu không hợp lệ');
      return;
    }

    try {
      setSaving(true);
      if (isNew) {
        await adminService.products.createProduct({
          ...payload,
          isActive: form.isActive,
        });
        toast.success('Tạo sản phẩm thành công');
      } else {
        await adminService.products.updateProduct(id, {
          ...payload,
          isActive: form.isActive,
        });
        toast.success('Cập nhật sản phẩm thành công');
      }
      navigate('/admin/products');
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        err.message ||
        'Lưu thất bại';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page text-center py-5">
        <Spinner animation="border" />
        <div className="mt-2 text-muted">Đang tải sản phẩm…</div>
      </div>
    );
  }

  return (
    <div className="admin-page admin-product-form">
      <div className="admin-page-header">
        <div>
          <Link to="/admin/products" className="admin-back-link d-inline-flex align-items-center gap-2 mb-2">
            <FiArrowLeft /> Danh sách sản phẩm
          </Link>
          <h1 className="admin-page-title">{isNew ? 'Thêm sản phẩm' : 'Chỉnh sửa sản phẩm'}</h1>
          <div className="admin-page-subtitle">
            Cấu hình giá, ảnh, biến thể (size/màu/SKU) và tồn kho theo từng mã.
          </div>
        </div>
      </div>

      <Form onSubmit={handleSubmit}>
        <Card className="admin-panel mb-3">
          <Card.Body className="admin-panel-body">
            <h5 className="mb-3">Thông tin chung</h5>
            <Row className="g-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label>SKU</Form.Label>
                  <Form.Control
                    value={form.sku}
                    onChange={(e) => setField('sku', e.target.value)}
                    placeholder="VD: SP-001"
                  />
                </Form.Group>
              </Col>
              <Col md={8}>
                <Form.Group>
                  <Form.Label>Tên sản phẩm *</Form.Label>
                  <Form.Control
                    required
                    value={form.productName}
                    onChange={(e) => setField('productName', e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Slug (URL) *</Form.Label>
                  <Form.Control
                    required
                    value={form.productSlug}
                    onChange={(e) => setField('productSlug', e.target.value)}
                    placeholder="ao-the-thao-nike"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Danh mục *</Form.Label>
                  <Form.Select
                    required
                    value={form.categoryId}
                    onChange={(e) => setField('categoryId', e.target.value)}
                  >
                    <option value="">— Chọn —</option>
                    {categories.map((c) => {
                      const cid = c._id?.toString?.() || c.categoryId;
                      return (
                        <option key={cid} value={cid}>
                          {c.categoryName || c.CategoryName}
                        </option>
                      );
                    })}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Thương hiệu</Form.Label>
                  <Form.Control
                    list="admin-brand-suggestions"
                    value={form.brand}
                    onChange={(e) => setField('brand', e.target.value)}
                    placeholder="Nike, Adidas…"
                  />
                  <datalist id="admin-brand-suggestions">
                    {brandSuggestions.map((b) => (
                      <option key={b} value={b} />
                    ))}
                  </datalist>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Giá bán chính (₫) *</Form.Label>
                  <Form.Control
                    type="number"
                    min={0}
                    step={1000}
                    required={form.variants.length === 0}
                    disabled={form.variants.length > 0}
                    value={form.defaultPrice}
                    onChange={(e) => setField('defaultPrice', e.target.value)}
                  />
                  <Form.Text muted>
                    {form.variants.length > 0
                      ? 'Đang dùng giá theo biến thể — giá sản phẩm = giá thấp nhất trong các biến thể khi lưu.'
                      : 'Nhập giá khi sản phẩm không có biến thể.'}
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Giá niêm yết (₫)</Form.Label>
                  <Form.Control
                    type="number"
                    min={0}
                    step={1000}
                    value={form.originalPrice}
                    onChange={(e) => setField('originalPrice', e.target.value)}
                    placeholder="Gạch ngang trên shop"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Trạng thái</Form.Label>
                  <Form.Check
                    type="switch"
                    id="active-switch"
                    label="Đang kinh doanh"
                    checked={form.isActive}
                    onChange={(e) => setField('isActive', e.target.checked)}
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Check
                  type="checkbox"
                  id="feat"
                  label="Sản phẩm nổi bật"
                  checked={form.isFeatured}
                  onChange={(e) => setField('isFeatured', e.target.checked)}
                />
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <AdminProductImages
          images={form.images}
          onChange={(nextImages) => setField('images', nextImages)}
        />

        <Card className="admin-panel mb-3">
          <Card.Body className="admin-panel-body">
            <ProductVariantEditor
              key={isNew ? 'new' : loading ? 'loading' : id}
              variants={form.variants}
              onVariantsChange={(next) => setField('variants', next)}
              basePrice={Number(form.defaultPrice) || 0}
              skuPrefix={(form.sku || form.productSlug || 'SKU').trim()}
              stockQuantity={form.stockQuantity}
              onStockQuantityChange={(n) => setField('stockQuantity', n)}
              variantProfile={variantProfile}
            />
          </Card.Body>
        </Card>

        <Card className="admin-panel mb-3">
          <Card.Body className="admin-panel-body">
            <h5 className="mb-3">Mô tả & thuộc tính</h5>
            <Row className="g-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Mô tả ngắn</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={form.shortDescription}
                    onChange={(e) => setField('shortDescription', e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Mô tả chi tiết</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    value={form.longDescription}
                    onChange={(e) => setField('longDescription', e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Chất liệu</Form.Label>
                  <Form.Control
                    value={form.material}
                    onChange={(e) => setField('material', e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Xuất xứ</Form.Label>
                  <Form.Control
                    value={form.origin}
                    onChange={(e) => setField('origin', e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Trọng lượng</Form.Label>
                  <Form.Control
                    type="number"
                    step="any"
                    value={form.weight}
                    onChange={(e) => setField('weight', e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <div className="admin-form-actions d-flex gap-2 flex-wrap">
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Đang lưu…' : 'Lưu sản phẩm'}
          </Button>
          <Button
            type="button"
            variant="outline-secondary"
            onClick={() => navigate('/admin/products')}
            disabled={saving}
          >
            Hủy
          </Button>
          {!isNew && form.defaultPrice !== '' && (
            <span className="text-muted small align-self-center ms-md-2">
              Xem trước giá: {fmt(Number(form.defaultPrice) || 0)}
            </span>
          )}
        </div>
      </Form>
    </div>
  );
};

export default AdminProductForm;
