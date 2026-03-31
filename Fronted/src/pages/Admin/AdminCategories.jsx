import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, Table, Button, Form, Row, Col, Spinner, Badge, Modal, Nav } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../../services/api';
import adminService from '../../services/adminService';
import ImageUploadField from '../../components/Upload/ImageUploadField';
import { VARIANT_PROFILES } from '../../config/variantProfileConfig';

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
    categoryName: '', categorySlug: '', description: '',
    imageUrl: '', displayOrder: 0, isActive: true,
    variantProfile: 'generic',
  });
  const [subForm, setSubForm] = useState({
    categoryId: '', subCategoryName: '', subCategorySlug: '',
    description: '', displayOrder: 0, isActive: true
  });
  const [brandForm, setBrandForm] = useState({
    brandName: '', brandSlug: '', logoUrl: '',
    description: '', website: '', isActive: true
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

  useEffect(() => { loadAll(); }, [loadAll]);

  /* ========== CATEGORY ========== */
  const openNewCategory = () => {
    setCatForm({
      categoryName: '', categorySlug: '', description: '', imageUrl: '', displayOrder: 0, isActive: true,
      variantProfile: 'generic',
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
      isActive: cat.isActive !== false,
      variantProfile: cat.variantProfile || 'generic',
    });
    setCatModal({ open: true, editing: id });
  };

  const saveCategory = async () => {
    if (!catForm.categoryName.trim()) { toast.error('Nhập tên danh mục'); return; }
    try {
      const payload = {
        categoryName: catForm.categoryName.trim(),
        categorySlug: catForm.categorySlug.trim() || catForm.categoryName.trim().toLowerCase().replace(/\s+/g, '-'),
        description: catForm.description.trim() || null,
        imageUrl: catForm.imageUrl.trim() || null,
        displayOrder: Number(catForm.displayOrder) || 0
      };
      if (catModal.editing) {
        await adminService.categories.updateCategory(catModal.editing, { ...payload, isActive: catForm.isActive });
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

  /* ========== SUB-CATEGORY ========== */
  const openNewSub = () => {
    const first = categories[0];
    setSubForm({
      categoryId: first ? (first.categoryId || first._id?.toString()) : '',
      subCategoryName: '', subCategorySlug: '', description: '', displayOrder: 0, isActive: true
    });
    setSubModal({ open: true, editing: null });
  };

  const openEditSub = (row) => {
    const cid = typeof row.categoryId === 'string'
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
    if (!subForm.subCategoryName.trim()) { toast.error('Nhập tên danh mục con'); return; }
    try {
      const payload = {
        subCategoryName: subForm.subCategoryName.trim(),
        subCategorySlug: subForm.subCategorySlug.trim() || subForm.subCategoryName.trim().toLowerCase().replace(/\s+/g, '-'),
        description: subForm.description.trim() || null,
        displayOrder: Number(subForm.displayOrder) || 0
      };
      if (subModal.editing) {
        await adminService.categories.updateSubCategory(subModal.editing, { ...payload, categoryId: subForm.categoryId, isActive: subForm.isActive });
        toast.success('Cập nhật danh mục con thành công');
      } else {
        await adminService.categories.createSubCategory({ categoryId: subForm.categoryId, ...payload });
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

  /* ========== BRAND ========== */
  const openNewBrand = () => {
    setBrandForm({ brandName: '', brandSlug: '', logoUrl: '', description: '', website: '', isActive: true });
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
    if (!brandForm.brandName.trim()) { toast.error('Nhập tên thương hiệu'); return; }
    try {
      const payload = {
        brandName: brandForm.brandName.trim(),
        brandSlug: brandForm.brandSlug.trim() || brandForm.brandName.trim().toLowerCase().replace(/\s+/g, '-'),
        logoUrl: brandForm.logoUrl.trim() || null,
        description: brandForm.description.trim() || null,
        website: brandForm.website.trim() || null
      };
      if (brandModal.editing) {
        await adminService.categories.updateBrand(brandModal.editing, { ...payload, isActive: brandForm.isActive });
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
          <h1 className="admin-page-title">Danh mục &amp; thương hiệu</h1>
          <div className="admin-page-subtitle">Quản lý danh mục cha, danh mục con và thương hiệu. Upload ảnh từ máy tính.</div>
        </div>
        <Button variant="primary" onClick={() => {
          if (active === tabKey.cats) openNewCategory();
          else if (active === tabKey.subs) openNewSub();
          else openNewBrand();
        }}>
          {active === tabKey.cats ? 'Thêm danh mục' : active === tabKey.subs ? 'Thêm danh mục con' : 'Thêm thương hiệu'}
        </Button>
      </div>

      <Nav variant="tabs" className="mb-3 admin-cat-nav" activeKey={active} onSelect={(k) => k && setActive(k)}>
        <Nav.Item><Nav.Link eventKey={tabKey.cats}>Danh mục cha ({categories.length})</Nav.Link></Nav.Item>
        <Nav.Item><Nav.Link eventKey={tabKey.subs}>Danh mục con ({flatSubs.length})</Nav.Link></Nav.Item>
        <Nav.Item><Nav.Link eventKey={tabKey.brands}>Thương hiệu ({brands.length})</Nav.Link></Nav.Item>
      </Nav>

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
      ) : (
        <>
          {/* ===== CATEGORY TAB ===== */}
          {active === tabKey.cats && (
            <Card className="admin-panel">
              <Card.Body className="admin-panel-body">
                <Table responsive hover className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: 60 }}>Ảnh</th>
                      <th>Tên</th>
                      <th>Slug</th>
                      <th style={{ width: 80 }}>Thứ tự</th>
                      <th style={{ width: 100 }}>Trạng thái</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((cat) => {
                      const id = cat.categoryId || cat._id?.toString();
                      return (
                        <tr key={id}>
                          <td>
                            {cat.imageUrl ? (
                              <img src={cat.imageUrl} alt={cat.categoryName}
                                style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6 }} />
                            ) : (
                              <div style={{ width: 44, height: 44, background: '#f0f0f0', borderRadius: 6,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#aaa' }}>
                                N/A
                              </div>
                            )}
                          </td>
                          <td className="fw-semibold">{cat.categoryName}
                            {cat.subCategories?.length > 0 && (
                              <Badge bg="light" text="dark" className="ms-2 small">{cat.subCategories.length} con</Badge>
                            )}
                          </td>
                          <td><code>{cat.categorySlug}</code></td>
                          <td>{cat.displayOrder ?? 0}</td>
                          <td>
                            <Badge bg={cat.isActive !== false ? 'success' : 'secondary'}>
                              {cat.isActive !== false ? 'Hiển thị' : 'Ẩn'}
                            </Badge>
                          </td>
                          <td className="text-end">
                            <Button size="sm" variant="outline-primary" className="me-2" onClick={() => openEditCategory(cat)}>Sửa</Button>
                            <Button size="sm" variant="outline-danger" onClick={() => deleteCategory(id)}>Xóa</Button>
                          </td>
                        </tr>
                      );
                    })}
                    {categories.length === 0 && (
                      <tr><td colSpan={6} className="text-center text-muted py-4">Chưa có danh mục nào.</td></tr>
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}

          {/* ===== SUBCATEGORY TAB ===== */}
          {active === tabKey.subs && (
            <Card className="admin-panel">
              <Card.Body className="admin-panel-body">
                <Table responsive hover className="admin-table">
                  <thead>
                    <tr>
                      <th>Danh mục cha</th>
                      <th>Tên</th>
                      <th>Slug</th>
                      <th>Thứ tự</th>
                      <th>Trạng thái</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {flatSubs.map((row) => (
                      <tr key={row.subCategoryId}>
                        <td><Badge bg="light" text="dark">{row.parentName}</Badge></td>
                        <td className="fw-semibold">{row.subCategoryName}</td>
                        <td><code>{row.subCategorySlug}</code></td>
                        <td>{row.displayOrder ?? 0}</td>
                        <td>
                          <Badge bg={row.isActive !== false ? 'success' : 'secondary'}>
                            {row.isActive !== false ? 'Hiển thị' : 'Ẩn'}
                          </Badge>
                        </td>
                        <td className="text-end">
                          <Button size="sm" variant="outline-primary" className="me-2" onClick={() => openEditSub(row)}>Sửa</Button>
                          <Button size="sm" variant="outline-danger" onClick={() => deleteSub(row.subCategoryId)}>Xóa</Button>
                        </td>
                      </tr>
                    ))}
                    {flatSubs.length === 0 && (
                      <tr><td colSpan={6} className="text-center text-muted py-4">Chưa có danh mục con.</td></tr>
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}

          {/* ===== BRAND TAB ===== */}
          {active === tabKey.brands && (
            <Card className="admin-panel">
              <Card.Body className="admin-panel-body">
                <Table responsive hover className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: 60 }}>Logo</th>
                      <th>Tên</th>
                      <th>Slug</th>
                      <th>Website</th>
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
                          <td>
                            {b.logoUrl ? (
                              <img src={b.logoUrl} alt={b.brandName}
                                style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 6, background: '#f8f8f8', padding: 4 }} />
                            ) : (
                              <div style={{ width: 44, height: 44, background: '#f0f0f0', borderRadius: 6,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#aaa', fontWeight: 600 }}>
                                {b.brandName?.slice(0, 2).toUpperCase() || 'B'}
                              </div>
                            )}
                          </td>
                          <td className="fw-semibold">{b.brandName}</td>
                          <td><code>{b.brandSlug}</code></td>
                          <td>
                            {b.website ? <a href={b.website} target="_blank" rel="noreferrer" className="small">{b.website}</a> : '—'}
                          </td>
                          <td>{b.productCount ?? '—'}</td>
                          <td>
                            <Badge bg={b.isActive !== false ? 'success' : 'secondary'}>
                              {b.isActive !== false ? 'Hiển thị' : 'Ẩn'}
                            </Badge>
                          </td>
                          <td className="text-end">
                            <Button size="sm" variant="outline-primary" className="me-2" onClick={() => openEditBrand(b)}>Sửa</Button>
                            <Button size="sm" variant="outline-danger" onClick={() => deleteBrand(id)}>Xóa</Button>
                          </td>
                        </tr>
                      );
                    })}
                    {brands.length === 0 && (
                      <tr><td colSpan={7} className="text-center text-muted py-4">Chưa có thương hiệu nào.</td></tr>
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}
        </>
      )}

      {/* ===== MODAL: CATEGORY ===== */}
      <Modal show={catModal.open} onHide={() => setCatModal({ open: false, editing: null })} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{catModal.editing ? 'Sửa danh mục' : 'Thêm danh mục'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={6}>
              <Form.Label>Tên danh mục *</Form.Label>
              <Form.Control value={catForm.categoryName}
                onChange={(e) => {
                  const v = e.target.value;
                  setCatForm((p) => ({
                    ...p,
                    categoryName: v,
                    categorySlug: p.categorySlug || v.toLowerCase().replace(/\s+/g, '-')
                  }));
                }} />
            </Col>
            <Col md={6}>
              <Form.Label>Slug *</Form.Label>
              <Form.Control value={catForm.categorySlug}
                onChange={(e) => setCatForm((p) => ({ ...p, categorySlug: e.target.value }))} />
            </Col>
            <Col md={6}>
              <Form.Label>Thứ tự hiển thị</Form.Label>
              <Form.Control type="number" value={catForm.displayOrder}
                onChange={(e) => setCatForm((p) => ({ ...p, displayOrder: e.target.value }))} />
            </Col>
            <Col md={12}>
              <Form.Label>Mô tả</Form.Label>
              <Form.Control as="textarea" rows={2} value={catForm.description}
                onChange={(e) => setCatForm((p) => ({ ...p, description: e.target.value }))} />
            </Col>
            <Col md={12}>
              <Form.Label>Biến thể sản phẩm (form thêm/sửa SP)</Form.Label>
              <Form.Select
                value={catForm.variantProfile}
                onChange={(e) => setCatForm((p) => ({ ...p, variantProfile: e.target.value }))}
              >
                {Object.values(VARIANT_PROFILES).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} — {p.description}
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                Quy định tên cột (Size / Cỡ giày / …) và sinh tổ hợp biến thể khi tạo sản phẩm thuộc danh mục này.
              </Form.Text>
            </Col>
            <Col md={12}>
              <ImageUploadField
                label="Ảnh danh mục (upload từ máy tính)"
                value={catForm.imageUrl}
                onChange={(url) => setCatForm((p) => ({ ...p, imageUrl: url }))}
                placeholder="Chưa có ảnh"
                previewSize={100}
              />
            </Col>
            {catModal.editing && (
              <Col md={12}>
                <Form.Check type="switch" label="Đang hiển thị"
                  checked={catForm.isActive}
                  onChange={(e) => setCatForm((p) => ({ ...p, isActive: e.target.checked }))} />
              </Col>
            )}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setCatModal({ open: false, editing: null })}>Đóng</Button>
          <Button variant="primary" onClick={saveCategory}>Lưu</Button>
        </Modal.Footer>
      </Modal>

      {/* ===== MODAL: SUBCATEGORY ===== */}
      <Modal show={subModal.open} onHide={() => setSubModal({ open: false, editing: null })} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{subModal.editing ? 'Sửa danh mục con' : 'Thêm danh mục con'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-2">
            <Col md={12}>
              <Form.Label>Danh mục cha *</Form.Label>
              <Form.Select value={subForm.categoryId}
                onChange={(e) => setSubForm((p) => ({ ...p, categoryId: e.target.value }))}>
                <option value="">— Chọn —</option>
                {categories.map((cat) => {
                  const id = cat.categoryId || cat._id?.toString();
                  return <option key={id} value={id}>{cat.categoryName}</option>;
                })}
              </Form.Select>
            </Col>
            <Col md={6}>
              <Form.Label>Tên *</Form.Label>
              <Form.Control value={subForm.subCategoryName}
                onChange={(e) => {
                  const v = e.target.value;
                  setSubForm((p) => ({
                    ...p,
                    subCategoryName: v,
                    subCategorySlug: p.subCategorySlug || v.toLowerCase().replace(/\s+/g, '-')
                  }));
                }} />
            </Col>
            <Col md={6}>
              <Form.Label>Slug *</Form.Label>
              <Form.Control value={subForm.subCategorySlug}
                onChange={(e) => setSubForm((p) => ({ ...p, subCategorySlug: e.target.value }))} />
            </Col>
            <Col md={6}>
              <Form.Label>Thứ tự</Form.Label>
              <Form.Control type="number" value={subForm.displayOrder}
                onChange={(e) => setSubForm((p) => ({ ...p, displayOrder: e.target.value }))} />
            </Col>
            <Col md={12}>
              <Form.Label>Mô tả</Form.Label>
              <Form.Control as="textarea" rows={2} value={subForm.description}
                onChange={(e) => setSubForm((p) => ({ ...p, description: e.target.value }))} />
            </Col>
            {subModal.editing && (
              <Col md={12}>
                <Form.Check type="switch" label="Đang hiển thị"
                  checked={subForm.isActive}
                  onChange={(e) => setSubForm((p) => ({ ...p, isActive: e.target.checked }))} />
              </Col>
            )}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setSubModal({ open: false, editing: null })}>Đóng</Button>
          <Button variant="primary" onClick={saveSub}>Lưu</Button>
        </Modal.Footer>
      </Modal>

      {/* ===== MODAL: BRAND ===== */}
      <Modal show={brandModal.open} onHide={() => setBrandModal({ open: false, editing: null })} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{brandModal.editing ? 'Sửa thương hiệu' : 'Thêm thương hiệu'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={6}>
              <Form.Label>Tên thương hiệu *</Form.Label>
              <Form.Control value={brandForm.brandName}
                onChange={(e) => {
                  const v = e.target.value;
                  setBrandForm((p) => ({
                    ...p,
                    brandName: v,
                    brandSlug: p.brandSlug || v.toLowerCase().replace(/\s+/g, '-')
                  }));
                }} />
            </Col>
            <Col md={6}>
              <Form.Label>Slug *</Form.Label>
              <Form.Control value={brandForm.brandSlug}
                onChange={(e) => setBrandForm((p) => ({ ...p, brandSlug: e.target.value }))} />
            </Col>
            <Col md={12}>
              <ImageUploadField
                label="Logo thương hiệu (upload từ máy tính)"
                value={brandForm.logoUrl}
                onChange={(url) => setBrandForm((p) => ({ ...p, logoUrl: url }))}
                placeholder="Chưa có logo"
                previewSize={90}
              />
            </Col>
            <Col md={12}>
              <Form.Label>Mô tả</Form.Label>
              <Form.Control as="textarea" rows={2} value={brandForm.description}
                onChange={(e) => setBrandForm((p) => ({ ...p, description: e.target.value }))} />
            </Col>
            <Col md={12}>
              <Form.Label>Website</Form.Label>
              <Form.Control value={brandForm.website} placeholder="https://..."
                onChange={(e) => setBrandForm((p) => ({ ...p, website: e.target.value }))} />
            </Col>
            {brandModal.editing && (
              <Col md={12}>
                <Form.Check type="switch" label="Đang hiển thị"
                  checked={brandForm.isActive}
                  onChange={(e) => setBrandForm((p) => ({ ...p, isActive: e.target.checked }))} />
              </Col>
            )}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setBrandModal({ open: false, editing: null })}>Đóng</Button>
          <Button variant="primary" onClick={saveBrand}>Lưu</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminCategories;
