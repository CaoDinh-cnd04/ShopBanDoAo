import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Card, Form, Button, Row, Col, Spinner, Badge, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { FiArrowLeft } from 'react-icons/fi';
import adminService from '../../services/adminService';

const toDateInput = (d) => {
  if (!d) return '';
  const x = new Date(d);
  return Number.isNaN(x.getTime()) ? '' : x.toISOString().slice(0, 10);
};

const sportsToString = (v) => {
  if (v == null) return '';
  if (Array.isArray(v)) return v.join(', ');
  return String(v);
};

const AdminUserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rolesCatalog, setRolesCatalog] = useState([]);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    fullName: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: '',
    bio: '',
    facebookLink: '',
    instagramLink: '',
    favoriteSports: '',
    isActive: true,
    isEmailVerified: false,
    isPhoneVerified: false,
    roleIds: []
  });

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        const [rolesRes, userRes] = await Promise.all([
          adminService.users.getRolesList(),
          adminService.users.getUserById(id)
        ]);
        if (cancelled) return;
        const list = rolesRes.data?.data;
        setRolesCatalog(Array.isArray(list) ? list : []);
        const u = userRes.data?.data;
        setUser(u);
        if (u) {
          const rids = (u.Roles || []).map((r) => (r.roleId?.toString?.() ? r.roleId.toString() : r.roleId));
          setForm({
            fullName: u.fullName ?? '',
            phoneNumber: u.phoneNumber ?? '',
            dateOfBirth: toDateInput(u.dateOfBirth),
            gender: u.gender ?? '',
            bio: u.bio ?? '',
            facebookLink: u.facebookLink ?? '',
            instagramLink: u.instagramLink ?? '',
            favoriteSports: sportsToString(u.favoriteSports),
            isActive: u.isActive !== false,
            isEmailVerified: !!u.isEmailVerified,
            isPhoneVerified: !!u.isPhoneVerified,
            roleIds: rids
          });
        }
      } catch (e) {
        if (!cancelled) {
          console.error(e);
          toast.error(e.response?.data?.message || 'Không tải được user');
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

  const stats = user?.Statistics;

  const toggleRole = (roleId) => {
    const rid = roleId.toString();
    setForm((f) => ({
      ...f,
      roleIds: f.roleIds.includes(rid) ? f.roleIds.filter((x) => x !== rid) : [...f.roleIds, rid]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (!form.roleIds.length) {
        toast.error('Chọn ít nhất một role');
        return;
      }
      const payload = {
        fullName: form.fullName.trim(),
        phoneNumber: form.phoneNumber.trim() || null,
        dateOfBirth: form.dateOfBirth || null,
        gender: form.gender.trim() || null,
        bio: form.bio.trim() || null,
        facebookLink: form.facebookLink.trim() || null,
        instagramLink: form.instagramLink.trim() || null,
        favoriteSports: form.favoriteSports.trim() || null,
        isActive: form.isActive,
        isEmailVerified: form.isEmailVerified,
        isPhoneVerified: form.isPhoneVerified,
        roles: form.roleIds
      };
      await adminService.users.updateUser(id, payload);
      toast.success('Đã lưu thông tin user');
      const userRes = await adminService.users.getUserById(id);
      setUser(userRes.data?.data);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const addrList = useMemo(() => user?.Addresses || [], [user]);

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

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <Link to="/admin/users" className="admin-back-link d-inline-flex align-items-center gap-2 mb-2">
            <FiArrowLeft /> Danh sách người dùng
          </Link>
          <h1 className="admin-page-title">User: {user.username || user.email}</h1>
          <div className="admin-page-subtitle">{user.email}</div>
        </div>
      </div>

      {stats && (
        <Row className="g-2 mb-3">
          <Col xs={6} md={3}>
            <Card className="admin-panel">
              <Card.Body className="py-3 text-center">
                <div className="small text-muted">Đơn hàng</div>
                <div className="fs-4 fw-bold">{stats.totalOrders ?? 0}</div>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6} md={3}>
            <Card className="admin-panel">
              <Card.Body className="py-3 text-center">
                <div className="small text-muted">Đặt sân</div>
                <div className="fs-4 fw-bold">{stats.totalBookings ?? 0}</div>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6} md={3}>
            <Card className="admin-panel">
              <Card.Body className="py-3 text-center">
                <div className="small text-muted">Đánh giá SP</div>
                <div className="fs-4 fw-bold">{stats.totalReviews ?? 0}</div>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6} md={3}>
            <Card className="admin-panel">
              <Card.Body className="py-3 text-center">
                <div className="small text-muted">Wishlist</div>
                <div className="fs-4 fw-bold">{stats.totalWishlistItems ?? 0}</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <Form onSubmit={handleSubmit}>
        <Card className="admin-panel mb-3">
          <Card.Body className="admin-panel-body">
            <h5 className="mb-3">Thông tin & quyền</h5>
            <Row className="g-3">
              <Col md={6}>
                <Form.Label>Họ tên</Form.Label>
                <Form.Control
                  value={form.fullName}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                />
              </Col>
              <Col md={6}>
                <Form.Label>Số điện thoại</Form.Label>
                <Form.Control
                  value={form.phoneNumber}
                  onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                />
              </Col>
              <Col md={4}>
                <Form.Label>Ngày sinh</Form.Label>
                <Form.Control
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                />
              </Col>
              <Col md={4}>
                <Form.Label>Giới tính</Form.Label>
                <Form.Control
                  value={form.gender}
                  onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                  placeholder="Nam / Nữ / ..."
                />
              </Col>
              <Col md={12}>
                <Form.Label>Roles</Form.Label>
                <div className="d-flex flex-wrap gap-2">
                  {rolesCatalog.map((r) => {
                    const rid = r.roleId || r._id?.toString();
                    const checked = form.roleIds.includes(rid);
                    return (
                      <Button
                        key={rid}
                        type="button"
                        size="sm"
                        variant={checked ? 'primary' : 'outline-secondary'}
                        onClick={() => toggleRole(rid)}
                      >
                        {r.roleName}
                      </Button>
                    );
                  })}
                </div>
              </Col>
              <Col md={4}>
                <Form.Check
                  type="switch"
                  label="Tài khoản hoạt động"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                />
              </Col>
              <Col md={4}>
                <Form.Check
                  type="switch"
                  label="Email đã xác minh"
                  checked={form.isEmailVerified}
                  onChange={(e) => setForm((f) => ({ ...f, isEmailVerified: e.target.checked }))}
                />
              </Col>
              <Col md={4}>
                <Form.Check
                  type="switch"
                  label="SĐT đã xác minh"
                  checked={form.isPhoneVerified}
                  onChange={(e) => setForm((f) => ({ ...f, isPhoneVerified: e.target.checked }))}
                />
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Card className="admin-panel mb-3">
          <Card.Body className="admin-panel-body">
            <h5 className="mb-3">Mạng xã hội & sở thích</h5>
            <Row className="g-3">
              <Col md={12}>
                <Form.Label>Tiểu sử</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={form.bio}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                />
              </Col>
              <Col md={6}>
                <Form.Label>Facebook</Form.Label>
                <Form.Control
                  value={form.facebookLink}
                  onChange={(e) => setForm((f) => ({ ...f, facebookLink: e.target.value }))}
                />
              </Col>
              <Col md={6}>
                <Form.Label>Instagram</Form.Label>
                <Form.Control
                  value={form.instagramLink}
                  onChange={(e) => setForm((f) => ({ ...f, instagramLink: e.target.value }))}
                />
              </Col>
              <Col md={12}>
                <Form.Label>Môn thể thao yêu thích (cách nhau bởi dấu phẩy)</Form.Label>
                <Form.Control
                  value={form.favoriteSports}
                  onChange={(e) => setForm((f) => ({ ...f, favoriteSports: e.target.value }))}
                />
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {addrList.length > 0 && (
          <Card className="admin-panel mb-3">
            <Card.Body className="admin-panel-body">
              <h5 className="mb-3">Địa chỉ đã lưu</h5>
              {addrList.map((a) => (
                <div key={a.addressId || a._id} className="mb-2 pb-2 border-bottom border-secondary border-opacity-25">
                  <strong>{a.receiverName}</strong> — {a.receiverPhone}
                  <div className="small text-muted">
                    {[a.addressLine, a.ward, a.district, a.city].filter(Boolean).join(', ')}
                  </div>
                  {a.isDefault && <Badge bg="success">Mặc định</Badge>}
                </div>
              ))}
            </Card.Body>
          </Card>
        )}

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
