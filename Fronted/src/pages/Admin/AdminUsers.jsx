import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Table, Button, Badge, Form, Row, Col, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import adminService from '../../services/adminService';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: '',
    role: '',
    isActive: ''
  });
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [filters.page, filters.role, filters.isActive]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminService.users.getAllUsers(filters);
      const data = response.data?.data;
      setUsers(Array.isArray(data?.users) ? data.users : []);
      setPagination(data?.pagination ?? null);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Lỗi khi tải danh sách users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
    fetchUsers();
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await adminService.users.toggleUserStatus(userId, !currentStatus);
      toast.success('Cập nhật trạng thái thành công');
      fetchUsers();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Bạn có chắc muốn xóa user này?')) return;

    try {
      await adminService.users.deleteUser(userId);
      toast.success('Xóa user thành công');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Lỗi khi xóa user');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Người dùng</h1>
          <div className="admin-page-subtitle">Tìm kiếm, khóa/mở tài khoản và mở chi tiết để chỉnh sửa.</div>
        </div>
      </div>

      <div className="admin-panel mb-3">
        <div className="admin-panel-body">
          <Form onSubmit={handleSearch}>
            <Row className="g-2">
              <Col md={5}>
                <Form.Control
                  type="text"
                  placeholder="Tìm kiếm (username, email, tên...)"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </Col>
              <Col md={3}>
                <Form.Select
                  value={filters.role}
                  onChange={(e) => setFilters({ ...filters, role: e.target.value, page: 1 })}
                >
                  <option value="">Tất cả roles</option>
                  <option value="Admin">Admin</option>
                  <option value="User">User</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Select
                  value={filters.isActive}
                  onChange={(e) => setFilters({ ...filters, isActive: e.target.value, page: 1 })}
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="true">Hoạt động</option>
                  <option value="false">Tạm dừng</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Button type="submit" variant="primary" className="w-100">
                  Tìm kiếm
                </Button>
              </Col>
            </Row>
          </Form>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : (
        <>
          <div className="admin-panel">
            <div className="admin-panel-body">
              <Table responsive hover className="admin-table table-hover">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Họ tên</th>
                    <th>Roles</th>
                    <th>Ngày tạo</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length > 0 ? (
                    users.map((user) => {
                      const uid = user.userId ?? user.UserID ?? user._id;
                      const rolesStr = user.roles;
                      const roles =
                        typeof rolesStr === 'string'
                          ? rolesStr.split(',').map((s) => s.trim()).filter(Boolean)
                          : [];
                      return (
                        <tr key={uid}>
                          <td className="fw-bold">{user.username ?? user.Username}</td>
                          <td>{user.email ?? user.Email}</td>
                          <td>{user.fullName ?? user.FullName}</td>
                          <td>
                            {roles.map((role, idx) => (
                              <Badge key={idx} bg="primary" className="me-1">
                                {role}
                              </Badge>
                            ))}
                          </td>
                          <td>{new Date(user.createdDate ?? user.CreatedDate).toLocaleDateString('vi-VN')}</td>
                          <td>
                            <Badge bg={(user.isActive ?? user.IsActive) ? 'success' : 'secondary'}>
                              {(user.isActive ?? user.IsActive) ? 'Hoạt động' : 'Tạm dừng'}
                            </Badge>
                          </td>
                          <td>
                            <Button
                              as={Link}
                              to={`/admin/users/${uid}`}
                              size="sm"
                              variant="outline-primary"
                              className="me-2"
                            >
                              Chi tiết
                            </Button>
                            <Button
                              size="sm"
                              variant={(user.isActive ?? user.IsActive) ? 'outline-warning' : 'outline-success'}
                              className="me-2"
                              onClick={() => toggleUserStatus(uid, user.isActive ?? user.IsActive)}
                            >
                              {(user.isActive ?? user.IsActive) ? 'Khóa' : 'Mở'}
                            </Button>
                            <Button size="sm" variant="outline-danger" onClick={() => handleDeleteUser(uid)}>
                              Xóa
                            </Button>
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
            </div>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Button
                variant="outline-primary"
                disabled={filters.page === 1}
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              >
                Trước
              </Button>
              <span className="mx-3 align-self-center">
                Trang {pagination.currentPage} / {pagination.totalPages}
              </span>
              <Button
                variant="outline-primary"
                disabled={filters.page === pagination.totalPages}
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              >
                Sau
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminUsers;
