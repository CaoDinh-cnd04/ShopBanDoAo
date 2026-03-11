/**
 * Seed MongoDB - Chuyển từ SportsEcommerce.sql + SQLQuery2.sql
 * Chạy: node scripts/seed-mongodb.js
 * Cần: MONGODB_URI trong .env (hoặc mongodb://localhost:27017)
 */
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DB_NAME || 'SportsEcommerce';

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    const db = client.db(dbName);

    // Drop collections để seed từ đầu (bỏ dòng này nếu muốn giữ data)
    const collections = await db.listCollections().toArray();
    for (const c of collections) {
      await db.collection(c.name).drop().catch(() => {});
    }
    console.log('Dropped existing collections');

    const ids = {}; // lưu _id đã insert để dùng làm ref

    // ========== 1. ROLES ==========
    const roles = [
      { roleName: 'Admin', description: 'Quản trị viên hệ thống', isActive: true, createdDate: new Date() },
      { roleName: 'Staff', description: 'Nhân viên', isActive: true, createdDate: new Date() },
      { roleName: 'Customer', description: 'Khách hàng', isActive: true, createdDate: new Date() }
    ];
    const rolesResult = await db.collection('roles').insertMany(roles);
    ids.roleAdmin = rolesResult.insertedIds[0];
    ids.roleStaff = rolesResult.insertedIds[1];
    ids.roleCustomer = rolesResult.insertedIds[2];
    console.log('Inserted roles');

    // ========== 2. ORDER STATUS ==========
    const orderStatus = [
      { statusName: 'Chờ xử lý', description: 'Đơn hàng mới chờ xác nhận', displayOrder: 1 },
      { statusName: 'Đã xác nhận', description: 'Đã xác nhận đơn hàng', displayOrder: 2 },
      { statusName: 'Đang giao', description: 'Đang giao hàng', displayOrder: 3 },
      { statusName: 'Hoàn thành', description: 'Giao hàng thành công', displayOrder: 4 },
      { statusName: 'Đã hủy', description: 'Đơn hàng bị hủy', displayOrder: 5 }
    ];
    const osResult = await db.collection('orderStatus').insertMany(orderStatus);
    ids.orderStatusPending = osResult.insertedIds[0];
    ids.orderStatusConfirmed = osResult.insertedIds[1];
    ids.orderStatusShipping = osResult.insertedIds[2];
    ids.orderStatusDone = osResult.insertedIds[3];
    ids.orderStatusCancelled = osResult.insertedIds[4];
    console.log('Inserted orderStatus');

    // ========== 3. BOOKING STATUS ==========
    const bookingStatus = [
      { statusName: 'Chờ xác nhận', description: 'Đặt sân chờ xác nhận', displayOrder: 1 },
      { statusName: 'Đã xác nhận', description: 'Đã xác nhận đặt sân', displayOrder: 2 },
      { statusName: 'Đang sử dụng', description: 'Đang sử dụng sân', displayOrder: 3 },
      { statusName: 'Hoàn thành', description: 'Đã hoàn thành', displayOrder: 4 },
      { statusName: 'Đã hủy', description: 'Đã hủy đặt sân', displayOrder: 5 }
    ];
    const bsResult = await db.collection('bookingStatus').insertMany(bookingStatus);
    ids.bookingStatusPending = bsResult.insertedIds[0];
    ids.bookingStatusConfirmed = bsResult.insertedIds[1];
    ids.bookingStatusDone = bsResult.insertedIds[3];
    console.log('Inserted bookingStatus');

    // ========== 4. PAYMENT METHODS ==========
    const paymentMethods = [
      { methodName: 'Tiền mặt', description: 'Thanh toán khi nhận hàng (COD)', isActive: true },
      { methodName: 'VNPay', description: 'Thanh toán qua VNPay', isActive: true },
      { methodName: 'Momo', description: 'Thanh toán qua Ví Momo', isActive: true },
      { methodName: 'Chuyển khoản', description: 'Chuyển khoản ngân hàng', isActive: true }
    ];
    const pmResult = await db.collection('paymentMethods').insertMany(paymentMethods);
    ids.paymentMethod1 = pmResult.insertedIds[0];
    ids.paymentMethod2 = pmResult.insertedIds[1];
    console.log('Inserted paymentMethods');

    // ========== 5. SHIPPING METHODS ==========
    const shippingMethods = [
      { methodName: 'Giao hàng tiêu chuẩn', description: 'Giao trong 3-5 ngày', shippingFee: 30000, estimatedDays: 4, isActive: true },
      { methodName: 'Giao hàng nhanh', description: 'Giao trong 1-2 ngày', shippingFee: 50000, estimatedDays: 2, isActive: true },
      { methodName: 'Giao hàng hỏa tốc', description: 'Giao trong 24h', shippingFee: 80000, estimatedDays: 1, isActive: true }
    ];
    const smResult = await db.collection('shippingMethods').insertMany(shippingMethods);
    ids.shippingMethod1 = smResult.insertedIds[0];
    console.log('Inserted shippingMethods');

    // ========== 6. COURT TYPES ==========
    const courtTypes = [
      { typeName: 'Sân bóng chuyền', description: 'Sân bóng chuyền trong nhà và ngoài trời', isActive: true },
      { typeName: 'Sân Pickleball', description: 'Sân Pickleball tiêu chuẩn', isActive: true }
    ];
    const ctResult = await db.collection('courtTypes').insertMany(courtTypes);
    ids.courtType1 = ctResult.insertedIds[0];
    ids.courtType2 = ctResult.insertedIds[1];
    console.log('Inserted courtTypes');

    // ========== 7. TAXES ==========
    await db.collection('taxes').insertOne({ taxName: 'VAT', taxRate: 10, country: 'Việt Nam', isActive: true });
    console.log('Inserted taxes');

    // ========== 8. CATEGORIES ==========
    const categories = [
      { categoryName: 'Quần áo thể thao', categorySlug: 'quan-ao-the-thao', description: 'Quần áo tập luyện và thi đấu', displayOrder: 1, isActive: true, createdDate: new Date() },
      { categoryName: 'Giày thể thao', categorySlug: 'giay-the-thao', description: 'Giày chạy bộ, bóng đá, bóng rổ', displayOrder: 2, isActive: true, createdDate: new Date() },
      { categoryName: 'Dụng cụ thể thao', categorySlug: 'dung-cu-the-thao', description: 'Bóng, vợt và dụng cụ tập luyện', displayOrder: 3, isActive: true, createdDate: new Date() },
      { categoryName: 'Phụ kiện', categorySlug: 'phu-kien', description: 'Balo, găng tay, băng tay...', displayOrder: 4, isActive: true, createdDate: new Date() }
    ];
    const catResult = await db.collection('categories').insertMany(categories);
    ids.cat1 = catResult.insertedIds[0];
    ids.cat2 = catResult.insertedIds[1];
    ids.cat3 = catResult.insertedIds[2];
    ids.cat4 = catResult.insertedIds[3];
    console.log('Inserted categories');

    // ========== 9. SUBCATEGORIES ==========
    const subCategories = [
      { categoryId: ids.cat1, subCategoryName: 'Áo thể thao', subCategorySlug: 'ao-the-thao', displayOrder: 1, isActive: true, createdDate: new Date() },
      { categoryId: ids.cat1, subCategoryName: 'Quần thể thao', subCategorySlug: 'quan-the-thao', displayOrder: 2, isActive: true, createdDate: new Date() },
      { categoryId: ids.cat1, subCategoryName: 'Đồ tập gym', subCategorySlug: 'do-tap-gym', displayOrder: 3, isActive: true, createdDate: new Date() },
      { categoryId: ids.cat1, subCategoryName: 'Đồ yoga', subCategorySlug: 'do-yoga', displayOrder: 4, isActive: true, createdDate: new Date() },
      { categoryId: ids.cat2, subCategoryName: 'Giày chạy bộ', subCategorySlug: 'giay-chay-bo', displayOrder: 1, isActive: true, createdDate: new Date() },
      { categoryId: ids.cat2, subCategoryName: 'Giày bóng đá', subCategorySlug: 'giay-bong-da', displayOrder: 2, isActive: true, createdDate: new Date() },
      { categoryId: ids.cat2, subCategoryName: 'Giày bóng rổ', subCategorySlug: 'giay-bong-ro', displayOrder: 3, isActive: true, createdDate: new Date() },
      { categoryId: ids.cat3, subCategoryName: 'Bóng', subCategorySlug: 'bong', displayOrder: 1, isActive: true, createdDate: new Date() },
      { categoryId: ids.cat3, subCategoryName: 'Vợt cầu lông', subCategorySlug: 'vot-cau-long', displayOrder: 2, isActive: true, createdDate: new Date() },
      { categoryId: ids.cat3, subCategoryName: 'Vợt pickleball', subCategorySlug: 'vot-pickleball', displayOrder: 3, isActive: true, createdDate: new Date() },
      { categoryId: ids.cat3, subCategoryName: 'Vợt tennis', subCategorySlug: 'vot-tennis', displayOrder: 4, isActive: true, createdDate: new Date() },
      { categoryId: ids.cat4, subCategoryName: 'Balo thể thao', subCategorySlug: 'balo-the-thao', displayOrder: 1, isActive: true, createdDate: new Date() },
      { categoryId: ids.cat4, subCategoryName: 'Găng tay', subCategorySlug: 'gang-tay', displayOrder: 2, isActive: true, createdDate: new Date() },
      { categoryId: ids.cat4, subCategoryName: 'Băng tay', subCategorySlug: 'bang-tay', displayOrder: 3, isActive: true, createdDate: new Date() },
      { categoryId: ids.cat4, subCategoryName: 'Bình nước', subCategorySlug: 'binh-nuoc', displayOrder: 4, isActive: true, createdDate: new Date() }
    ];
    const subResult = await db.collection('subCategories').insertMany(subCategories);
    ids.subCat1 = subResult.insertedIds[0];  // Áo thể thao
    ids.subCat2 = subResult.insertedIds[1];
    ids.subCat5 = subResult.insertedIds[4];  // Giày chạy bộ
    ids.subCat8 = subResult.insertedIds[7];  // Bóng
    console.log('Inserted subCategories');

    // ========== 10. BRANDS ==========
    const brands = [
      { brandName: 'Nike', brandSlug: 'nike', description: 'Thương hiệu thể thao hàng đầu thế giới', isActive: true, createdDate: new Date() },
      { brandName: 'Adidas', brandSlug: 'adidas', description: 'Thương hiệu thể thao Đức', isActive: true, createdDate: new Date() },
      { brandName: 'Puma', brandSlug: 'puma', description: 'Thương hiệu thể thao cao cấp', isActive: true, createdDate: new Date() },
      { brandName: 'Mizuno', brandSlug: 'mizuno', description: 'Thương hiệu Nhật Bản chuyên về thể thao', isActive: true, createdDate: new Date() },
      { brandName: 'Kamito', brandSlug: 'kamito', description: 'Thương hiệu Việt Nam', isActive: true, createdDate: new Date() },
      { brandName: 'Li-Ning', brandSlug: 'li-ning', description: 'Thương hiệu Trung Quốc', isActive: true, createdDate: new Date() }
    ];
    const brandResult = await db.collection('brands').insertMany(brands);
    ids.brand1 = brandResult.insertedIds[0];
    ids.brand2 = brandResult.insertedIds[1];
    console.log('Inserted brands');

    // ========== 11. COLORS ==========
    const colors = [
      { colorName: 'Đen', colorCode: '#000000', isActive: true },
      { colorName: 'Trắng', colorCode: '#FFFFFF', isActive: true },
      { colorName: 'Đỏ', colorCode: '#FF0000', isActive: true },
      { colorName: 'Xanh dương', colorCode: '#0000FF', isActive: true },
      { colorName: 'Xanh lá', colorCode: '#00FF00', isActive: true },
      { colorName: 'Vàng', colorCode: '#FFFF00', isActive: true },
      { colorName: 'Hồng', colorCode: '#FFC0CB', isActive: true },
      { colorName: 'Cam', colorCode: '#FFA500', isActive: true },
      { colorName: 'Xám', colorCode: '#808080', isActive: true },
      { colorName: 'Nâu', colorCode: '#A52A2A', isActive: true }
    ];
    const colorResult = await db.collection('colors').insertMany(colors);
    ids.color1 = colorResult.insertedIds[0];
    ids.color2 = colorResult.insertedIds[1];
    ids.color3 = colorResult.insertedIds[2];
    console.log('Inserted colors');

    // ========== 12. SIZES ==========
    const sizes = [
      { sizeName: 'XS', sizeOrder: 1, isActive: true }, { sizeName: 'S', sizeOrder: 2, isActive: true },
      { sizeName: 'M', sizeOrder: 3, isActive: true }, { sizeName: 'L', sizeOrder: 4, isActive: true },
      { sizeName: 'XL', sizeOrder: 5, isActive: true }, { sizeName: 'XXL', sizeOrder: 6, isActive: true },
      { sizeName: '35', sizeOrder: 10, isActive: true }, { sizeName: '36', sizeOrder: 11, isActive: true },
      { sizeName: '37', sizeOrder: 12, isActive: true }, { sizeName: '38', sizeOrder: 13, isActive: true },
      { sizeName: '39', sizeOrder: 14, isActive: true }, { sizeName: '40', sizeOrder: 15, isActive: true },
      { sizeName: '41', sizeOrder: 16, isActive: true }, { sizeName: '42', sizeOrder: 17, isActive: true },
      { sizeName: '43', sizeOrder: 18, isActive: true }, { sizeName: '44', sizeOrder: 19, isActive: true },
      { sizeName: '45', sizeOrder: 20, isActive: true }
    ];
    const sizeResult = await db.collection('sizes').insertMany(sizes);
    ids.sizeS = sizeResult.insertedIds[1];
    ids.sizeM = sizeResult.insertedIds[2];
    ids.sizeL = sizeResult.insertedIds[3];
    ids.size42 = sizeResult.insertedIds[16];
    console.log('Inserted sizes');

    // ========== 13. TIME SLOTS ==========
    const timeSlots = [
      { startTime: '06:00', endTime: '07:00', slotName: 'Sáng sớm', isActive: true },
      { startTime: '07:00', endTime: '08:00', slotName: 'Sáng 1', isActive: true },
      { startTime: '08:00', endTime: '09:00', slotName: 'Sáng 2', isActive: true },
      { startTime: '09:00', endTime: '10:00', slotName: 'Sáng 3', isActive: true },
      { startTime: '10:00', endTime: '11:00', slotName: 'Sáng 4', isActive: true },
      { startTime: '14:00', endTime: '15:00', slotName: 'Chiều 1', isActive: true },
      { startTime: '15:00', endTime: '16:00', slotName: 'Chiều 2', isActive: true },
      { startTime: '16:00', endTime: '17:00', slotName: 'Chiều 3', isActive: true },
      { startTime: '17:00', endTime: '18:00', slotName: 'Chiều 4', isActive: true },
      { startTime: '18:00', endTime: '19:00', slotName: 'Tối 1', isActive: true },
      { startTime: '19:00', endTime: '20:00', slotName: 'Tối 2', isActive: true },
      { startTime: '20:00', endTime: '21:00', slotName: 'Tối 3', isActive: true },
      { startTime: '21:00', endTime: '22:00', slotName: 'Tối 4', isActive: true }
    ];
    const tsResult = await db.collection('timeSlots').insertMany(timeSlots);
    ids.timeSlot1 = tsResult.insertedIds[0];
    ids.timeSlot2 = tsResult.insertedIds[1];
    ids.timeSlot10 = tsResult.insertedIds[9];
    console.log('Inserted timeSlots');

    // ========== 14. USERS (admin + customer) ==========
    const passwordHash = bcrypt.hashSync('123456', 10); // mật khẩu mẫu: 123456
    const users = [
      { username: 'admin', email: 'admin@tdsport.id.vn', passwordHash, fullName: 'Quản trị viên', phoneNumber: '0901234567', isActive: true, isEmailVerified: true, createdDate: new Date(), lastLoginDate: null },
      { username: 'customer1', email: 'customer1@gmail.com', passwordHash, fullName: 'Nguyễn Văn A', phoneNumber: '0912345678', isActive: true, isEmailVerified: true, createdDate: new Date(), lastLoginDate: null },
      { username: 'customer2', email: 'customer2@gmail.com', passwordHash, fullName: 'Trần Thị B', phoneNumber: '0923456789', isActive: true, isEmailVerified: false, createdDate: new Date(), lastLoginDate: null }
    ];
    const userResult = await db.collection('users').insertMany(users);
    ids.userAdmin = userResult.insertedIds[0];
    ids.user1 = userResult.insertedIds[1];
    ids.user2 = userResult.insertedIds[2];
    console.log('Inserted users');

    // ========== 15. USER ROLES ==========
    await db.collection('userRoles').insertMany([
      { userId: ids.userAdmin, roleId: ids.roleAdmin, assignedDate: new Date() },
      { userId: ids.user1, roleId: ids.roleCustomer, assignedDate: new Date() },
      { userId: ids.user2, roleId: ids.roleCustomer, assignedDate: new Date() }
    ]);
    console.log('Inserted userRoles');

    // ========== 16. USER ADDRESSES ==========
    await db.collection('userAddresses').insertMany([
      { userId: ids.user1, receiverName: 'Nguyễn Văn A', receiverPhone: '0912345678', addressLine: '123 Đường ABC', ward: 'Phường 1', district: 'Quận 1', city: 'TP. Hồ Chí Minh', isDefault: true, createdDate: new Date() },
      { userId: ids.user2, receiverName: 'Trần Thị B', receiverPhone: '0923456789', addressLine: '456 Đường XYZ', ward: 'Phường 2', district: 'Quận 7', city: 'TP. Hồ Chí Minh', isDefault: true, createdDate: new Date() }
    ]);
    const addrResult = await db.collection('userAddresses').find({ userId: ids.user1 }).toArray();
    ids.address1 = addrResult[0]._id;
    console.log('Inserted userAddresses');

    // ========== 17. PRODUCTS ==========
    const products = [
      { productCode: 'SP001', productName: 'Áo thể thao Nike Pro', productSlug: 'ao-the-thao-nike-pro', subCategoryId: ids.subCat1, brandId: ids.brand1, shortDescription: 'Áo thun thấm mồ hôi', description: 'Áo thun thể thao Nike Pro, chất liệu thoáng mát, phù hợp chạy bộ và gym.', material: 'Polyester', origin: 'Việt Nam', isActive: true, isFeatured: true, isNewArrival: true, viewCount: 0, avgRating: null, reviewCount: 0, createdDate: new Date(), updatedDate: new Date() },
      { productCode: 'SP002', productName: 'Giày chạy bộ Adidas Ultraboost', productSlug: 'giay-chay-bo-adidas-ultraboost', subCategoryId: ids.subCat5, brandId: ids.brand2, shortDescription: 'Giày chạy bộ êm ái', description: 'Giày chạy bộ Adidas Ultraboost, đế Boost êm ái, ôm chân.', material: 'Mesh, Boost', origin: 'Indonesia', isActive: true, isFeatured: true, isNewArrival: false, viewCount: 0, avgRating: 4.5, reviewCount: 12, createdDate: new Date(), updatedDate: new Date() },
      { productCode: 'SP003', productName: 'Bóng đá số 5 Nike', productSlug: 'bong-da-so-5-nike', subCategoryId: ids.subCat8, brandId: ids.brand1, shortDescription: 'Bóng đá chính hãng', description: 'Bóng đá size 5 Nike, bề mặt PU, bền bỉ.', material: 'PU', origin: 'Pakistan', isActive: true, isFeatured: false, isNewArrival: true, viewCount: 0, avgRating: null, reviewCount: 0, createdDate: new Date(), updatedDate: new Date() },
      { productCode: 'SP004', productName: 'Áo thể thao Puma', productSlug: 'ao-the-thao-puma', subCategoryId: ids.subCat1, brandId: brandResult.insertedIds[2], shortDescription: 'Áo Puma thoáng mát', description: 'Áo thể thao Puma form rộng, thoải mái.', material: 'Cotton', origin: 'Việt Nam', isActive: true, isFeatured: false, isNewArrival: false, viewCount: 0, avgRating: 4.0, reviewCount: 5, createdDate: new Date(), updatedDate: new Date() },
      { productCode: 'SP005', productName: 'Quần short thể thao Nike', productSlug: 'quan-short-the-thao-nike', subCategoryId: ids.subCat2, brandId: ids.brand1, shortDescription: 'Quần short tập gym', description: 'Quần short Nike Dri-FIT, nhẹ thoáng.', material: 'Polyester', origin: 'Việt Nam', isActive: true, isFeatured: true, isNewArrival: false, viewCount: 0, avgRating: null, reviewCount: 0, createdDate: new Date(), updatedDate: new Date() }
    ];
    const prodResult = await db.collection('products').insertMany(products);
    ids.product1 = prodResult.insertedIds[0];
    ids.product2 = prodResult.insertedIds[1];
    ids.product3 = prodResult.insertedIds[2];
    ids.product4 = prodResult.insertedIds[3];
    ids.product5 = prodResult.insertedIds[4];
    console.log('Inserted products');

    // ========== 18. PRODUCT VARIANTS (size + color + giá) ==========
    const variants = [
      { productId: ids.product1, sizeId: ids.sizeS, colorId: ids.color1, sku: 'SP001-S-DEN', originalPrice: 299000, salePrice: 249000, currencyCode: 'VND', isActive: true, createdDate: new Date() },
      { productId: ids.product1, sizeId: ids.sizeM, colorId: ids.color1, sku: 'SP001-M-DEN', originalPrice: 299000, salePrice: 249000, currencyCode: 'VND', isActive: true, createdDate: new Date() },
      { productId: ids.product1, sizeId: ids.sizeL, colorId: ids.color2, sku: 'SP001-L-TRANG', originalPrice: 299000, salePrice: null, currencyCode: 'VND', isActive: true, createdDate: new Date() },
      { productId: ids.product2, sizeId: ids.size42, colorId: ids.color1, sku: 'SP002-42-DEN', originalPrice: 3590000, salePrice: 3190000, currencyCode: 'VND', isActive: true, createdDate: new Date() },
      { productId: ids.product2, sizeId: ids.size42, colorId: ids.color3, sku: 'SP002-42-DO', originalPrice: 3590000, salePrice: 3190000, currencyCode: 'VND', isActive: true, createdDate: new Date() },
      { productId: ids.product3, sizeId: ids.sizeM, colorId: ids.color3, sku: 'SP003-M-DO', originalPrice: 450000, salePrice: 399000, currencyCode: 'VND', isActive: true, createdDate: new Date() },
      { productId: ids.product4, sizeId: ids.sizeM, colorId: ids.color2, sku: 'SP004-M-TRANG', originalPrice: 350000, salePrice: null, currencyCode: 'VND', isActive: true, createdDate: new Date() },
      { productId: ids.product5, sizeId: ids.sizeL, colorId: ids.color1, sku: 'SP005-L-DEN', originalPrice: 399000, salePrice: 349000, currencyCode: 'VND', isActive: true, createdDate: new Date() }
    ];
    const varResult = await db.collection('productVariants').insertMany(variants);
    ids.variant1 = varResult.insertedIds[0];
    ids.variant2 = varResult.insertedIds[1];
    ids.variant4 = varResult.insertedIds[3];
    ids.variant6 = varResult.insertedIds[5];
    console.log('Inserted productVariants');

    // ========== 19. PRODUCT INVENTORY ==========
    const inventories = [
      { variantId: ids.variant1, stockQuantity: 50, reorderLevel: 10, updatedDate: new Date() },
      { variantId: ids.variant2, stockQuantity: 30, reorderLevel: 10, updatedDate: new Date() },
      { variantId: varResult.insertedIds[2], stockQuantity: 20, reorderLevel: 10, updatedDate: new Date() },
      { variantId: ids.variant4, stockQuantity: 15, reorderLevel: 5, updatedDate: new Date() },
      { variantId: varResult.insertedIds[4], stockQuantity: 12, reorderLevel: 5, updatedDate: new Date() },
      { variantId: ids.variant6, stockQuantity: 40, reorderLevel: 10, updatedDate: new Date() },
      { variantId: varResult.insertedIds[6], stockQuantity: 25, reorderLevel: 10, updatedDate: new Date() },
      { variantId: varResult.insertedIds[7], stockQuantity: 18, reorderLevel: 10, updatedDate: new Date() }
    ];
    await db.collection('productInventory').insertMany(inventories);
    console.log('Inserted productInventory');

    // ========== 20. PRODUCT IMAGES ==========
    await db.collection('productImages').insertMany([
      { productId: ids.product1, imageUrl: '/uploads/products/ao-nike-1.jpg', altText: 'Áo Nike Pro', displayOrder: 0, isPrimary: true, createdDate: new Date() },
      { productId: ids.product2, imageUrl: '/uploads/products/giay-adidas-1.jpg', altText: 'Giày Adidas Ultraboost', displayOrder: 0, isPrimary: true, createdDate: new Date() },
      { productId: ids.product3, imageUrl: '/uploads/products/bong-nike-1.jpg', altText: 'Bóng đá Nike', displayOrder: 0, isPrimary: true, createdDate: new Date() }
    ]);
    console.log('Inserted productImages');

    // ========== 21. VOUCHERS ==========
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 2);
    const vouchers = [
      { voucherCode: 'GIAM10', voucherName: 'Giảm 10% đơn hàng', description: 'Áp dụng cho đơn từ 500k', discountType: 'Phần trăm', discountValue: 10, maxDiscountAmount: 100000, minOrderAmount: 500000, usageLimit: 100, usedCount: 0, startDate, endDate, isActive: true, createdDate: new Date() },
      { voucherCode: 'FREESHIP', voucherName: 'Miễn phí ship', description: 'Đơn từ 300k', discountType: 'Số tiền', discountValue: 30000, maxDiscountAmount: 30000, minOrderAmount: 300000, usageLimit: 50, usedCount: 0, startDate, endDate, isActive: true, createdDate: new Date() }
    ];
    await db.collection('vouchers').insertMany(vouchers);
    const voucherList = await db.collection('vouchers').find({}).toArray();
    ids.voucher1 = voucherList[0]._id;
    console.log('Inserted vouchers');

    // ========== 22. COURTS ==========
    const courts = [
      { courtTypeId: ids.courtType1, courtName: 'Sân bóng chuyền A', courtCode: 'SAN-BC-A', location: 'Quận 1', address: '123 Nguyễn Huệ, Q.1, TP.HCM', description: 'Sân bóng chuyền trong nhà, máy lạnh', facilities: 'Phòng thay đồ, nước uống', capacity: 14, openTime: '06:00', closeTime: '22:00', avgRating: 4.5, reviewCount: 20, isActive: true, createdDate: new Date() },
      { courtTypeId: ids.courtType1, courtName: 'Sân bóng chuyền B', courtCode: 'SAN-BC-B', location: 'Quận 7', address: '456 Nguyễn Lương Bằng, Q.7', description: 'Sân ngoài trời', facilities: 'Bãi xe', capacity: 14, openTime: '06:00', closeTime: '22:00', avgRating: 4.2, reviewCount: 15, isActive: true, createdDate: new Date() },
      { courtTypeId: ids.courtType2, courtName: 'Sân Pickleball 1', courtCode: 'SAN-PB-1', location: 'Quận 3', address: '789 Lê Lợi, Q.3', description: 'Sân Pickleball tiêu chuẩn', facilities: 'Vợt thuê, bóng', capacity: 8, openTime: '07:00', closeTime: '21:00', avgRating: null, reviewCount: 0, isActive: true, createdDate: new Date() }
    ];
    const courtResult = await db.collection('courts').insertMany(courts);
    ids.court1 = courtResult.insertedIds[0];
    ids.court2 = courtResult.insertedIds[1];
    ids.court3 = courtResult.insertedIds[2];
    console.log('Inserted courts');

    // ========== 23. COURT PRICING (giá theo sân + khung giờ + thứ) ==========
    const effectiveDate = new Date();
    const courtPricing = [
      { courtId: ids.court1, timeSlotId: ids.timeSlot10, dayOfWeek: 1, price: 200000, currencyCode: 'VND', effectiveDate, isActive: true },
      { courtId: ids.court1, timeSlotId: ids.timeSlot10, dayOfWeek: 6, price: 250000, currencyCode: 'VND', effectiveDate, isActive: true },
      { courtId: ids.court2, timeSlotId: ids.timeSlot1, dayOfWeek: 0, price: 150000, currencyCode: 'VND', effectiveDate, isActive: true },
      { courtId: ids.court3, timeSlotId: ids.timeSlot2, dayOfWeek: 2, price: 180000, currencyCode: 'VND', effectiveDate, isActive: true }
    ];
    const cpResult = await db.collection('courtPricing').insertMany(courtPricing);
    ids.pricing1 = cpResult.insertedIds[0];
    console.log('Inserted courtPricing');

    // ========== 24. WISHLISTS ==========
    await db.collection('wishlists').insertMany([
      { userId: ids.user1, createdDate: new Date(), updatedDate: new Date() },
      { userId: ids.user2, createdDate: new Date(), updatedDate: new Date() }
    ]);
    const wishResult = await db.collection('wishlists').find({ userId: ids.user1 }).toArray();
    ids.wishlist1 = wishResult[0]._id;
    console.log('Inserted wishlists');

    // ========== 25. WISHLIST ITEMS ==========
    await db.collection('wishlistItems').insertMany([
      { wishlistId: ids.wishlist1, productId: ids.product2, addedDate: new Date() },
      { wishlistId: ids.wishlist1, productId: ids.product3, addedDate: new Date() }
    ]);
    console.log('Inserted wishlistItems');

    // ========== 26. CARTS ==========
    await db.collection('carts').insertOne({ userId: ids.user1, createdDate: new Date(), updatedDate: new Date() });
    const cartDoc = await db.collection('carts').findOne({ userId: ids.user1 });
    ids.cart1 = cartDoc._id;
    console.log('Inserted carts');

    // ========== 27. CART ITEMS ==========
    await db.collection('cartItems').insertMany([
      { cartId: ids.cart1, variantId: ids.variant1, quantity: 2, addedDate: new Date() },
      { cartId: ids.cart1, variantId: ids.variant4, quantity: 1, addedDate: new Date() }
    ]);
    console.log('Inserted cartItems');

    // ========== 28. ORDERS (mẫu) ==========
    const orderCode = 'ORD' + Date.now();
    const subTotal = 498000 + 3190000; // 2 áo + 1 giày
    const taxAmount = Math.round(subTotal * 0.1);
    const totalAmount = subTotal + 30000 + taxAmount;
    const orders = [
      { orderCode, userId: ids.user1, addressId: ids.address1, statusId: ids.orderStatusDone, shippingMethodId: ids.shippingMethod1, voucherId: null, subTotal, discountAmount: 0, shippingFee: 30000, taxAmount, totalAmount, currencyCode: 'VND', note: '', orderDate: new Date(), updatedDate: new Date() }
    ];
    const orderResult = await db.collection('orders').insertMany(orders);
    ids.order1 = orderResult.insertedIds[0];
    console.log('Inserted orders');

    // ========== 29. ORDER ITEMS ==========
    await db.collection('orderItems').insertMany([
      { orderId: ids.order1, variantId: ids.variant1, productName: 'Áo thể thao Nike Pro', sizeName: 'S', colorName: 'Đen', quantity: 2, unitPrice: 249000, totalPrice: 498000 },
      { orderId: ids.order1, variantId: ids.variant4, productName: 'Giày chạy bộ Adidas Ultraboost', sizeName: '42', colorName: 'Đen', quantity: 1, unitPrice: 3190000, totalPrice: 3190000 }
    ]);
    console.log('Inserted orderItems');

    // ========== 30. BOOKINGS (mẫu) ==========
    const bookingDate = new Date();
    bookingDate.setDate(bookingDate.getDate() + 3);
    const bookings = [
      { bookingCode: 'BK' + Date.now(), userId: ids.user1, courtId: ids.court1, statusId: ids.bookingStatusConfirmed, bookingDate, discountAmount: 0, taxAmount: 0, totalAmount: 200000, currencyCode: 'VND', note: '', createdDate: new Date(), updatedDate: new Date() }
    ];
    const bookResult = await db.collection('bookings').insertMany(bookings);
    ids.booking1 = bookResult.insertedIds[0];
    console.log('Inserted bookings');

    // ========== 31. BOOKING DETAILS ==========
    await db.collection('bookingDetails').insertMany([
      { bookingId: ids.booking1, timeSlotId: ids.timeSlot10, pricingId: ids.pricing1, price: 200000 }
    ]);
    console.log('Inserted bookingDetails');

    // ========== 32. NOTIFICATIONS ==========
    await db.collection('notifications').insertMany([
      { userId: ids.user1, title: 'Đơn hàng đã giao', content: 'Đơn hàng ' + orderCode + ' đã được giao thành công.', notificationType: 'order', referenceId: ids.order1.toString(), isRead: false, createdDate: new Date() },
      { userId: ids.user1, title: 'Đặt sân đã xác nhận', content: 'Đặt sân của bạn đã được xác nhận.', notificationType: 'booking', referenceId: ids.booking1.toString(), isRead: true, createdDate: new Date() }
    ]);
    console.log('Inserted notifications');

    // ========== 33. PRODUCT REVIEWS (mẫu) ==========
    await db.collection('productReviews').insertMany([
      { productId: ids.product1, userId: ids.user1, rating: 5, reviewTitle: 'Áo rất đẹp', reviewContent: 'Chất liệu tốt, mặc thoáng.', isVerifiedPurchase: true, isApproved: true, createdDate: new Date(), updatedDate: new Date() },
      { productId: ids.product2, userId: ids.user1, rating: 4, reviewTitle: 'Giày êm', reviewContent: 'Chạy bộ rất êm chân.', isVerifiedPurchase: true, isApproved: true, createdDate: new Date(), updatedDate: new Date() }
    ]);
    console.log('Inserted productReviews');

    // ========== INDEXES (tương đương SQL indexes) ==========
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ username: 1 }, { unique: true });
    await db.collection('products').createIndex({ productSlug: 1 }, { unique: true });
    await db.collection('products').createIndex({ subCategoryId: 1 });
    await db.collection('products').createIndex({ brandId: 1 });
    await db.collection('orders').createIndex({ userId: 1, orderDate: -1 });
    await db.collection('orders').createIndex({ orderCode: 1 }, { unique: true });
    await db.collection('bookings').createIndex({ userId: 1, bookingDate: -1 });
    await db.collection('bookings').createIndex({ bookingCode: 1 }, { unique: true });
    await db.collection('notifications').createIndex({ userId: 1, isRead: 1 });
    console.log('Created indexes');

    console.log('\n✅ Seed MongoDB hoàn tất!');
    console.log('   - Đăng nhập admin: admin@tdsport.id.vn / 123456');
    console.log('   - Khách hàng: customer1@gmail.com / 123456');
  } catch (err) {
    console.error('Seed error:', err);
    throw err;
  } finally {
    await client.close();
  }
}

run();
