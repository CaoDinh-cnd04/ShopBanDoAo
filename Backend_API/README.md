# Sports E-commerce & Court Booking API

Backend API cho hệ thống bán hàng thể thao và đặt sân bóng, được xây dựng bằng Node.js và Express.js.

> 📊 **Đánh giá:** Backend đã hoàn thiện ~85%, đủ để phát triển frontend. Xem `BACKEND_REVIEW.md` để biết chi tiết.

## Công nghệ sử dụng

### Core
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQL Server** - Database (sử dụng `mssql` driver)

### Security & Authentication
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Helmet** - Security headers
- **express-mongo-sanitize** - Input sanitization
- **express-rate-limit** - Rate limiting

### Validation & Utilities
- **express-validator** - Input validation
- **multer** - File upload
- **moment** - Date/time handling
- **morgan** - HTTP request logger

## Cài đặt

> 💡 **Mới bắt đầu?** Xem `SETUP_STEP_BY_STEP.md` - Hướng dẫn từng bước đơn giản nhất
> 
> 📖 **Chi tiết?** Xem `SETUP_GUIDE.md` - Hướng dẫn đầy đủ với troubleshooting

### Quick Setup (5 bước)

1. **Kiểm tra Node.js:**
```bash
node --version  # Cần v16+ (khuyến nghị v18+)
```

2. **Tạo Database:**
   - Mở file `SportsEcommerce.sql` (ở thư mục gốc)
   - Chạy trong SQL Server Management Studio
   - Đảm bảo database `SportsEcommerce` đã được tạo

3. **Cài đặt dependencies:**
```bash
cd Backend_API
npm install
```

4. **Cấu hình environment:**
```bash
# Tạo file .env
copy env.example .env

# Sửa file .env:
# - DB_PASSWORD = password SQL Server của bạn
# - JWT_SECRET = tạo bằng: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

5. **Chạy server:**
```bash
npm start
```

**Kết quả mong đợi:**
```
✅ Environment variables validated
✅ Firebase Admin SDK initialized successfully
✅ Connected to SQL Server database
🚀 Server is running on port 3000
```

### Test Server

Mở browser: `http://localhost:3000/health`

Nên thấy: `{"success": true, "message": "Server is running"}`

## API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Đăng ký tài khoản
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/firebase-login` - Đăng nhập với Firebase (Google OAuth)
- `GET /api/auth/profile` - Lấy thông tin profile (cần auth)
- `PUT /api/auth/profile` - Cập nhật profile (cần auth)
- `PUT /api/auth/change-password` - Đổi mật khẩu (cần auth)

### Products (`/api/products`)
- `GET /api/products` - Lấy danh sách sản phẩm (có phân trang, filter)
- `GET /api/products/:id` - Lấy chi tiết sản phẩm (theo ID hoặc slug)
- `POST /api/products` - Tạo sản phẩm mới (Admin only)
- `PUT /api/products/:id` - Cập nhật sản phẩm (Admin only)
- `DELETE /api/products/:id` - Xóa sản phẩm (Admin only)

### Categories (`/api/categories`)
- `GET /api/categories` - Lấy danh sách danh mục và subcategories
- `GET /api/categories/:id` - Lấy chi tiết danh mục
- `GET /api/categories/brands` - Lấy danh sách thương hiệu

### Cart (`/api/cart`)
- `GET /api/cart` - Lấy giỏ hàng (cần auth)
- `POST /api/cart` - Thêm sản phẩm vào giỏ hàng (cần auth)
- `PUT /api/cart/:id` - Cập nhật số lượng (cần auth)
- `DELETE /api/cart/:id` - Xóa sản phẩm khỏi giỏ hàng (cần auth)
- `DELETE /api/cart` - Xóa toàn bộ giỏ hàng (cần auth)

### Orders (`/api/orders`)
- `POST /api/orders` - Tạo đơn hàng (cần auth)
- `GET /api/orders` - Lấy danh sách đơn hàng của user (cần auth)
- `GET /api/orders/:id` - Lấy chi tiết đơn hàng (cần auth)

### Bookings (`/api/bookings`)
- `GET /api/bookings/available-slots` - Lấy các khung giờ còn trống
- `POST /api/bookings` - Đặt sân (cần auth)
- `GET /api/bookings` - Lấy danh sách đặt sân của user (cần auth)
- `GET /api/bookings/:id` - Lấy chi tiết đặt sân (cần auth)
- `PUT /api/bookings/:id/cancel` - Hủy đặt sân (cần auth)

### Courts (`/api/courts`)
- `GET /api/courts` - Lấy danh sách sân
- `GET /api/courts/types` - Lấy danh sách loại sân
- `GET /api/courts/:id` - Lấy chi tiết sân

### Addresses (`/api/addresses`)
- `GET /api/addresses` - Lấy danh sách địa chỉ (cần auth)
- `POST /api/addresses` - Thêm địa chỉ mới (cần auth)
- `PUT /api/addresses/:id` - Cập nhật địa chỉ (cần auth)
- `DELETE /api/addresses/:id` - Xóa địa chỉ (cần auth)

### Reviews (`/api/reviews`)
- `POST /api/reviews/products` - Tạo đánh giá sản phẩm (cần auth)
- `POST /api/reviews/courts` - Tạo đánh giá sân (cần auth)
- `GET /api/reviews/products/:productId` - Lấy đánh giá sản phẩm

### Vouchers (`/api/vouchers`)
- `GET /api/vouchers/available` - Lấy voucher khả dụng (cần auth)
- `GET /api/vouchers` - Lấy voucher của user (cần auth)
- `POST /api/vouchers/receive` - Nhận voucher (cần auth)

### Wishlist (`/api/wishlist`)
- `GET /api/wishlist` - Lấy wishlist (cần auth)
- `POST /api/wishlist` - Thêm vào wishlist (cần auth)
- `DELETE /api/wishlist/:id` - Xóa khỏi wishlist (cần auth)

### Notifications (`/api/notifications`)
- `GET /api/notifications` - Lấy thông báo (cần auth)
- `GET /api/notifications/unread-count` - Đếm chưa đọc (cần auth)
- `PUT /api/notifications/:id/read` - Đánh dấu đã đọc (cần auth)
- `PUT /api/notifications/read-all` - Đánh dấu tất cả đã đọc (cần auth)

## Authentication

API hỗ trợ 2 phương thức xác thực:

### 1. JWT Authentication (Traditional)
Sau khi đăng nhập thành công, bạn sẽ nhận được JWT token. Sử dụng token này trong header:

```
Authorization: Bearer <jwt_token>
```

### 2. Firebase Authentication (Google OAuth)
Sử dụng Firebase ID token để đăng nhập:

**Endpoint:** `POST /api/auth/firebase-login`
```json
{
  "idToken": "firebase-id-token-from-client"
}
```

Sau khi đăng nhập, bạn sẽ nhận được cả JWT token và Firebase token. Sử dụng JWT token cho các request tiếp theo.

**Lưu ý:** Bạn cũng có thể sử dụng Firebase token trực tiếp với middleware `authenticateFirebase`.

## Response Format

Tất cả API responses đều có format:

```json
{
  "success": true/false,
  "message": "Thông báo",
  "data": { ... }
}
```

## Error Handling

Khi có lỗi, response sẽ có format:

```json
{
  "success": false,
  "message": "Mô tả lỗi",
  "errors": [ ... ] // (nếu có validation errors)
}
```

## Cấu trúc thư mục

```
Backend_API/
├── config/
│   └── database.js          # Database configuration với transaction support
├── controllers/             # Business logic (12 controllers)
│   ├── authController.js
│   ├── productController.js
│   ├── categoryController.js
│   ├── orderController.js
│   ├── cartController.js
│   ├── bookingController.js
│   ├── courtController.js
│   ├── addressController.js
│   ├── reviewController.js      # NEW
│   ├── voucherController.js     # NEW
│   ├── wishlistController.js    # NEW
│   └── notificationController.js # NEW
├── middleware/
│   ├── auth.js              # Authentication & Authorization
│   ├── errorHandler.js      # Error handling
│   ├── logger.js            # Request & error logging
│   ├── rateLimiter.js       # Rate limiting
│   ├── security.js         # Security headers & sanitization
│   ├── upload.js            # File upload
│   └── validateEnv.js       # Environment validation
├── routes/                  # API routes (12 route files)
│   └── ... (tương ứng với controllers)
├── utils/                   # Utilities & helpers
│   ├── constants.js         # App constants & enums
│   ├── responseFormatter.js # Standardized responses
│   └── validators.js        # Reusable validators
├── uploads/                 # Uploaded files
├── logs/                    # Log files (access.log, error.log)
├── .env                     # Environment variables
├── env.example              # Environment template
├── .gitignore
├── package.json
├── server.js                # Entry point
├── README.md
└── ENTERPRISE_FEATURES.md   # Enterprise features documentation
```

## Enterprise Features

Backend đã được nâng cấp với các tính năng enterprise:

### Security
- ✅ Helmet.js - Security headers (XSS, CSRF protection)
- ✅ Input sanitization - Ngăn chặn NoSQL injection
- ✅ XSS Protection middleware
- ✅ Rate limiting - Chống DDoS (Auth: 5/15min, API: 100/15min)
- ✅ CORS với whitelist

### Logging & Monitoring
- ✅ Morgan logger - Request logging
- ✅ File-based logging (access.log, error.log)
- ✅ Error logging với stack traces

### Code Quality
- ✅ Standardized response format
- ✅ Constants & Enums
- ✅ Centralized validators
- ✅ Transaction support
- ✅ Better error handling

Xem chi tiết trong file `ENTERPRISE_FEATURES.md`

## Firebase Integration

Backend đã tích hợp Firebase Authentication và Firestore:

- ✅ **Firebase Authentication** - Đăng nhập với Google OAuth
- ✅ **Firestore** - Lưu trữ notifications, logs, real-time data
- ✅ **Auto user sync** - Tự động tạo user trong database khi đăng nhập Firebase

Xem hướng dẫn chi tiết trong file `FIREBASE_SETUP.md`

### Cấu hình Firebase

Thêm vào file `.env` (chọn 1 trong 3 options):

**Option 1: Service Account File Path**
```env
FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json
```

**Option 2: Service Account JSON String (Recommended)**
```env
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

**Option 3: Individual Credentials**
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## Lưu ý

1. Đảm bảo SQL Server đã được cài đặt và database `SportsEcommerce` đã được tạo từ file SQL
2. Copy file `env.example` thành `.env` và cấu hình đúng thông tin
3. Thay đổi `JWT_SECRET` thành một giá trị bảo mật (tối thiểu 32 ký tự) trong production
4. Cấu hình `ALLOWED_ORIGINS` cho CORS trong production
5. Cấu hình Firebase credentials nếu muốn sử dụng Firebase features
6. Thư mục `uploads` và `logs` sẽ tự động tạo khi chạy

## Development

Để chạy ở chế độ development với auto-reload:

```bash
npm run dev
```

## License

ISC
