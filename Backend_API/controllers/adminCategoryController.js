const { getPool } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

/**
 * Admin Category & Brand Management Controller
 */

// ==================== CATEGORY MANAGEMENT ====================

// Tạo category mới
exports.createCategory = async (req, res) => {
    try {
        const pool = await getPool();
        const { categoryName, categorySlug, description, imageUrl, displayOrder } = req.body;

        if (!categoryName || !categorySlug) {
            return errorResponse(res, 'Vui lòng cung cấp tên và slug cho category', 400);
        }

        // Check if category already exists
        const checkCategory = await pool.request()
            .input('categoryName', categoryName)
            .query('SELECT CategoryID FROM Categories WHERE CategoryName = @categoryName');

        if (checkCategory.recordset.length > 0) {
            return errorResponse(res, 'Category đã tồn tại', 400);
        }

        // Insert new category
        const result = await pool.request()
            .input('categoryName', categoryName)
            .input('categorySlug', categorySlug)
            .input('description', description || null)
            .input('imageUrl', imageUrl || null)
            .input('displayOrder', displayOrder || 0)
            .query(`
                INSERT INTO Categories (CategoryName, CategorySlug, Description, ImageUrl, DisplayOrder)
                OUTPUT INSERTED.CategoryID
                VALUES (@categoryName, @categorySlug, @description, @imageUrl, @displayOrder)
            `);

        return successResponse(res, {
            categoryId: result.recordset[0].CategoryID
        }, 'Tạo category thành công', 201);

    } catch (error) {
        console.error('Create category error:', error);
        return errorResponse(res, 'Lỗi khi tạo category', 500);
    }
};

// Cập nhật category
exports.updateCategory = async (req, res) => {
    try {
        const pool = await getPool();
        const { id } = req.params;
        const { categoryName, categorySlug, description, imageUrl, displayOrder, isActive } = req.body;

        // Check if category exists
        const checkCategory = await pool.request()
            .input('categoryId', id)
            .query('SELECT CategoryID FROM Categories WHERE CategoryID = @categoryId');

        if (checkCategory.recordset.length === 0) {
            return errorResponse(res, 'Không tìm thấy category', 404);
        }

        // Update category
        await pool.request()
            .input('categoryId', id)
            .input('categoryName', categoryName || null)
            .input('categorySlug', categorySlug || null)
            .input('description', description || null)
            .input('imageUrl', imageUrl || null)
            .input('displayOrder', displayOrder !== undefined ? displayOrder : null)
            .input('isActive', isActive !== undefined ? isActive : null)
            .query(`
                UPDATE Categories
                SET 
                    CategoryName = COALESCE(@categoryName, CategoryName),
                    CategorySlug = COALESCE(@categorySlug, CategorySlug),
                    Description = COALESCE(@description, Description),
                    ImageUrl = COALESCE(@imageUrl, ImageUrl),
                    DisplayOrder = COALESCE(@displayOrder, DisplayOrder),
                    IsActive = COALESCE(@isActive, IsActive)
                WHERE CategoryID = @categoryId
            `);

        return successResponse(res, null, 'Cập nhật category thành công');

    } catch (error) {
        console.error('Update category error:', error);
        return errorResponse(res, 'Lỗi khi cập nhật category', 500);
    }
};

// Xóa category
exports.deleteCategory = async (req, res) => {
    try {
        const pool = await getPool();
        const { id } = req.params;

        // Check if category exists
        const checkCategory = await pool.request()
            .input('categoryId', id)
            .query('SELECT CategoryID FROM Categories WHERE CategoryID = @categoryId');

        if (checkCategory.recordset.length === 0) {
            return errorResponse(res, 'Không tìm thấy category', 404);
        }

        // Check if category has subcategories
        const checkSubCategories = await pool.request()
            .input('categoryId', id)
            .query('SELECT COUNT(*) as Count FROM SubCategories WHERE CategoryID = @categoryId');

        if (checkSubCategories.recordset[0].Count > 0) {
            return errorResponse(res, 'Không thể xóa category có subcategories', 400);
        }

        // Soft delete - set IsActive = 0
        await pool.request()
            .input('categoryId', id)
            .query('UPDATE Categories SET IsActive = 0 WHERE CategoryID = @categoryId');

        return successResponse(res, null, 'Xóa category thành công');

    } catch (error) {
        console.error('Delete category error:', error);
        return errorResponse(res, 'Lỗi khi xóa category', 500);
    }
};

// Tạo subcategory
exports.createSubCategory = async (req, res) => {
    try {
        const pool = await getPool();
        const { categoryId, subCategoryName, subCategorySlug, description, displayOrder } = req.body;

        if (!categoryId || !subCategoryName || !subCategorySlug) {
            return errorResponse(res, 'Vui lòng cung cấp đầy đủ thông tin', 400);
        }

        // Check if category exists
        const checkCategory = await pool.request()
            .input('categoryId', categoryId)
            .query('SELECT CategoryID FROM Categories WHERE CategoryID = @categoryId');

        if (checkCategory.recordset.length === 0) {
            return errorResponse(res, 'Không tìm thấy category', 404);
        }

        // Insert new subcategory
        const result = await pool.request()
            .input('categoryId', categoryId)
            .input('subCategoryName', subCategoryName)
            .input('subCategorySlug', subCategorySlug)
            .input('description', description || null)
            .input('displayOrder', displayOrder || 0)
            .query(`
                INSERT INTO SubCategories (CategoryID, SubCategoryName, SubCategorySlug, Description, DisplayOrder)
                OUTPUT INSERTED.SubCategoryID
                VALUES (@categoryId, @subCategoryName, @subCategorySlug, @description, @displayOrder)
            `);

        return successResponse(res, {
            subCategoryId: result.recordset[0].SubCategoryID
        }, 'Tạo subcategory thành công', 201);

    } catch (error) {
        console.error('Create subcategory error:', error);
        return errorResponse(res, 'Lỗi khi tạo subcategory', 500);
    }
};

// ==================== BRAND MANAGEMENT ====================

// Tạo brand mới
exports.createBrand = async (req, res) => {
    try {
        const pool = await getPool();
        const { brandName, brandSlug, logoUrl, description, website } = req.body;

        if (!brandName || !brandSlug) {
            return errorResponse(res, 'Vui lòng cung cấp tên và slug cho brand', 400);
        }

        // Check if brand already exists
        const checkBrand = await pool.request()
            .input('brandName', brandName)
            .query('SELECT BrandID FROM Brands WHERE BrandName = @brandName');

        if (checkBrand.recordset.length > 0) {
            return errorResponse(res, 'Brand đã tồn tại', 400);
        }

        // Insert new brand
        const result = await pool.request()
            .input('brandName', brandName)
            .input('brandSlug', brandSlug)
            .input('logoUrl', logoUrl || null)
            .input('description', description || null)
            .input('website', website || null)
            .query(`
                INSERT INTO Brands (BrandName, BrandSlug, LogoUrl, Description, Website)
                OUTPUT INSERTED.BrandID
                VALUES (@brandName, @brandSlug, @logoUrl, @description, @website)
            `);

        return successResponse(res, {
            brandId: result.recordset[0].BrandID
        }, 'Tạo brand thành công', 201);

    } catch (error) {
        console.error('Create brand error:', error);
        return errorResponse(res, 'Lỗi khi tạo brand', 500);
    }
};

// Cập nhật brand
exports.updateBrand = async (req, res) => {
    try {
        const pool = await getPool();
        const { id } = req.params;
        const { brandName, brandSlug, logoUrl, description, website, isActive } = req.body;

        // Check if brand exists
        const checkBrand = await pool.request()
            .input('brandId', id)
            .query('SELECT BrandID FROM Brands WHERE BrandID = @brandId');

        if (checkBrand.recordset.length === 0) {
            return errorResponse(res, 'Không tìm thấy brand', 404);
        }

        // Update brand
        await pool.request()
            .input('brandId', id)
            .input('brandName', brandName || null)
            .input('brandSlug', brandSlug || null)
            .input('logoUrl', logoUrl || null)
            .input('description', description || null)
            .input('website', website || null)
            .input('isActive', isActive !== undefined ? isActive : null)
            .query(`
                UPDATE Brands
                SET 
                    BrandName = COALESCE(@brandName, BrandName),
                    BrandSlug = COALESCE(@brandSlug, BrandSlug),
                    LogoUrl = COALESCE(@logoUrl, LogoUrl),
                    Description = COALESCE(@description, Description),
                    Website = COALESCE(@website, Website),
                    IsActive = COALESCE(@isActive, IsActive)
                WHERE BrandID = @brandId
            `);

        return successResponse(res, null, 'Cập nhật brand thành công');

    } catch (error) {
        console.error('Update brand error:', error);
        return errorResponse(res, 'Lỗi khi cập nhật brand', 500);
    }
};

// Xóa brand
exports.deleteBrand = async (req, res) => {
    try {
        const pool = await getPool();
        const { id } = req.params;

        // Check if brand exists
        const checkBrand = await pool.request()
            .input('brandId', id)
            .query('SELECT BrandID FROM Brands WHERE BrandID = @brandId');

        if (checkBrand.recordset.length === 0) {
            return errorResponse(res, 'Không tìm thấy brand', 404);
        }

        // Check if brand has products
        const checkProducts = await pool.request()
            .input('brandId', id)
            .query('SELECT COUNT(*) as Count FROM Products WHERE BrandID = @brandId');

        if (checkProducts.recordset[0].Count > 0) {
            return errorResponse(res, 'Không thể xóa brand có sản phẩm', 400);
        }

        // Soft delete - set IsActive = 0
        await pool.request()
            .input('brandId', id)
            .query('UPDATE Brands SET IsActive = 0 WHERE BrandID = @brandId');

        return successResponse(res, null, 'Xóa brand thành công');

    } catch (error) {
        console.error('Delete brand error:', error);
        return errorResponse(res, 'Lỗi khi xóa brand', 500);
    }
};

// Lấy tất cả brands (admin)
exports.getAllBrands = async (req, res) => {
    try {
        const pool = await getPool();

        const result = await pool.request().query(`
            SELECT 
                b.*,
                (SELECT COUNT(*) FROM Products WHERE BrandID = b.BrandID) as ProductCount
            FROM Brands b
            ORDER BY b.BrandName
        `);

        return successResponse(res, result.recordset, 'Lấy danh sách brands thành công');

    } catch (error) {
        console.error('Get all brands error:', error);
        return errorResponse(res, 'Lỗi khi lấy danh sách brands', 500);
    }
};
