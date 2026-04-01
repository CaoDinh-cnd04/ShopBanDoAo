import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMapPin, FiPlus, FiEdit2, FiTrash2, FiX,
  FiUser, FiPhone, FiHome, FiCheck,
} from 'react-icons/fi';
import {
  fetchAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../../store/slices/addressSlice';
import { toast } from 'react-toastify';
import Loading from '../../components/Loading/Loading';

const schema = z.object({
  fullName: z.string().min(2, 'Họ tên tối thiểu 2 ký tự'),
  phone: z.string().regex(/^(0|\+84)[3-9]\d{8}$/, 'Số điện thoại không hợp lệ'),
  address: z.string().min(5, 'Vui lòng nhập địa chỉ cụ thể'),
  ward: z.string().min(1, 'Vui lòng nhập phường/xã'),
  district: z.string().min(1, 'Vui lòng nhập quận/huyện'),
  city: z.string().min(1, 'Vui lòng nhập tỉnh/thành phố'),
  isDefault: z.boolean().optional(),
});

const Field = ({ label, icon: Icon, name, placeholder, register, errors, type = 'text' }) => (
  <div className="profile-field">
    <label className="profile-field-label"><Icon size={14} /> {label}</label>
    <input
      type={type}
      className={`profile-field-input ${errors[name] ? 'error' : ''}`}
      placeholder={placeholder}
      {...register(name)}
    />
    {errors[name] && <span className="profile-field-error">{errors[name].message}</span>}
  </div>
);

const emptyForm = { fullName: '', phone: '', address: '', ward: '', district: '', city: '', isDefault: false };

const AddressModal = ({ editing, onClose, onSaved }) => {
  const dispatch = useDispatch();
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: emptyForm,
  });

  const editingKey = editing?._id || editing?.id || 'new';
  useEffect(() => {
    reset(
      editing
        ? {
            fullName: editing.fullName || '',
            phone: editing.phone || '',
            address: editing.address || '',
            ward: editing.ward || '',
            district: editing.district || '',
            city: editing.city || '',
            isDefault: !!editing.isDefault,
          }
        : emptyForm,
    );
  }, [editingKey, editing, reset]);

  const onSubmit = async (data) => {
    const action = editing
      ? updateAddress({ id: editing._id || editing.id, addressData: data })
      : createAddress(data);
    const result = await dispatch(action);
    if ((editing ? updateAddress : createAddress).fulfilled.match(result)) {
      toast.success(editing ? 'Cập nhật địa chỉ thành công' : 'Thêm địa chỉ thành công');
      onSaved();
    } else {
      toast.error('Không thể lưu địa chỉ');
    }
  };

  return (
    <motion.div
      className="pf-modal-overlay"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="pf-modal wide"
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pf-modal-head">
          <h3>{editing ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}</h3>
          <button className="pf-modal-close" onClick={onClose}><FiX size={18} /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="addr-form-grid">
            <Field label="Họ và tên" icon={FiUser} name="fullName" placeholder="Nguyễn Văn A" register={register} errors={errors} />
            <Field label="Số điện thoại" icon={FiPhone} name="phone" placeholder="0901234567" register={register} errors={errors} />
          </div>
          <Field label="Địa chỉ (số nhà, tên đường)" icon={FiHome} name="address" placeholder="123 Đường Lê Lợi" register={register} errors={errors} />
          <div className="addr-form-grid addr-form-grid-3">
            <Field label="Phường / Xã" icon={FiMapPin} name="ward" placeholder="Phường Bến Nghé" register={register} errors={errors} />
            <Field label="Quận / Huyện" icon={FiMapPin} name="district" placeholder="Quận 1" register={register} errors={errors} />
            <Field label="Tỉnh / Thành phố" icon={FiMapPin} name="city" placeholder="TP. Hồ Chí Minh" register={register} errors={errors} />
          </div>

          <label className="addr-default-check">
            <input type="checkbox" {...register('isDefault')} />
            <span>Đặt làm địa chỉ mặc định</span>
          </label>

          <div className="pf-modal-actions">
            <button type="button" className="profile-btn-secondary" onClick={onClose}>Hủy</button>
            <button type="submit" className="profile-btn-primary">
              <FiCheck size={15} /> {editing ? 'Cập nhật' : 'Thêm địa chỉ'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

const Addresses = () => {
  const dispatch = useDispatch();
  const { addresses: rawAddresses, isLoading } = useSelector((s) => s.addresses);
  const addresses = Array.isArray(rawAddresses) ? rawAddresses : [];
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => { dispatch(fetchAddresses()); }, [dispatch]);

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa địa chỉ này?')) return;
    const result = await dispatch(deleteAddress(id));
    if (deleteAddress.fulfilled.match(result)) {
      toast.success('Đã xóa địa chỉ');
      dispatch(fetchAddresses());
    } else {
      toast.error('Không thể xóa địa chỉ');
    }
  };

  const handleSetDefault = async (id) => {
    const result = await dispatch(setDefaultAddress(id));
    if (setDefaultAddress.fulfilled.match(result)) {
      toast.success('Đã đặt làm địa chỉ mặc định');
    } else {
      toast.error(result.payload || 'Không thể cập nhật');
    }
  };

  const openAdd = () => { setEditing(null); setShowModal(true); };
  const openEdit = (addr) => { setEditing(addr); setShowModal(true); };
  const handleSaved = () => { setShowModal(false); dispatch(fetchAddresses()); };

  if (isLoading) return <Loading />;

  return (
    <div className="profile-section-card">
      <div className="profile-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="profile-section-title-row">
            <FiMapPin size={20} />
            <h2 className="profile-section-title">Địa chỉ giao hàng</h2>
          </div>
          <p className="profile-section-sub">{addresses?.length || 0} địa chỉ đã lưu</p>
        </div>
        <button className="profile-btn-primary" onClick={openAdd}>
          <FiPlus size={15} /> Thêm địa chỉ
        </button>
      </div>

      {(!addresses || addresses.length === 0) ? (
        <div className="profile-empty-state">
          <FiMapPin size={48} />
          <p>Bạn chưa có địa chỉ nào. Thêm địa chỉ để đặt hàng nhanh hơn!</p>
          <button className="profile-btn-primary" onClick={openAdd}>
            <FiPlus size={15} /> Thêm địa chỉ đầu tiên
          </button>
        </div>
      ) : (
        <div className="addr-list">
          {addresses.map((addr) => (
            <motion.div
              key={addr._id || addr.id}
              className="addr-card"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {addr.isDefault && (
                <span className="addr-default-badge"><FiCheck size={11} /> Mặc định</span>
              )}
              <div className="addr-card-body">
                <div className="addr-name">{addr.fullName}</div>
                <div className="addr-phone">{addr.phone}</div>
                <div className="addr-text">
                  {addr.address}, {addr.ward}, {addr.district}, {addr.city}
                </div>
              </div>
              <div className="addr-card-actions">
                {!addr.isDefault && (
                  <button
                    type="button"
                    className="addr-btn"
                    onClick={() => handleSetDefault(addr._id || addr.id)}
                  >
                    Mặc định
                  </button>
                )}
                <button type="button" className="addr-btn edit" onClick={() => openEdit(addr)}>
                  <FiEdit2 size={14} /> Sửa
                </button>
                <button type="button" className="addr-btn delete" onClick={() => handleDelete(addr._id || addr.id)}>
                  <FiTrash2 size={14} /> Xóa
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <AddressModal editing={editing} onClose={() => setShowModal(false)} onSaved={handleSaved} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Addresses;
