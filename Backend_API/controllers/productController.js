const { executeQuery } = require('../config/database');
const { validationResult } = require('express-validator');

// Get all products with filters
const getProducts = async (req, res, next) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            categoryId, 
            subCategoryId, 
            brandId, 
            search,
            minPrice,
            maxPrice,
            isFeatured,
            isNewArrival,
            sortBy = 'CreatedDate',
            sortOrder = 'DESC'
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);
        let whereConditions = ['p.IsActive = 1'];
        const params = { limit: parseInt(limit), offset };

        if (categoryId) {
            whereConditions.push('c.CategoryID = @categoryId');
            params.categoryId = parseInt(categoryId);
        }

        if (subCategoryId) {
            whereConditions.push('p.SubCategoryID = @subCategoryId');
            params.subCategoryId = parseInt(subCategoryId);
        }

        if (brandId) {
            whereConditions.push('p.BrandID = @brandId');
            params.brandId = parseInt(brandId);
        }

        if (search) {
            whereConditions.push('(p.ProductName LIKE @search OR p.Description LIKE @search)');
            params.search = `%${search}%`;
        }

        if (isFeatured === 'true') {
            whereConditions.push('p.IsFeatured = 1');
        }

        if (isNewArrival === 'true') {
            whereConditions.push('p.IsNewArrival = 1');
        }

        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

        // Get products with variants (min price)
        let orderBy = `ORDER BY p.${sortBy} ${sortOrder}`;
        if (sortBy === 'price') {
            orderBy = 'ORDER BY minPrice ' + sortOrder;
        }

        const query = `
            SELECT 
                p.ProductID,
                p.ProductCode,
                p.ProductName,
                p.ProductSlug,
                p.ShortDescription,
                p.Description,
                p.Material,
                p.Origin,
                p.Weight,
                p.IsFeatured,
                p.IsNewArrival,
                p.ViewCount,
                p.AvgRating,
                p.ReviewCount,
                p.CreatedDate,
                sc.SubCategoryID,
                sc.SubCategoryName,
                c.CategoryID,
                c.CategoryName,
                b.BrandID,
                b.BrandName,
                b.LogoUrl as BrandLogo,
                (SELECT TOP 1 ImageUrl FROM ProductImages WHERE ProductID = p.ProductID AND IsPrimary = 1) as PrimaryImage,
                MIN(pv.SalePrice) as MinPrice,
                MAX(pv.OriginalPrice) as MaxPrice
            FROM Products p
            INNER JOIN SubCategories sc ON p.SubCategoryID = sc.SubCategoryID
            INNER JOIN Categories c ON sc.CategoryID = c.CategoryID
            INNER JOIN Brands b ON p.BrandID = b.BrandID
            LEFT JOIN ProductVariants pv ON p.ProductID = pv.ProductID AND pv.IsActive = 1
            ${whereClause}
            GROUP BY 
                p.ProductID, p.ProductCode, p.ProductName, p.ProductSlug, p.ShortDescription,
                p.Description, p.Material, p.Origin, p.Weight, p.IsFeatured, p.IsNewArrival,
                p.ViewCount, p.AvgRating, p.ReviewCount, p.CreatedDate,
                sc.SubCategoryID, sc.SubCategoryName, c.CategoryID, c.CategoryName,
                b.BrandID, b.BrandName, b.LogoUrl
            ${orderBy}
            OFFSET @offset ROWS
            FETCH NEXT @limit ROWS ONLY
        `;

        const products = await executeQuery(query, params);

        // Get total count
        const countQuery = `
            SELECT COUNT(DISTINCT p.ProductID) as Total
            FROM Products p
            INNER JOIN SubCategories sc ON p.SubCategoryID = sc.SubCategoryID
            INNER JOIN Categories c ON sc.CategoryID = c.CategoryID
            ${whereClause}
        `;
        const countResult = await executeQuery(countQuery, params);
        const total = countResult[0].Total;

        res.json({
            success: true,
            data: products,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get product by ID or slug
const getProductById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const isNumeric = /^\d+$/.test(id);

        let query = `
            SELECT 
                p.*,
                sc.SubCategoryID,
                sc.SubCategoryName,
                sc.SubCategorySlug,
                c.CategoryID,
                c.CategoryName,
                c.CategorySlug,
                b.BrandID,
                b.BrandName,
                b.BrandSlug,
                b.LogoUrl as BrandLogo,
                b.Description as BrandDescription
            FROM Products p
            INNER JOIN SubCategories sc ON p.SubCategoryID = sc.SubCategoryID
            INNER JOIN Categories c ON sc.CategoryID = c.CategoryID
            INNER JOIN Brands b ON p.BrandID = b.BrandID
            WHERE p.IsActive = 1 AND 
        `;

        if (isNumeric) {
            query += 'p.ProductID = @id';
        } else {
            query += 'p.ProductSlug = @id';
        }

        const products = await executeQuery(query, { id });

        if (!products || products.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }

        const product = products[0];

        // Increment view count
        await executeQuery(
            `UPDATE Products SET ViewCount = ViewCount + 1 WHERE ProductID = @productId`,
            { productId: product.ProductID }
        );

        // Get images
        const images = await executeQuery(
            `SELECT ImageID, ImageUrl, AltText, DisplayOrder, IsPrimary
             FROM ProductImages
             WHERE ProductID = @productId
             ORDER BY IsPrimary DESC, DisplayOrder ASC`,
            { productId: product.ProductID }
        );

        // Get variants with inventory
        const variants = await executeQuery(
            `SELECT 
                pv.VariantID,
                pv.SKU,
                pv.OriginalPrice,
                pv.SalePrice,
                pv.CurrencyCode,
                pv.IsActive,
                s.SizeID,
                s.SizeName,
                c.ColorID,
                c.ColorName,
                c.ColorCode,
                pi.StockQuantity,
                pi.ReorderLevel
             FROM ProductVariants pv
             INNER JOIN Sizes s ON pv.SizeID = s.SizeID
             INNER JOIN Colors c ON pv.ColorID = c.ColorID
             LEFT JOIN ProductInventory pi ON pv.VariantID = pi.VariantID
             WHERE pv.ProductID = @productId AND pv.IsActive = 1
             ORDER BY s.SizeOrder, c.ColorName`,
            { productId: product.ProductID }
        );

        // Get reviews
        const reviews = await executeQuery(
            `SELECT 
                pr.ReviewID,
                pr.Rating,
                pr.ReviewTitle,
                pr.ReviewContent,
                pr.IsVerifiedPurchase,
                pr.CreatedDate,
                u.UserID,
                u.Username,
                u.FullName,
                u.Avatar
             FROM ProductReviews pr
             INNER JOIN Users u ON pr.UserID = u.UserID
             WHERE pr.ProductID = @productId AND pr.IsApproved = 1
             ORDER BY pr.CreatedDate DESC`,
            { productId: product.ProductID }
        );

        res.json({
            success: true,
            data: {
                ...product,
                images,
                variants,
                reviews
            }
        });
    } catch (error) {
        next(error);
    }
};

// Create product (Admin only)
const createProduct = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const {
            productCode,
            productName,
            productSlug,
            subCategoryId,
            brandId,
            description,
            shortDescription,
            material,
            origin,
            weight,
            isFeatured,
            isNewArrival
        } = req.body;

        const result = await executeQuery(
            `INSERT INTO Products (
                ProductCode, ProductName, ProductSlug, SubCategoryID, BrandID,
                Description, ShortDescription, Material, Origin, Weight,
                IsFeatured, IsNewArrival, CreatedDate, UpdatedDate
            )
            OUTPUT INSERTED.ProductID
            VALUES (
                @productCode, @productName, @productSlug, @subCategoryId, @brandId,
                @description, @shortDescription, @material, @origin, @weight,
                @isFeatured, @isNewArrival, GETDATE(), GETDATE()
            )`,
            {
                productCode,
                productName,
                productSlug,
                subCategoryId: parseInt(subCategoryId),
                brandId: parseInt(brandId),
                description: description || null,
                shortDescription: shortDescription || null,
                material: material || null,
                origin: origin || null,
                weight: weight || null,
                isFeatured: isFeatured === true || isFeatured === 'true' ? 1 : 0,
                isNewArrival: isNewArrival === true || isNewArrival === 'true' ? 1 : 0
            }
        );

        res.status(201).json({
            success: true,
            message: 'Tạo sản phẩm thành công',
            data: { productId: result[0].ProductID }
        });
    } catch (error) {
        next(error);
    }
};

// Update product (Admin only)
const updateProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            productName,
            productSlug,
            subCategoryId,
            brandId,
            description,
            shortDescription,
            material,
            origin,
            weight,
            isFeatured,
            isNewArrival,
            isActive
        } = req.body;

        await executeQuery(
            `UPDATE Products 
             SET ProductName = @productName,
                 ProductSlug = @productSlug,
                 SubCategoryID = @subCategoryId,
                 BrandID = @brandId,
                 Description = @description,
                 ShortDescription = @shortDescription,
                 Material = @material,
                 Origin = @origin,
                 Weight = @weight,
                 IsFeatured = @isFeatured,
                 IsNewArrival = @isNewArrival,
                 IsActive = @isActive,
                 UpdatedDate = GETDATE()
             WHERE ProductID = @id`,
            {
                id: parseInt(id),
                productName,
                productSlug,
                subCategoryId: parseInt(subCategoryId),
                brandId: parseInt(brandId),
                description: description || null,
                shortDescription: shortDescription || null,
                material: material || null,
                origin: origin || null,
                weight: weight || null,
                isFeatured: isFeatured === true || isFeatured === 'true' ? 1 : 0,
                isNewArrival: isNewArrival === true || isNewArrival === 'true' ? 1 : 0,
                isActive: isActive !== undefined ? (isActive === true || isActive === 'true' ? 1 : 0) : undefined
            }
        );

        res.json({
            success: true,
            message: 'Cập nhật sản phẩm thành công'
        });
    } catch (error) {
        next(error);
    }
};

// Delete product (Admin only)
const deleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;

        await executeQuery(
            `UPDATE Products SET IsActive = 0 WHERE ProductID = @id`,
            { id: parseInt(id) }
        );

        res.json({
            success: true,
            message: 'Xóa sản phẩm thành công'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};
