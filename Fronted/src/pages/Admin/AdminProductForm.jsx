import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Card, Form, Button, Row, Col, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { FiArrowLeft } from 'react-icons/fi';
import api from '../../services/api';
import adminService from '../../services/adminService';

const emptyForm = {
  productCode: '',
  productName: '',
  productSlug: '',
  subCategoryId: '',
  brandId: '',
  shortDescription: '',
  description: '',
  material: '',
  origin: '',
  weight: '',
  isFeatured: false,
  isNewArrival: false,
  isActive: true
};

const AdminProductForm = () => {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const subOptions = useMemo(() => {
    const out = [];
    (categories || []).forEach((cat) => {
      const name = cat.categoryName || cat.CategoryName;
      (cat.subCategories || []).forEach((sc) => {
        const sid = sc.subCategoryId || sc._id?.toString();
        out.push({
          value: sid,
          label: `${name} › ${sc.subCategoryName || sc.SubCategoryName}`
        });
      });
    });
    return out;
  }, [categories]);

  useEffect(() => {
    let cancelled = false;
    const loadMeta = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          api.get('/categories'),
          api.get('/categories/brands')
        ]);
        if (cancelled) return;
        setCategories(Array.isArray(catRes.data?.data) ? catRes.data.data : []);
        setBrands(Array.isArray(brandRes.data?.data) ? brandRes.data.data : []);
      } catch (e) {
        console.error(e);
        toast.error('Không tải được danh mục / thương hiệu');
      }
    };
    loadMeta();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const res = await adminService.products.getProductById(id);
        const p = res.data?.data;
        if (cancelled || !p) return;
        setForm({
          productCode: p.productCode || '',
          productName: p.productName || '',
          productSlug: p.productSlug || '',
          subCategoryId: p.subCategoryId || '',
          brandId: p.brandId || '',
          shortDescription: p.shortDescription ?? '',
          description: p.description ?? '',
          material: p.material ?? '',
          origin: p.origin ?? '',
          weight: p.weight != null ? String(p.weight) : '',
          isFeatured: !!(p.isFeatured ?? p.IsFeatured),
          isNewArrival: !!(p.isNewArrival ?? p.IsNewArrival),
          isActive: p.isActive !== false && p.IsActive !== false
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

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subCategoryId || !form.brandId) {
      toast.error('Chọn danh mục con và thương hiệu');
      return;
    }
    const payload = {
      productName: form.productName.trim(),
      productSlug: form.productSlug.trim(),
      subCategoryId: form.subCategoryId,
      brandId: form.brandId,
      description: form.description.trim() || null,
      shortDescription: form.shortDescription.trim() || null,
      material: form.material.trim() || null,
      origin: form.origin.trim() || null,
      weight: form.weight === '' ? null : Number(form.weight),
      isFeatured: form.isFeatured,
      isNewArrival: form.isNewArrival
    };
    if (Number.isNaN(payload.weight)) {
      toast.error('Trọng lượng không hợp lệ');
      return;
    }
    try {
      setSaving(true);
      if (isNew) {
        await adminService.products.createProduct({
          ...payload,
          productCode: form.productCode.trim()
        });
        toast.success('Tạo sản phẩm thành công');
      } else {
        await adminService.products.updateProduct(id, {
          ...payload,
          isActive: form.isActive
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
        <div className="mt-2 text-muted">
          Đang tải sản phẩm…
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <Link to="/admin/products" className="admin-back-link d-inline-flex align-items-center gap-2 mb-2">
            <FiArrowLeft /> Danh sách sản phẩm
          </Link>
          <h1 className="admin-page-title">{isNew ? 'Thêm sản phẩm' : 'Chỉnh sửa sản phẩm'}</h1>
          <div className="admin-page-subtitle">
            {isNew
              ? 'Nhập thông tin cơ bản. Biến thể và ảnh có thể bổ sung sau từ luồng khác.'
              : 'Cập nhật thông tin hiển thị và trạng thái.'}
          </div>
        </div>
      </div>

      <Form onSubmit={handleSubmit}>
        <Card className="admin-panel mb-3">
          <Card.Body className="admin-panel-body">
            <h5 className="mb-3">Thông tin chung</h5>
            <Row className="g-3">
              {isNew && (
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Mã sản phẩm *</Form.Label>
                    <Form.Control
                      required
                      value={form.productCode}
                      onChange={(e) => setField('productCode', e.target.value)}
                      placeholder="VD: SP001"
                    />
                  </Form.Group>
                </Col>
              )}
              <Col md={isNew ? 6 : 12}>
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
                  <Form.Label>Slug *</Form.Label>
                  <Form.Control
                    required
                    value={form.productSlug}
                    onChange={(e) => setField('productSlug', e.target.value)}
                    placeholder="ten-san-pham-url"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Danh mục con *</Form.Label>
                  <Form.Select
                    required
                    value={form.subCategoryId}
                    onChange={(e) => setField('subCategoryId', e.target.value)}
                  >
                    <option value="">— Chọn —</option>
                    {subOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Thương hiệu *</Form.Label>
                  <Form.Select
                    required
                    value={form.brandId}
                    onChange={(e) => setField('brandId', e.target.value)}
                  >
                    <option value="">— Chọn —</option>
                    {brands.map((b) => {
                      const bid = b.brandId || b._id?.toString();
                      const bname = b.brandName || b.BrandName;
                      return (
                        <option key={bid} value={bid}>
                          {bname}
                        </option>
                      );
                    })}
                  </Form.Select>
                </Form.Group>
              </Col>
              {!isNew && (
                <Col md={12}>
                  <Form.Check
                    type="switch"
                    id="active-switch"
                    label="Đang kinh doanh (hiển thị)"
                    checked={form.isActive}
                    onChange={(e) => setField('isActive', e.target.checked)}
                  />
                </Col>
              )}
            </Row>
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
                    rows={4}
                    value={form.description}
                    onChange={(e) => setField('description', e.target.value)}
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
                  <Form.Label>Trọng lượng (số)</Form.Label>
                  <Form.Control
                    type="number"
                    step="any"
                    value={form.weight}
                    onChange={(e) => setField('weight', e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Check
                  type="checkbox"
                  id="feat"
                  label="Sản phẩm nổi bật"
                  checked={form.isFeatured}
                  onChange={(e) => setField('isFeatured', e.target.checked)}
                />
              </Col>
              <Col md={6}>
                <Form.Check
                  type="checkbox"
                  id="new"
                  label="Hàng mới"
                  checked={form.isNewArrival}
                  onChange={(e) => setField('isNewArrival', e.target.checked)}
                />
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <div className="d-flex gap-2">
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Đang lưu…' : 'Lưu'}
          </Button>
          <Button type="button" variant="outline-secondary" onClick={() => navigate('/admin/products')} disabled={saving}>
            Hủy
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default AdminProductForm;
