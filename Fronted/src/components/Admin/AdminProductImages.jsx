import { useId, useRef, useState, useCallback, useMemo } from 'react';
import { Card, Button, Form, Spinner, Collapse } from 'react-bootstrap';
import { toast } from 'react-toastify';
import {
  FiUpload,
  FiTrash2,
  FiLink,
  FiChevronUp,
  FiChevronDown,
  FiImage,
} from 'react-icons/fi';
import { uploadProductImages } from '../../services/uploadService';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import './AdminProductImages.css';

export const emptyProductImageRow = () => ({ imageUrl: '', color: '' });

const MAX_FILES_PER_BATCH = 20;
const MAX_GALLERY = 24;
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

function rowsFromProp(images) {
  if (!Array.isArray(images)) return [];
  return images
    .map((x) => {
      if (typeof x === 'string') {
        return { imageUrl: String(x).trim(), color: '' };
      }
      return {
        imageUrl: String(x?.imageUrl ?? '').trim(),
        color: String(x?.color ?? '').trim(),
      };
    })
    .filter((r) => r.imageUrl);
}

function commitItems(onChange, list) {
  onChange(
    list.map(({ imageUrl, color }) => {
      const o = { imageUrl };
      const c = (color || '').trim();
      if (c) o.color = c;
      return o;
    }),
  );
}

function reorder(list, from, to) {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const next = [...list];
  const [m] = next.splice(from, 1);
  next.splice(to, 0, m);
  return next;
}

/**
 * Ảnh sản phẩm — gallery + gắn màu (tuỳ chọn) để trang chi tiết lọc ảnh theo màu đã chọn.
 */
export function AdminProductImages({ images, onChange }) {
  const reactId = useId();
  const fileInputId = `adm-pimg-${reactId.replace(/:/g, '')}`;
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [zoneActive, setZoneActive] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [urlOpen, setUrlOpen] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');

  const items = useMemo(() => rowsFromProp(images), [images]);

  const pushUrls = useCallback(
    (newUrls) => {
      const merged = [...items];
      let added = 0;
      for (const u of newUrls) {
        const s = String(u).trim();
        if (!s) continue;
        if (merged.length >= MAX_GALLERY) break;
        merged.push({ imageUrl: s, color: '' });
        added += 1;
      }
      if (added) commitItems(onChange, merged);
      return added;
    },
    [items, onChange],
  );

  const setItems = useCallback(
    (next) => {
      commitItems(onChange, next);
    },
    [onChange],
  );

  const setItemColor = useCallback(
    (index, color) => {
      setItems(items.map((row, i) => (i === index ? { ...row, color } : row)));
    },
    [items, setItems],
  );

  const processFiles = async (fileList) => {
    if (!fileList?.length) return;
    let picked = Array.from(fileList).slice(0, MAX_FILES_PER_BATCH);
    const room = MAX_GALLERY - items.length;
    if (room <= 0) {
      toast.error(`Tối đa ${MAX_GALLERY} ảnh`);
      return;
    }
    picked = picked.slice(0, room);

    for (const f of picked) {
      if (!f.type.startsWith('image/')) {
        toast.error(`Không phải ảnh: ${f.name}`);
        return;
      }
      if (f.size > MAX_SIZE_BYTES) {
        toast.error(`Ảnh quá 5MB: ${f.name}`);
        return;
      }
    }

    setUploading(true);
    try {
      const res = await uploadProductImages(picked);
      const body = res?.data;
      const inner = body?.data ?? body;
      const uploaded = Array.isArray(inner?.urls) ? inner.urls : [];
      if (!uploaded.length) {
        toast.error('Server không trả về đường dẫn ảnh');
        return;
      }
      const n = pushUrls(uploaded);
      if (n) toast.success(`Đã thêm ${n} ảnh`);
    } catch (err) {
      console.error(err);
      const status = err.status ?? err.response?.status;
      const msg = err.response?.data?.message ?? err.message;
      if (!err.response && !err.status) {
        toast.error('Không kết nối được máy chủ (kiểm tra backend đang chạy).');
      } else if (status === 401) {
        toast.error('Hết phiên đăng nhập — đăng nhập lại.');
      } else if (status === 403) {
        toast.error(msg || 'Chỉ tài khoản Admin được upload.');
      } else {
        toast.error(typeof msg === 'string' ? msg : 'Upload thất bại');
      }
    } finally {
      setUploading(false);
    }
  };

  const onFileChange = (e) => {
    const fl = e.target.files;
    e.target.value = '';
    processFiles(fl);
  };

  const onZoneDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setZoneActive(false);
    if (uploading) return;
    const dt = e.dataTransfer?.files;
    if (dt?.length) processFiles(dt);
  };

  const onZoneDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
  };

  const removeAt = (index) => {
    const next = items.filter((_, i) => i !== index);
    setItems(next);
  };

  const move = (index, dir) => {
    const to = index + dir;
    if (to < 0 || to >= items.length) return;
    setItems(reorder(items, index, to));
  };

  const addUrl = () => {
    const s = urlDraft.trim();
    if (!s) {
      toast.error('Nhập URL hoặc đường dẫn ảnh');
      return;
    }
    if (items.length >= MAX_GALLERY) {
      toast.error(`Tối đa ${MAX_GALLERY} ảnh`);
      return;
    }
    pushUrls([s]);
    setUrlDraft('');
    toast.success('Đã thêm ảnh từ URL');
  };

  const onCardDragStart = (index) => (e) => {
    setDraggingIndex(index);
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.effectAllowed = 'move';
  };

  const onCardDragEnd = () => {
    setDraggingIndex(null);
  };

  const onCardDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const onCardDrop = (dropIndex) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer?.files;
    if (files?.length) {
      processFiles(files);
      setDraggingIndex(null);
      return;
    }
    const raw = e.dataTransfer.getData('text/plain');
    const from = draggingIndex != null ? draggingIndex : parseInt(raw, 10);
    if (Number.isNaN(from) || from === dropIndex) {
      setDraggingIndex(null);
      return;
    }
    setItems(reorder(items, from, dropIndex));
    setDraggingIndex(null);
  };

  return (
    <Card className="admin-panel mb-3 admin-product-images">
      <Card.Body className="admin-panel-body">
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
          <div>
            <h5 className="mb-1">Ảnh sản phẩm</h5>
            <p className="text-muted small mb-0 adm-pimg-lead">
              Tối đa {MAX_GALLERY} ảnh. Có thể gắn <strong>màu</strong> từng ảnh (trùng với tên màu biến thể) để
              trang chi tiết chỉ hiện đúng ảnh khi khách chọn màu. Ảnh đầu là ảnh bìa.
            </p>
          </div>
          <Button
            type="button"
            variant="outline-secondary"
            size="sm"
            className="align-self-start"
            onClick={() => setUrlOpen((o) => !o)}
            aria-expanded={urlOpen}
          >
            <FiLink className="me-1" />
            Thêm bằng URL
          </Button>
        </div>

        <Collapse in={urlOpen}>
          <div className="adm-pimg-url-bar mb-3">
            <Form.Control
              size="sm"
              placeholder="https://... hoặc /uploads/..."
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUrl())}
              aria-label="URL ảnh"
            />
            <Button type="button" size="sm" variant="primary" onClick={addUrl}>
              Thêm
            </Button>
          </div>
        </Collapse>

        {items.length > 0 && (
          <ul className="adm-pimg-grid list-unstyled mb-3">
            {items.map((row, index) => (
              <li
                key={`${index}-${row.imageUrl.slice(-32)}`}
                className={`adm-pimg-tile ${draggingIndex === index ? 'adm-pimg-tile--drag' : ''}`}
                draggable
                onDragStart={onCardDragStart(index)}
                onDragEnd={onCardDragEnd}
                onDragOver={onCardDragOver}
                onDrop={onCardDrop(index)}
              >
                <div className="adm-pimg-tile-inner">
                  <img
                    src={resolveMediaUrl(row.imageUrl)}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    onError={(ev) => {
                      ev.currentTarget.style.opacity = '0.35';
                    }}
                  />
                  {index === 0 && <span className="adm-pimg-badge">Ảnh bìa</span>}
                  <div className="adm-pimg-tile-actions">
                    <div className="adm-pimg-move">
                      <button
                        type="button"
                        className="adm-pimg-icon-btn"
                        disabled={index === 0}
                        onClick={() => move(index, -1)}
                        aria-label="Lên trên"
                      >
                        <FiChevronUp />
                      </button>
                      <button
                        type="button"
                        className="adm-pimg-icon-btn"
                        disabled={index >= items.length - 1}
                        onClick={() => move(index, 1)}
                        aria-label="Xuống dưới"
                      >
                        <FiChevronDown />
                      </button>
                    </div>
                    <button
                      type="button"
                      className="adm-pimg-icon-btn adm-pimg-icon-btn--danger"
                      onClick={() => removeAt(index)}
                      aria-label="Xóa ảnh"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
                <Form.Control
                  size="sm"
                  className="adm-pimg-color-tag mt-1"
                  placeholder="Màu (vd: Đỏ) — tuỳ chọn"
                  value={row.color}
                  onChange={(e) => setItemColor(index, e.target.value)}
                  aria-label={`Màu cho ảnh ${index + 1}`}
                />
                <span className="adm-pimg-drag-hint">Kéo để sắp xếp</span>
              </li>
            ))}
          </ul>
        )}

        <div
          className={`adm-pimg-dropzone ${zoneActive ? 'adm-pimg-dropzone--active' : ''} ${uploading ? 'adm-pimg-dropzone--busy' : ''}`}
          onDragEnter={(e) => {
            e.preventDefault();
            setZoneActive(true);
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) setZoneActive(false);
          }}
          onDragOver={onZoneDragOver}
          onDrop={onZoneDrop}
        >
          <input
            ref={fileInputRef}
            id={fileInputId}
            type="file"
            accept="image/*"
            multiple
            className="adm-pimg-file-input"
            aria-label="Chọn ảnh từ máy tính"
            disabled={uploading || items.length >= MAX_GALLERY}
            onChange={onFileChange}
          />
          {uploading ? (
            <div className="adm-pimg-dropzone-body text-center">
              <Spinner animation="border" size="sm" className="me-2" />
              Đang tải lên…
            </div>
          ) : items.length >= MAX_GALLERY ? (
            <div className="adm-pimg-dropzone-body text-center text-muted">
              <FiImage className="adm-pimg-drop-ico mb-2" />
              Đã đủ {MAX_GALLERY} ảnh. Xóa bớt để thêm.
            </div>
          ) : (
            <div className="adm-pimg-dropzone-body text-center">
              <FiUpload className="adm-pimg-drop-ico mb-2" />
              <p className="mb-2 fw-medium">Kéo thả ảnh vào đây hoặc</p>
              <button
                type="button"
                className="btn btn-primary btn-sm mb-0"
                disabled={uploading || items.length >= MAX_GALLERY}
                onClick={() => fileInputRef.current?.click()}
              >
                Chọn ảnh từ máy
              </button>
              <p className="small text-muted mt-2 mb-0">
                Còn lại {MAX_GALLERY - items.length} slot
              </p>
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}

export default AdminProductImages;
