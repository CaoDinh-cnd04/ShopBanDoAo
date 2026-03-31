import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Card, Form, Button, Row, Col, Spinner, Alert, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { FiArrowLeft } from 'react-icons/fi';
import adminService from '../../services/adminService';

const AdminUserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    role: 'User',
    isActive: true,
  });

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        const userRes = await adminService.users.getUserById(id);
        if (cancelled) return;
        const u = userRes.data?.data;
        setUser(u);
        if (u) {
          setForm({
            fullName: u.fullName ?? '',
            phone: u.phone ?? '',
            role: u.role === 'Admin' ? 'Admin' : 'User',
            isActive: u.isActive !== false,
          });
        }
      } catch (e) {
        if (!cancelled) {
          console.error(e);
          toast.error(e.response?.data?.message || 'Không tải được người dùng');
          navigate('/admin/users');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || undefined,
        role: form.role,
        isActive: form.isActive,
      };
      await adminService.users.updateUser(id, payload);
      toast.success('Đã lưu');
      const userRes = await adminService.users.getUserById(id);
      setUser(userRes.data?.data);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page text-center py-5">
        <Spinner animation="border" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="admin-page">
        <Alert variant="danger">Không có dữ liệu user.</Alert>
        <Link to="/admin/users">← Quay lại</Link>
      </div>
    );
  }

  const email = user.email ?? '';
  const created = user.createdAt ?? user.createdDate;
  const t = created ? new Date(created) : null;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <Link to="/admin/users" className="admin-back-link d-inline-flex align-items-center gap-2 mb-2">
            <FiArrowLeft /> Danh sách người dùng
          </Link>
          <h1 className="admin-page-title">User: {form.fullName || email}</h1>
          <div className="admin-page-subtitle d-flex flex-wrap align-items-center gap-2">
            <span>{email}</span>
            {t && !Number.isNaN(t.getTime()) && (
              <Badge bg="secondary">Tạo: {t.toLocaleString('vi-VN')}</Badge>
            )}
          </div>
        </div>
      </div>

      <Form onSubmit={handleSubmit}>
        <Card className="admin-panel mb-3">
          <Card.Body className="admin-panel-body">
            <h5 className="mb-3">Thông tin &amp; quyền</h5>
            <Row className="g-3">
              <Col md={12}>
                <Form.Label>Email</Form.Label>
                <Form.Control value={email} disabled readOnly className="bg-light" />
              </Col>
              <Col md={6}>
                <Form.Label>Họ tên</Form.Label>
                <Form.Control
                  value={form.fullName}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                  required
                />
              </Col>
              <Col md={6}>
                <Form.Label>Số điện thoại</Form.Label>
                <Form.Control
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="Tuỳ chọn"
                />
              </Col>
              <Col md={6}>
                <Form.Label>Role</Form.Label>
                <Form.Select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                >
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                </Form.Select>
              </Col>
              <Col md={6} className="d-flex align-items-end">
                <Form.Check
                  type="switch"
                  id="user-active"
                  label="Tài khoản hoạt động"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                />
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <div className="d-flex gap-2">
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
          </Button>
          <Button type="button" variant="outline-secondary" onClick={() => navigate('/admin/users')} disabled={saving}>
            Quay lại
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default AdminUserDetail;
