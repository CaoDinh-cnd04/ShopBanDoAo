import { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Form, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import {
  FiSave, FiPlus, FiTrash2, FiEye, FiEyeOff,
  FiArrowUp, FiArrowDown, FiTag, FiLink
} from 'react-icons/fi';
import adminService from '../../services/adminService';
import ImageUploadField from '../../components/Upload/ImageUploadField';
import { resolveMediaUrl, normalizeUploadUrlForDb } from '../../utils/mediaUrl';

const PRESET_COLORS = [
  { bg: '#111111', text: '#ffffff', label: 'Đen' },
  { bg: '#E00000', text: '#ffffff', label: 'Đỏ' },
  { bg: '#1D4ED8', text: '#ffffff', label: 'Xanh' },
  { bg: '#065F46', text: '#ffffff', label: 'Xanh lá' },
  { bg: '#7C3AED', text: '#ffffff', label: 'Tím' },
  { bg: '#F5F5F5', text: '#111111', label: 'Sáng' },
];

const DEFAULT_PROMO = {
  id: '',
  title: '',
  subtitle: '',
  code: '',
  description: '',
  bgColor: '#111111',
  textColor: '#ffffff',
  imageUrl: '',
  link: '/products',
  linkText: 'Mua ngay',
  isActive: true,
};

let _idCounter = Date.now();
const genId = () => `promo_${++_idCounter}`;

const PromoCard = ({ promo, index, total, onChange, onDelete, onMoveUp, onMoveDown }) => {
  const [open, setOpen] = useState(false);

  const update = (key, val) => onChange({ ...promo, [key]: val });

  const cardStyle = {
    background: promo.bgColor || '#111',
    color: promo.textColor || '#fff',
    borderRadius: 6,
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    minHeight: 80,
    overflow: 'hidden',
    position: 'relative',
  };

  return (
    <Card className="mb-3 admin-panel">
      {/* Preview strip */}
      <div style={cardStyle}>
        {promo.imageUrl && (
          <img
            src={resolveMediaUrl(promo.imageUrl) || promo.imageUrl}
            alt=""
            style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
          />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          {promo.code && (
            <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', opacity: 0.8, textTransform: 'uppercase' }}>
              {promo.code}
            </div>
          )}
          <div style={{ fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.2 }}>
            {promo.title || 'Tiêu đề khuyến mãi'}
          </div>
          {promo.subtitle && (
            <div style={{ fontSize: '0.78rem', opacity: 0.8, marginTop: 2 }}>{promo.subtitle}</div>
          )}
        </div>
        {promo.linkText && (
          <div style={{ fontSize: '0.72rem', fontWeight: 700, padding: '5px 12px', border: `1.5px solid ${promo.textColor}`, borderRadius: 3, whiteSpace: 'nowrap', opacity: 0.95 }}>
            {promo.linkText}
          </div>
        )}
        {!promo.isActive && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}>
            <span style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>ẨN</span>
          </div>
        )}
      </div>

      <Card.Body className="py-2 px-3">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span className="fw-semibold small text-muted">#{index + 1}</span>
          {promo.code && <Badge bg="secondary" className="small">{promo.code}</Badge>}
          <Badge bg={promo.isActive ? 'success' : 'secondary'}>{promo.isActive ? 'Hiển thị' : 'Ẩn'}</Badge>
          <div className="ms-auto d-flex gap-1">
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => onMoveUp()}
              disabled={index === 0}
              title="Lên"
            >
              <FiArrowUp size={12} />
            </button>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => onMoveDown()}
              disabled={index === total - 1}
              title="Xuống"
            >
              <FiArrowDown size={12} />
            </button>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => update('isActive', !promo.isActive)}
              title={promo.isActive ? 'Ẩn' : 'Hiện'}
            >
              {promo.isActive ? <FiEyeOff size={13} /> : <FiEye size={13} />}
            </button>
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => setOpen((p) => !p)}
            >
              {open ? 'Thu lại' : 'Sửa'}
            </button>
            <button className="btn btn-sm btn-outline-danger" onClick={onDelete}>
              <FiTrash2 size={13} />
            </button>
          </div>
        </div>

        {open && (
          <div className="mt-3">
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Tiêu đề chính</Form.Label>
                  <Form.Control
                    size="sm"
                    value={promo.title}
                    onChange={(e) => update('title', e.target.value)}
                    placeholder="SALE 50% — Giày thể thao"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Phụ đề</Form.Label>
                  <Form.Control
                    size="sm"
                    value={promo.subtitle}
                    onChange={(e) => update('subtitle', e.target.value)}
                    placeholder="Áp dụng đến 30/4/2025"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-semibold"><FiTag size={12} className="me-1" />Mã voucher</Form.Label>
                  <Form.Control
                    size="sm"
                    value={promo.code}
                    onChange={(e) => update('code', e.target.value.toUpperCase())}
                    placeholder="SPORT50"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-semibold"><FiLink size={12} className="me-1" />Link đường dẫn</Form.Label>
                  <Form.Control
                    size="sm"
                    value={promo.link}
                    onChange={(e) => update('link', e.target.value)}
                    placeholder="/products"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Chữ nút CTA</Form.Label>
                  <Form.Control
                    size="sm"
                    value={promo.linkText}
                    onChange={(e) => update('linkText', e.target.value)}
                    placeholder="Mua ngay"
                  />
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Mô tả ngắn (tuỳ chọn)</Form.Label>
                  <Form.Control
                    size="sm"
                    as="textarea"
                    rows={2}
                    value={promo.description}
                    onChange={(e) => update('description', e.target.value)}
                    placeholder="Giảm ngay 50% cho tất cả giày thể thao..."
                  />
                </Form.Group>
              </Col>

              {/* Colors */}
              <Col xs={12}>
                <Form.Label className="small fw-semibold d-block mb-2">Màu sắc — chọn nhanh</Form.Label>
                <div className="d-flex gap-2 flex-wrap mb-2">
                  {PRESET_COLORS.map((p) => (
                    <button
                      key={p.bg}
                      title={p.label}
                      onClick={() => { update('bgColor', p.bg); onChange({ ...promo, bgColor: p.bg, textColor: p.text }); }}
                      style={{
                        width: 32, height: 32, borderRadius: 4,
                        background: p.bg, border: promo.bgColor === p.bg ? '2.5px solid #2563EB' : '1.5px solid #ccc',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </div>
                <Row className="g-2">
                  <Col md={6}>
                    <div className="d-flex align-items-center gap-2">
                      <Form.Control
                        type="color"
                        value={promo.bgColor}
                        onChange={(e) => update('bgColor', e.target.value)}
                        style={{ width: 38, height: 34, padding: 2, cursor: 'pointer' }}
                      />
                      <Form.Control
                        size="sm"
                        value={promo.bgColor}
                        onChange={(e) => update('bgColor', e.target.value)}
                        placeholder="Màu nền"
                      />
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="d-flex align-items-center gap-2">
                      <Form.Control
                        type="color"
                        value={promo.textColor}
                        onChange={(e) => update('textColor', e.target.value)}
                        style={{ width: 38, height: 34, padding: 2, cursor: 'pointer' }}
                      />
                      <Form.Control
                        size="sm"
                        value={promo.textColor}
                        onChange={(e) => update('textColor', e.target.value)}
                        placeholder="Màu chữ"
                      />
                    </div>
                  </Col>
                </Row>
              </Col>

              {/* Image */}
              <Col xs={12}>
                <Form.Label className="small fw-semibold d-block mb-1">Hình ảnh (tuỳ chọn)</Form.Label>
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

const AdminPromos = () => {
  const [promos, setPromos] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminService.promos.getPromos().then((data) => {
      setPromos(Array.isArray(data) ? data : []);
    });
  }, []);

  const addPromo = () => {
    setPromos((prev) => [...prev, { ...DEFAULT_PROMO, id: genId() }]);
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
            Quản lý các thẻ quảng cáo, voucher hiển thị trên trang chủ (thay thế vùng thống kê).
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

      <div className="mb-3 small text-muted">
        <FiTag size={13} className="me-1" />
        Chỉ những banner có trạng thái <strong>Hiển thị</strong> mới xuất hiện trên trang chủ.
        Kéo thứ tự bằng nút ↑↓. Tối đa hiển thị tốt nhất là <strong>3–4 banner</strong>.
      </div>

      {promos.length === 0 ? (
        <Card className="admin-panel">
          <Card.Body className="text-center py-5 text-muted">
            <FiTag size={36} className="mb-3 d-block mx-auto" />
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
