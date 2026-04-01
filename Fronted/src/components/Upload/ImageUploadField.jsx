import { useState, useRef, useId, useEffect } from 'react';
import { Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { uploadSingleImage } from '../../services/uploadService';
import { resolveMediaUrl, normalizeUploadUrlForDb } from '../../utils/mediaUrl';

/**
 * ImageUploadField - Component upload ảnh nhúng trong form admin
 * Props:
 *   value       : URL ảnh hiện tại (string)
 *   onChange    : callback(url: string) khi upload xong hoặc xóa ảnh
 *   label       : nhãn hiển thị (default: 'Ảnh')
 *   placeholder : text khi chưa có ảnh
 *   previewSize : kích thước preview (default: 120)
 *   disabled    : vô hiệu hóa
 *   persistImageAfterUpload : (url đã chuẩn hóa) => Promise<void> — gọi API lưu ảnh ngay (khi sửa bản ghi có id),
 *                             tránh mất ảnh nếu admin đóng trang trước khi bấm Lưu.
 */
const ImageUploadField = ({
  value = '',
  onChange,
  label = 'Ảnh',
  placeholder = 'Chưa có ảnh',
  previewSize = 120,
  disabled = false,
  persistImageAfterUpload,
}) => {
  const [uploading, setUploading] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const inputRef = useRef(null);
  const fileInputId = useId();

  useEffect(() => {
    setImgFailed(false);
  }, [value]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ chấp nhận file ảnh (JPEG, PNG, WebP...)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File ảnh không được vượt quá 5MB');
      return;
    }

    try {
      setUploading(true);
      const res = await uploadSingleImage(file);
      const uploaded = res.data?.data;
      const raw =
        typeof uploaded === 'string'
          ? uploaded
          : uploaded?.url ?? uploaded?.path ?? uploaded?.filename ?? '';

      if (!raw) throw new Error('Không nhận được URL ảnh');
      const normalized = normalizeUploadUrlForDb(raw);
      if (!normalized) {
        throw new Error('URL ảnh không hợp lệ để lưu (tránh blob / đường dẫn tạm)');
      }
      onChange?.(normalized);
      if (typeof persistImageAfterUpload === 'function') {
        await persistImageAfterUpload(normalized);
        toast.success('Đã lưu ảnh lên máy chủ');
      } else {
        toast.success(
          'Tải ảnh lên thành công. Nhấn «Lưu» để ghi ảnh vào cơ sở dữ liệu.',
          { autoClose: 6000 },
        );
      }
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message || err.message || 'Upload ảnh thất bại',
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    onChange?.('');
  };

  return (
    <div className="image-upload-field">
      {label && (
        <label className="form-label small fw-semibold">{label}</label>
      )}

      <div className="d-flex align-items-start gap-3 flex-wrap">
        {/* Preview box */}
        <div
          className="iuf-preview rounded border d-flex align-items-center justify-content-center overflow-hidden flex-shrink-0 position-relative"
          style={{ width: previewSize, height: previewSize, background: '#f8f9fa' }}
        >
          {uploading ? (
            <Spinner animation="border" size="sm" variant="primary" />
          ) : value ? (
            <>
              {!imgFailed ? (
                <img
                  src={resolveMediaUrl(value)}
                  alt="Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={() => setImgFailed(true)}
                />
              ) : (
                <span className="text-danger small text-center px-1" style={{ fontSize: 10 }}>
                  Không tải ảnh (URL/API)
                </span>
              )}
              {!disabled && (
                <button
                  type="button"
                  className="iuf-remove-btn position-absolute top-0 end-0 btn btn-danger btn-sm"
                  style={{ padding: '1px 5px', fontSize: 11 }}
                  onClick={handleRemove}
                  title="Xóa ảnh"
                >
                  ×
                </button>
              )}
            </>
          ) : (
            <span className="text-muted small text-center px-1" style={{ fontSize: 11 }}>
              {placeholder}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="d-flex flex-column gap-2 justify-content-center">
          <input
            ref={inputRef}
            id={fileInputId}
            type="file"
            accept="image/*"
            className="visually-hidden"
            onChange={handleFileChange}
            disabled={disabled || uploading}
          />
          <label
            htmlFor={disabled || uploading ? undefined : fileInputId}
            className={`btn btn-outline-primary btn-sm ${disabled || uploading ? 'disabled pe-none' : ''}`}
            style={{ cursor: disabled || uploading ? 'not-allowed' : 'pointer' }}
          >
            {uploading ? (
              <>
                <Spinner animation="border" size="sm" className="me-1" />
                Đang tải...
              </>
            ) : (
              <>
                <i className="bi bi-folder2-open me-1" />
                {value ? 'Đổi ảnh' : 'Chọn ảnh từ máy'}
              </>
            )}
          </label>
          {value && !disabled && (
            <span
              className="text-muted small text-truncate"
              style={{ maxWidth: 180, fontSize: 11 }}
              title={value}
            >
              {value.split('/').pop()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageUploadField;
