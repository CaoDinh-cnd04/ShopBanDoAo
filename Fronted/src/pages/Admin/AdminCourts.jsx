import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Form,
  Row,
  Col,
  Spinner,
  Badge,
  Modal,
  Nav
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import { FiMapPin, FiCalendar, FiLayers } from 'react-icons/fi';
import StatCard from '../../components/Admin/StatCard';
import api from '../../services/api';
import adminService from '../../services/adminService';

const TAB = { courts: 'courts', types: 'types' };

const emptyCourt = {
  courtTypeId: '',
  courtName: '',
  courtCode: '',
  location: '',
  address: '',
  description: '',
  facilities: '',
  capacity: '',
  openTime: '',
  closeTime: '',
  isActive: true
};

const AdminCourts = () => {
  const [tab, setTab] = useState(TAB.courts);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [courts, setCourts] = useState([]);
  const [courtTypes, setCourtTypes] = useState([]);

  const [filters, setFilters] = useState({
    courtType: '',
    isActive: ''
  });

  const [courtModal, setCourtModal] = useState({ open: false, editing: null });
  const [courtForm, setCourtForm] = useState(emptyCourt);

  const [typeModal, setTypeModal] = useState(false);
  const [typeForm, setTypeForm] = useState({ typeName: '', description: '' });

  const loadCourtTypes = useCallback(async () => {
    const res = await api.get('/courts/types');
    const data = res.data?.data;
    setCourtTypes(Array.isArray(data) ? data : []);
  }, []);

  const loadCourts = useCallback(async () => {
    const params = {};
    if (filters.courtType) params.courtType = filters.courtType;
    if (filters.isActive !== '') params.isActive = filters.isActive;
    const res = await adminService.courts.getAllCourts(params);
    const data = res.data?.data;
    setCourts(Array.isArray(data) ? data : []);
  }, [filters.courtType, filters.isActive]);

  const loadStats = useCallback(async () => {
    const res = await adminService.courts.getCourtStats();
    setStats(res.data?.data ?? null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        await Promise.all([loadStats(), loadCourtTypes(), loadCourts()]);
      } catch (e) {
        if (!cancelled) {
          console.error(e);
          toast.error(e.response?.data?.message || 'Không tải được dữ liệu sân');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadCourtTypes, loadCourts, loadStats]);

  const refreshAll = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([loadStats(), loadCourtTypes(), loadCourts()]);
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || 'Không tải được dữ liệu sân');
    } finally {
      setLoading(false);
    }
  }, [loadCourtTypes, loadCourts, loadStats]);

  const openNewCourt = () => {
    setCourtForm(emptyCourt);
    setCourtModal({ open: true, editing: null });
  };

  const openEditCourt = (c) => {
    const id = c.courtId || c._id?.toString();
    setCourtForm({
      courtTypeId: c.courtTypeId || '',
      courtName: c.courtName || '',
      courtCode: c.courtCode || '',
      location: c.location || '',
      address: c.address ?? '',
      description: c.description ?? '',
      facilities: typeof c.facilities === 'string' ? c.facilities : c.facilities ?? '',
      capacity: c.capacity != null ? String(c.capacity) : '',
      openTime: c.openTime || '',
      closeTime: c.closeTime || '',
      isActive: c.isActive !== false
    });
    setCourtModal({ open: true, editing: id });
  };

  const saveCourt = async () => {
    const payload = {
      courtTypeId: courtForm.courtTypeId,
      courtName: courtForm.courtName.trim(),
      courtCode: courtForm.courtCode.trim(),
      location: courtForm.location.trim(),
      address: courtForm.address.trim() || null,
      description: courtForm.description.trim() || null,
      facilities: courtForm.facilities.trim() || null,
      capacity: courtForm.capacity === '' ? null : Number(courtForm.capacity),
      openTime: courtForm.openTime.trim(),
      closeTime: courtForm.closeTime.trim()
    };
    if (Number.isNaN(payload.capacity)) {
      toast.error('Sức chứa không hợp lệ');
      return;
    }
    try {
      if (courtModal.editing) {
        await adminService.courts.updateCourt(courtModal.editing, {
          ...payload,
          isActive: courtForm.isActive
        });
        toast.success('Cập nhật sân thành công');
      } else {
        await adminService.courts.createCourt(payload);
        toast.success('Tạo sân thành công');
      }
      setCourtModal({ open: false, editing: null });
      await refreshAll();
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || 'Lưu sân thất bại');
    }
  };

  const deleteCourt = async (id) => {
    if (!window.confirm('Ngừng hoạt động sân này?')) return;
    try {
      await adminService.courts.deleteCourt(id);
      toast.success('Đã cập nhật');
      await refreshAll();
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || 'Thao tác thất bại');
    }
  };

  const saveCourtType = async () => {
    if (!typeForm.typeName.trim()) {
      toast.error('Nhập tên loại sân');
      return;
    }
    try {
      await adminService.courts.createCourtType({
        typeName: typeForm.typeName.trim(),
        description: typeForm.description.trim() || null
      });
      toast.success('Đã thêm loại sân');
      setTypeModal(false);
      setTypeForm({ typeName: '', description: '' });
      await loadCourtTypes();
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || 'Không tạo được loại sân');
    }
  };

  const typeNameOptions = courtTypes.map((t) => ({
    value: t.typeName,
    label: t.typeName
  }));

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Sân thể thao</h1>
          <div className="admin-page-subtitle">Quản lý sân, loại sân và xem nhanh thống kê.</div>
        </div>
      </div>

      {stats && (
        <Row className="g-3 mb-3">
          <Col md={4}>
            <StatCard title="Tổng sân" value={stats.totalCourts ?? 0} icon={FiMapPin} color="indigo" />
          </Col>
          <Col md={4}>
            <StatCard
              title="Sân đang hoạt động"
              value={stats.activeCourts ?? 0}
              icon={FiLayers}
              color="green"
            />
          </Col>
          <Col md={4}>
            <StatCard
              title="Lượt đặt (tổng)"
              value={stats.totalBookings ?? 0}
              icon={FiCalendar}
              color="amber"
            />
          </Col>
        </Row>
      )}

      <Nav variant="tabs" className="mb-3 admin-cat-nav" activeKey={tab} onSelect={(k) => k && setTab(k)}>
        <Nav.Item>
          <Nav.Link eventKey={TAB.courts}>Danh sách sân</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey={TAB.types}>Loại sân</Nav.Link>
        </Nav.Item>
      </Nav>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : (
        <>
          {tab === TAB.courts && (
            <Card className="admin-panel">
              <Card.Body className="admin-panel-body">
                <Row className="g-2 mb-3 align-items-end">
                  <Col md={4}>
                    <Form.Label className="small text-muted mb-1">Loại sân</Form.Label>
                    <Form.Select
                      value={filters.courtType}
                      onChange={(e) => setFilters((f) => ({ ...f, courtType: e.target.value }))}
                    >
                      <option value="">Tất cả</option>
                      {typeNameOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col md={3}>
                    <Form.Label className="small text-muted mb-1">Trạng thái</Form.Label>
                    <Form.Select
                      value={filters.isActive}
                      onChange={(e) => setFilters((f) => ({ ...f, isActive: e.target.value }))}
                    >
                      <option value="">Tất cả</option>
                      <option value="true">Đang hoạt động</option>
                      <option value="false">Ngừng</option>
                    </Form.Select>
                  </Col>
                  <Col md={5} className="text-md-end">
                    <Button variant="primary" onClick={openNewCourt}>
                      Thêm sân
                    </Button>
                  </Col>
                </Row>

                <Table responsive hover className="admin-table">
                  <thead>
                    <tr>
                      <th>Mã</th>
                      <th>Tên sân</th>
                      <th>Loại</th>
                      <th>Địa điểm</th>
                      <th>Giờ mở</th>
                      <th>Đặt / Đánh giá</th>
                      <th>Trạng thái</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {courts.map((c) => {
                      const id = c.courtId || c._id?.toString();
                      return (
                        <tr key={id}>
                          <td>
                            <code>{c.courtCode}</code>
                          </td>
                          <td className="fw-semibold">{c.courtName}</td>
                          <td>{c.courtType || '—'}</td>
                          <td>
                            <div>{c.location}</div>
                            {c.address && (
                              <small className="text-muted d-block">{c.address}</small>
                            )}
                          </td>
                          <td>
                            <small>
                              {c.openTime} – {c.closeTime}
                            </small>
                          </td>
                          <td>
                            <span className="me-2">{c.totalBookings ?? 0} đặt</span>
                            <span className="text-muted">{c.reviewCount ?? 0} review</span>
                          </td>
                          <td>
                            <Badge bg={c.isActive !== false ? 'success' : 'secondary'}>
                              {c.isActive !== false ? 'Hoạt động' : 'Ngừng'}
                            </Badge>
                          </td>
                          <td className="text-end">
                            <Button
                              size="sm"
                              variant="outline-primary"
                              className="me-2"
                              onClick={() => openEditCourt(c)}
                            >
                              Sửa
                            </Button>
                            <Button size="sm" variant="outline-danger" onClick={() => deleteCourt(id)}>
                              Ngừng
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
                {courts.length === 0 && (
                  <p className="text-muted mb-0">Chưa có sân nào hoặc không khớp bộ lọc.</p>
                )}
              </Card.Body>
            </Card>
          )}

          {tab === TAB.types && (
            <Card className="admin-panel">
              <Card.Body className="admin-panel-body">
                <div className="d-flex justify-content-end mb-3">
                  <Button variant="primary" onClick={() => setTypeModal(true)}>
                    Thêm loại sân
                  </Button>
                </div>
                <Table responsive hover className="admin-table">
                  <thead>
                    <tr>
                      <th>Tên loại</th>
                      <th>Mô tả</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courtTypes.map((t) => {
                      const tid = t.courtTypeId || t._id?.toString();
                      return (
                        <tr key={tid}>
                          <td className="fw-semibold">{t.typeName}</td>
                          <td className="text-muted">{t.description || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
                {courtTypes.length === 0 && (
                  <p className="text-muted mb-0">Chưa có loại sân. Thêm loại trước khi tạo sân.</p>
                )}
              </Card.Body>
            </Card>
          )}
        </>
      )}

      <Modal show={courtModal.open} onHide={() => setCourtModal({ open: false, editing: null })} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{courtModal.editing ? 'Sửa sân' : 'Thêm sân'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-2">
            <Col md={6}>
              <Form.Label>Loại sân *</Form.Label>
              <Form.Select
                required
                value={courtForm.courtTypeId}
                onChange={(e) => setCourtForm((p) => ({ ...p, courtTypeId: e.target.value }))}
              >
                <option value="">— Chọn —</option>
                {courtTypes.map((t) => {
                  const tid = t.courtTypeId || t._id?.toString();
                  return (
                    <option key={tid} value={tid}>
                      {t.typeName}
                    </option>
                  );
                })}
              </Form.Select>
            </Col>
            <Col md={6}>
              <Form.Label>Mã sân *</Form.Label>
              <Form.Control
                value={courtForm.courtCode}
                onChange={(e) => setCourtForm((p) => ({ ...p, courtCode: e.target.value }))}
                disabled={!!courtModal.editing}
              />
            </Col>
            <Col md={12}>
              <Form.Label>Tên sân *</Form.Label>
              <Form.Control
                value={courtForm.courtName}
                onChange={(e) => setCourtForm((p) => ({ ...p, courtName: e.target.value }))}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Địa điểm / khu vực *</Form.Label>
              <Form.Control
                value={courtForm.location}
                onChange={(e) => setCourtForm((p) => ({ ...p, location: e.target.value }))}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Địa chỉ chi tiết</Form.Label>
              <Form.Control
                value={courtForm.address}
                onChange={(e) => setCourtForm((p) => ({ ...p, address: e.target.value }))}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Mở cửa *</Form.Label>
              <Form.Control
                placeholder="VD: 06:00"
                value={courtForm.openTime}
                onChange={(e) => setCourtForm((p) => ({ ...p, openTime: e.target.value }))}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Đóng cửa *</Form.Label>
              <Form.Control
                placeholder="VD: 22:00"
                value={courtForm.closeTime}
                onChange={(e) => setCourtForm((p) => ({ ...p, closeTime: e.target.value }))}
              />
            </Col>
            <Col md={12}>
              <Form.Label>Mô tả</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={courtForm.description}
                onChange={(e) => setCourtForm((p) => ({ ...p, description: e.target.value }))}
              />
            </Col>
            <Col md={12}>
              <Form.Label>Tiện ích (text)</Form.Label>
              <Form.Control
                value={courtForm.facilities}
                onChange={(e) => setCourtForm((p) => ({ ...p, facilities: e.target.value }))}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Sức chứa (người)</Form.Label>
              <Form.Control
                type="number"
                min={0}
                value={courtForm.capacity}
                onChange={(e) => setCourtForm((p) => ({ ...p, capacity: e.target.value }))}
              />
            </Col>
            {courtModal.editing && (
              <Col md={12}>
                <Form.Check
                  type="switch"
                  label="Đang hoạt động"
                  checked={courtForm.isActive}
                  onChange={(e) => setCourtForm((p) => ({ ...p, isActive: e.target.checked }))}
                />
              </Col>
            )}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setCourtModal({ open: false, editing: null })}>
            Đóng
          </Button>
          <Button variant="primary" onClick={saveCourt}>
            Lưu
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={typeModal} onHide={() => setTypeModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Thêm loại sân</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-2">
            <Form.Label>Tên loại *</Form.Label>
            <Form.Control
              value={typeForm.typeName}
              onChange={(e) => setTypeForm((p) => ({ ...p, typeName: e.target.value }))}
              placeholder="VD: Sân pickleball"
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Mô tả</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={typeForm.description}
              onChange={(e) => setTypeForm((p) => ({ ...p, description: e.target.value }))}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setTypeModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={saveCourtType}>
            Tạo
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminCourts;
