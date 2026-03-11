import { useState, useEffect } from 'react';
import { Container, Table, Button, Badge, Form, Row, Col, Spinner, Modal } from 'react-bootstrap';
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
            setUsers(response.data.data.users);
            setPagination(response.data.data.pagination);
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
        <Container fluid className="admin-page-wrap">
            <h1 className="admin-page-title mb-3">
                <i className="bi bi-people-fill me-2"></i>
                Quản Lý Users
            </h1>

            {/* Filters */}
            <Form onSubmit={handleSearch} className="mb-4">
                <Row>
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
                            <i className="bi bi-search"></i> Tìm kiếm
                        </Button>
                    </Col>
                </Row>
            </Form>

            {/* Users Table */}
            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                </div>
            ) : (
                <>
                    <Table responsive hover className="bg-white shadow-sm">
                        <thead className="table-light">
                            <tr>
                                <th>ID</th>
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
                                users.map((user) => (
                                    <tr key={user.UserID}>
                                        <td>{user.UserID}</td>
                                        <td className="fw-bold">{user.Username}</td>
                                        <td>{user.Email}</td>
                                        <td>{user.FullName}</td>
                                        <td>
                                            {user.Roles?.split(',').map((role, idx) => (
                                                <Badge key={idx} bg="primary" className="me-1">
                                                    {role.trim()}
                                                </Badge>
                                            ))}
                                        </td>
                                        <td>{new Date(user.CreatedDate).toLocaleDateString('vi-VN')}</td>
                                        <td>
                                            <Badge bg={user.IsActive ? 'success' : 'secondary'}>
                                                {user.IsActive ? 'Hoạt động' : 'Tạm dừng'}
                                            </Badge>
                                        </td>
                                        <td>
                                            <Button
                                                size="sm"
                                                variant={user.IsActive ? 'outline-warning' : 'outline-success'}
                                                className="me-2"
                                                onClick={() => toggleUserStatus(user.UserID, user.IsActive)}
                                            >
                                                <i className={`bi bi-${user.IsActive ? 'pause' : 'play'}-circle`}></i>
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline-danger"
                                                onClick={() => handleDeleteUser(user.UserID)}
                                            >
                                                <i className="bi bi-trash"></i>
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="text-center text-muted py-4">
                                        Không có user nào
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="d-flex justify-content-center mt-4">
                            <Button
                                variant="outline-primary"
                                disabled={filters.page === 1}
                                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                            >
                                <i className="bi bi-chevron-left"></i> Trước
                            </Button>
                            <span className="mx-3 align-self-center">
                                Trang {pagination.currentPage} / {pagination.totalPages}
                            </span>
                            <Button
                                variant="outline-primary"
                                disabled={filters.page === pagination.totalPages}
                                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                            >
                                Sau <i className="bi bi-chevron-right"></i>
                            </Button>
                        </div>
                    )}
                </>
            )}
        </Container>
    );
};

export default AdminUsers;
