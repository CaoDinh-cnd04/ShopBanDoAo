# Schema MongoDB (chuyển từ SportsEcommerce.sql + SQLQuery2.sql)

Tài liệu này mô tả cấu trúc collection MongoDB tương ứng với các bảng SQL.

## Quy ước

- **Tên collection:** camelCase (vd: `userRoles`, `productVariants`).
- **Tên trường:** camelCase (vd: `categoryId`, `productName`).
- **Khóa ngoại:** lưu dạng `ObjectId` (vd: `userId`, `productId`).
- **Ngày:** lưu kiểu `Date` (vd: `createdDate`, `orderDate`).

---

## Danh sách collection

| SQL Table           | MongoDB Collection  | Ghi chú                          |
|---------------------|---------------------|----------------------------------|
| Roles               | roles               |                                  |
| Users               | users               |                                  |
| UserRoles           | userRoles           | userId, roleId (ObjectId)        |
| UserAddresses       | userAddresses       | userId (ObjectId)                |
| Categories          | categories          |                                  |
| SubCategories       | subCategories       | categoryId (ObjectId)            |
| Brands              | brands              |                                  |
| Colors              | colors              |                                  |
| Sizes               | sizes               |                                  |
| Products            | products            | subCategoryId, brandId          |
| ProductVariants     | productVariants     | productId, sizeId, colorId      |
| ProductInventory    | productInventory    | variantId (ObjectId)             |
| ProductImages       | productImages       | productId (ObjectId)             |
| ProductReviews      | productReviews      | productId, userId               |
| Wishlists           | wishlists           | userId (ObjectId)               |
| WishlistItems       | wishlistItems       | wishlistId, productId           |
| Carts               | carts               | userId (ObjectId)               |
| CartItems           | cartItems           | cartId, variantId               |
| OrderStatus         | orderStatus         |                                  |
| ShippingMethods     | shippingMethods     |                                  |
| Taxes               | taxes               |                                  |
| Vouchers            | vouchers            |                                  |
| Orders              | orders              | userId, addressId, statusId, shippingMethodId, voucherId |
| OrderItems          | orderItems          | orderId, variantId             |
| PaymentMethods      | paymentMethods      |                                  |
| OrderPayments       | orderPayments       | orderId, paymentMethodId        |
| CourtTypes          | courtTypes          |                                  |
| Courts              | courts              | courtTypeId (ObjectId)          |
| TimeSlots           | timeSlots           |                                  |
| CourtPricing        | courtPricing        | courtId, timeSlotId             |
| CourtImages         | courtImages         | courtId (ObjectId)              |
| BookingStatus       | bookingStatus       |                                  |
| Bookings            | bookings            | userId, courtId, statusId        |
| BookingDetails      | bookingDetails      | bookingId, timeSlotId, pricingId |
| BookingPayments     | bookingPayments     | bookingId, paymentMethodId      |
| CourtReviews        | courtReviews        | courtId, userId, bookingId      |
| Notifications       | notifications       | userId (ObjectId)               |
| Promotions          | promotions          | (có trong SQL, chưa seed)       |
| PromotionProducts   | promotionProducts   | (có trong SQL, chưa seed)       |
| UserVouchers        | userVouchers         | (có trong SQL, chưa seed)       |
| AuditLogs           | auditLogs            | (có trong SQL, chưa seed)       |
| SystemSettings      | systemSettings      | (có trong SQL, chưa seed)       |
| Banners             | banners              | (có trong SQL, chưa seed)       |

---

## Chạy seed

```bash
cd Backend_API
# Cấu hình .env: MONGODB_URI=mongodb+srv://...
node scripts/seed-mongodb.js
```

Sau khi chạy:

- **Admin:** email `admin@tdsport.id.vn`, mật khẩu `123456`
- **Khách hàng:** `customer1@gmail.com` / `123456`
