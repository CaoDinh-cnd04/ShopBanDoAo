import { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Form, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import {
  FiSave, FiPlus, FiTrash2, FiEye, FiEyeOff,
  FiArrowUp, FiArrowDown, FiTag,
} from 'react-icons/fi';
import adminService from '../../services/adminService';
import ImageUploadField from '../../components/Upload/ImageUploadField';
import { resolveMediaUrl, normalizeUploadUrlForDb } from '../../utils/mediaUrl';
import api from '../../services/api';

const PRESET_COLORS = [
  { bg: '#111111', text: '#ffffff', label: 'Đen' },
  { bg: '#E00000', text: '#ffffff', label: 'Đỏ' },
  { bg: '#1D4ED8', text: '#ffffff', label: 'Xanh dương' },
  { bg: '#065F46', text: '#ffffff', label: 'Xanh lá' },
  { bg: '#7C3AED', text: '#ffffff', label: 'Tím' },
  { bg: '#92400E', text: '#ffffff', label: 'Nâu' },
  { bg: '#F5F5F5', text: '#111111', label: 'Sáng' },
  { bg: '#FEF9C3', text: '#713F12', label: 'Vàng' },
];

const DEFAULT_PROMO = {
  id: '',
  title: '',
  subtitle: '',
  code: '',
  discountPercent: '',
  bgColor: '#111111',
  textColor: '#ffffff',
  imageUrl: '',
  categoryId: '',
  linkText: 'Mua ngay',
  isActive: true,
};

let _idCounter = Date.now();
const genId = () => `promo_${++_idCounter}`;

/* ── Single Promo Card Editor ── */
const PromoCard = ({ promo, index, total, categories, onChange, onDelete, onMoveUp, onMoveDown }) => {
  const [open, setOpen] = useState(index === 0 && !promo.title);

  const update = (key, val) => onChange({ ...promo, [key]: val });
  const applyPreset = (preset) => onChange({ ...promo, bgColor: preset.bg, textColor: preset.text });

  /* Resolve category name for display */
  const catName = categories.find((c) => {
    const id = c.categoryId || c._id || c.id;
    return String(id) === String(promo.categoryId);
  })?.categoryName;

  /* Build link from categoryId */
  const resolvedLink = promo.categoryId
    ? `/products?category=${promo.categoryId}`
    : '/products';

  const cardStyle = {
    background: promo.bgColor || '#111',
    color: promo.textColor || '#fff',
    borderRadius: 6,
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    minHeight: 88,
    overflow: 'hidden',
    position: 'relative',
    cursor: 'default',
  };

  return (
    <Card className="mb-3 admin-panel">
      {/* Live preview strip */}
      <div style={cardStyle}>
        {promo.imageUrl && (
          <img
            src={resolveMediaUrl(promo.imageUrl) || promo.imageUrl}
            alt=""
            style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
          />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          {(promo.code || promo.discountPercent) && (
            <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', opacity: 0.8, textTransform: 'uppercase', marginBottom: 3 }}>
              {promo.discountPercent ? `SALE ${promo.discountPercent}%` : ''}{promo.code ? `  ${promo.code}` : ''}
            </div>
          )}
          <div style={{ fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.2 }}>
            {promo.title || 'Tiêu đề khuyến mãi'}
          </div>
          {promo.subtitle && (
            <div style={{ fontSize: '0.78rem', opacity: 0.75, marginTop: 2 }}>{promo.subtitle}</div>
          )}
          {catName && (
            <div style={{ fontSize: '0.65rem', opacity: 0.6, marginTop: 3 }}>→ {catName}</div>
          )}
        </div>
        {promo.linkText && (
          <div style={{
            fontSize: '0.72rem', fontWeight: 700, padding: '5px 12px',
            border: `1.5px solid ${promo.textColor}`, borderRadius: 3,
            whiteSpace: 'nowrap', opacity: 0.95, flexShrink: 0,
          }}>
            {promo.linkText}
          </div>
        )}
        {!promo.isActive && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.8rem' }}>ẨN</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <Card.Body className="py-2 px-3">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span className="fw-semibold small text-muted">#{index + 1}</span>
          {promo.code && <Badge bg="secondary">{promo.code}</Badge>}
          {promo.discountPercent && <Badge bg="danger">-{promo.discountPercent}%</Badge>}
          <Badge bg={promo.isActive ? 'success' : 'secondary'}>{promo.isActive ? 'Hiển thị' : 'Ẩn'}</Badge>
          <div className="ms-auto d-flex gap-1 flex-wrap">
            <button className="btn btn-sm btn-outline-secondary" onClick={onMoveUp} disabled={index === 0}><FiArrowUp size={12} /></button>
            <button className="btn btn-sm btn-outline-secondary" onClick={onMoveDown} disabled={index === total - 1}><FiArrowDown size={12} /></button>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => update('isActive', !promo.isActive)} title={promo.isActive ? 'Ẩn' : 'Hiện'}>
              {promo.isActive ? <FiEyeOff size={13} /> : <FiEye size={13} />}
            </button>
            <button className="btn btn-sm btn-outline-primary" onClick={() => setOpen((p) => !p)}>
              {open ? 'Thu lại' : 'Chỉnh sửa'}
            </button>
            <button className="btn btn-sm btn-outline-danger" onClick={onDelete}><FiTrash2 size={13} /></button>
          </div>
        </div>

        {open && (
          <div className="mt-3 border-top pt-3">
            <Row className="g-3">
              {/* Tiêu đề & phụ đề */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Tiêu đề chính <span className="text-danger">*</span></Form.Label>
                  <Form.Control size="sm" value={promo.title} onChange={(e) => update('title', e.target.value)} placeholder="SALE 50% — Giày thể thao" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Phụ đề</Form.Label>
                  <Form.Control size="sm" value={promo.subtitle} onChange={(e) => update('subtitle', e.target.value)} placeholder="Áp dụng đến 30/4/2025" />
                </Form.Group>
              </Col>

              {/* Giảm giá & mã voucher */}
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Giảm giá (%)</Form.Label>
                  <Form.Control
                    size="sm" type="number" min={0} max={100}
                    value={promo.discountPercent}
                    onChange={(e) => update('discountPercent', e.target.value)}
                    placeholder="50"
                  />
                  <Form.Text className="text-muted">Hiển thị "SALE 50%" trên banner</Form.Text>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-bold"><FiTag size={12} className="me-1" />Mã voucher</Form.Label>
                  <Form.Control
                    size="sm" value={promo.code}
                    onChange={(e) => update('code', e.target.value.toUpperCase())}
                    placeholder="SPORT50"
                  />
                  <Form.Text className="text-muted">Hiển thị trên banner</Form.Text>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Chữ nút CTA</Form.Label>
                  <Form.Control size="sm" value={promo.linkText} onChange={(e) => update('linkText', e.target.value)} placeholder="Mua ngay" />
                </Form.Group>
              </Col>

              {/* Danh mục sản phẩm */}
              <Col xs={12}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Danh mục sản phẩm <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    size="sm"
                    value={promo.categoryId}
                    onChange={(e) => update('categoryId', e.target.value)}
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map((cat) => {
                      const id = cat.categoryId || cat._id || cat.id;
                      return (
                        <option key={id} value={String(id)}>
                          {cat.categoryName}
                        </option>
                      );
                    })}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Khi nhấn "{promo.linkText || 'Mua ngay'}" → trang sản phẩm lọc theo danh mục này
                    {promo.categoryId && <span className="text-success ms-2">→ {resolvedLink}</span>}
                  </Form.Text>
                </Form.Group>
              </Col>

              {/* Màu sắc */}
              <Col xs={12}>
                <Form.Label className="small fw-bold d-block mb-2">Màu sắc — chọn nhanh</Form.Label>
                <div className="d-flex gap-2 flex-wrap mb-2">
                  {PRESET_COLORS.map((p) => (
                    <button
                      key={p.bg}
                      title={p.label}
                      onClick={() => applyPreset(p)}
                      style={{
                        width: 32, height: 32, borderRadius: 4,
                        background: p.bg,
                        border: promo.bgColor === p.bg ? '2.5px solid #2563EB' : '1.5px solid #ccc',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </div>
                <Row className="g-2">
                  <Col md={6}>
                    <Form.Label className="small text-muted">Màu nền</Form.Label>
                    <div className="d-flex align-items-center gap-2">
                      <Form.Control type="color" value={promo.bgColor} onChange={(e) => update('bgColor', e.target.value)} style={{ width: 38, height: 34, padding: 2, cursor: 'pointer' }} />
                      <Form.Control size="sm" value={promo.bgColor} onChange={(e) => update('bgColor', e.target.value)} placeholder="#111111" />
                    </div>
                  </Col>
                  <Col md={6}>
                    <Form.Label className="small text-muted">Màu chữ</Form.Label>
                    <div className="d-flex align-items-center gap-2">
                      <Form.Control type="color" value={promo.textColor} onChange={(e) => update('textColor', e.target.value)} style={{ width: 38, height: 34, padding: 2, cursor: 'pointer' }} />
                      <Form.Control size="sm" value={promo.textColor} onChange={(e) => update('textColor', e.target.value)} placeholder="#ffffff" />
                    </div>
                  </Col>
                </Row>
              </Col>

              {/* Hình ảnh */}
              <Col xs={12}>
                <Form.Label className="small fw-bold d-block mb-1">Hình ảnh nhỏ (tuỳ chọn)</Form.Label>
                <ImageUploadField
                  label=""
                  value={promo.imageUrl}
                  onChange={(url) => update('imageUrl', normalizeUploadUrlForDb(url) || url)}
                  placeholder="Ảnh nhỏ bên trái thẻ"
                  previewSize={72}
                />
              </Col>
            </Row>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

/* ── Main Page ── */
const AdminPromos = () => {
  const [promos, setPromos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load promos
    adminService.promos.getPromos().then((data) => {
      setPromos(Array.isArray(data) ? data : []);
    });
    // Load categories
    api.get('/categories').then((res) => {
      const arr = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];
      setCategories(arr);
    }).catch(() => {});
  }, []);

  const addPromo = () => {
    const newPromo = { ...DEFAULT_PROMO, id: genId() };
    setPromos((prev) => [...prev, newPromo]);
  };

  const updatePromo = (index, updated) => {
    setPromos((prev) => prev.map((p, i) => (i === index ? updated : p)));
  };

  const deletePromo = (index) => {
    if (!window.confirm('Xoá banner khuyến mãi này?')) return;
    setPromos((prev) => prev.filter((_, i) => i !== index));
  };

  const moveUp = (index) => {
    if (index === 0) return;
    setPromos((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const moveDown = (index) => {
    setPromos((prev) => {
      if (index === prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  const handleSave = async () => {
    const invalid = promos.filter((p) => !p.title?.trim());
    if (invalid.length) {
      toast.warning('Có banner chưa điền tiêu đề. Vui lòng điền đầy đủ trước khi lưu.');
      return;
    }
    setSaving(true);
    try {
      await adminService.promos.savePromos(promos);
      toast.success('Đã lưu banner khuyến mãi!');
    } catch {
      toast.error('Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Banner Khuyến Mãi</h1>
          <div className="admin-page-subtitle">
            Quảng cáo, voucher hiển thị trên trang chủ. Nhấn vào banner → lọc sản phẩm theo danh mục.
          </div>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" onClick={addPromo}>
            <FiPlus className="me-1" size={14} /> Thêm banner
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            <FiSave className="me-1" size={14} /> {saving ? 'Đang lưu…' : 'Lưu tất cả'}
          </Button>
        </div>
      </div>

      {/* Hướng dẫn */}
      <Card className="admin-panel mb-4">
        <Card.Body className="py-2 px-3 small text-muted">
          <strong>Cách hoạt động:</strong>
          <ol className="mb-0 mt-1 ps-3">
            <li>Thêm banner → điền tiêu đề, % giảm giá, mã voucher (tuỳ chọn)</li>
            <li>Chọn <strong>Danh mục sản phẩm</strong> — khi khách nhấn "Mua ngay" sẽ xem sản phẩm thuộc danh mục đó</li>
            <li>Sản phẩm hiển thị cả <strong>giá gốc</strong> (gạch ngang) và <strong>giá sale</strong> — admin cài trong trang Sản phẩm (trường "Giá gốc" và "Giá bán")</li>
            <li>Nhấn <strong>Lưu tất cả</strong> → banner hiện ngay trên trang chủ</li>
          </ol>
        </Card.Body>
      </Card>

      {promos.length === 0 ? (
        <Card className="admin-panel">
          <Card.Body className="text-center py-5 text-muted">
            <FiTag size={36} className="mb-3 d-block mx-auto opacity-50" />
            <div className="fw-semibold mb-2">Chưa có banner khuyến mãi nào</div>
            <div className="small mb-3">Nhấn "+ Thêm banner" để tạo banner đầu tiên.</div>
            <Button variant="primary" onClick={addPromo}>
              <FiPlus className="me-1" size={14} /> Thêm banner
            </Button>
          </Card.Body>
        </Card>
      ) : (
        promos.map((promo, index) => (
          <PromoCard
            key={promo.id || index}
            promo={promo}
            index={index}
            total={promos.length}
            categories={categories}
            onChange={(updated) => updatePromo(index, updated)}
            onDelete={() => deletePromo(index)}
            onMoveUp={() => moveUp(index)}
            onMoveDown={() => moveDown(index)}
          />
        ))
      )}
    </div>
  );
};

export default AdminPromos;
