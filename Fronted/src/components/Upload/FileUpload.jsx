import { useState, useRef } from 'react';
import { Form, Button, ProgressBar, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import axios from 'axios';

const FileUpload = ({
    onUploadSuccess,
    multiple = false,
    maxFiles = 10,
    maxSize = 5, // MB
    accept = 'image/*',
    label = 'Chọn ảnh'
}) => {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [preview, setPreview] = useState([]);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);

        if (!multiple && files.length > 1) {
            toast.error('Chỉ được chọn 1 file');
            return;
        }

        if (files.length > maxFiles) {
            toast.error(`Chỉ được chọn tối đa ${maxFiles} files`);
            return;
        }

        // Validate file size
        const oversizedFiles = files.filter(file => file.size > maxSize * 1024 * 1024);
        if (oversizedFiles.length > 0) {
            toast.error(`File không được vượt quá ${maxSize}MB`);
            return;
        }

        // Create preview
        const previews = files.map(file => ({
            file,
            preview: URL.createObjectURL(file)
        }));
        setPreview(previews);
    };

    const handleUpload = async () => {
        if (preview.length === 0) {
            toast.error('Vui lòng chọn file');
            return;
        }

        try {
            setUploading(true);
            const token = localStorage.getItem('token');
            const formData = new FormData();

            if (multiple) {
                preview.forEach(item => {
                    formData.append('images', item.file);
                });
            } else {
                formData.append('image', preview[0].file);
            }

            const endpoint = multiple ? '/upload/multiple' : '/upload/single';
            const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

            const response = await axios.post(`${API_URL}${endpoint}`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setProgress(percentCompleted);
                }
            });

            toast.success(response.data.message);

            if (onUploadSuccess) {
                onUploadSuccess(response.data.data);
            }

            // Reset
            setPreview([]);
            setProgress(0);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.error(error.response?.data?.message || 'Lỗi khi upload file');
        } finally {
            setUploading(false);
        }
    };

    const handleRemovePreview = (index) => {
        const newPreview = preview.filter((_, i) => i !== index);
        setPreview(newPreview);
    };

    return (
        <div>
            <Form.Group className="mb-3">
                <Form.Label className="fw-bold">{label}</Form.Label>
                <Form.Control
                    ref={fileInputRef}
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    onChange={handleFileChange}
                    disabled={uploading}
                />
                <Form.Text className="text-muted">
                    {multiple ? `Tối đa ${maxFiles} files` : 'Chỉ chọn 1 file'}, mỗi file tối đa {maxSize}MB
                </Form.Text>
            </Form.Group>

            {/* Preview */}
            {preview.length > 0 && (
                <div className="mb-3">
                    <div className="d-flex flex-wrap gap-2">
                        {preview.map((item, index) => (
                            <div key={index} className="position-relative">
                                <img
                                    src={item.preview}
                                    alt={`Preview ${index + 1}`}
                                    style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                                    className="rounded"
                                />
                                <Button
                                    size="sm"
                                    variant="danger"
                                    className="position-absolute top-0 end-0"
                                    style={{ padding: '2px 6px' }}
                                    onClick={() => handleRemovePreview(index)}
                                    disabled={uploading}
                                >
                                    <i className="bi bi-x"></i>
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Progress */}
            {uploading && (
                <ProgressBar
                    now={progress}
                    label={`${progress}%`}
                    className="mb-3"
                    animated
                />
            )}

            {/* Upload Button */}
            {preview.length > 0 && (
                <Button
                    variant="primary"
                    onClick={handleUpload}
                    disabled={uploading}
                >
                    {uploading ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Đang upload...
                        </>
                    ) : (
                        <>
                            <i className="bi bi-cloud-upload me-2"></i>
                            Upload {preview.length} file
                        </>
                    )}
                </Button>
            )}
        </div>
    );
};

export default FileUpload;
