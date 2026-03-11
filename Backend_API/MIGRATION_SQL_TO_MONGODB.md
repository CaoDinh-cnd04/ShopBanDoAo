# Chuyển từ SQL Server sang MongoDB (MongoDB Atlas)

## Bạn có thể chạy trên "hệ thống của MongoDB" không?

**Có.** Bạn dùng **MongoDB Atlas** (cloud của MongoDB) thì:

- Không cần cài SQL Server, không cần thuê VPS chỉ để chạy database.
- Atlas có **free tier** (M0), đủ cho dev và traffic nhỏ.
- Database nằm trên cloud của MongoDB, bạn chỉ cần chuỗi kết nối (connection string).

**Nhưng:** Toàn bộ backend hiện tại viết cho **SQL Server** (dùng `mssql`, câu lệnh SQL, stored procedure). Để chạy với MongoDB bạn cần **đổi cách truy cập dữ liệu** trong code.

---

## So sánh nhanh

| | SQL Server (hiện tại) | MongoDB Atlas |
|--|----------------------|---------------|
| **Hosting DB** | Bạn phải có máy chạy SQL Server (PC, VPS, Azure SQL...) | MongoDB host giúp (Atlas), có free tier |
| **Trong code** | `executeQuery("SELECT ... FROM Table ...")`, stored procedure | Thao tác **collection** (find, insertOne, updateOne, aggregate...) |
| **Cấu trúc dữ liệu** | Bảng (table), quan hệ (FK), schema cố định | Collection, document (JSON), linh hoạt |
| **Công việc khi đổi** | — | **Viết lại** mọi chỗ gọi DB (controller, middleware) |

---

## Cần làm những gì khi đổi sang MongoDB

### 1. Tạo cluster trên MongoDB Atlas (miễn phí)

1. Vào [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) → Đăng ký / Đăng nhập.
2. Tạo **Project** → Tạo **Cluster** (chọn free tier M0).
3. Tạo **Database User** (username + password).
4. **Network Access** → Add IP (0.0.0.0/0 cho dev, production nên giới hạn IP).
5. Lấy **Connection String**: Cluster → Connect → "Connect your application" → copy chuỗi dạng:
   ```text
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Đổi `<password>` bằng mật khẩu user vừa tạo. Có thể đặt tên database trong chuỗi, ví dụ:
   ```text
   mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/SportsEcommerce?retryWrites=true&w=majority
   ```

### 2. Trong project Backend

- **Cấu hình:** Dùng file `config/database.mongodb.js` (đã thêm) và biến môi trường `MONGODB_URI` (xem `env.example`).
- **Code:** Mọi file đang dùng `executeQuery`, `executeProcedure`, `getPool` từ `config/database.js` cần chuyển sang dùng **MongoDB** (collection, documents).

### 3. Các file cần chỉnh (ước lượng)

| File | Hiện tại | Khi dùng MongoDB |
|------|----------|-------------------|
| `config/database.js` | Kết nối SQL Server, export `executeQuery`, `getPool`... | Giữ cho SQL **hoặc** thay bằng `database.mongodb.js` |
| `controllers/authController.js` | Nhiều `executeQuery(SQL, params)` | Thao tác collection `users`, `roles`... |
| `controllers/categoryController.js` | `executeQuery` với bảng Categories, SubCategories | Collection `categories` (có thể nhúng subcategories trong document) |
| `controllers/productController.js` | SQL Products, ... | Collection `products` |
| `controllers/orderController.js` | SQL Orders, OrderDetails | Collection `orders` (có thể nhúng items) |
| `controllers/cartController.js` | SQL Cart, CartItems | Collection `carts` |
| `controllers/bookingController.js` | SQL Bookings, Courts, Slots... | Collections `bookings`, `courts`, ... |
| `controllers/addressController.js` | SQL Addresses | Collection `addresses` |
| `controllers/reviewController.js` | SQL Reviews | Collection `reviews` |
| `controllers/voucherController.js` | SQL Vouchers | Collection `vouchers` |
| `controllers/wishlistController.js` | SQL Wishlists | Collection `wishlists` |
| `controllers/notificationController.js` | SQL Notifications | Collection `notifications` |
| Các `controllers/admin*.js` | `getPool()`, SQL trực tiếp | Dùng MongoDB client và collection tương ứng |
| `middleware/firebaseAuth.js` | `executeQuery` tra cứu user | Tra cứu user trong collection `users` |

Bạn có thể đổi **từng module** (ví dụ: trước categories, sau auth, rồi products...) hoặc làm hết một lần.

### 4. Thiết kế collection (gợi ý)

- **users** – thông tin user (tương ứng bảng Users, có thể nhúng hoặc tham chiếu role).
- **categories** – danh mục, mỗi document có thể có mảng `subCategories` (embedded).
- **products** – sản phẩm (có thể tham chiếu categoryId, brandId).
- **orders** – đơn hàng, mảng `items` nhúng trong document.
- **carts** – giỏ hàng, mảng `items`.
- **bookings** – đặt sân (courtId, userId, slot, status...).
- **reviews**, **vouchers**, **addresses**, **wishlists**, **notifications** – mỗi loại một collection.

Quan hệ phức tạp (nhiều bảng join) trong SQL sẽ chuyển thành: embed document hoặc lưu ID và query nhiều lần / aggregate.

---

## Cách dùng MongoDB trong code (ví dụ)

Thay vì:

```javascript
const categories = await executeQuery(
  'SELECT CategoryID, CategoryName, ... FROM Categories WHERE IsActive = 1 ORDER BY DisplayOrder'
);
```

Bạn sẽ dùng:

```javascript
const { getDb } = require('../config/database.mongodb');
const db = getDb();
const categories = await db.collection('categories')
  .find({ isActive: true })
  .sort({ displayOrder: 1, categoryName: 1 })
  .toArray();
```

Tên trường trong MongoDB thường dùng **camelCase** (categoryName, isActive...) thay cho PascalCase trong SQL (CategoryName, IsActive). Bạn có thể chuẩn hóa khi đọc/ghi để giữ tương thích với frontend (ví dụ map `CategoryID` ↔ `_id` hoặc `categoryId`).

---

## Tóm tắt

- **Chạy DB trên "hệ thống của MongoDB"** = dùng **MongoDB Atlas** → không cần tự host SQL Server, có free tier.
- **Đổi sang MongoDB** = phải **đổi toàn bộ layer truy cập dữ liệu** từ SQL sang MongoDB (connection + mọi controller/middleware đang gọi DB).
- Trong repo đã có:
  - `config/database.mongodb.js` – kết nối Atlas, export `getDb`, `connectMongo`, `closeMongo`.
  - `env.example` – thêm `MONGODB_URI`, `MONGODB_DB_NAME`.
  - `package.json` – thêm dependency `mongodb`.

**Lưu ý:** Hiện tại `middleware/validateEnv.js` bắt buộc biến SQL Server (`DB_SERVER`, `DB_DATABASE`, ...). Khi chạy **chỉ** MongoDB, bạn cần sửa `validateEnv.js` để kiểm tra `MONGODB_URI` thay vì (hoặc ngoài) các biến DB_*. Trong `server.js` khi dùng MongoDB: gọi `const { connectMongo, closeMongo } = require('./config/database.mongodb');` → lúc start gọi `await connectMongo();` và lúc tắt process gọi `await closeMongo();` (thay hoặc bên cạnh `getPool`/`closePool` của SQL).
