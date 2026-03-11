-- =============================================
-- HỆ THỐNG E-COMMERCE THỂ THAO & ĐẶT SÂN
-- SQL Server Database Design - Phiên bản Hoàn Chỉnh (Không lỗi)
-- =============================================
USE master;
GO

-- Tạo database
IF DB_ID('SportsEcommerce') IS NOT NULL
    DROP DATABASE SportsEcommerce;
GO

CREATE DATABASE SportsEcommerce;
GO

USE SportsEcommerce;
GO

-- =============================================
-- A. QUẢN LÝ NGƯỜI DÙNG & PHÂN QUYỀN
-- =============================================
CREATE TABLE Roles (
    RoleID INT IDENTITY(1,1) PRIMARY KEY,
    RoleName NVARCHAR(50) NOT NULL UNIQUE,
    Description NVARCHAR(255),
    CreatedDate DATETIME DEFAULT GETDATE(),
    IsActive BIT DEFAULT 1
);

CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(50) NOT NULL UNIQUE,
    Email NVARCHAR(100) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    FullName NVARCHAR(100) NOT NULL,
    PhoneNumber NVARCHAR(20),
    Avatar NVARCHAR(500),
    DateOfBirth DATE,
    Gender NVARCHAR(10) CHECK (Gender IN (N'Nam', N'Nữ', N'Khác')),
    Bio NVARCHAR(500),
    FacebookLink NVARCHAR(255),
    InstagramLink NVARCHAR(255),
    FavoriteSports NVARCHAR(255),
    CreatedDate DATETIME DEFAULT GETDATE(),
    LastLoginDate DATETIME,
    IsActive BIT DEFAULT 1,
    IsEmailVerified BIT DEFAULT 0,
    IsPhoneVerified BIT DEFAULT 0
);

CREATE TABLE UserRoles (
    UserRoleID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    RoleID INT NOT NULL,
    AssignedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    FOREIGN KEY (RoleID) REFERENCES Roles(RoleID) ON DELETE CASCADE,
    UNIQUE(UserID, RoleID)
);

CREATE TABLE UserAddresses (
    AddressID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    ReceiverName NVARCHAR(100) NOT NULL,
    ReceiverPhone NVARCHAR(20) NOT NULL,
    AddressLine NVARCHAR(255) NOT NULL,
    Ward NVARCHAR(100),
    District NVARCHAR(100) NOT NULL,
    City NVARCHAR(100) NOT NULL,
    IsDefault BIT DEFAULT 0,
    CreatedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);

-- =============================================
-- B. QUẢN LÝ SẢN PHẨM
-- =============================================
CREATE TABLE Categories (
    CategoryID INT IDENTITY(1,1) PRIMARY KEY,
    CategoryName NVARCHAR(100) NOT NULL UNIQUE,
    CategorySlug NVARCHAR(100) NOT NULL UNIQUE,
    Description NVARCHAR(500),
    ImageUrl NVARCHAR(500),
    DisplayOrder INT DEFAULT 0,
    IsActive BIT DEFAULT 1,
    CreatedDate DATETIME DEFAULT GETDATE()
);

CREATE TABLE SubCategories (
    SubCategoryID INT IDENTITY(1,1) PRIMARY KEY,
    CategoryID INT NOT NULL,
    SubCategoryName NVARCHAR(100) NOT NULL,
    SubCategorySlug NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500),
    DisplayOrder INT DEFAULT 0,
    IsActive BIT DEFAULT 1,
    CreatedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID),
    UNIQUE(CategoryID, SubCategoryName)
);

CREATE TABLE Brands (
    BrandID INT IDENTITY(1,1) PRIMARY KEY,
    BrandName NVARCHAR(100) NOT NULL UNIQUE,
    BrandSlug NVARCHAR(100) NOT NULL UNIQUE,
    LogoUrl NVARCHAR(500),
    Description NVARCHAR(500),
    Website NVARCHAR(255),
    IsActive BIT DEFAULT 1,
    CreatedDate DATETIME DEFAULT GETDATE()
);

CREATE TABLE Colors (
    ColorID INT IDENTITY(1,1) PRIMARY KEY,
    ColorName NVARCHAR(50) NOT NULL UNIQUE,
    ColorCode NVARCHAR(20),
    IsActive BIT DEFAULT 1
);

CREATE TABLE Sizes (
    SizeID INT IDENTITY(1,1) PRIMARY KEY,
    SizeName NVARCHAR(20) NOT NULL UNIQUE,
    SizeOrder INT DEFAULT 0,
    IsActive BIT DEFAULT 1
);

CREATE TABLE Products (
    ProductID INT IDENTITY(1,1) PRIMARY KEY,
    ProductCode NVARCHAR(50) NOT NULL UNIQUE,
    ProductName NVARCHAR(255) NOT NULL,
    ProductSlug NVARCHAR(255) NOT NULL UNIQUE,
    SubCategoryID INT NOT NULL,
    BrandID INT NOT NULL,
    Description NVARCHAR(MAX),
    ShortDescription NVARCHAR(500),
    Material NVARCHAR(255),
    Origin NVARCHAR(100),
    Weight DECIMAL(10,2),
    IsActive BIT DEFAULT 1,
    IsFeatured BIT DEFAULT 0,
    IsNewArrival BIT DEFAULT 0,
    ViewCount INT DEFAULT 0,
    AvgRating DECIMAL(3,2) NULL,
    ReviewCount INT DEFAULT 0,
    CreatedDate DATETIME DEFAULT GETDATE(),
    UpdatedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (SubCategoryID) REFERENCES SubCategories(SubCategoryID),
    FOREIGN KEY (BrandID) REFERENCES Brands(BrandID)
);

CREATE TABLE ProductVariants (
    VariantID INT IDENTITY(1,1) PRIMARY KEY,
    ProductID INT NOT NULL,
    SizeID INT NOT NULL,
    ColorID INT NOT NULL,
    SKU NVARCHAR(100) NOT NULL UNIQUE,
    OriginalPrice DECIMAL(18,2) NOT NULL CHECK (OriginalPrice >= 0),
    SalePrice DECIMAL(18,2) CHECK (SalePrice >= 0),
    CurrencyCode NVARCHAR(3) NOT NULL DEFAULT 'VND',
    IsActive BIT DEFAULT 1,
    CreatedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE,
    FOREIGN KEY (SizeID) REFERENCES Sizes(SizeID),
    FOREIGN KEY (ColorID) REFERENCES Colors(ColorID),
    UNIQUE(ProductID, SizeID, ColorID)
);

CREATE TABLE ProductInventory (
    InventoryID INT IDENTITY(1,1) PRIMARY KEY,
    VariantID INT NOT NULL UNIQUE,
    StockQuantity INT NOT NULL DEFAULT 0 CHECK (StockQuantity >= 0),
    ReorderLevel INT DEFAULT 10,
    LastRestockDate DATETIME,
    UpdatedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (VariantID) REFERENCES ProductVariants(VariantID) ON DELETE CASCADE
);

CREATE TABLE ProductImages (
    ImageID INT IDENTITY(1,1) PRIMARY KEY,
    ProductID INT NOT NULL,
    ImageUrl NVARCHAR(500) NOT NULL,
    AltText NVARCHAR(255),
    DisplayOrder INT DEFAULT 0,
    IsPrimary BIT DEFAULT 0,
    CreatedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE
);

CREATE TABLE ProductReviews (
    ReviewID INT IDENTITY(1,1) PRIMARY KEY,
    ProductID INT NOT NULL,
    UserID INT NOT NULL,
    Rating INT NOT NULL CHECK (Rating BETWEEN 1 AND 5),
    ReviewTitle NVARCHAR(255),
    ReviewContent NVARCHAR(MAX),
    IsVerifiedPurchase BIT DEFAULT 0,
    IsApproved BIT DEFAULT 0,
    CreatedDate DATETIME DEFAULT GETDATE(),
    UpdatedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE,
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

CREATE TABLE Wishlists (
    WishlistID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL UNIQUE,
    CreatedDate DATETIME DEFAULT GETDATE(),
    UpdatedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);

CREATE TABLE WishlistItems (
    WishlistItemID INT IDENTITY(1,1) PRIMARY KEY,
    WishlistID INT NOT NULL,
    ProductID INT NOT NULL,
    AddedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (WishlistID) REFERENCES Wishlists(WishlistID) ON DELETE CASCADE,
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID),
    UNIQUE(WishlistID, ProductID)
);

-- =============================================
-- C. GIỎ HÀNG & ĐƠN HÀNG
-- =============================================
CREATE TABLE Carts (
    CartID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL UNIQUE,
    CreatedDate DATETIME DEFAULT GETDATE(),
    UpdatedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);

CREATE TABLE CartItems (
    CartItemID INT IDENTITY(1,1) PRIMARY KEY,
    CartID INT NOT NULL,
    VariantID INT NOT NULL,
    Quantity INT NOT NULL DEFAULT 1 CHECK (Quantity > 0),
    AddedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (CartID) REFERENCES Carts(CartID) ON DELETE CASCADE,
    FOREIGN KEY (VariantID) REFERENCES ProductVariants(VariantID),
    UNIQUE(CartID, VariantID)
);

CREATE TABLE OrderStatus (
    StatusID INT IDENTITY(1,1) PRIMARY KEY,
    StatusName NVARCHAR(50) NOT NULL UNIQUE,
    Description NVARCHAR(255),
    DisplayOrder INT DEFAULT 0
);

CREATE TABLE ShippingMethods (
    ShippingMethodID INT IDENTITY(1,1) PRIMARY KEY,
    MethodName NVARCHAR(100) NOT NULL UNIQUE,
    Description NVARCHAR(255),
    ShippingFee DECIMAL(18,2) DEFAULT 0,
    EstimatedDays INT,
    IsActive BIT DEFAULT 1
);

CREATE TABLE Taxes (
    TaxID INT IDENTITY(1,1) PRIMARY KEY,
    TaxName NVARCHAR(100) NOT NULL UNIQUE,
    TaxRate DECIMAL(5,2) NOT NULL CHECK (TaxRate >= 0),
    Country NVARCHAR(100) NOT NULL DEFAULT 'Việt Nam',
    IsActive BIT DEFAULT 1
);

CREATE TABLE Vouchers (
    VoucherID INT IDENTITY(1,1) PRIMARY KEY,
    VoucherCode NVARCHAR(50) NOT NULL UNIQUE,
    VoucherName NVARCHAR(255) NOT NULL,
    Description NVARCHAR(500),
    DiscountType NVARCHAR(20) NOT NULL CHECK (DiscountType IN (N'Phần trăm', N'Số tiền')),
    DiscountValue DECIMAL(18,2) NOT NULL CHECK (DiscountValue > 0),
    MaxDiscountAmount DECIMAL(18,2),
    MinOrderAmount DECIMAL(18,2) DEFAULT 0,
    UsageLimit INT,
    UsedCount INT DEFAULT 0,
    StartDate DATETIME NOT NULL,
    EndDate DATETIME NOT NULL,
    IsActive BIT DEFAULT 1,
    CreatedDate DATETIME DEFAULT GETDATE(),
    CHECK (EndDate > StartDate)
);

CREATE TABLE Orders (
    OrderID INT IDENTITY(1,1) PRIMARY KEY,
    OrderCode NVARCHAR(50) NOT NULL UNIQUE,
    UserID INT NOT NULL,
    AddressID INT NOT NULL,
    StatusID INT NOT NULL,
    ShippingMethodID INT NOT NULL,
    VoucherID INT NULL,
    SubTotal DECIMAL(18,2) NOT NULL CHECK (SubTotal >= 0),
    DiscountAmount DECIMAL(18,2) DEFAULT 0 CHECK (DiscountAmount >= 0),
    ShippingFee DECIMAL(18,2) DEFAULT 0 CHECK (ShippingFee >= 0),
    TaxAmount DECIMAL(18,2) DEFAULT 0 CHECK (TaxAmount >= 0),
    TotalAmount DECIMAL(18,2) NOT NULL CHECK (TotalAmount >= 0),
    CurrencyCode NVARCHAR(3) NOT NULL DEFAULT 'VND',
    Note NVARCHAR(500),
    OrderDate DATETIME DEFAULT GETDATE(),
    UpdatedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (AddressID) REFERENCES UserAddresses(AddressID),
    FOREIGN KEY (StatusID) REFERENCES OrderStatus(StatusID),
    FOREIGN KEY (ShippingMethodID) REFERENCES ShippingMethods(ShippingMethodID),
    FOREIGN KEY (VoucherID) REFERENCES Vouchers(VoucherID)
);

CREATE TABLE OrderItems (
    OrderItemID INT IDENTITY(1,1) PRIMARY KEY,
    OrderID INT NOT NULL,
    VariantID INT NOT NULL,
    ProductName NVARCHAR(255) NOT NULL,
    SizeName NVARCHAR(20) NOT NULL,
    ColorName NVARCHAR(50) NOT NULL,
    Quantity INT NOT NULL CHECK (Quantity > 0),
    UnitPrice DECIMAL(18,2) NOT NULL CHECK (UnitPrice >= 0),
    TotalPrice DECIMAL(18,2) NOT NULL CHECK (TotalPrice >= 0),
    FOREIGN KEY (OrderID) REFERENCES Orders(OrderID) ON DELETE CASCADE,
    FOREIGN KEY (VariantID) REFERENCES ProductVariants(VariantID)
);

CREATE TABLE PaymentMethods (
    PaymentMethodID INT IDENTITY(1,1) PRIMARY KEY,
    MethodName NVARCHAR(100) NOT NULL UNIQUE,
    Description NVARCHAR(255),
    IsActive BIT DEFAULT 1
);

CREATE TABLE OrderPayments (
    PaymentID INT IDENTITY(1,1) PRIMARY KEY,
    OrderID INT NOT NULL,
    PaymentMethodID INT NOT NULL,
    TransactionCode NVARCHAR(100) UNIQUE,
    Amount DECIMAL(18,2) NOT NULL CHECK (Amount >= 0),
    PaymentStatus NVARCHAR(50) NOT NULL CHECK (PaymentStatus IN (N'Chờ thanh toán', N'Thành công', N'Thất bại', N'Hoàn tiền')),
    PaymentDate DATETIME DEFAULT GETDATE(),
    Note NVARCHAR(500),
    FOREIGN KEY (OrderID) REFERENCES Orders(OrderID),
    FOREIGN KEY (PaymentMethodID) REFERENCES PaymentMethods(PaymentMethodID)
);

-- =============================================
-- D. KHUYẾN MÃI
-- =============================================
CREATE TABLE Promotions (
    PromotionID INT IDENTITY(1,1) PRIMARY KEY,
    PromotionName NVARCHAR(255) NOT NULL,
    PromotionCode NVARCHAR(50) NOT NULL UNIQUE,
    Description NVARCHAR(500),
    DiscountType NVARCHAR(20) NOT NULL CHECK (DiscountType IN (N'Phần trăm', N'Số tiền')),
    DiscountValue DECIMAL(18,2) NOT NULL CHECK (DiscountValue > 0),
    MaxDiscountAmount DECIMAL(18,2),
    StartDate DATETIME NOT NULL,
    EndDate DATETIME NOT NULL,
    IsActive BIT DEFAULT 1,
    CreatedDate DATETIME DEFAULT GETDATE(),
    CHECK (EndDate > StartDate)
);

CREATE TABLE PromotionProducts (
    PromotionProductID INT IDENTITY(1,1) PRIMARY KEY,
    PromotionID INT NOT NULL,
    ProductID INT NOT NULL,
    FOREIGN KEY (PromotionID) REFERENCES Promotions(PromotionID) ON DELETE CASCADE,
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE,
    UNIQUE(PromotionID, ProductID)
);

CREATE TABLE PromotionCategories (
    PromotionCategoryID INT IDENTITY(1,1) PRIMARY KEY,
    PromotionID INT NOT NULL,
    CategoryID INT NULL,
    SubCategoryID INT NULL,
    FOREIGN KEY (PromotionID) REFERENCES Promotions(PromotionID) ON DELETE CASCADE,
    FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID),
    FOREIGN KEY (SubCategoryID) REFERENCES SubCategories(SubCategoryID),
    CHECK ((CategoryID IS NOT NULL AND SubCategoryID IS NULL) OR (CategoryID IS NULL AND SubCategoryID IS NOT NULL))
);

CREATE TABLE UserVouchers (
    UserVoucherID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    VoucherID INT NOT NULL,
    IsUsed BIT DEFAULT 0,
    UsedDate DATETIME,
    ReceivedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    FOREIGN KEY (VoucherID) REFERENCES Vouchers(VoucherID) ON DELETE CASCADE
);

-- =============================================
-- E. QUẢN LÝ SÂN THỂ THAO
-- =============================================
CREATE TABLE CourtTypes (
    CourtTypeID INT IDENTITY(1,1) PRIMARY KEY,
    TypeName NVARCHAR(100) NOT NULL UNIQUE,
    Description NVARCHAR(500),
    IsActive BIT DEFAULT 1
);

CREATE TABLE Courts (
    CourtID INT IDENTITY(1,1) PRIMARY KEY,
    CourtTypeID INT NOT NULL,
    CourtName NVARCHAR(100) NOT NULL,
    CourtCode NVARCHAR(50) NOT NULL UNIQUE,
    Location NVARCHAR(255) NOT NULL,
    Address NVARCHAR(500),
    Description NVARCHAR(MAX),
    Facilities NVARCHAR(500),
    Capacity INT,
    OpenTime TIME NOT NULL,
    CloseTime TIME NOT NULL,
    AvgRating DECIMAL(3,2) NULL,
    ReviewCount INT DEFAULT 0,
    IsActive BIT DEFAULT 1,
    CreatedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (CourtTypeID) REFERENCES CourtTypes(CourtTypeID)
);

CREATE TABLE TimeSlots (
    TimeSlotID INT IDENTITY(1,1) PRIMARY KEY,
    StartTime TIME NOT NULL,
    EndTime TIME NOT NULL,
    SlotName NVARCHAR(50),
    IsActive BIT DEFAULT 1,
    UNIQUE(StartTime, EndTime),
    CHECK (EndTime > StartTime)
);

CREATE TABLE CourtPricing (
    PricingID INT IDENTITY(1,1) PRIMARY KEY,
    CourtID INT NOT NULL,
    TimeSlotID INT NOT NULL,
    DayOfWeek INT NOT NULL CHECK (DayOfWeek BETWEEN 0 AND 6),
    Price DECIMAL(18,2) NOT NULL CHECK (Price >= 0),
    CurrencyCode NVARCHAR(3) NOT NULL DEFAULT 'VND',
    EffectiveDate DATE NOT NULL,
    IsActive BIT DEFAULT 1,
    FOREIGN KEY (CourtID) REFERENCES Courts(CourtID) ON DELETE CASCADE,
    FOREIGN KEY (TimeSlotID) REFERENCES TimeSlots(TimeSlotID)
);

CREATE TABLE CourtImages (
    ImageID INT IDENTITY(1,1) PRIMARY KEY,
    CourtID INT NOT NULL,
    ImageUrl NVARCHAR(500) NOT NULL,
    AltText NVARCHAR(255),
    DisplayOrder INT DEFAULT 0,
    IsPrimary BIT DEFAULT 0,
    CreatedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (CourtID) REFERENCES Courts(CourtID) ON DELETE CASCADE
);

CREATE TABLE BookingStatus (
    StatusID INT IDENTITY(1,1) PRIMARY KEY,
    StatusName NVARCHAR(50) NOT NULL UNIQUE,
    Description NVARCHAR(255),
    DisplayOrder INT DEFAULT 0
);

CREATE TABLE Bookings (
    BookingID INT IDENTITY(1,1) PRIMARY KEY,
    BookingCode NVARCHAR(50) NOT NULL UNIQUE,
    UserID INT NOT NULL,
    CourtID INT NOT NULL,
    StatusID INT NOT NULL,
    BookingDate DATE NOT NULL,
    DiscountAmount DECIMAL(18,2) DEFAULT 0 CHECK (DiscountAmount >= 0),
    TaxAmount DECIMAL(18,2) DEFAULT 0 CHECK (TaxAmount >= 0),
    TotalAmount DECIMAL(18,2) NOT NULL CHECK (TotalAmount >= 0),
    CurrencyCode NVARCHAR(3) NOT NULL DEFAULT 'VND',
    Note NVARCHAR(500),
    CreatedDate DATETIME DEFAULT GETDATE(),
    UpdatedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (CourtID) REFERENCES Courts(CourtID),
    FOREIGN KEY (StatusID) REFERENCES BookingStatus(StatusID)
);

CREATE TABLE BookingDetails (
    BookingDetailID INT IDENTITY(1,1) PRIMARY KEY,
    BookingID INT NOT NULL,
    TimeSlotID INT NOT NULL,
    PricingID INT NOT NULL,
    Price DECIMAL(18,2) NOT NULL CHECK (Price >= 0),
    FOREIGN KEY (BookingID) REFERENCES Bookings(BookingID) ON DELETE CASCADE,
    FOREIGN KEY (TimeSlotID) REFERENCES TimeSlots(TimeSlotID),
    FOREIGN KEY (PricingID) REFERENCES CourtPricing(PricingID),
    UNIQUE(BookingID, TimeSlotID)
);

CREATE TABLE BookingPayments (
    PaymentID INT IDENTITY(1,1) PRIMARY KEY,
    BookingID INT NOT NULL,
    PaymentMethodID INT NOT NULL,
    TransactionCode NVARCHAR(100) UNIQUE,
    Amount DECIMAL(18,2) NOT NULL CHECK (Amount >= 0),
    PaymentStatus NVARCHAR(50) NOT NULL CHECK (PaymentStatus IN (N'Chờ thanh toán', N'Thành công', N'Thất bại', N'Hoàn tiền')),
    PaymentDate DATETIME DEFAULT GETDATE(),
    Note NVARCHAR(500),
    FOREIGN KEY (BookingID) REFERENCES Bookings(BookingID),
    FOREIGN KEY (PaymentMethodID) REFERENCES PaymentMethods(PaymentMethodID)
);

CREATE TABLE CourtReviews (
    ReviewID INT IDENTITY(1,1) PRIMARY KEY,
    CourtID INT NOT NULL,
    UserID INT NOT NULL,
    BookingID INT,
    Rating INT NOT NULL CHECK (Rating BETWEEN 1 AND 5),
    ReviewTitle NVARCHAR(255),
    ReviewContent NVARCHAR(MAX),
    IsVerifiedBooking BIT DEFAULT 0,
    IsApproved BIT DEFAULT 0,
    CreatedDate DATETIME DEFAULT GETDATE(),
    UpdatedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (CourtID) REFERENCES Courts(CourtID) ON DELETE CASCADE,
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (BookingID) REFERENCES Bookings(BookingID)
);

-- =============================================
-- F. HỆ THỐNG HỖ TRỢ
-- =============================================
CREATE TABLE Notifications (
    NotificationID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    Title NVARCHAR(255) NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    NotificationType NVARCHAR(50) NOT NULL,
    ReferenceID INT,
    IsRead BIT DEFAULT 0,
    CreatedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);

CREATE TABLE AuditLogs (
    LogID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT,
    ActionType NVARCHAR(100) NOT NULL,
    TableName NVARCHAR(100),
    RecordID INT,
    OldValue NVARCHAR(MAX),
    NewValue NVARCHAR(MAX),
    IPAddress NVARCHAR(50),
    CreatedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

CREATE TABLE SystemSettings (
    SettingID INT IDENTITY(1,1) PRIMARY KEY,
    SettingKey NVARCHAR(100) NOT NULL UNIQUE,
    SettingValue NVARCHAR(MAX),
    Description NVARCHAR(255),
    UpdatedDate DATETIME DEFAULT GETDATE()
);

CREATE TABLE Banners (
    BannerID INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(255) NOT NULL,
    ImageUrl NVARCHAR(500) NOT NULL,
    LinkUrl NVARCHAR(500),
    Position NVARCHAR(50) NOT NULL,
    DisplayOrder INT DEFAULT 0,
    StartDate DATETIME NOT NULL,
    EndDate DATETIME NOT NULL,
    IsActive BIT DEFAULT 1,
    CreatedDate DATETIME DEFAULT GETDATE(),
    CHECK (EndDate > StartDate)
);

-- =============================================
-- TẠO INDEX TỐI ƯU
-- =============================================
CREATE NONCLUSTERED INDEX IX_Users_Email ON Users(Email);
CREATE NONCLUSTERED INDEX IX_Users_Username ON Users(Username);
CREATE NONCLUSTERED INDEX IX_Users_IsActive ON Users(IsActive);

CREATE NONCLUSTERED INDEX IX_Products_SubCategoryID ON Products(SubCategoryID);
CREATE NONCLUSTERED INDEX IX_Products_BrandID ON Products(BrandID);
CREATE NONCLUSTERED INDEX IX_Products_ProductSlug ON Products(ProductSlug);
CREATE NONCLUSTERED INDEX IX_Products_IsActive_IsFeatured ON Products(IsActive, IsFeatured);

CREATE NONCLUSTERED INDEX IX_ProductVariants_ProductID ON ProductVariants(ProductID);
CREATE NONCLUSTERED INDEX IX_ProductVariants_SKU ON ProductVariants(SKU);
CREATE NONCLUSTERED INDEX IX_ProductVariants_IsActive ON ProductVariants(IsActive);

CREATE NONCLUSTERED INDEX IX_Orders_UserID_OrderDate ON Orders(UserID, OrderDate DESC);
CREATE NONCLUSTERED INDEX IX_Orders_StatusID ON Orders(StatusID);
CREATE NONCLUSTERED INDEX IX_Orders_OrderCode ON Orders(OrderCode);
CREATE NONCLUSTERED INDEX IX_Orders_OrderDate ON Orders(OrderDate DESC);

CREATE NONCLUSTERED INDEX IX_OrderItems_OrderID ON OrderItems(OrderID);
CREATE NONCLUSTERED INDEX IX_OrderItems_VariantID ON OrderItems(VariantID);

CREATE NONCLUSTERED INDEX IX_Bookings_UserID_BookingDate ON Bookings(UserID, BookingDate DESC);
CREATE NONCLUSTERED INDEX IX_Bookings_CourtID_BookingDate ON Bookings(CourtID, BookingDate);
CREATE NONCLUSTERED INDEX IX_Bookings_StatusID ON Bookings(StatusID);
CREATE NONCLUSTERED INDEX IX_Bookings_BookingCode ON Bookings(BookingCode);

CREATE NONCLUSTERED INDEX IX_Courts_CourtTypeID ON Courts(CourtTypeID);
CREATE NONCLUSTERED INDEX IX_Courts_IsActive ON Courts(IsActive);

CREATE NONCLUSTERED INDEX IX_ProductReviews_ProductID_IsApproved ON ProductReviews(ProductID, IsApproved);
CREATE NONCLUSTERED INDEX IX_ProductReviews_UserID ON ProductReviews(UserID);

CREATE NONCLUSTERED INDEX IX_CourtReviews_CourtID_IsApproved ON CourtReviews(CourtID, IsApproved);
CREATE NONCLUSTERED INDEX IX_CourtReviews_UserID ON CourtReviews(UserID);

CREATE NONCLUSTERED INDEX IX_Notifications_UserID_IsRead ON Notifications(UserID, IsRead);
CREATE NONCLUSTERED INDEX IX_Notifications_CreatedDate ON Notifications(CreatedDate DESC);

CREATE NONCLUSTERED INDEX IX_OrderPayments_OrderID ON OrderPayments(OrderID);
CREATE NONCLUSTERED INDEX IX_OrderPayments_TransactionCode ON OrderPayments(TransactionCode);

CREATE NONCLUSTERED INDEX IX_BookingPayments_BookingID ON BookingPayments(BookingID);
CREATE NONCLUSTERED INDEX IX_BookingPayments_TransactionCode ON BookingPayments(TransactionCode);

CREATE NONCLUSTERED INDEX IX_CartItems_CartID ON CartItems(CartID);
CREATE NONCLUSTERED INDEX IX_CartItems_VariantID ON CartItems(VariantID);

CREATE NONCLUSTERED INDEX IX_ProductInventory_VariantID ON ProductInventory(VariantID);
CREATE NONCLUSTERED INDEX IX_ProductInventory_StockQuantity ON ProductInventory(StockQuantity);

CREATE NONCLUSTERED INDEX IX_WishlistItems_WishlistID ON WishlistItems(WishlistID);
CREATE NONCLUSTERED INDEX IX_WishlistItems_ProductID ON WishlistItems(ProductID);

CREATE NONCLUSTERED INDEX IX_PromotionCategories_PromotionID ON PromotionCategories(PromotionID);
GO

-- =============================================
-- TẠO TRIGGER (sau tất cả bảng)
-- =============================================
GO
CREATE TRIGGER trg_UpdateProductRating
ON ProductReviews
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    WITH RatingStats AS (
        SELECT 
            ProductID,
            AVG(CAST(Rating AS DECIMAL(3,2))) AS AvgRat,
            COUNT(*) AS ReviewCnt
        FROM ProductReviews
        WHERE ProductID IN (SELECT ProductID FROM inserted UNION SELECT ProductID FROM deleted)
        GROUP BY ProductID
    )
    UPDATE p
    SET 
        AvgRating = rs.AvgRat,
        ReviewCount = rs.ReviewCnt
    FROM Products p
    INNER JOIN RatingStats rs ON p.ProductID = rs.ProductID;

    UPDATE p
    SET 
        AvgRating = NULL,
        ReviewCount = 0
    FROM Products p
    WHERE p.ProductID IN (SELECT ProductID FROM deleted)
      AND NOT EXISTS (SELECT 1 FROM ProductReviews pr WHERE pr.ProductID = p.ProductID);
END
GO

CREATE TRIGGER trg_UpdateCourtRating
ON CourtReviews
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    WITH RatingStats AS (
        SELECT 
            CourtID,
            AVG(CAST(Rating AS DECIMAL(3,2))) AS AvgRat,
            COUNT(*) AS ReviewCnt
        FROM CourtReviews
        WHERE CourtID IN (SELECT CourtID FROM inserted UNION SELECT CourtID FROM deleted)
        GROUP BY CourtID
    )
    UPDATE c
    SET 
        AvgRating = rs.AvgRat,
        ReviewCount = rs.ReviewCnt
    FROM Courts c
    INNER JOIN RatingStats rs ON c.CourtID = rs.CourtID;

    UPDATE c
    SET 
        AvgRating = NULL,
        ReviewCount = 0
    FROM Courts c
    WHERE c.CourtID IN (SELECT CourtID FROM deleted)
      AND NOT EXISTS (SELECT 1 FROM CourtReviews cr WHERE cr.CourtID = c.CourtID);
END
GO

-- =============================================
-- DỮ LIỆU MẪU CƠ BẢN (sau tất cả bảng và trigger)
-- =============================================
INSERT INTO Roles (RoleName, Description) VALUES
(N'Admin', N'Quản trị viên hệ thống'),
(N'Staff', N'Nhân viên'),
(N'Customer', N'Khách hàng');

INSERT INTO OrderStatus (StatusName, Description, DisplayOrder) VALUES
(N'Chờ xử lý', N'Đơn hàng mới chờ xác nhận', 1),
(N'Đã xác nhận', N'Đã xác nhận đơn hàng', 2),
(N'Đang giao', N'Đang giao hàng', 3),
(N'Hoàn thành', N'Giao hàng thành công', 4),
(N'Đã hủy', N'Đơn hàng bị hủy', 5);

INSERT INTO BookingStatus (StatusName, Description, DisplayOrder) VALUES
(N'Chờ xác nhận', N'Đặt sân chờ xác nhận', 1),
(N'Đã xác nhận', N'Đã xác nhận đặt sân', 2),
(N'Đang sử dụng', N'Đang sử dụng sân', 3),
(N'Hoàn thành', N'Đã hoàn thành', 4),
(N'Đã hủy', N'Đã hủy đặt sân', 5);

INSERT INTO PaymentMethods (MethodName, Description) VALUES
(N'Tiền mặt', N'Thanh toán khi nhận hàng (COD)'),
(N'VNPay', N'Thanh toán qua VNPay'),
(N'Momo', N'Thanh toán qua Ví Momo'),
(N'Chuyển khoản', N'Chuyển khoản ngân hàng');

INSERT INTO ShippingMethods (MethodName, Description, ShippingFee, EstimatedDays) VALUES
(N'Giao hàng tiêu chuẩn', N'Giao trong 3-5 ngày', 30000, 4),
(N'Giao hàng nhanh', N'Giao trong 1-2 ngày', 50000, 2),
(N'Giao hàng hỏa tốc', N'Giao trong 24h', 80000, 1);

INSERT INTO CourtTypes (TypeName, Description) VALUES
(N'Sân bóng chuyền', N'Sân bóng chuyền trong nhà và ngoài trời'),
(N'Sân Pickleball', N'Sân Pickleball tiêu chuẩn');

INSERT INTO Categories (CategoryName, CategorySlug, Description, DisplayOrder) VALUES
(N'Quần áo thể thao', 'quan-ao-the-thao', N'Quần áo tập luyện và thi đấu', 1),
(N'Giày thể thao', 'giay-the-thao', N'Giày chạy bộ, bóng đá, bóng rổ', 2),
(N'Dụng cụ thể thao', 'dung-cu-the-thao', N'Bóng, vợt và dụng cụ tập luyện', 3),
(N'Phụ kiện', 'phu-kien', N'Balo, găng tay, băng tay...', 4);

-- Các INSERT khác giữ nguyên như cũ (SubCategories, Brands, Colors, Sizes, TimeSlots, Taxes...)

INSERT INTO SubCategories (CategoryID, SubCategoryName, SubCategorySlug, DisplayOrder) VALUES
(1, N'Áo thể thao', 'ao-the-thao', 1),
(1, N'Quần thể thao', 'quan-the-thao', 2),
(1, N'Đồ tập gym', 'do-tap-gym', 3),
(1, N'Đồ yoga', 'do-yoga', 4),
(2, N'Giày chạy bộ', 'giay-chay-bo', 1),
(2, N'Giày bóng đá', 'giay-bong-da', 2),
(2, N'Giày bóng rổ', 'giay-bong-ro', 3),
(3, N'Bóng', 'bong', 1),
(3, N'Vợt cầu lông', 'vot-cau-long', 2),
(3, N'Vợt pickleball', 'vot-pickleball', 3),
(3, N'Vợt tennis', 'vot-tennis', 4),
(4, N'Balo thể thao', 'balo-the-thao', 1),
(4, N'Găng tay', 'gang-tay', 2),
(4, N'Băng tay', 'bang-tay', 3),
(4, N'Bình nước', 'binh-nuoc', 4);

INSERT INTO Brands (BrandName, BrandSlug, Description) VALUES
(N'Nike', 'nike', N'Thương hiệu thể thao hàng đầu thế giới'),
(N'Adidas', 'adidas', N'Thương hiệu thể thao Đức'),
(N'Puma', 'puma', N'Thương hiệu thể thao cao cấp'),
(N'Mizuno', 'mizuno', N'Thương hiệu Nhật Bản chuyên về thể thao'),
(N'Kamito', 'kamito', N'Thương hiệu Việt Nam'),
(N'Li-Ning', 'li-ning', N'Thương hiệu Trung Quốc');

INSERT INTO Colors (ColorName, ColorCode) VALUES
(N'Đen', '#000000'),
(N'Trắng', '#FFFFFF'),
(N'Đỏ', '#FF0000'),
(N'Xanh dương', '#0000FF'),
(N'Xanh lá', '#00FF00'),
(N'Vàng', '#FFFF00'),
(N'Hồng', '#FFC0CB'),
(N'Cam', '#FFA500'),
(N'Xám', '#808080'),
(N'Nâu', '#A52A2A');

INSERT INTO Sizes (SizeName, SizeOrder) VALUES
('XS', 1), ('S', 2), ('M', 3), ('L', 4), ('XL', 5), ('XXL', 6),
('35', 10), ('36', 11), ('37', 12), ('38', 13), ('39', 14),
('40', 15), ('41', 16), ('42', 17), ('43', 18), ('44', 19), ('45', 20);

INSERT INTO TimeSlots (StartTime, EndTime, SlotName) VALUES
('06:00', '07:00', N'Sáng sớm'),
('07:00', '08:00', N'Sáng 1'),
('08:00', '09:00', N'Sáng 2'),
('09:00', '10:00', N'Sáng 3'),
('10:00', '11:00', N'Sáng 4'),
('14:00', '15:00', N'Chiều 1'),
('15:00', '16:00', N'Chiều 2'),
('16:00', '17:00', N'Chiều 3'),
('17:00', '18:00', N'Chiều 4'),
('18:00', '19:00', N'Tối 1'),
('19:00', '20:00', N'Tối 2'),
('20:00', '21:00', N'Tối 3'),
('21:00', '22:00', N'Tối 4');

INSERT INTO Taxes (TaxName, TaxRate) VALUES
(N'VAT', 10.00);
GO

PRINT N'✅ Tạo database thành công!';
PRINT N'✅ Tổng số bảng: 44';
PRINT N'✅ Đã tạo trigger và index thành công';
PRINT N'✅ Đã thêm dữ liệu mẫu cơ bản';