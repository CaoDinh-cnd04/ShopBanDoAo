# Thêm dữ liệu vào MongoDB Atlas (Cloud)

Có **2 cách** để đưa dữ liệu seed vào cluster MongoDB Atlas của bạn.

---

## Cách 1: Dùng script Node.js (khuyến nghị)

Script `seed-mongodb.js` đã sẵn sàng chạy với **MongoDB Atlas**. Bạn chỉ cần chuỗi kết nối (connection string) của cluster.

### Bước 1: Lấy connection string từ Atlas

1. Đăng nhập [MongoDB Atlas](https://cloud.mongodb.com).
2. Chọn **Database** → chọn cluster → bấm **Connect**.
3. Chọn **Drivers** (hoặc **Connect your application**).
4. Copy chuỗi dạng:
   ```text
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Thay `<username>` và `<password>` bằng user database của bạn. Nếu mật khẩu có ký tự đặc biệt thì encode (ví dụ `@` → `%40`).

### Bước 2: Cấu hình và chạy

Trong thư mục **Backend_API**, tạo hoặc sửa file **`.env`**:

```env
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/SportsEcommerce?retryWrites=true&w=majority
MONGODB_DB_NAME=SportsEcommerce
```

Thay `USER`, `PASSWORD` và `cluster0.xxxxx.mongodb.net` bằng thông tin thật của bạn.

Chạy seed:

```bash
cd Backend_API
node scripts/seed-mongodb.js
```

Kết quả: toàn bộ collection được tạo và dữ liệu mẫu được thêm vào database **SportsEcommerce** trên Atlas.

---

## Cách 2: Dùng MongoDB Shell (mongosh)

Nếu bạn muốn dùng **câu lệnh MongoDB** trực tiếp (mongosh) để thêm dữ liệu vào Atlas:

### Bước 1: Cài MongoDB Shell (nếu chưa có)

- Tải: [MongoDB Shell (mongosh)](https://www.mongodb.com/try/download/shell)
- Hoặc: `winget install MongoDB.Shell` (Windows)

### Bước 2: Chạy script

Dùng connection string Atlas của bạn (đã thay username/password):

```bash
cd Backend_API/scripts
mongosh "mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/SportsEcommerce?retryWrites=true&w=majority" --file seed-atlas-mongosh.js
```

Script **seed-atlas-mongosh.js** chứa các lệnh MongoDB (insertMany, insertOne...) để tạo collection và thêm dữ liệu mẫu vào cloud.

**Lưu ý:** Script mongosh chỉ thêm dữ liệu tham chiếu + vài bản ghi mẫu (roles, categories, brands, 1 user admin). Để có **đủ** dữ liệu như Node (sản phẩm, đơn hàng, đặt sân...), nên dùng **Cách 1**.

---

## Mở khóa IP trên Atlas (nếu lỗi kết nối)

- Vào Atlas → **Network Access** → **Add IP Address**.
- Thêm IP máy bạn hoặc tạm thời chọn **Allow Access from Anywhere** (`0.0.0.0/0`) cho dev.

Sau khi chạy xong, có thể đăng nhập thử với:
- **Admin:** `admin@tdsport.id.vn` / `123456`
- **Khách:** `customer1@gmail.com` / `123456`
