import { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Button, Form, Badge, Table } from 'react-bootstrap';
import { toast } from 'react-toastify';
import {
  FiPlus, FiEdit2, FiTrash2, FiSave, FiX,
  FiCalendar, FiPercent, FiLayers, FiClock,
} from 'react-icons/fi';
import promotionService from '../../services/promotionService';
import api from '../../services/api';
import { useDispatch } from 'react-redux';
import { fetchActivePromotions } from '../../store/slices/promotionSlice';

const fmt = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

const toLocalInput = (iso) => {
  if (!iso) return '';
  return iso.slice(0, 10);
};

const isActive = (p) => {
  if (!p.isActive) return false;
  // So sánh theo ngày (bỏ qua giờ) để tránh lệch múi giờ UTC+7
  const todayMs = new Date().setHours(0, 0, 0, 0);
  const startMs = new Date(p.startDate).setHours(0, 0, 0, 0);
  const endMs   = new Date(p.endDate).setHours(23, 59, 59, 999);
  return startMs <= todayMs && todayMs <= endMs;
};

const EMPTY_FORM = {
  name: '',
  description: '',
  discountPercent: '',
  targetType: 'category',
  targetCategoryIds: [],
  startDate: '',
  endDate: '',
  isActive: true,
};

const AdminPromotions = () => {
  const dispatch = useDispatch();
  const [promotions, setPromotions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null); // null = list view, 'new' or id = form
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await promotionService.getAll();
      const arr = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];
      setPromotions(arr);
    } catch {
      toast.error('Không tải được danh sách');
    }
  }, []);

  useEffect(() => {
    load();
    api.get('/categories').then((res) => {
      const arr = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];
      setCategories(arr);
    }).catch(() => {});
  }, [load]);

  const openNew = () => {
    setForm({ ...EMPTY_FORM });
    setEditing('new');
  };

  const openEdit = (p) => {
    setForm({
      name: p.name ?? '',
      description: p.description ?? '',
      discountPercent: p.discountPercent ?? '',
      targetType: p.targetType ?? 'category',
      targetCategoryIds: (p.targetCategoryIds ?? []).map(String),
      startDate: toLocalInput(p.startDate),
      endDate: toLocalInput(p.endDate),
      isActive: p.isActive ?? true,
    });
    setEditing(p._id ?? p.id);
  };

  const cancel = () => { setEditing(null); setForm(EMPTY_FORM); };

  const setField = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const toggleCategory = (id) => {
    setForm((prev) => {
      const ids = prev.targetCategoryIds.includes(id)
        ? prev.targetCategoryIds.filter((x) => x !== id)
        : [...prev.targetCategoryIds, id];
      return { ...prev, targetCategoryIds: ids };
    });
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.warning('Vui lòng nhập tên chương trình'); return; }
    if (!form.discountPercent || Number(form.discountPercent) <= 0) {
      toast.warning('% giảm giá phải lớn hơn 0'); return;
    }
    if (!form.startDate || !form.endDate) {
      toast.warning('Vui lòng chọn ngày bắt đầu và kết thúc'); return;
    }
    if (form.targetType === 'category' && form.targetCategoryIds.length === 0) {
      toast.warning('Vui lòng chọn ít nhất một danh mục'); return;
    }

    const payload = {
      ...form,
      discountPercent: Number(form.discountPercent),
    };

    setSaving(true);
    try {
      if (editing === 'new') {
        await promotionService.create(payload);
        toast.success('Đã tạo chương trình khuyến mãi!');
      } else {
        await promotionService.update(editing, payload);
        toast.success('Đã cập nhật!');
      }
      cancel();
      await load();
      dispatch(fetchActivePromotions());
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xoá chương trình khuyến mãi này?')) return;
    try {
      await promotionService.remove(id);
      toast.success('Đã xoá');
      await load();
      dispatch(fetchActivePromotions());
    } catch {
      toast.error('Xoá thất bại');
    }
  };

  const toggleActive = async (p) => {
    try {
      await promotionService.update(p._id ?? p.id, { isActive: !p.isActive });
      await load();
      dispatch(fetchActivePromotions());
    } catch { toast.error('Cập nhật thất bại'); }
  };

  /* ── FORM ── */
  if (editing !== null) {
    return (
      <div className="admin-page">
        <div className="admin-page-header">
          <div>
            <h1 className="admin-page-title">
              {editing === 'new' ? 'Tạo chương trình khuyến mãi' : 'Chỉnh sửa khuyến mãi'}
            </h1>
            <div className="admin-page-subtitle">
              Chương trình sẽ tự động áp dụng giảm giá lên sản phẩm thuộc danh mục đã chọn trong thời gian hiệu lực.
            </div>
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-secondary" onClick={cancel}><FiX className="me-1" size={14} /> Huỷ</Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              <FiSave className="me-1" size={14} /> {saving ? 'Đang lưu…' : 'Lưu'}
            </Button>
          </div>
        </div>

        <Row className="g-3">
          <Col lg={7}>
            <Card className="admin-panel">
              <Card.Body className="admin-panel-body">
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">Tên chương trình <span className="text-danger">*</span></Form.Label>
                    <Form.Control value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="Sale mùa hè 2025" />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">Mô tả</Form.Label>
                    <Form.Control as="textarea" rows={2} value={form.description} onChange={(e) => setField('description', e.target.value)} placeholder="Mô tả ngắn về chương trình..." />
                  </Form.Group>

                  <Row className="g-3 mb-3">
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="fw-bold"><FiPercent size={13} className="me-1" />Giảm giá (%) <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          type="number" min={1} max={100}
                          value={form.discountPercent}
                          onChange={(e) => setField('discountPercent', e.target.value)}
                          placeholder="50"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="fw-bold"><FiCalendar size={13} className="me-1" />Ngày bắt đầu <span className="text-danger">*</span></Form.Label>
                        <Form.Control type="date" value={form.startDate} onChange={(e) => setField('startDate', e.target.value)} />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="fw-bold"><FiCalendar size={13} className="me-1" />Ngày kết thúc <span className="text-danger">*</span></Form.Label>
                        <Form.Control type="date" value={form.endDate} onChange={(e) => setField('endDate', e.target.value)} />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">Bật / Tắt thủ công</Form.Label>
                    <Form.Check
                      type="switch"
                      label={form.isActive ? 'Đang bật (áp dụng trong thời gian hiệu lực)' : 'Đang tắt'}
                      checked={form.isActive}
                      onChange={(e) => setField('isActive', e.target.checked)}
                    />
                  </Form.Group>

                  <hr />

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold"><FiLayers size={13} className="me-1" />Áp dụng cho</Form.Label>
                    <div className="d-flex gap-3 mb-2">
                      {['all', 'category'].map((t) => (
                        <Form.Check
                          key={t} type="radio" inline
                          label={t === 'all' ? 'Tất cả sản phẩm' : 'Danh mục cụ thể'}
                          checked={form.targetType === t}
                          onChange={() => setField('targetType', t)}
                        />
                      ))}
                    </div>

                    {form.targetType === 'category' && (
                      <div className="d-flex flex-wrap gap-2 mt-2">
                        {categories.map((cat) => {
                          const id = String(cat.categoryId || cat._id || cat.id);
                          const checked = form.targetCategoryIds.includes(id);
                          return (
                            <Button
                              key={id}
                              size="sm"
                              variant={checked ? 'dark' : 'outline-secondary'}
                              onClick={() => toggleCategory(id)}
                            >
                              {cat.categoryName}
                            </Button>
                          );
                        })}
                      </div>
                    )}
                  </Form.Group>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          {/* Preview */}
          <Col lg={5}>
            <Card className="admin-panel">
              <Card.Body>
                <div className="fw-bold mb-3 small text-muted">Xem trước hiệu ứng trên sản phẩm</div>
                <div className="p-3 rounded" style={{ background: '#f5f5f5', border: '1px solid #e5e5e5' }}>
                  <div className="small text-muted mb-1">Giá gốc</div>
                  <div style={{ textDecoration: 'line-through', color: '#999', fontSize: '0.9rem' }}>
                    {fmt(1000000)}
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#E00000' }}>
                    {form.discountPercent
                      ? fmt(Math.round(1000000 * (1 - Number(form.discountPercent) / 100)))
                      : fmt(1000000)}
                  </div>
                  {form.discountPercent > 0 && (
                    <Badge bg="danger" className="mt-1">-{form.discountPercent}%</Badge>
                  )}
                </div>
                <div className="small text-muted mt-3">
                  <strong>Ví dụ:</strong> sản phẩm giá 1.000.000₫<br />
                  Sau giảm: {form.discountPercent ? fmt(Math.round(1000000 * (1 - Number(form.discountPercent) / 100))) : 'không đổi'}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  /* ── LIST ── */
  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Chương Trình Khuyến Mãi</h1>
          <div className="admin-page-subtitle">
            Tạo chương trình giảm giá theo danh mục. Giá sale hiển thị tự động trên sản phẩm và giỏ hàng trong thời gian hiệu lực.
          </div>
        </div>
        <Button variant="primary" onClick={openNew}>
          <FiPlus className="me-1" size={14} /> Tạo chương trình
        </Button>
      </div>

      <Card className="admin-panel mb-3">
        <Card.Body className="py-2 px-3 small text-muted">
          <strong>Cách hoạt động:</strong> Khi chương trình active, trang sản phẩm sẽ tự động hiển thị
          giá gốc (gạch ngang) và giá sale (đỏ). Khi hết hạn hoặc tắt thủ công → giá về mặc định.
          <strong> Voucher</strong> vẫn hoạt động độc lập.
        </Card.Body>
      </Card>

      {promotions.length === 0 ? (
        <Card className="admin-panel">
          <Card.Body className="text-center py-5 text-muted">
            <FiPercent size={40} className="d-block mx-auto mb-3 opacity-50" />
            <div className="fw-semibold mb-2">Chưa có chương trình khuyến mãi</div>
            <Button variant="primary" onClick={openNew}><FiPlus className="me-1" size={14} />Tạo ngay</Button>
          </Card.Body>
        </Card>
      ) : (
        <Card className="admin-panel">
          <Card.Body className="p-0">
            <Table hover responsive className="mb-0 admin-table">
              <thead>
                <tr>
                  <th>Chương trình</th>
                  <th>Giảm giá</th>
                  <th>Áp dụng</th>
                  <th>Thời gian</th>
                  <th>Trạng thái</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {promotions.map((p) => {
                  const active = isActive(p);
                  const catNames = (p.targetCategoryIds ?? [])
                    .map((cid) => {
                      const cat = categories.find((c) => String(c.categoryId || c._id || c.id) === String(cid));
                      return cat?.categoryName;
                    })
                    .filter(Boolean);

                  return (
                    <tr key={p._id ?? p.id}>
                      <td>
                        <div className="fw-semibold">{p.name}</div>
                        {p.description && <div className="small text-muted">{p.description}</div>}
                      </td>
                      <td>
                        <Badge bg="danger" style={{ fontSize: '0.85rem', padding: '5px 10px' }}>
                          -{p.discountPercent}%
                        </Badge>
                      </td>
                      <td>
                        {p.targetType === 'all'
                          ? <Badge bg="secondary">Tất cả</Badge>
                          : catNames.length > 0
                            ? catNames.map((n) => <Badge key={n} bg="light" text="dark" className="me-1">{n}</Badge>)
                            : <span className="text-muted small">—</span>
                        }
                      </td>
                      <td className="small">
                        <div><FiClock size={11} className="me-1" />{new Date(p.startDate).toLocaleDateString('vi-VN')}</div>
                        <div className="text-muted">→ {new Date(p.endDate).toLocaleDateString('vi-VN')}</div>
                      </td>
                      <td>
                        {active
                          ? <Badge bg="success">Đang chạy</Badge>
                          : p.isActive
                            ? <Badge bg="warning" text="dark">Chờ / Hết hạn</Badge>
                            : <Badge bg="secondary">Tắt</Badge>
                        }
                      </td>
                      <td>
                        <div className="d-flex gap-1 justify-content-end">
                          <button
                            className={`btn btn-sm ${p.isActive ? 'btn-outline-secondary' : 'btn-outline-success'}`}
                            onClick={() => toggleActive(p)}
                            title={p.isActive ? 'Tắt' : 'Bật'}
                          >
                            {p.isActive ? 'Tắt' : 'Bật'}
                          </button>
                          <button className="btn btn-sm btn-outline-primary" onClick={() => openEdit(p)}>
                            <FiEdit2 size={13} />
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(p._id ?? p.id)}>
                            <FiTrash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default AdminPromotions;
