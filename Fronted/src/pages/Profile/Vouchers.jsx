import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  FiTag,
  FiCopy,
  FiCheck,
  FiCalendar,
  FiPercent,
  FiDollarSign,
  FiPackage,
} from 'react-icons/fi';
import { fetchMyVouchers, fetchPublicVouchers } from '../../store/slices/voucherSlice';
import { toast } from 'react-toastify';
import Loading from '../../components/Loading/Loading';

const formatMoney = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '';

const formatDateTime = (d) =>
  d
    ? new Date(d).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

/** API có thể trả `code` hoặc tên cũ — tránh copy ra "undefined" */
const getVoucherCode = (v) => {
  const c = v?.code ?? v?.voucherCode ?? v?.VoucherCode;
  return c != null ? String(c).trim() : '';
};

const VoucherCard = ({ voucher }) => {
  const [copied, setCopied] = useState(false);
  const voucherCode = getVoucherCode(voucher);

  const handleCopy = async () => {
    try {
      if (!voucherCode) {
        toast.error('Không có mã để sao chép');
        return;
      }
      await navigator.clipboard.writeText(voucherCode);
      setCopied(true);
      toast.success(`Đã sao chép mã: ${voucherCode}`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Không thể sao chép, hãy copy thủ công');
    }
  };

  const isPercent = voucher.discountType === 'percent';
  const discountLabel = isPercent
    ? `${voucher.discountValue}%`
    : formatMoney(voucher.discountValue);

  return (
    <motion.div
      className="voucher-card-item"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="voucher-strip">
        {isPercent ? <FiPercent size={18} /> : <FiDollarSign size={18} />}
      </div>

      <div className="voucher-body">
        <div className="voucher-top">
          <div>
            <div className="voucher-code">{voucherCode || '—'}</div>
            <div className="voucher-discount">Giảm {discountLabel}</div>
            {voucher.voucherName ? (
              <div className="voucher-name-sub small text-muted mt-1">{voucher.voucherName}</div>
            ) : null}
          </div>
          <button
            type="button"
            className={`voucher-copy-btn ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
            title="Sao chép mã"
            disabled={!voucherCode}
          >
            {copied ? <FiCheck size={15} /> : <FiCopy size={15} />}
            {copied ? 'Đã copy' : 'Sao chép'}
          </button>
        </div>

        <div className="voucher-meta">
          {voucher.minOrderValue > 0 && (
            <span className="voucher-meta-item">
              Đơn tối thiểu: {formatMoney(voucher.minOrderValue)}
            </span>
          )}
          {isPercent && voucher.maxDiscountAmount > 0 && (
            <span className="voucher-meta-item">
              Giảm tối đa: {formatMoney(voucher.maxDiscountAmount)}
            </span>
          )}
          {voucher.endDate && (
            <span className="voucher-meta-item">
              <FiCalendar size={12} /> HSD: {formatDate(voucher.endDate)}
            </span>
          )}
        </div>
        <p className="voucher-hint small text-muted mb-0 mt-2">
          Nhập mã ở <strong>Giỏ hàng</strong> trước khi thanh toán — mỗi tài khoản chỉ dùng một lần / mã.
        </p>
      </div>
    </motion.div>
  );
};

const Vouchers = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((s) => s.auth);
  const { vouchers, usedVouchers, isLoading, error } = useSelector((s) => s.vouchers);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchMyVouchers());
    } else {
      dispatch(fetchPublicVouchers());
    }
  }, [dispatch, isAuthenticated]);

  if (isLoading) return <Loading />;

  return (
    <div className="profile-section-card">
      <div className="profile-section-header">
        <div className="profile-section-title-row">
          <FiTag size={20} />
          <h2 className="profile-section-title">Voucher khuyến mãi</h2>
        </div>
        <p className="profile-section-sub">
          {isAuthenticated
            ? 'Mã bạn có thể dùng và lịch sử đã áp dụng trên tài khoản'
            : 'Đăng nhập để xem voucher theo tài khoản — hoặc xem mã đang phát hành bên dưới'}
        </p>
      </div>

      {error && (
        <div className="profile-alert error">Không thể tải danh sách voucher. Thử lại sau.</div>
      )}

      {isAuthenticated && usedVouchers.length > 0 && (
        <div className="mb-4">
          <h3 className="h6 fw-semibold mb-3 d-flex align-items-center gap-2">
            <FiPackage size={16} /> Đã sử dụng
          </h3>
          <div className="voucher-used-list">
            {usedVouchers.map((row) => (
              <div key={`${row.orderId}-${row.voucherCode}`} className="voucher-used-row">
                <div>
                  <span className="fw-semibold font-monospace">{row.voucherCode}</span>
                  <span className="text-muted small d-block">
                    Đơn: {row.orderCode || row.orderId}
                  </span>
                </div>
                <span className="small text-muted">{formatDateTime(row.usedAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isAuthenticated && vouchers.length > 0 && (
        <h3 className="h6 fw-semibold mb-3">Có thể dùng</h3>
      )}

      {!error &&
        vouchers.length === 0 &&
        (!isAuthenticated || usedVouchers.length === 0) && (
        <div className="profile-empty-state">
          <FiTag size={48} />
          <p>
            {isAuthenticated
              ? 'Bạn đã dùng hết mã đang phát hành hoặc chưa có mã mới.'
              : 'Hiện chưa có voucher nào đang áp dụng'}
          </p>
        </div>
      )}

      <div className="voucher-list">
        {vouchers.map((v) => (
          <VoucherCard key={v._id || v.id} voucher={v} />
        ))}
      </div>
    </div>
  );
};

export default Vouchers;
