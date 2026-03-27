import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FiTag, FiCopy, FiCheck, FiCalendar, FiPercent, FiDollarSign } from 'react-icons/fi';
import { fetchPublicVouchers } from '../../store/slices/voucherSlice';
import { toast } from 'react-toastify';
import Loading from '../../components/Loading/Loading';

const formatMoney = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';

const VoucherCard = ({ voucher }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(voucher.code);
      setCopied(true);
      toast.success(`Đã sao chép mã: ${voucher.code}`);
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
      {/* Left accent strip */}
      <div className="voucher-strip">
        {isPercent ? <FiPercent size={18} /> : <FiDollarSign size={18} />}
      </div>

      <div className="voucher-body">
        <div className="voucher-top">
          <div>
            <div className="voucher-code">{voucher.code}</div>
            <div className="voucher-discount">Giảm {discountLabel}</div>
          </div>
          <button
            className={`voucher-copy-btn ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
            title="Sao chép mã"
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
          {voucher.usageLimit > 0 && (
            <span className="voucher-meta-item">
              Còn: {voucher.usageLimit - (voucher.usedCount ?? 0)} lượt
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const Vouchers = () => {
  const dispatch = useDispatch();
  const { vouchers, isLoading, error } = useSelector((s) => s.vouchers);

  useEffect(() => {
    dispatch(fetchPublicVouchers());
  }, [dispatch]);

  if (isLoading) return <Loading />;

  return (
    <div className="profile-section-card">
      <div className="profile-section-header">
        <div className="profile-section-title-row">
          <FiTag size={20} />
          <h2 className="profile-section-title">Voucher khuyến mãi</h2>
        </div>
        <p className="profile-section-sub">
          Sao chép mã và nhập tại trang thanh toán để được giảm giá
        </p>
      </div>

      {error && (
        <div className="profile-alert error">Không thể tải danh sách voucher. Thử lại sau.</div>
      )}

      {!error && vouchers.length === 0 && (
        <div className="profile-empty-state">
          <FiTag size={48} />
          <p>Hiện chưa có voucher nào đang áp dụng</p>
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
