import { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Form, Tab, Nav, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiSave, FiRefreshCw, FiEye, FiShoppingBag, FiCalendar, FiPackage, FiStar, FiUsers } from 'react-icons/fi';
import adminService from '../../services/adminService';
import ImageUploadField from '../../components/Upload/ImageUploadField';
import { resolveMediaUrl } from '../../utils/mediaUrl';

export const DEFAULT_BANNER = {
  eyebrow: '⚡ SPORTS E-COMMERCE',
  title: 'Đặt sân thể thao dễ dàng',
  subtitle: 'Hệ thống đặt sân trực tuyến – nhanh chóng, tiện lợi, mọi lúc mọi nơi',
  ctaText: 'Đặt sân ngay',
  ctaLink: '/courts',
  ctaIcon: 'shopping',
  ctaText2: 'Xem sản phẩm',
  ctaLink2: '/products',
  ctaIcon2: 'calendar',
  heroImageUrl: '',
  showBadge: true,
  badgeText: '10,000+ khách hàng',
  badgeIcon: 'star',
  bgColor1: '#0f766e',
  bgColor2: '#134e4a',
  bgAngle: 135,
  textColor: '#ffffff',
  overlayOpacity: 0.45,
  imageUrl: '',
  showImage: false,
};

const ICON_OPTIONS = [
  { value: 'shopping', label: 'Giỏ / mua' },
  { value: 'calendar', label: 'Lịch' },
  { value: 'package', label: 'Gói hàng' },
  { value: 'bag', label: 'Túi mua' },
];

const BADGE_ICON_OPTIONS = [
  { value: 'star', label: 'Ngôi sao' },
  { value: 'users', label: 'Người dùng' },
  { value: 'none', label: 'Không icon' },
];

function PreviewIcon({ name, size = 16 }) {
  const Icon =
    name === 'calendar'
      ? FiCalendar
      : name === 'package'
        ? FiPackage
        : FiShoppingBag;
  return <Icon size={size} />;
}

function PreviewBadgeIcon({ name, size = 14 }) {
  if (name === 'users') return <FiUsers size={size} />;
  if (name === 'none') return null;
  return <FiStar size={size} fill="#F59E0B" color="#F59E0B" />;
}

const AdminBanner = () => {
  const [banner, setBanner] = useState(DEFAULT_BANNER);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('content');

  useEffect(() => {
    const stored = adminService.banner.getBanner();
    if (stored) setBanner({ ...DEFAULT_BANNER, ...stored });
  }, []);

  const update = (key, value) => {
    setSaved(false);
    setBanner((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      await adminService.banner.saveBanner(banner);
      toast.success('Đã lưu cài đặt banner!');
      setSaved(true);
    } catch {
      toast.error('Lưu thất bại');
    }
  };

  const handleReset = () => {
    if (!window.confirm('Khôi phục banner về mặc định?')) return;
    adminService.banner.resetBanner();
    setBanner(DEFAULT_BANNER);
    setSaved(false);
    toast.info('Đã khôi phục mặc định');
  };

  const heroSrc = resolveMediaUrl(banner.heroImageUrl) || banner.heroImageUrl;

  const leftColumnStyle = {
    color: banner.textColor,
  };

  const sectionBg = {
    background:
      banner.showImage && banner.imageUrl
        ? `linear-gradient(rgba(0,0,0,${banner.overlayOpacity}), rgba(0,0,0,${banner.overlayOpacity})), url(${banner.imageUrl}) center/cover no-repeat`
        : `linear-gradient(${banner.bgAngle}deg, ${banner.bgColor1}, ${banner.bgColor2})`,
    color: banner.textColor,
    borderRadius: 16,
    padding: '40px 32px',
    minHeight: 280,
    overflow: 'hidden',
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Banner trang chủ</h1>
          <div className="admin-page-subtitle">
            Chỉnh toàn bộ: nhãn trên cùng, tiêu đề, ảnh bên phải, badge, nút, màu nền / ảnh nền.
          </div>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" as={Link} to="/" target="_blank" rel="noreferrer">
            <FiEye className="me-1" size={14} /> Xem trang chủ
          </Button>
          <Button variant="outline-secondary" onClick={handleReset}>
            <FiRefreshCw className="me-1" size={14} /> Mặc định
          </Button>
          <Button variant="primary" onClick={handleSave}>
            <FiSave className="me-1" size={14} /> Lưu thay đổi
          </Button>
        </div>
      </div>

      {saved && (
        <Alert variant="success" className="mb-3 py-2">
          Đã lưu! Tải lại trang chủ để xem (hoặc đã cập nhật tức thì nếu mở cùng trình duyệt).
        </Alert>
      )}

      <Row className="g-3">
        <Col lg={6}>
          <Card className="admin-panel h-100">
            <Card.Body className="admin-panel-body">
              <Tab.Container activeKey={activeTab} onSelect={(k) => k && setActiveTab(k)}>
                <Nav variant="tabs" className="mb-3 flex-wrap">
                  <Nav.Item>
                    <Nav.Link eventKey="content">Nội dung &amp; nút</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="color">Màu &amp; nền</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="image">Hình ảnh</Nav.Link>
                  </Nav.Item>
                </Nav>

                <Tab.Content>
                  <Tab.Pane eventKey="content">
                    <Form>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Dòng nhãn (eyebrow)</Form.Label>
                        <Form.Control
                          value={banner.eyebrow}
                          onChange={(e) => update('eyebrow', e.target.value)}
                          placeholder="⚡ SPORTS E-COMMERCE"
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Tiêu đề chính</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          value={banner.title}
                          onChange={(e) => update('title', e.target.value)}
                          placeholder="Có thể xuống dòng bằng Enter"
                        />
                        <Form.Text className="text-muted">Nhiều dòng được phép.</Form.Text>
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Phụ đề</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          value={banner.subtitle}
                          onChange={(e) => update('subtitle', e.target.value)}
                        />
                      </Form.Group>

                      <hr className="my-3" />
                      <Form.Label className="fw-semibold d-block mb-2">Badge trên ảnh</Form.Label>
                      <Form.Check
                        type="switch"
                        label="Hiển thị badge"
                        checked={banner.showBadge}
                        onChange={(e) => update('showBadge', e.target.checked)}
                        className="mb-2"
                      />
                      <Row className="g-2 mb-3">
                        <Col md={8}>
                          <Form.Control
                            value={banner.badgeText}
                            onChange={(e) => update('badgeText', e.target.value)}
                            placeholder="10,000+ khách hàng"
                            disabled={!banner.showBadge}
                          />
                        </Col>
                        <Col md={4}>
                          <Form.Select
                            value={banner.badgeIcon}
                            onChange={(e) => update('badgeIcon', e.target.value)}
                            disabled={!banner.showBadge}
                          >
                            {BADGE_ICON_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </Form.Select>
                        </Col>
                      </Row>

                      <hr className="my-3" />
                      <Row className="g-2 mb-2">
                        <Col md={6}>
                          <Form.Label className="fw-semibold">Nút 1 — chữ</Form.Label>
                          <Form.Control value={banner.ctaText} onChange={(e) => update('ctaText', e.target.value)} />
                        </Col>
                        <Col md={6}>
                          <Form.Label className="fw-semibold">Nút 1 — icon</Form.Label>
                          <Form.Select value={banner.ctaIcon} onChange={(e) => update('ctaIcon', e.target.value)}>
                            {ICON_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </Form.Select>
                        </Col>
                        <Col md={12}>
                          <Form.Label className="fw-semibold">Nút 1 — đường dẫn</Form.Label>
                          <Form.Control
                            value={banner.ctaLink}
                            onChange={(e) => update('ctaLink', e.target.value)}
                            placeholder="/courts"
                          />
                        </Col>
                      </Row>
                      <Row className="g-2">
                        <Col md={6}>
                          <Form.Label className="fw-semibold">Nút 2 — chữ</Form.Label>
                          <Form.Control value={banner.ctaText2} onChange={(e) => update('ctaText2', e.target.value)} />
                        </Col>
                        <Col md={6}>
                          <Form.Label className="fw-semibold">Nút 2 — icon</Form.Label>
                          <Form.Select value={banner.ctaIcon2} onChange={(e) => update('ctaIcon2', e.target.value)}>
                            {ICON_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </Form.Select>
                        </Col>
                        <Col md={12}>
                          <Form.Label className="fw-semibold">Nút 2 — đường dẫn</Form.Label>
                          <Form.Control
                            value={banner.ctaLink2}
                            onChange={(e) => update('ctaLink2', e.target.value)}
                            placeholder="/products"
                          />
                        </Col>
                      </Row>
                    </Form>
                  </Tab.Pane>

                  <Tab.Pane eventKey="color">
                    <Form>
                      <Row className="g-3 mb-3">
                        <Col md={6}>
                          <Form.Label className="fw-semibold">Màu gradient 1</Form.Label>
                          <div className="d-flex align-items-center gap-2">
                            <Form.Control
                              type="color"
                              value={banner.bgColor1}
                              onChange={(e) => update('bgColor1', e.target.value)}
                              style={{ width: 44, height: 38, padding: 2, cursor: 'pointer' }}
                            />
                            <Form.Control
                              value={banner.bgColor1}
                              onChange={(e) => update('bgColor1', e.target.value)}
                              placeholder="#0f766e"
                              style={{ flex: 1 }}
                            />
                          </div>
                        </Col>
                        <Col md={6}>
                          <Form.Label className="fw-semibold">Màu gradient 2</Form.Label>
                          <div className="d-flex align-items-center gap-2">
                            <Form.Control
                              type="color"
                              value={banner.bgColor2}
                              onChange={(e) => update('bgColor2', e.target.value)}
                              style={{ width: 44, height: 38, padding: 2, cursor: 'pointer' }}
                            />
                            <Form.Control
                              value={banner.bgColor2}
                              onChange={(e) => update('bgColor2', e.target.value)}
                              placeholder="#134e4a"
                              style={{ flex: 1 }}
                            />
                          </div>
                        </Col>
                      </Row>
                      <Row className="g-3 mb-3">
                        <Col md={6}>
                          <Form.Label className="fw-semibold">Màu chữ</Form.Label>
                          <div className="d-flex align-items-center gap-2">
                            <Form.Control
                              type="color"
                              value={banner.textColor}
                              onChange={(e) => update('textColor', e.target.value)}
                              style={{ width: 44, height: 38, padding: 2, cursor: 'pointer' }}
                            />
                            <Form.Control
                              value={banner.textColor}
                              onChange={(e) => update('textColor', e.target.value)}
                              placeholder="#ffffff"
                              style={{ flex: 1 }}
                            />
                          </div>
                        </Col>
                        <Col md={6}>
                          <Form.Label className="fw-semibold">Góc gradient ({banner.bgAngle}°)</Form.Label>
                          <Form.Range min={0} max={360} value={banner.bgAngle} onChange={(e) => update('bgAngle', Number(e.target.value))} />
                        </Col>
                      </Row>
                      <Form.Group>
                        <Form.Label className="fw-semibold">
                          Độ mờ overlay ảnh nền ({Math.round(banner.overlayOpacity * 100)}%)
                        </Form.Label>
                        <Form.Range
                          min={0}
                          max={1}
                          step={0.05}
                          value={banner.overlayOpacity}
                          onChange={(e) => update('overlayOpacity', Number(e.target.value))}
                        />
                        <Form.Text className="text-muted">Khi bật “Ảnh phủ toàn vùng banner” ở tab Hình ảnh.</Form.Text>
                      </Form.Group>
                    </Form>
                  </Tab.Pane>

                  <Tab.Pane eventKey="image">
                    <Form className="mb-3">
                      <Form.Label className="fw-semibold">Ảnh bên phải (hero)</Form.Label>
                      <ImageUploadField
                        label=""
                        value={banner.heroImageUrl}
                        onChange={(url) => update('heroImageUrl', url)}
                        placeholder="Upload ảnh hiển thị cạnh tiêu đề"
                        previewSize={120}
                      />
                      <Form.Text className="text-muted d-block mt-1">
                        Ảnh lớn trong khung bo góc; nếu để trống sẽ dùng ảnh mặc định.
                      </Form.Text>
                    </Form>

                    <hr />

                    <Form.Check
                      type="switch"
                      label="Dùng ảnh phủ toàn vùng banner (thay gradient)"
                      checked={banner.showImage}
                      onChange={(e) => update('showImage', e.target.checked)}
                      className="mb-3 fw-semibold"
                    />
                    <ImageUploadField
                      label="Ảnh nền toàn banner"
                      value={banner.imageUrl}
                      onChange={(url) => {
                        update('imageUrl', url);
                        update('showImage', true);
                      }}
                      placeholder="Ảnh nền (tuỳ chọn)"
                      previewSize={100}
                    />
                  </Tab.Pane>
                </Tab.Content>
              </Tab.Container>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card className="admin-panel h-100">
            <Card.Body className="admin-panel-body">
              <div className="d-flex align-items-center gap-2 mb-3 text-muted">
                <FiEye /> <span className="fw-semibold">Xem trước (gần giống trang chủ)</span>
              </div>
              <div style={sectionBg}>
                <Row className="align-items-center g-3 m-0">
                  <Col md={6} className="p-0 pe-md-2">
                    <div style={leftColumnStyle}>
                      <div
                        className="small fw-bold mb-2"
                        style={{ color: banner.textColor, opacity: 0.95, letterSpacing: '0.04em' }}
                      >
                        {banner.eyebrow || 'Eyebrow'}
                      </div>
                      <h2
                        style={{
                          color: banner.textColor,
                          fontWeight: 800,
                          fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
                          marginBottom: 8,
                          lineHeight: 1.2,
                          whiteSpace: 'pre-line',
                        }}
                      >
                        {banner.title || 'Tiêu đề'}
                      </h2>
                      <p style={{ color: banner.textColor, opacity: 0.9, marginBottom: 12, fontSize: '0.85rem', lineHeight: 1.5 }}>
                        {banner.subtitle || 'Phụ đề'}
                      </p>
                      <div className="d-flex gap-2 flex-wrap">
                        {banner.ctaText && (
                          <span
                            className="d-inline-flex align-items-center gap-1"
                            style={{
                              background: 'rgba(255,255,255,0.95)',
                              color: '#2563eb',
                              padding: '6px 14px',
                              borderRadius: 10,
                              fontWeight: 700,
                              fontSize: '0.8rem',
                            }}
                          >
                            <PreviewIcon name={banner.ctaIcon} size={14} />
                            {banner.ctaText}
                          </span>
                        )}
                        {banner.ctaText2 && (
                          <span
                            className="d-inline-flex align-items-center gap-1"
                            style={{
                              border: '1.5px solid rgba(255,255,255,0.55)',
                              color: banner.textColor,
                              padding: '6px 14px',
                              borderRadius: 10,
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              background: 'rgba(255,255,255,0.12)',
                            }}
                          >
                            <PreviewIcon name={banner.ctaIcon2} size={14} />
                            {banner.ctaText2}
                          </span>
                        )}
                      </div>
                    </div>
                  </Col>
                  <Col md={6} className="p-0 ps-md-2 position-relative">
                    <div
                      style={{
                        borderRadius: 16,
                        overflow: 'hidden',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
                      }}
                    >
                      <img
                        src={heroSrc || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80&auto=format&fit=crop'}
                        alt=""
                        style={{ width: '100%', display: 'block', aspectRatio: '4/3', objectFit: 'cover' }}
                      />
                    </div>
                    {banner.showBadge && banner.badgeText && (
                      <div
                        className="d-inline-flex align-items-center gap-1 px-2 py-1 rounded-pill shadow-sm"
                        style={{
                          position: 'absolute',
                          left: 12,
                          bottom: 12,
                          background: '#fff',
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#0f172a',
                        }}
                      >
                        <PreviewBadgeIcon name={banner.badgeIcon} />
                        <span>{banner.badgeText}</span>
                      </div>
                    )}
                  </Col>
                </Row>
              </div>

              <div className="mt-3 p-3 rounded small" style={{ background: 'var(--admin-canvas, #f1f5f9)' }}>
                <strong>Ghi chú:</strong>
                <ul className="mb-0 mt-2 ps-3">
                  <li>Ảnh phải: upload ở tab Hình ảnh (hero).</li>
                  <li>Ảnh nền toàn khối: bật switch + upload (overlay chỉnh ở tab Màu).</li>
                </ul>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminBanner;
