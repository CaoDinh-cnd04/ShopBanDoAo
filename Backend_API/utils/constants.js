/**
 * Application Constants
 */

const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500
};

const ROLES = {
    ADMIN: 'Admin',
    STAFF: 'Staff',
    CUSTOMER: 'Customer'
};

const ORDER_STATUS = {
    PENDING: 'Chờ xử lý',
    CONFIRMED: 'Đã xác nhận',
    SHIPPING: 'Đang giao',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy'
};

const BOOKING_STATUS = {
    PENDING: 'Chờ xác nhận',
    CONFIRMED: 'Đã xác nhận',
    IN_USE: 'Đang sử dụng',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy'
};

const PAYMENT_STATUS = {
    PENDING: 'Chờ thanh toán',
    SUCCESS: 'Thành công',
    FAILED: 'Thất bại',
    REFUNDED: 'Hoàn tiền'
};

const DISCOUNT_TYPE = {
    PERCENTAGE: 'Phần trăm',
    AMOUNT: 'Số tiền'
};

const MESSAGES = {
    // Auth
    REGISTER_SUCCESS: 'Đăng ký thành công',
    LOGIN_SUCCESS: 'Đăng nhập thành công',
    LOGOUT_SUCCESS: 'Đăng xuất thành công',
    INVALID_CREDENTIALS: 'Username hoặc password không đúng',
    USER_NOT_FOUND: 'Không tìm thấy người dùng',
    USER_EXISTS: 'Username hoặc Email đã tồn tại',
    UNAUTHORIZED: 'Không có quyền truy cập',
    TOKEN_INVALID: 'Token không hợp lệ',
    TOKEN_EXPIRED: 'Token đã hết hạn',
    
    // General
    NOT_FOUND: 'Không tìm thấy dữ liệu',
    CREATED: 'Tạo mới thành công',
    UPDATED: 'Cập nhật thành công',
    DELETED: 'Xóa thành công',
    INVALID_INPUT: 'Dữ liệu không hợp lệ',
    SERVER_ERROR: 'Lỗi server',
    
    // Product
    PRODUCT_NOT_FOUND: 'Không tìm thấy sản phẩm',
    PRODUCT_OUT_OF_STOCK: 'Sản phẩm đã hết hàng',
    
    // Order
    ORDER_CREATED: 'Đặt hàng thành công',
    ORDER_NOT_FOUND: 'Không tìm thấy đơn hàng',
    CART_EMPTY: 'Giỏ hàng trống',
    
    // Booking
    BOOKING_CREATED: 'Đặt sân thành công',
    BOOKING_NOT_FOUND: 'Không tìm thấy đặt sân',
    TIME_SLOT_BOOKED: 'Khung giờ đã được đặt',
    
    // Address
    ADDRESS_NOT_FOUND: 'Không tìm thấy địa chỉ'
};

const VALIDATION = {
    PASSWORD_MIN_LENGTH: 6,
    USERNAME_MIN_LENGTH: 3,
    USERNAME_MAX_LENGTH: 50,
    EMAIL_MAX_LENGTH: 100,
    NAME_MAX_LENGTH: 100
};

const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100
};

module.exports = {
    HTTP_STATUS,
    ROLES,
    ORDER_STATUS,
    BOOKING_STATUS,
    PAYMENT_STATUS,
    DISCOUNT_TYPE,
    MESSAGES,
    VALIDATION,
    PAGINATION
};
