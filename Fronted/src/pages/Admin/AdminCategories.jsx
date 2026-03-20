import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, Table, Button, Form, Row, Col, Spinner, Badge, Modal, Nav } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../../services/api';
import adminService from '../../services/adminService';

const tabKey = { cats: 'cats', subs: 'subs', brands: 'brands' };

const AdminCategories = () => {
  const [active, setActive] = useState(tabKey.cats);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const [catModal, setCatModal] = useState({ open: false, editing: null });
  const [subModal, setSubModal] = useState({ open: false, editing: null });
  const [brandModal, setBrandModal] = useState({ open: false, editing: null });

  const [catForm, setCatForm] = useState({
    categoryName: '',
    categorySlug: '',
    description: '',
    imageUrl: '',
    displayOrder: 0,
    isActive: true
  });
  const [subForm, setSubForm] = useState({
    categoryId: '',
    subCategoryName: '',
    subCategorySlug: '',
    description: '',
    displayOrder: 0,
    isActive: true
  });
  const [brandForm, setBrandForm] = useState({
    brandName: '',
    brandSlug: '',
    logoUrl: '',
    description: '',
    website: '',
    isActive: true
  });

  const flatSubs = useMemo(() => {
    const rows = [];
    (categories || []).forEach((cat) => {
      const pid = cat.categoryId || cat._id?.toString();
      const pname = cat.categoryName || cat.CategoryName;
      (cat.subCategories || []).forEach((sc) => {
        rows.push({
          ...sc,
          subCategoryId: sc.subCategoryId || sc._id?.toString(),
          parentName: pname,
          parentCategoryId: pid
        });
      });
    });
    return rows;
  }, [categories]);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      const [cRes, bRes] = await Promise.all([
        api.get('/categories'),
        adminService.categories.getAllBrands()
      ]);
      setCategories(Array.isArray(cRes.data?.data) ? cRes.data.data : []);
      const bData = bRes.data?.data;
      setBrands(Array.isArray(bData) ? bData : []);
    } catch (e) {
      console.error(e);
      toast.error('Không tải được dữ liệu danh mục');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const openNewCategory = () => {
    setCatForm({
      categoryName: '',
      categorySlug: '',
      description: '',
      imageUrl: '',
      displayOrder: 0,
      isActive: true
    });
    setCatModal({ open: true, editing: null });
  };

  const openEditCategory = (cat) => {
    const id = cat.categoryId || cat._id?.toString();
    setCatForm({
      categoryName: cat.categoryName || '',
      categorySlug: cat.categorySlug || '',
      description: cat.description ?? '',
      imageUrl: cat.imageUrl ?? '',
      displayOrder: cat.displayOrder ?? 0,
      isActive: cat.isActive !== false
    });
    setCatModal({ open: true, editing: id });
  };

  const saveCategory = async () => {
    try {
      const payload = {
        categoryName: catForm.categoryName.trim(),
        categorySlug: catForm.categorySlug.trim(),
        description: catForm.description.trim() || null,
        imageUrl: catForm.imageUrl.trim() || null,
        displayOrder: Number(catForm.displayOrder) || 0
      };
      if (catModal.editing) {
        await adminService.categories.updateCategory(catModal.editing, {
          ...payload,
          isActive: catForm.isActive
        });
        toast.success('Cập nhật danh mục thành công');
      } else {
        await adminService.categories.createCategory(payload);
        toast.success('Tạo danh mục thành công');
      }
      setCatModal({ open: false, editing: null });
      loadAll();
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || 'Lỗi khi lưu danh mục');
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm('Xóa danh mục này? (Chỉ khi không còn danh mục con)')) return;
    try {
      await adminService.categories.deleteCategory(id);
      toast.success('Đã xóa danh mục');
      loadAll();
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || 'Không xóa được');
    }
  };

  const openNewSub = () => {
    const first = categories[0];
    setSubForm({
      categoryId: first ? (first.categoryId || first._id?.toString()) : '',
      subCategoryName: '',
      subCategorySlug: '',
      description: '',
      displayOrder: 0,
      isActive: true
    });
    setSubModal({ open: true, editing: null });
  };

  const openEditSub = (row) => {
    const cid =
      typeof row.categoryId === 'string'
        ? row.categoryId
        : row.categoryId?.toString?.() || row.parentCategoryId || '';
    setSubForm({
      categoryId: cid,
      subCategoryName: row.subCategoryName || '',
      subCategorySlug: row.subCategorySlug || '',
      description: row.description ?? '',
      displayOrder: row.displayOrder ?? 0,
      isActive: row.isActive !== false
    });
    setSubModal({ open: true, editing: row.subCategoryId });
  };

  const saveSub = async () => {
    try {
      const payload = {
        subCategoryName: subForm.subCategoryName.trim(),
        subCategorySlug: subForm.subCategorySlug.trim(),
        description: subForm.description.trim() || null,
        displayOrder: Number(subForm.displayOrder) || 0
      };
      if (subModal.editing) {
        await adminService.categories.updateSubCategory(subModal.editing, {
          ...payload,
          categoryId: subForm.categoryId,
          isActive: subForm.isActive
        });
        toast.success('Cập nhật danh mục con thành công');
      } else {
        await adminService.categories.createSubCategory({
          categoryId: subForm.categoryId,
          ...payload
        });
        toast.success('Tạo danh mục con thành công');
      }
      setSubModal({ open: false, editing: null });
      loadAll();
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || 'Lỗi khi lưu danh mục con');
    }
  };

  const deleteSub = async (id) => {
    if (!window.confirm('Xóa danh mục con? (Không được có sản phẩm)')) return;
    try {
      await adminService.categories.deleteSubCategory(id);
      toast.success('Đã xóa danh mục con');
      loadAll();
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || 'Không xóa được');
    }
  };

  const openNewBrand = () => {
    setBrandForm({
      brandName: '',
      brandSlug: '',
      logoUrl: '',
      description: '',
      website: '',
      isActive: true
    });
    setBrandModal({ open: true, editing: null });
  };

  const openEditBrand = (b) => {
    const id = b.brandId || b._id?.toString();
    setBrandForm({
      brandName: b.brandName || '',
      brandSlug: b.brandSlug || '',
      logoUrl: b.logoUrl ?? '',
      description: b.description ?? '',
      website: b.website ?? '',
      isActive: b.isActive !== false
    });
    setBrandModal({ open: true, editing: id });
  };

  const saveBrand = async () => {
    try {
      const payload = {
        brandName: brandForm.brandName.trim(),
        brandSlug: brandForm.brandSlug.trim(),
        logoUrl: brandForm.logoUrl.trim() || null,
        description: brandForm.description.trim() || null,
        website: brandForm.website.trim() || null
      };
      if (brandModal.editing) {
        await adminService.categories.updateBrand(brandModal.editing, {
          ...payload,
          isActive: brandForm.isActive
        });
        toast.success('Cập nhật thương hiệu thành công');
      } else {
        await adminService.categories.createBrand(payload);
        toast.success('Tạo thương hiệu thành công');
      }
      setBrandModal({ open: false, editing: null });
      loadAll();
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || 'Lỗi khi lưu thương hiệu');
    }
  };

  const deleteBrand = async (id) => {
    if (!window.confirm('Xóa thương hiệu? (Không được có sản phẩm)')) return;
    try {
      await adminService.categories.deleteBrand(id);
      toast.success('Đã xóa thương hiệu');
      loadAll();
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || 'Không xóa được');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Danh mục & thương hiệu</h1>
          <div className="admin-page-subtitle">Quản lý danh mục cha, danh mục con và thương hiệu.</div>
        </div>
      </div>

      <Nav variant="tabs" className="mb-3 admin-cat-nav" activeKey={active} onSelect={(k) => k && setActive(k)}>
        <Nav.Item>
          <Nav.Link eventKey={tabKey.cats}>Danh mục cha</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey={tabKey.subs}>Danh mục con</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey={tabKey.brands}>Thương hiệu</Nav.Link>
        </Nav.Item>
      </Nav>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : (
        <>
          {active === tabKey.cats && (
            <Card className="admin-panel">
              <Card.Body className="admin-panel-body">
                <div className="d-flex justify-content-end mb-3">
                  <Button variant="primary" onClick={openNewCategory}>
                    Thêm danh mục
                  </Button>
                </div>
                <Table responsive hover className="admin-table">
                  <thead>
                    <tr>
                      <th>Tên</th>
                      <th>Slug</th>
                      <th>Thứ tự</th>
                      <th>Trạng thái</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((cat) => {
                      const id = cat.categoryId || cat._id?.toString();
                      return (
                        <tr key={id}>
                          <td className="fw-semibold">{cat.categoryName}</td>
                          <td>
                            <code>{cat.categorySlug}</code>
                          </td>
                          <td>{cat.displayOrder ?? 0}</td>
                          <td>
                            <Badge bg={cat.isActive !== false ? 'success' : 'secondary'}>
                              {cat.isActive !== false ? 'Hiển thị' : 'Ẩn'}
                            </Badge>
                          </td>
                          <td className="text-end">
                            <Button size="sm" variant="outline-primary" className="me-2" onClick={() => openEditCategory(cat)}>
                              Sửa
                            </Button>
                            <Button size="sm" variant="outline-danger" onClick={() => deleteCategory(id)}>
                              Xóa
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}

          {active === tabKey.subs && (
            <Card className="admin-panel">
              <Card.Body className="admin-panel-body">
                <div className="d-flex justify-content-end mb-3">
                  <Button variant="primary" onClick={openNewSub} disabled={!categories.length}>
                    Thêm danh mục con
                  </Button>
                </div>
                <Table responsive hover className="admin-table">
                  <thead>
                    <tr>
                      <th>Danh mục cha</th>
                      <th>Tên</th>
                      <th>Slug</th>
                      <th>Trạng thái</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {flatSubs.map((row) => (
                      <tr key={row.subCategoryId}>
                        <td>{row.parentName}</td>
                        <td>{row.subCategoryName}</td>
                        <td>
                          <code>{row.subCategorySlug}</code>
                        </td>
                        <td>
                          <Badge bg={row.isActive !== false ? 'success' : 'secondary'}>
                            {row.isActive !== false ? 'Hiển thị' : 'Ẩn'}
                          </Badge>
                        </td>
                        <td className="text-end">
                          <Button size="sm" variant="outline-primary" className="me-2" onClick={() => openEditSub(row)}>
                            Sửa
                          </Button>
                          <Button size="sm" variant="outline-danger" onClick={() => deleteSub(row.subCategoryId)}>
                            Xóa
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                {flatSubs.length === 0 && (
                  <p className="text-muted mb-0">Chưa có danh mục con.</p>
                )}
              </Card.Body>
            </Card>
          )}

          {active === tabKey.brands && (
            <Card className="admin-panel">
              <Card.Body className="admin-panel-body">
                <div className="d-flex justify-content-end mb-3">
                  <Button variant="primary" onClick={openNewBrand}>
                    Thêm thương hiệu
                  </Button>
                </div>
                <Table responsive hover className="admin-table">
                  <thead>
                    <tr>
                      <th>Tên</th>
                      <th>Slug</th>
                      <th>SP</th>
                      <th>Trạng thái</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {brands.map((b) => {
                      const id = b.brandId || b._id?.toString();
                      return (
                        <tr key={id}>
                          <td className="fw-semibold">{b.brandName}</td>
                          <td>
                            <code>{b.brandSlug}</code>
                          </td>
                          <td>{b.productCount ?? '—'}</td>
                          <td>
                            <Badge bg={b.isActive !== false ? 'success' : 'secondary'}>
                              {b.isActive !== false ? 'Hiển thị' : 'Ẩn'}
                            </Badge>
                          </td>
                          <td className="text-end">
                            <Button size="sm" variant="outline-primary" className="me-2" onClick={() => openEditBrand(b)}>
                              Sửa
                            </Button>
                            <Button size="sm" variant="outline-danger" onClick={() => deleteBrand(id)}>
                              Xóa
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}
        </>
      )}

      {/* Category modal */}
      <Modal show={catModal.open} onHide={() => setCatModal({ open: false, editing: null })} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{catModal.editing ? 'Sửa danh mục' : 'Thêm danh mục'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-2">
            <Col md={6}>
              <Form.Label>Tên *</Form.Label>
              <Form.Control
                value={catForm.categoryName}
                onChange={(e) => setCatForm((p) => ({ ...p, categoryName: e.target.value }))}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Slug *</Form.Label>
              <Form.Control
                value={catForm.categorySlug}
                onChange={(e) => setCatForm((p) => ({ ...p, categorySlug: e.target.value }))}
              />
            </Col>
            <Col md={12}>
              <Form.Label>Mô tả</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={catForm.description}
                onChange={(e) => setCatForm((p) => ({ ...p, description: e.target.value }))}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Ảnh (URL)</Form.Label>
              <Form.Control
                value={catForm.imageUrl}
                onChange={(e) => setCatForm((p) => ({ ...p, imageUrl: e.target.value }))}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Thứ tự hiển thị</Form.Label>
              <Form.Control
                type="number"
                value={catForm.displayOrder}
                onChange={(e) => setCatForm((p) => ({ ...p, displayOrder: e.target.value }))}
              />
            </Col>
            {catModal.editing && (
              <Col md={12}>
                <Form.Check
                  type="switch"
                  label="Đang hiển thị"
                  checked={catForm.isActive}
                  onChange={(e) => setCatForm((p) => ({ ...p, isActive: e.target.checked }))}
                />
              </Col>
            )}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setCatModal({ open: false, editing: null })}>
            Đóng
          </Button>
          <Button variant="primary" onClick={saveCategory}>
            Lưu
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Subcategory modal */}
      <Modal show={subModal.open} onHide={() => setSubModal({ open: false, editing: null })} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{subModal.editing ? 'Sửa danh mục con' : 'Thêm danh mục con'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-2">
            <Col md={12}>
              <Form.Label>Danh mục cha *</Form.Label>
              <Form.Select
                value={subForm.categoryId}
                onChange={(e) => setSubForm((p) => ({ ...p, categoryId: e.target.value }))}
              >
                <option value="">— Chọn —</option>
                {categories.map((cat) => {
                  const id = cat.categoryId || cat._id?.toString();
                  return (
                    <option key={id} value={id}>
                      {cat.categoryName}
                    </option>
                  );
                })}
              </Form.Select>
            </Col>
            <Col md={6}>
              <Form.Label>Tên *</Form.Label>
              <Form.Control
                value={subForm.subCategoryName}
                onChange={(e) => setSubForm((p) => ({ ...p, subCategoryName: e.target.value }))}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Slug *</Form.Label>
              <Form.Control
                value={subForm.subCategorySlug}
                onChange={(e) => setSubForm((p) => ({ ...p, subCategorySlug: e.target.value }))}
              />
            </Col>
            <Col md={12}>
              <Form.Label>Mô tả</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={subForm.description}
                onChange={(e) => setSubForm((p) => ({ ...p, description: e.target.value }))}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Thứ tự</Form.Label>
              <Form.Control
                type="number"
                value={subForm.displayOrder}
                onChange={(e) => setSubForm((p) => ({ ...p, displayOrder: e.target.value }))}
              />
            </Col>
            {subModal.editing && (
              <Col md={12}>
                <Form.Check
                  type="switch"
                  label="Đang hiển thị"
                  checked={subForm.isActive}
                  onChange={(e) => setSubForm((p) => ({ ...p, isActive: e.target.checked }))}
                />
              </Col>
            )}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setSubModal({ open: false, editing: null })}>
            Đóng
          </Button>
          <Button variant="primary" onClick={saveSub}>
            Lưu
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Brand modal */}
      <Modal show={brandModal.open} onHide={() => setBrandModal({ open: false, editing: null })} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{brandModal.editing ? 'Sửa thương hiệu' : 'Thêm thương hiệu'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-2">
            <Col md={6}>
              <Form.Label>Tên *</Form.Label>
              <Form.Control
                value={brandForm.brandName}
                onChange={(e) => setBrandForm((p) => ({ ...p, brandName: e.target.value }))}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Slug *</Form.Label>
              <Form.Control
                value={brandForm.brandSlug}
                onChange={(e) => setBrandForm((p) => ({ ...p, brandSlug: e.target.value }))}
              />
            </Col>
            <Col md={12}>
              <Form.Label>Logo (URL)</Form.Label>
              <Form.Control
                value={brandForm.logoUrl}
                onChange={(e) => setBrandForm((p) => ({ ...p, logoUrl: e.target.value }))}
              />
            </Col>
            <Col md={12}>
              <Form.Label>Mô tả</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={brandForm.description}
                onChange={(e) => setBrandForm((p) => ({ ...p, description: e.target.value }))}
              />
            </Col>
            <Col md={12}>
              <Form.Label>Website</Form.Label>
              <Form.Control
                value={brandForm.website}
                onChange={(e) => setBrandForm((p) => ({ ...p, website: e.target.value }))}
              />
            </Col>
            {brandModal.editing && (
              <Col md={12}>
                <Form.Check
                  type="switch"
                  label="Đang hiển thị"
                  checked={brandForm.isActive}
                  onChange={(e) => setBrandForm((p) => ({ ...p, isActive: e.target.checked }))}
                />
              </Col>
            )}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setBrandModal({ open: false, editing: null })}>
            Đóng
          </Button>
          <Button variant="primary" onClick={saveBrand}>
            Lưu
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminCategories;
