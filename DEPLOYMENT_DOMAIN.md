# Đưa web lên tên miền TDSport.id.vn (PA Vietnam)

## 0. Đăng ký tên miền tại PA Vietnam (pavietnam.vn)

- Bạn đã chọn tên miền **TDSport.id.vn** (đuôi .id.vn dành cho cá nhân 18–23 tuổi).
- **Bước tiếp theo:** Bấm **"Xác thực"** và hoàn thành **eKYC** (xác thực thông tin cá nhân) để nhận tên miền miễn phí.
- Sau khi eKYC xong, bạn sẽ vào **bảng điều khiển quản lý tên miền** của PA Vietnam để cấu hình DNS và trỏ domain về hosting.

URL thực tế khi dùng trên trình duyệt thường là **tdsport.id.vn** (chữ thường).

---

## 1. Chuẩn bị

- Tên miền: **tdsport.id.vn** (sau khi đăng ký + eKYC xong tại pavietnam.vn).
- Bạn cần **hosting** cho 2 phần:
  - **Frontend** (React/Vite): trang chủ, giao diện người dùng.
  - **Backend API** (Node/Express): xử lý đăng nhập, đơn hàng, sản phẩm...

---

## 2. Cách bố trí phổ biến

| Thành phần | URL ví dụ | Ghi chú |
|------------|-----------|--------|
| Website (Frontend) | `https://tdsport.id.vn` hoặc `https://www.tdsport.id.vn` | Trang chủ, sản phẩm, giỏ hàng... |
| API (Backend) | `https://api.tdsport.id.vn` | Gọi từ frontend qua biến môi trường |

**Cách khác:** Có thể đặt cả frontend và backend trên cùng 1 domain (ví dụ `https://tdsport.id.vn` và `https://tdsport.id.vn/api`), tùy nhà cung cấp hosting.

---

## 3. Cấu hình DNS tại PA Vietnam

Sau khi có tên miền, đăng nhập **pavietnam.vn** → vào mục **Quản lý tên miền** / **DNS** cho **tdsport.id.vn**:

- **Nếu dùng subdomain `api`:**

  | Loại | Tên (Host) | Giá trị (Point to) |
  |------|------------|---------------------|
  | **A** hoặc **CNAME** | `@` | IP hoặc URL máy chủ chạy **frontend** (hoặc Vercel/Netlify) |
  | **A** hoặc **CNAME** | `www` | Cùng nơi host frontend (hoặc redirect về `@`) |
  | **A** hoặc **CNAME** | `api` | IP hoặc URL máy chủ chạy **backend** |

- **Ví dụ cụ thể:**
  - Frontend host trên **Vercel** → Vercel sẽ cho bạn domain dạng `xxx.vercel.app` → thêm bản ghi **CNAME** `@` và `www` trỏ tới `cname.vercel-dns.com` (theo hướng dẫn Vercel).
  - Backend host trên **Railway/Render** → họ cho URL dạng `your-app.up.railway.app` → thêm bản ghi **CNAME** `api` trỏ tới URL đó.

**Lưu ý:** Một số nhà cung cấp .id.vn có thể dùng giao diện DNS riêng (A record, CNAME). Làm theo hướng dẫn “Trỏ tên miền” / “DNS” trong tài khoản PA Vietnam.

Sau khi cấu hình DNS, đợi 5–30 phút (có thể vài giờ) để domain trỏ đúng.

---

## 4. Cấu hình Backend (API) cho domain mới

Trong **Backend_API**, tạo/sửa file **`.env`** (production):

```env
PORT=3000
NODE_ENV=production

# Database (dùng DB production thật)
DB_SERVER=your-db-server
DB_DATABASE=SportsEcommerce
DB_USER=your-user
DB_PASSWORD=your-password

# JWT (dùng secret mạnh, ≥ 32 ký tự)
JWT_SECRET=your-production-jwt-secret-at-least-32-chars
JWT_EXPIRE=7d

# Cho phép frontend gọi API từ domain của bạn (tên miền PA Vietnam)
ALLOWED_ORIGINS=https://tdsport.id.vn,https://www.tdsport.id.vn

# Firebase (nếu dùng đăng nhập Google)
# FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json
```

- **Quan trọng:** `ALLOWED_ORIGINS` phải chứa đúng URL mà người dùng mở web (ví dụ `https://tdsport.id.vn` và `https://www.tdsport.id.vn`). Thiếu là trình duyệt sẽ chặn gọi API.

---

## 5. Cấu hình Frontend (build production) cho domain mới

Frontend cần biết **địa chỉ API** khi chạy trên domain thật.

**Cách 1 – API ở subdomain `api.tdsport.id.vn`**

Trong **Fronted**, tạo file **`.env.production`** (chỉ dùng khi build production):

```env
VITE_API_BASE_URL=https://api.tdsport.id.vn/api
```

Các biến Firebase (nếu dùng) vẫn giữ trong `.env.production`:

```env
VITE_API_BASE_URL=https://api.tdsport.id.vn/api
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
# ... các key Firebase khác
```

**Cách 2 – API cùng domain (ví dụ `https://tdsport.id.vn/api`)**

Nếu bạn cấu hình server (Nginx/Reverse proxy) để:
- `https://tdsport.id.vn` → serve frontend (file tĩnh)
- `https://tdsport.id.vn/api` → proxy tới backend Node

thì có thể để:

```env
# Frontend và API cùng domain, không cần đổi khi đổi domain
VITE_API_BASE_URL=/api
```

Sau đó build:

```bash
cd Fronted
npm run build
```

Thư mục `dist/` là toàn bộ web tĩnh, đưa lên hosting (Vercel, Netlify, Nginx, etc.).

---

## 6. Bật HTTPS (SSL)

- **Vercel/Netlify/Railway/Render:** thường tự cấp SSL cho domain bạn thêm (Let's Encrypt).
- **VPS (tự cài Nginx + Node):** dùng Let's Encrypt (certbot) hoặc Cloudflare proxy (bật “Proxied” cho A/CNAME) để có HTTPS.

Trên production **luôn dùng `https://`** trong `ALLOWED_ORIGINS` và `VITE_API_BASE_URL`.

---

## 7. Tóm tắt nhanh

1. **PA Vietnam:** Hoàn thành eKYC để nhận tên miền **TDSport.id.vn** (dùng dạng **tdsport.id.vn** trong URL).
2. **DNS:** Trong bảng điều khiển PA Vietnam, trỏ `tdsport.id.vn` (và `www` nếu có) tới nơi host frontend; trỏ `api.tdsport.id.vn` tới nơi chạy backend (nếu tách subdomain).
3. **Backend:** Đặt `ALLOWED_ORIGINS=https://tdsport.id.vn,https://www.tdsport.id.vn` trong `.env` production.
4. **Frontend:** Đặt `VITE_API_BASE_URL=https://api.tdsport.id.vn/api` (hoặc `/api` nếu cùng domain) trong `.env.production`, rồi `npm run build` và deploy thư mục `dist/`.
5. **HTTPS:** Bật SSL cho cả domain chính và subdomain API.

Sau khi DNS và 2 bên (frontend + backend) đều dùng đúng URL domain, web sẽ chạy đúng trên **TDSport.id.vn** (pavietnam.vn).
