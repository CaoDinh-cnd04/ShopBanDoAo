import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Table, Button, Form, Row, Col, Spinner, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../../services/api';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: '',
    category: '',
    brand: ''
  });
  const [pagination, setPagination] = useState(null);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchCategoriesAndBrands();
  }, [filters.page, filters.category, filters.brand]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page: filters.page,
        limit: filters.limit,
        search: filters.search || undefined,
        categoryId: filters.category || undefined,
        brandId: filters.brand || undefined
      };
      const response = await api.get('/products', { params });
      const resData = response.data?.data;
      const resPagination = response.data?.pagination;
      setProducts(Array.isArray(resData) ? resData : (resData?.products ?? []));
      const pag = resPagination ?? resData?.pagination;
      setPagination(pag ? { ...pag, currentPage: pag.currentPage ?? pag.page } : null);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Lỗi khi tải danh sách sản phẩm');
      setProducts([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoriesAndBrands = async () => {
    try {
      const [catResponse, brandResponse] = await Promise.all([
        api.get('/categories'),
        api.get('/categories/brands')
      ]);
      setCategories(Array.isArray(catResponse.data?.data) ? catResponse.data.data : []);
      setBrands(Array.isArray(brandResponse.data?.data) ? brandResponse.data.data : []);
    } catch (error) {
      console.error('Error fetching categories/brands:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
    fetchProducts();
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;

    try {
      await api.delete(`/products/${productId}`);
      toast.success('Xóa sản phẩm thành công');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Lỗi khi xóa sản phẩm');
    }
  };

  const toggleProductStatus = async (productId, currentStatus) => {
    try {
      await api.put(`/products/${productId}`, { isActive: !currentStatus });
      toast.success('Cập nhật trạng thái thành công');
      fetchProducts();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };

  const pid = (p) => p.productId || p.ProductID || p._id;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Sản phẩm</h1>
          <div className="admin-page-subtitle">Quản lý danh sách sản phẩm, trạng thái và tìm kiếm.</div>
        </div>
        <Button as={Link} to="/admin/products/new" variant="primary">
          Thêm sản phẩm
        </Button>
      </div>

      <Card className="admin-panel">
        <Card.Body className="admin-panel-body">
          <Form onSubmit={handleSearch}>
            <Row className="g-2">
              <Col md={4}>
                <Form.Control
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </Col>
              <Col md={3}>
                <Form.Select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}
                >
                  <option value="">Tất cả danh mục</option>
                  {categories.map((cat) => (
                    <option key={cat.categoryId || cat._id} value={cat.categoryId || cat._id}>
                      {cat.categoryName || cat.CategoryName}
                    </option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={3}>
                <Form.Select
                  value={filters.brand}
                  onChange={(e) => setFilters({ ...filters, brand: e.target.value, page: 1 })}
                >
                  <option value="">Tất cả thương hiệu</option>
                  {brands.map((brand) => (
                    <option key={brand.brandId || brand._id} value={brand.brandId || brand._id}>
                      {brand.brandName || brand.BrandName}
                    </option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={2}>
                <Button type="submit" variant="primary" className="w-100">
                  Tìm kiếm
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
              <Table responsive hover className="admin-table table-hover">
                <thead>
                  <tr>
                    <th>Hình ảnh</th>
                    <th>Tên sản phẩm</th>
                    <th>Danh mục</th>
                    <th>Thương hiệu</th>
                    <th>Giá</th>
                    <th>Đánh giá</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {(products?.length ?? 0) > 0 ? (
                    products.map((product) => {
                      const active = product.isActive ?? product.IsActive;
                      return (
                        <tr key={pid(product)}>
                          <td>
                            <img
                              src={product.primaryImage || product.PrimaryImage || '/placeholder.jpg'}
                              alt={product.productName || product.ProductName}
                              style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }}
                            />
                          </td>
                          <td>
                            <div className="fw-bold">{product.productName || product.ProductName}</div>
                            <small className="text-muted">{product.productCode || product.ProductCode}</small>
                          </td>
                          <td>{product.categoryName || product.CategoryName}</td>
                          <td>{product.brandName || product.BrandName}</td>
                          <td className="fw-bold">
                            {new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND'
                            }).format(product.minPrice ?? product.MinPrice ?? 0)}
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="bi bi-star-fill text-warning me-1"></i>
                              <span>{(product.avgRating ?? product.AvgRating)?.toFixed?.(1) || 'N/A'}</span>
                              <small className="text-muted ms-1">({product.reviewCount ?? product.ReviewCount ?? 0})</small>
                            </div>
                          </td>
                          <td>
                            <Badge bg={active ? 'success' : 'secondary'}>
                              {active ? 'Hoạt động' : 'Tạm dừng'}
                            </Badge>
                          </td>
                          <td>
                            <Button
                              as={Link}
                              to={`/admin/products/${pid(product)}`}
                              size="sm"
                              variant="outline-primary"
                              className="me-2"
                            >
                              Sửa
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-warning"
                              className="me-2"
                              onClick={() => toggleProductStatus(pid(product), active)}
                            >
                              {active ? 'Tạm dừng' : 'Kích hoạt'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => handleDelete(pid(product))}
                            >
                              Xóa
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center" style={{ color: 'rgba(255,255,255,0.62)' }}>
                        Không có sản phẩm nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          {pagination && (pagination.totalPages ?? 0) > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Button
                variant="outline-primary"
                disabled={filters.page === 1}
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              >
                Trước
              </Button>
              <span className="mx-3 align-self-center">
                Trang {pagination.currentPage ?? pagination.page} / {pagination.totalPages}
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

export default AdminProducts;
