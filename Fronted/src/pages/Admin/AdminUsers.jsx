import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Table, Button, Badge, Form, Row, Col, Spinner, Modal, Card } from 'react-bootstrap';
import { FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import adminService from '../../services/adminService';

const userId = (u) => u?._id?.toString?.() || u?.userId || u?.UserID;

/** Mongo User: một trường `role` (Admin | User) */
const displayRoles = (u) => {
  if (u?.role) return [String(u.role)];
  const r = u?.roles;
  if (typeof r === 'string') return r.split(',').map((s) => s.trim()).filter(Boolean);
  if (Array.isArray(r)) return r.map((x) => (typeof x === 'string' ? x : x?.roleName)).filter(Boolean);
  return [];
};

const displayUsername = (u) => {
  const email = u?.email ?? u?.Email ?? '';
  if (!email) return '—';
  const local = email.split('@')[0];
  return local || email;
};

const AdminUsers = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [draft, setDraft] = useState({ search: '' });
  const [infoModal, setInfoModal] = useState({ open: false, user: null });

  const filters = useMemo(
    () => ({
      page: Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1),
      limit: 20,
      search: searchParams.get('search') || '',
      role: searchParams.get('role') || '',
      isActive: searchParams.get('isActive') || '',
    }),
    [searchParams],
  );

  useEffect(() => {
    setDraft({ search: filters.search });
  }, [filters.search]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: filters.page,
        limit: filters.limit,
        ...(filters.search?.trim() ? { search: filters.search.trim() } : {}),
        ...(filters.role?.trim() ? { role: filters.role.trim() } : {}),
        ...(filters.isActive !== '' ? { isActive: filters.isActive } : {}),
      };
      const response = await adminService.users.getAllUsers(params);
      const data = response.data?.data;
      setUsers(Array.isArray(data?.users) ? data.users : []);
      setPagination(data?.pagination ?? null);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error(
        error.response?.data?.message || error.response?.data?.error || 'Lỗi khi tải danh sách người dùng',
      );
    } finally {
      setLoading(false);
    }
  }, [filters.page, filters.limit, filters.search, filters.role, filters.isActive]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const patchParams = (patch) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === '' || v == null || v === undefined) next.delete(k);
      else next.set(k, String(v));
    });
    setSearchParams(next);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    patchParams({ search: draft.search.trim(), page: '' });
  };

  const handleFilterRole = (value) => {
    patchParams({ role: value, page: '' });
  };

  const handleFilterActive = (value) => {
    patchParams({ isActive: value, page: '' });
  };

  const handlePage = (page) => {
    patchParams({ page: page > 1 ? page : '' });
  };

  const clearFilters = () => {
    setDraft({ search: '' });
    setSearchParams({});
  };

  const toggleUserStatus = async (id, currentActive) => {
    try {
      await adminService.users.toggleUserStatus(id, !currentActive);
      toast.success('Đã cập nhật trạng thái tài khoản');
      fetchUsers();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error(
        error.response?.data?.message || error.response?.data?.error || 'Lỗi khi cập nhật trạng thái',
      );
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Vô hiệu hóa tài khoản này? (Xóa mềm — đặt không hoạt động)')) return;
    try {
      await adminService.users.deleteUser(id);
      toast.success('Đã vô hiệu hóa tài khoản');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error.response?.data?.message || error.response?.data?.error || 'Lỗi khi xóa');
    }
  };

  const handlePermanentDeleteUser = async (id, emailLabel) => {
    const first = window.confirm(
      `XÓA VĨNH VIỄN người dùng "${emailLabel}"?\n\nHành động này không thể hoàn tác (mất dữ liệu tài khoản trong hệ thống).`,
    );
    if (!first) return;
    const second = window.prompt('Gõ chữ XOA để xác nhận (viết hoa):');
    if (second !== 'XOA') {
      toast.info('Đã hủy xóa vĩnh viễn');
      return;
    }
    try {
      await adminService.users.permanentDeleteUser(id);
      toast.success('Đã xóa người dùng vĩnh viễn');
      fetchUsers();
    } catch (error) {
      console.error('Error permanent delete user:', error);
      toast.error(
        error.response?.data?.message || error.response?.data?.error || 'Lỗi khi xóa vĩnh viễn',
      );
    }
  };

  const totalCount = pagination?.totalUsers ?? pagination?.totalItems ?? pagination?.total ?? users.length;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Người dùng</h1>
          <div className="admin-page-subtitle">
            Tìm kiếm theo email / tên / SĐT, lọc role và trạng thái — đồng bộ với API.
          </div>
        </div>
      </div>

      <Card className="admin-panel mb-3">
        <Card.Body className="admin-panel-body">
          <Form onSubmit={handleSearch}>
            <Row className="g-2 align-items-end">
              <Col md={5}>
                <Form.Label className="small text-muted mb-1">Tìm kiếm</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Email, họ tên, số điện thoại…"
                  value={draft.search}
                  onChange={(e) => setDraft((d) => ({ ...d, search: e.target.value }))}
                />
              </Col>
              <Col md={2}>
                <Form.Label className="small text-muted mb-1">Role</Form.Label>
                <Form.Select value={filters.role} onChange={(e) => handleFilterRole(e.target.value)}>
                  <option value="">Tất cả roles</option>
                  <option value="Admin">Admin</option>
                  <option value="User">User</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Label className="small text-muted mb-1">Trạng thái</Form.Label>
                <Form.Select
                  value={filters.isActive}
                  onChange={(e) => handleFilterActive(e.target.value)}
                >
                  <option value="">Tất cả</option>
                  <option value="true">Hoạt động</option>
                  <option value="false">Tạm dừng</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Button type="submit" variant="primary" className="w-100">
                  Tìm kiếm
                </Button>
              </Col>
              <Col md={1}>
                <Button
                  type="button"
                  variant="outline-secondary"
                  className="w-100"
                  title="Xóa bộ lọc"
                  onClick={clearFilters}
                >
                  <FiX size={18} />
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : (
        <>
          <Card className="admin-panel">
            <Card.Body className="admin-panel-body">
              <div className="mb-2 text-muted small">Tổng: {totalCount} người dùng</div>
              <Table responsive hover className="admin-table table-hover">
                <thead>
                  <tr>
                    <th>Đăng nhập</th>
                    <th>Email</th>
                    <th>Họ tên</th>
                    <th>Role</th>
                    <th>Ngày tạo</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length > 0 ? (
                    users.map((user) => {
                      const uid = userId(user);
                      const roles = displayRoles(user);
                      const isActive = user.isActive !== false && user.IsActive !== false;
                      const created = user.createdAt ?? user.createdDate ?? user.CreatedDate;
                      const t = created ? new Date(created) : null;
                      return (
                        <tr key={uid}>
                          <td className="fw-bold">
                            <div className="d-flex align-items-center gap-2">
                              <div
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: '50%',
                                  background: '#6c63ff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#fff',
                                  fontWeight: 700,
                                  fontSize: 13,
                                  flexShrink: 0,
                                }}
                              >
                                {(user.fullName || user.email || 'U').slice(0, 1).toUpperCase()}
                              </div>
                              {displayUsername(user)}
                            </div>
                          </td>
                          <td>{user.email ?? user.Email}</td>
                          <td>{user.fullName ?? user.FullName ?? '—'}</td>
                          <td>
                            {roles.length ? (
                              roles.map((role, idx) => (
                                <Badge key={idx} bg={role === 'Admin' ? 'danger' : 'primary'} className="me-1">
                                  {role}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td>
                            {t && !Number.isNaN(t.getTime()) ? t.toLocaleDateString('vi-VN') : '—'}
                          </td>
                          <td>
                            <Badge bg={isActive ? 'success' : 'secondary'}>
                              {isActive ? 'Hoạt động' : 'Tạm dừng'}
                            </Badge>
                          </td>
                          <td>
                            <div className="admin-actions">
                              <Button
                                size="sm"
                                variant="outline-secondary"
                                onClick={() => setInfoModal({ open: true, user })}
                              >
                                Xem
                              </Button>
                              <Button
                                as={Link}
                                to={`/admin/users/${uid}`}
                                size="sm"
                                variant="outline-primary"
                              >
                                Chi tiết
                              </Button>
                              <Button
                                size="sm"
                                variant={isActive ? 'outline-warning' : 'outline-success'}
                                onClick={() => toggleUserStatus(uid, isActive)}
                              >
                                {isActive ? 'Khóa' : 'Mở'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline-danger"
                                onClick={() => handleDeleteUser(uid)}
                              >
                                Vô hiệu
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                title="Xóa khỏi cơ sở dữ liệu — không hoàn tác"
                                onClick={() =>
                                  handlePermanentDeleteUser(uid, user.email ?? user.Email ?? uid)
                                }
                              >
                                Xóa
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center text-muted">
                        Không có user nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          {pagination && pagination.totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Button
                variant="outline-primary"
                disabled={filters.page === 1}
                onClick={() => handlePage(filters.page - 1)}
              >
                Trước
              </Button>
              <span className="mx-3 align-self-center">
                Trang {pagination.currentPage} / {pagination.totalPages}
              </span>
              <Button
                variant="outline-primary"
                disabled={filters.page === pagination.totalPages}
                onClick={() => handlePage(filters.page + 1)}
              >
                Sau
              </Button>
            </div>
          )}
        </>
      )}

      <Modal show={infoModal.open} onHide={() => setInfoModal({ open: false, user: null })} centered>
        <Modal.Header closeButton>
          <Modal.Title>Thông tin nhanh</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {infoModal.user && (() => {
            const u = infoModal.user;
            const roles = displayRoles(u);
            const isActive = u.isActive !== false && u.IsActive !== false;
            const created = u.createdAt ?? u.createdDate ?? u.CreatedDate;
            const t = created ? new Date(created) : null;
            return (
              <div>
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: '#6c63ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 22,
                    }}
                  >
                    {(u.fullName || u.email || 'U').slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <div className="fw-bold">{u.fullName ?? u.FullName}</div>
                    <div className="text-muted small">{u.email ?? u.Email}</div>
                  </div>
                </div>
                <table className="table table-sm table-borderless mb-0">
                  <tbody>
                    <tr>
                      <td className="text-muted" style={{ width: 120 }}>
                        Số điện thoại
                      </td>
                      <td>{u.phone ?? u.Phone ?? '—'}</td>
                    </tr>
                    <tr>
                      <td className="text-muted">Role</td>
                      <td>
                        {roles.map((r, i) => (
                          <Badge key={i} bg={r === 'Admin' ? 'danger' : 'primary'} className="me-1">
                            {r}
                          </Badge>
                        ))}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted">Trạng thái</td>
                      <td>
                        <Badge bg={isActive ? 'success' : 'secondary'}>
                          {isActive ? 'Hoạt động' : 'Tạm dừng'}
                        </Badge>
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted">Ngày tạo</td>
                      <td>
                        {t && !Number.isNaN(t.getTime()) ? t.toLocaleDateString('vi-VN') : '—'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })()}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setInfoModal({ open: false, user: null })}>
            Đóng
          </Button>
          {infoModal.user && (
            <Button
              as={Link}
              variant="primary"
              to={`/admin/users/${userId(infoModal.user)}`}
              onClick={() => setInfoModal({ open: false, user: null })}
            >
              Xem đầy đủ
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminUsers;
