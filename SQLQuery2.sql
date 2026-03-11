-- =============================================
-- CÂU L?NH INSERT D? LI?U THEO T?NG B?NG
-- Ch?y SAU khi ?ã t?o xong t?t c? b?ng (TABLES_BY_TABLE.sql)
-- =============================================
USE SportsEcommerce;
GO

-- =============================================
-- 1. ROLES
-- =============================================
IF NOT EXISTS (SELECT 1 FROM Roles)
INSERT INTO Roles (RoleName, Description) VALUES
(N'Admin', N'Qu?n tr? viên h? th?ng'),
(N'Staff', N'Nhân viên'),
(N'Customer', N'Khách hàng');

-- =============================================
-- 2. ORDERSTATUS
-- =============================================
IF NOT EXISTS (SELECT 1 FROM OrderStatus)
INSERT INTO OrderStatus (StatusName, Description, DisplayOrder) VALUES
(N'Ch? x? lý', N'??n hàng m?i ch? xác nh?n', 1),
(N'?ã xác nh?n', N'?ã xác nh?n ??n hàng', 2),
(N'?ang giao', N'?ang giao hàng', 3),
(N'Hoàn thành', N'Giao hàng thành công', 4),
(N'?ã h?y', N'??n hàng b? h?y', 5);

-- =============================================
-- 3. BOOKINGSTATUS
-- =============================================
IF NOT EXISTS (SELECT 1 FROM BookingStatus)
INSERT INTO BookingStatus (StatusName, Description, DisplayOrder) VALUES
(N'Ch? xác nh?n', N'??t sân ch? xác nh?n', 1),
(N'?ã xác nh?n', N'?ã xác nh?n ??t sân', 2),
(N'?ang s? d?ng', N'?ang s? d?ng sân', 3),
(N'Hoàn thành', N'?ã hoàn thành', 4),
(N'?ã h?y', N'?ã h?y ??t sân', 5);

-- =============================================
-- 4. PAYMENTMETHODS
-- =============================================
IF NOT EXISTS (SELECT 1 FROM PaymentMethods)
INSERT INTO PaymentMethods (MethodName, Description) VALUES
(N'Ti?n m?t', N'Thanh toán khi nh?n hàng (COD)'),
(N'VNPay', N'Thanh toán qua VNPay'),
(N'Momo', N'Thanh toán qua Ví Momo'),
(N'Chuy?n kho?n', N'Chuy?n kho?n ngân hàng');

-- =============================================
-- 5. SHIPPINGMETHODS
-- =============================================
IF NOT EXISTS (SELECT 1 FROM ShippingMethods)
INSERT INTO ShippingMethods (MethodName, Description, ShippingFee, EstimatedDays) VALUES
(N'Giao hàng tiêu chu?n', N'Giao trong 3-5 ngày', 30000, 4),
(N'Giao hàng nhanh', N'Giao trong 1-2 ngày', 50000, 2),
(N'Giao hàng h?a t?c', N'Giao trong 24h', 80000, 1);

-- =============================================
-- 6. COURTTYPES
-- =============================================
IF NOT EXISTS (SELECT 1 FROM CourtTypes)
INSERT INTO CourtTypes (TypeName, Description) VALUES
(N'Sân bóng chuy?n', N'Sân bóng chuy?n trong nhà và ngoài tr?i'),
(N'Sân Pickleball', N'Sân Pickleball tiêu chu?n');

-- =============================================
-- 7. CATEGORIES
-- =============================================
IF NOT EXISTS (SELECT 1 FROM Categories)
INSERT INTO Categories (CategoryName, CategorySlug, Description, DisplayOrder) VALUES
(N'Qu?n áo th? thao', 'quan-ao-the-thao', N'Qu?n áo t?p luy?n và thi ??u', 1),
(N'Giày th? thao', 'giay-the-thao', N'Giày ch?y b?, bóng ?á, bóng r?', 2),
(N'D?ng c? th? thao', 'dung-cu-the-thao', N'Bóng, v?t và d?ng c? t?p luy?n', 3),
(N'Ph? ki?n', 'phu-kien', N'Balo, g?ng tay, b?ng tay...', 4);

-- =============================================
-- 8. SUBCATEGORIES
-- =============================================
IF NOT EXISTS (SELECT 1 FROM SubCategories)
INSERT INTO SubCategories (CategoryID, SubCategoryName, SubCategorySlug, DisplayOrder) VALUES
(1, N'Áo th? thao', 'ao-the-thao', 1),
(1, N'Qu?n th? thao', 'quan-the-thao', 2),
(1, N'?? t?p gym', 'do-tap-gym', 3),
(1, N'?? yoga', 'do-yoga', 4),
(2, N'Giày ch?y b?', 'giay-chay-bo', 1),
(2, N'Giày bóng ?á', 'giay-bong-da', 2),
(2, N'Giày bóng r?', 'giay-bong-ro', 3),
(3, N'Bóng', 'bong', 1),
(3, N'V?t c?u lông', 'vot-cau-long', 2),
(3, N'V?t pickleball', 'vot-pickleball', 3),
(3, N'V?t tennis', 'vot-tennis', 4),
(4, N'Balo th? thao', 'balo-the-thao', 1),
(4, N'G?ng tay', 'gang-tay', 2),
(4, N'B?ng tay', 'bang-tay', 3),
(4, N'Bình n??c', 'binh-nuoc', 4);

-- =============================================
-- 9. BRANDS
-- =============================================
IF NOT EXISTS (SELECT 1 FROM Brands)
INSERT INTO Brands (BrandName, BrandSlug, Description) VALUES
(N'Nike', 'nike', N'Th??ng hi?u th? thao hàng ??u th? gi?i'),
(N'Adidas', 'adidas', N'Th??ng hi?u th? thao ??c'),
(N'Puma', 'puma', N'Th??ng hi?u th? thao cao c?p'),
(N'Mizuno', 'mizuno', N'Th??ng hi?u Nh?t B?n chuyên v? th? thao'),
(N'Kamito', 'kamito', N'Th??ng hi?u Vi?t Nam'),
(N'Li-Ning', 'li-ning', N'Th??ng hi?u Trung Qu?c');

-- =============================================
-- 10. COLORS
-- =============================================
IF NOT EXISTS (SELECT 1 FROM Colors)
INSERT INTO Colors (ColorName, ColorCode) VALUES
(N'?en', '#000000'),
(N'Tr?ng', '#FFFFFF'),
(N'??', '#FF0000'),
(N'Xanh d??ng', '#0000FF'),
(N'Xanh lá', '#00FF00'),
(N'Vàng', '#FFFF00'),
(N'H?ng', '#FFC0CB'),
(N'Cam', '#FFA500'),
(N'Xám', '#808080'),
(N'Nâu', '#A52A2A');

-- =============================================
-- 11. SIZES
-- =============================================
IF NOT EXISTS (SELECT 1 FROM Sizes)
INSERT INTO Sizes (SizeName, SizeOrder) VALUES
('XS', 1), ('S', 2), ('M', 3), ('L', 4), ('XL', 5), ('XXL', 6),
('35', 10), ('36', 11), ('37', 12), ('38', 13), ('39', 14),
('40', 15), ('41', 16), ('42', 17), ('43', 18), ('44', 19), ('45', 20);

-- =============================================
-- 12. TIMESLOTS
-- =============================================
IF NOT EXISTS (SELECT 1 FROM TimeSlots)
INSERT INTO TimeSlots (StartTime, EndTime, SlotName) VALUES
('06:00', '07:00', N'Sáng s?m'),
('07:00', '08:00', N'Sáng 1'),
('08:00', '09:00', N'Sáng 2'),
('09:00', '10:00', N'Sáng 3'),
('10:00', '11:00', N'Sáng 4'),
('14:00', '15:00', N'Chi?u 1'),
('15:00', '16:00', N'Chi?u 2'),
('16:00', '17:00', N'Chi?u 3'),
('17:00', '18:00', N'Chi?u 4'),
('18:00', '19:00', N'T?i 1'),
('19:00', '20:00', N'T?i 2'),
('20:00', '21:00', N'T?i 3'),
('21:00', '22:00', N'T?i 4');

-- =============================================
-- 13. TAXES
-- =============================================
IF NOT EXISTS (SELECT 1 FROM Taxes)
INSERT INTO Taxes (TaxName, TaxRate) VALUES
(N'VAT', 10.00);

-- =============================================
-- Ví d? INSERT USERS (c?n hash m?t kh?u th?t t? backend)
-- =============================================
-- INSERT INTO Users (Username, Email, PasswordHash, FullName) VALUES
-- (N'admin', 'admin@example.com', N'$2a$10$...', N'Qu?n tr? viên');

-- =============================================
-- Ví d? INSERT PRODUCTS (sau khi có SubCategories, Brands)
-- =============================================
-- INSERT INTO Products (ProductCode, ProductName, ProductSlug, SubCategoryID, BrandID, ShortDescription, IsActive, IsFeatured) VALUES
-- (N'SP001', N'Áo th? thao Nike', 'ao-the-thao-nike', 1, 1, N'Áo thun th? thao', 1, 1);

-- =============================================
-- Ví d? INSERT COURTS (sau khi có CourtTypes)
-- =============================================
-- INSERT INTO Courts (CourtTypeID, CourtName, CourtCode, Location, OpenTime, CloseTime) VALUES
-- (1, N'Sân A', 'SAN-A', N'Hà N?i', '06:00', '22:00');

GO
PRINT N'?ã chèn d? li?u m?u c? b?n.';
