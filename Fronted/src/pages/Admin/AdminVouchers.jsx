import { useState, useEffect, useCallback } from 'react';
import { Card, Table, Button, Form, Row, Col, Spinner, Badge, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { FiTag, FiCheckCircle } from 'react-icons/fi';
import StatCard from '../../components/Admin/StatCard';
import adminService from '../../services/adminService';

const DISCOUNT_TYPES = ['Phần trăm', 'Số tiền'];

const mapDiscountTypeToUi = (t) => {
  if (t === 'percent' || t === 'Phần trăm') return 'Phần trăm';
  if (t === 'fixed' || t === 'Số tiền') return 'Số tiền';
  return t || 'Phần trăm';
};

const voucherStatusLabel = (v) => {
  if (!v?.endDate || !v?.startDate) return '—';
  const now = Date.now();
  const end = new Date(v.endDate).getTime();
  const start = new Date(v.startDate).getTime();
  if (Number.isNaN(end) || Number.isNaN(start)) return '—';
  if (end < now) return 'Hết hạn';
  if (start > now) return 'Chưa bắt đầu';
  return 'Đang chạy';
};

const toInputDate = (d) => {
  if (!d) return '';
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(x.getHours())}:${pad(x.getMinutes())}`;
};

const emptyForm = {
  voucherCode: '',
  voucherName: '',
  description: '',
  discountType: 'Phần trăm',
  discountValue: '',
  maxDiscountAmount: '',
  minOrderAmount: '0',
  usageLimit: '999',
  startDate: '',
  endDate: '',
  isActive: true
};

const AdminVouchers = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [vouchers, setVouchers] = useState([]);
  const [filters, setFilters] = useState({ isActive: '', isExpired: '' });
  const [modal, setModal] = useState({ open: false, editing: null });
  const [form, setForm] = useState(emptyForm);

  const loadStats = useCallback(async () => {
    const res = await adminService.vouchers.getVoucherStats();
    setStats(res.data?.data ?? null);
  }, []);

  const loadVouchers = useCallback(async () => {
    const params = {};
    if (filters.isActive !== '') params.isActive = filters.isActive;
    if (filters.isExpired !== '') params.isExpired = filters.isExpired;
    const res = await adminService.vouchers.getAllVouchers(params);
    const data = res.data?.data;
    const list = Array.isArray(data?.vouchers) ? data.vouchers : Array.isArray(data) ? data : [];
    setVouchers(list);
  }, [filters.isActive, filters.isExpired]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        await Promise.all([loadStats(), loadVouchers()]);
      } catch (e) {
        if (!cancelled) {
          console.error(e);
          toast.error(e.response?.data?.message || 'Không tải được voucher');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadStats, loadVouchers]);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([loadStats(), loadVouchers()]);
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [loadStats, loadVouchers]);

  const openNew = () => {
    setForm({
      ...emptyForm,
      startDate: toInputDate(new Date()),
      endDate: toInputDate(new Date(Date.now() + 30 * 86400000))
    });
    setModal({ open: true, editing: null });
  };

  const openEdit = (v) => {
    const id = v.voucherId || v._id?.toString();
    setForm({
      voucherCode: v.voucherCode || v.code || '',
      voucherName: v.voucherName || '',
      description: v.description ?? '',
      discountType: mapDiscountTypeToUi(v.discountType),
      discountValue: v.discountValue != null ? String(v.discountValue) : '',
      maxDiscountAmount: v.maxDiscountAmount != null ? String(v.maxDiscountAmount) : '',
      minOrderAmount:
        v.minOrderValue != null ? String(v.minOrderValue) : v.minOrderAmount != null ? String(v.minOrderAmount) : '0',
      usageLimit: v.usageLimit != null ? String(v.usageLimit) : '999',
      startDate: toInputDate(v.startDate),
      endDate: toInputDate(v.endDate),
      isActive: v.isActive !== false
    });
    setModal({ open: true, editing: id });
  };

  const save = async () => {
    const discountValue = Number(form.discountValue);
    if (!form.voucherName.trim() || Number.isNaN(discountValue)) {
      toast.error('Kiểm tra tên và giá trị giảm');
      return;
    }
    if (!form.startDate || !form.endDate) {
      toast.error('Chọn thời gian bắt đầu và kết thúc');
      return;
    }
    const payload = {
      voucherName: form.voucherName.trim(),
      description: form.description.trim() || null,
      discountType: form.discountType,
      discountValue,
      maxDiscountAmount:
        form.maxDiscountAmount === '' ? null : Number(form.maxDiscountAmount),
      minOrderAmount: form.minOrderAmount === '' ? 0 : Number(form.minOrderAmount),
      usageLimit: form.usageLimit === '' ? 999 : Number(form.usageLimit),
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString()
    };
    if (payload.maxDiscountAmount !== null && Number.isNaN(payload.maxDiscountAmount)) {
      toast.error('Giảm tối đa không hợp lệ');
      return;
    }
    try {
      if (modal.editing) {
        await adminService.vouchers.updateVoucher(modal.editing, {
          ...payload,
          isActive: form.isActive
        });
        toast.success('Cập nhật voucher thành công');
      } else {
        if (!form.voucherCode.trim()) {
          toast.error('Nhập mã voucher');
          return;
        }
        await adminService.vouchers.createVoucher({
          voucherCode: form.voucherCode.trim(),
          ...payload
        });
        toast.success('Tạo voucher thành công');
      }
      setModal({ open: false, editing: null });
      await refresh();
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || 'Lưu thất bại');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Vô hiệu hóa voucher này?')) return;
    try {
      await adminService.vouchers.deleteVoucher(id);
      toast.success('Đã cập nhật');
      await refresh();
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || 'Thao tác thất bại');
    }
  };

  const fmtMoney = (n) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(n) || 0);

  const fmtDate = (d) => {
    if (!d) return '—';
    const x = new Date(d);
    return Number.isNaN(x.getTime()) ? '—' : x.toLocaleString('vi-VN');
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Mã giảm giá (Voucher)</h1>
          <div className="admin-page-subtitle">Tạo và quản lý mã khuyến mãi cho đơn hàng.</div>
        </div>
        <Button variant="primary" onClick={openNew}>
          Thêm voucher
        </Button>
      </div>

      {stats && (
        <Row className="g-3 mb-3">
          <Col md={6}>
            <StatCard title="Tổng mã" value={stats.totalVouchers ?? 0} icon={FiTag} color="indigo" />
          </Col>
          <Col md={6}>
            <StatCard
              title="Đang hiệu lực"
              value={stats.activeVouchers ?? 0}
              icon={FiCheckCircle}
              color="green"
            />
          </Col>
        </Row>
      )}

      <Card className="admin-panel">
        <Card.Body className="admin-panel-body">
          <Row className="g-2 mb-3 align-items-end">
            <Col md={4}>
              <Form.Label className="small text-muted mb-1">Trạng thái bật</Form.Label>
              <Form.Select
                value={filters.isActive}
                onChange={(e) => setFilters((f) => ({ ...f, isActive: e.target.value }))}
              >
                <option value="">Tất cả</option>
                <option value="true">Đang bật</option>
                <option value="false">Đã tắt</option>
              </Form.Select>
            </Col>
            <Col md={4}>
              <Form.Label className="small text-muted mb-1">Hạn</Form.Label>
              <Form.Select
                value={filters.isExpired}
                onChange={(e) => setFilters((f) => ({ ...f, isExpired: e.target.value }))}
              >
                <option value="">Tất cả</option>
                <option value="false">Còn hạn / sắp diễn ra</option>
                <option value="true">Đã hết hạn</option>
              </Form.Select>
            </Col>
          </Row>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : (
            <Table responsive hover className="admin-table">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Tên</th>
                  <th>Giảm</th>
                  <th>Đơn tối thiểu</th>
                  <th>Dùng</th>
                  <th>Thời gian</th>
                  <th>Trạng thái</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {vouchers.map((v) => {
                  const id = v.voucherId || v._id?.toString();
                  const uiType = mapDiscountTypeToUi(v.discountType);
                  const disc =
                    uiType === 'Phần trăm'
                      ? `${v.discountValue}%`
                      : fmtMoney(v.discountValue);
                  const minOrd = v.minOrderValue ?? v.minOrderAmount ?? 0;
                  return (
                    <tr key={id}>
                      <td>
                        <code>{v.voucherCode || v.code}</code>
                      </td>
                      <td>
                        <div className="fw-semibold">{v.voucherName || v.code}</div>
                        {v.description && (
                          <small className="text-muted d-block">{v.description}</small>
                        )}
                      </td>
                      <td>
                        {disc}
                        {v.maxDiscountAmount != null && uiType === 'Phần trăm' && (
                          <small className="text-muted d-block">Tối đa {fmtMoney(v.maxDiscountAmount)}</small>
                        )}
                      </td>
                      <td>{fmtMoney(minOrd)}</td>
                      <td>
                        {v.usedCount ?? 0} / {v.usageLimit ?? '—'}
                      </td>
                      <td>
                        <small>
                          {fmtDate(v.startDate)} → {fmtDate(v.endDate)}
                        </small>
                      </td>
                      <td>
                        <Badge bg={v.isActive !== false ? 'primary' : 'secondary'} className="me-1">
                          {v.isActive !== false ? 'Bật' : 'Tắt'}
                        </Badge>
                        <Badge bg="light" text="dark">
                          {voucherStatusLabel(v)}
                        </Badge>
                      </td>
                      <td>
                        <div className="admin-actions">
                          <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => openEdit(v)}
                          >
                            Sửa
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => remove(id)}>
                            Xóa
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
          {!loading && vouchers.length === 0 && (
            <p className="text-muted mb-0">Không có voucher nào.</p>
          )}
        </Card.Body>
      </Card>

      <Modal show={modal.open} onHide={() => setModal({ open: false, editing: null })} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{modal.editing ? 'Sửa voucher' : 'Thêm voucher'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-2">
            <Col md={6}>
              <Form.Label>Mã voucher *</Form.Label>
              <Form.Control
                value={form.voucherCode}
                onChange={(e) => setForm((p) => ({ ...p, voucherCode: e.target.value }))}
                disabled={!!modal.editing}
                placeholder="SALE10"
              />
            </Col>
            <Col md={6}>
              <Form.Label>Tên hiển thị *</Form.Label>
              <Form.Control
                value={form.voucherName}
                onChange={(e) => setForm((p) => ({ ...p, voucherName: e.target.value }))}
              />
            </Col>
            <Col md={12}>
              <Form.Label>Mô tả</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Loại giảm *</Form.Label>
              <Form.Select
                value={form.discountType}
                onChange={(e) => setForm((p) => ({ ...p, discountType: e.target.value }))}
              >
                {DISCOUNT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={6}>
              <Form.Label>Giá trị * {form.discountType === 'Phần trăm' ? '(%)' : '(VND)'}</Form.Label>
              <Form.Control
                type="number"
                min={0}
                step="any"
                value={form.discountValue}
                onChange={(e) => setForm((p) => ({ ...p, discountValue: e.target.value }))}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Giảm tối đa (VND, tuỳ chọn)</Form.Label>
              <Form.Control
                type="number"
                min={0}
                value={form.maxDiscountAmount}
                onChange={(e) => setForm((p) => ({ ...p, maxDiscountAmount: e.target.value }))}
                placeholder="Áp dụng khi %"
              />
            </Col>
            <Col md={6}>
              <Form.Label>Đơn tối thiểu (VND)</Form.Label>
              <Form.Control
                type="number"
                min={0}
                value={form.minOrderAmount}
                onChange={(e) => setForm((p) => ({ ...p, minOrderAmount: e.target.value }))}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Giới hạn lượt dùng</Form.Label>
              <Form.Control
                type="number"
                min={1}
                value={form.usageLimit}
                onChange={(e) => setForm((p) => ({ ...p, usageLimit: e.target.value }))}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Bắt đầu *</Form.Label>
              <Form.Control
                type="datetime-local"
                value={form.startDate}
                onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Kết thúc *</Form.Label>
              <Form.Control
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
              />
            </Col>
            {modal.editing && (
              <Col md={12}>
                <Form.Check
                  type="switch"
                  label="Đang bật"
                  checked={form.isActive}
                  onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                />
              </Col>
            )}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setModal({ open: false, editing: null })}>
            Đóng
          </Button>
          <Button variant="primary" onClick={save}>
            Lưu
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminVouchers;
