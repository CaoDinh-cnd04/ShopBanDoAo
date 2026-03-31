import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Form,
  Row,
  Col,
  Spinner,
  Badge,
  Dropdown,
} from 'react-bootstrap';
import { FiEdit2, FiEye, FiEyeOff, FiMoreVertical, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import adminService from '../../services/adminService';
import {
  productPrimaryImageUrl,
  productPriceLabel,
  productStockTotal,
  categoryLabel,
  variantCount,
} from '../../utils/adminProductHelpers';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import './AdminProducts.css';

const PLACEHOLDER_SVG =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect fill="#e2e8f0" width="100%" height="100%"/><text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-size="11" font-family="system-ui">No img</text></svg>'
  );

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: '',
    category: '',
    brand: '',
  });
  const [searchDraft, setSearchDraft] = useState('');
  const [pagination, setPagination] = useState(null);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const pid = (p) => p._id?.toString?.() || p.productId || p.ProductID;

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: filters.page,
        limit: filters.limit,
        search: filters.search || undefined,
        categoryId: filters.category || undefined,
        brand: filters.brand || undefined,
        /** Backend: chỉ khi gửi flag này admin mới thấy cả SP ẩn (JWT admin không còn “mở” full list trên cửa hàng). */
        includeInactive: 'true',
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
  }, [filters]);

  const fetchCategoriesAndBrands = useCallback(async () => {
    try {
      const [catResponse, brandResponse] = await Promise.all([
        api.get('/categories'),
        adminService.products.getDistinctBrands(),
      ]);
      setCategories(Array.isArray(catResponse.data?.data) ? catResponse.data.data : []);
      const b = brandResponse.data?.data;
      setBrands(Array.isArray(b) ? b : []);
    } catch (error) {
      console.error('Error fetching categories/brands:', error);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchCategoriesAndBrands();
  }, [fetchCategoriesAndBrands]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, page: 1, search: searchDraft.trim() }));
  };

  const toggleProductStatus = async (productId, currentStatus) => {
    const next = !currentStatus;
    const label = next ? 'mở bán lại' : 'ẩn khỏi cửa hàng (không hiển thị cho khách)';
    if (!window.confirm(`${next ? 'Mở bán' : 'Ngừng hiển thị'} sản phẩm này? (${label})`)) return;
    try {
      await api.put(`/products/${productId}`, { isActive: next });
      toast.success(next ? 'Đã mở bán' : 'Đã ẩn — khách không còn thấy trên cửa hàng');
      fetchProducts();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error(
        error.response?.data?.message || error.response?.data?.error || 'Lỗi khi cập nhật trạng thái',
      );
    }
  };

  /** Backend: soft delete — đặt isActive: false (giống ngừng bán; có thể “Mở bán lại” sau). */
  const handleDeleteProduct = async (productId) => {
    if (
      !window.confirm(
        'Xóa sản phẩm này khỏi kinh doanh?\n\nSản phẩm sẽ ẩn khỏi cửa hàng (xóa an toàn). Bạn có thể bật lại bằng “Mở bán lại”.',
      )
    )
      return;
    try {
      await api.delete(`/products/${productId}`);
      toast.success('Đã xóa khỏi cửa hàng');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error(
        error.response?.data?.message || error.response?.data?.error || 'Lỗi khi xóa sản phẩm',
      );
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Sản phẩm</h1>
          <div className="admin-page-subtitle">
            Quản lý giá, biến thể (size/màu), tồn kho và ảnh — đồng bộ với cửa hàng.
          </div>
        </div>
        <Button as={Link} to="/admin/products/new" variant="primary">
          + Thêm sản phẩm
        </Button>
      </div>

      <Card className="admin-panel">
        <Card.Body className="admin-panel-body">
          <Form onSubmit={handleSearchSubmit}>
            <Row className="g-2 align-items-end">
              <Col md={4}>
                <Form.Label className="small text-muted mb-1">Tìm kiếm</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Tên, mô tả ngắn…"
                  value={searchDraft}
                  onChange={(e) => setSearchDraft(e.target.value)}
                />
              </Col>
              <Col md={3}>
                <Form.Label className="small text-muted mb-1">Danh mục</Form.Label>
                <Form.Select
                  value={filters.category}
                  onChange={(e) =>
                    setFilters({ ...filters, category: e.target.value, page: 1 })
                  }
                >
                  <option value="">Tất cả</option>
                  {categories.map((cat) => {
                    const id = cat._id?.toString?.() || cat.categoryId;
                    return (
                      <option key={id} value={id}>
                        {cat.categoryName || cat.CategoryName}
                      </option>
                    );
                  })}
                </Form.Select>
              </Col>
              <Col md={3}>
                <Form.Label className="small text-muted mb-1">Thương hiệu</Form.Label>
                <Form.Select
                  value={filters.brand}
                  onChange={(e) =>
                    setFilters({ ...filters, brand: e.target.value, page: 1 })
                  }
                >
                  <option value="">Tất cả</option>
                  {brands.map((b) => (
                    <option key={b} value={b}>
                      {b}
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
            <Card.Body className="admin-panel-body p-0">
              <div className="admin-products-table-wrap">
                <Table responsive hover className="admin-table table-hover mb-0">
                  <thead>
                    <tr>
                      <th style={{ width: 88 }}>Ảnh</th>
                      <th>Sản phẩm</th>
                      <th>Danh mục</th>
                      <th>Thương hiệu</th>
                      <th>Giá</th>
                      <th>Tồn kho</th>
                      <th>Biến thể</th>
                      <th>Đánh giá</th>
                      <th>TT</th>
                      <th style={{ width: 120 }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(products?.length ?? 0) > 0 ? (
                      products.map((product) => {
                        const active = product.isActive !== false && product.IsActive !== false;
                        const stock = productStockTotal(product);
                        const vCount = variantCount(product);
                        const imgUrl =
                          resolveMediaUrl(productPrimaryImageUrl(product) || '') || PLACEHOLDER_SVG;
                        const brand = product.brand || product.BrandName || '—';
                        return (
                          <tr key={pid(product)}>
                            <td>
                              <img
                                className="admin-products-thumb"
                                src={imgUrl}
                                alt=""
                                onError={(e) => {
                                  e.currentTarget.src = PLACEHOLDER_SVG;
                                }}
                              />
                            </td>
                            <td>
                              <div className="fw-semibold">
                                {product.productName || product.ProductName}
                              </div>
                              <div className="admin-products-meta">
                                SKU: {product.sku || product.productCode || '—'}
                              </div>
                            </td>
                            <td>{categoryLabel(product)}</td>
                            <td>{brand}</td>
                            <td className="text-nowrap fw-semibold">{productPriceLabel(product)}</td>
                            <td>
                              <span className={stock <= 0 ? 'admin-products-stock-zero' : ''}>
                                {stock}
                              </span>
                            </td>
                            <td>
                              {vCount ? (
                                <Badge bg="secondary">{vCount} mã</Badge>
                              ) : (
                                <span className="text-muted small">—</span>
                              )}
                            </td>
                            <td>
                              <div className="d-flex align-items-center small">
                                <span className="text-warning me-1">★</span>
                                <span>
                                  {(product.avgRating ?? product.AvgRating)?.toFixed?.(1) ?? '—'}
                                </span>
                                <span className="text-muted ms-1">
                                  ({product.reviewCount ?? product.ReviewCount ?? 0})
                                </span>
                              </div>
                            </td>
                            <td>
                              <Badge bg={active ? 'success' : 'secondary'}>
                                {active ? 'Bán' : 'Ẩn'}
                              </Badge>
                            </td>
                            <td>
                              <Dropdown align="end" className="admin-products-actions">
                                <Dropdown.Toggle
                                  variant="outline-secondary"
                                  size="sm"
                                  className="px-2"
                                  id={`act-${pid(product)}`}
                                >
                                  <FiMoreVertical size={16} />
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                  <Dropdown.Item as={Link} to={`/admin/products/${pid(product)}`}>
                                    <FiEdit2 className="me-2" /> Sửa
                                  </Dropdown.Item>
                                  <Dropdown.Item onClick={() => toggleProductStatus(pid(product), active)}>
                                    {active ? (
                                      <>
                                        <FiEyeOff className="me-2" /> Ẩn khỏi cửa hàng
                                      </>
                                    ) : (
                                      <>
                                        <FiEye className="me-2" /> Mở bán lại
                                      </>
                                    )}
                                  </Dropdown.Item>
                                  <Dropdown.Divider />
                                  <Dropdown.Item
                                    className="text-danger"
                                    onClick={() => handleDeleteProduct(pid(product))}
                                  >
                                    <FiTrash2 className="me-2" /> Xóa
                                  </Dropdown.Item>
                                </Dropdown.Menu>
                              </Dropdown>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="10" className="text-center text-muted py-5">
                          Không có sản phẩm nào
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>

          {pagination && (pagination.totalPages ?? 0) > 1 && (
            <div className="d-flex justify-content-center align-items-center gap-3 mt-4">
              <Button
                variant="outline-primary"
                size="sm"
                disabled={filters.page === 1}
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              >
                Trước
              </Button>
              <span className="small text-muted">
                Trang {pagination.currentPage ?? pagination.page} / {pagination.totalPages}
              </span>
              <Button
                variant="outline-primary"
                size="sm"
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
