const { executeQuery } = require('../config/database');

// Get all categories
const getCategories = async (req, res, next) => {
    try {
        const categories = await executeQuery(
            `SELECT 
                CategoryID,
                CategoryName,
                CategorySlug,
                Description,
                ImageUrl,
                DisplayOrder,
                IsActive
             FROM Categories
             WHERE IsActive = 1
             ORDER BY DisplayOrder ASC, CategoryName ASC`
        );

        // Get subcategories for each category
        for (let category of categories) {
            const subCategories = await executeQuery(
                `SELECT 
                    SubCategoryID,
                    SubCategoryName,
                    SubCategorySlug,
                    Description,
                    DisplayOrder,
                    IsActive
                 FROM SubCategories
                 WHERE CategoryID = @categoryId AND IsActive = 1
                 ORDER BY DisplayOrder ASC, SubCategoryName ASC`,
                { categoryId: category.CategoryID }
            );
            category.subCategories = subCategories;
        }

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        next(error);
    }
};

// Get category by ID or slug
const getCategoryById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const isNumeric = /^\d+$/.test(id);

        let query = `
            SELECT 
                CategoryID,
                CategoryName,
                CategorySlug,
                Description,
                ImageUrl,
                DisplayOrder,
                IsActive
             FROM Categories
             WHERE IsActive = 1 AND 
        `;

        if (isNumeric) {
            query += 'CategoryID = @id';
        } else {
            query += 'CategorySlug = @id';
        }

        const categories = await executeQuery(query, { id });

        if (!categories || categories.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy danh mục'
            });
        }

        const category = categories[0];

        // Get subcategories
        const subCategories = await executeQuery(
            `SELECT 
                SubCategoryID,
                SubCategoryName,
                SubCategorySlug,
                Description,
                DisplayOrder,
                IsActive
             FROM SubCategories
             WHERE CategoryID = @categoryId AND IsActive = 1
             ORDER BY DisplayOrder ASC, SubCategoryName ASC`,
            { categoryId: category.CategoryID }
        );

        category.subCategories = subCategories;

        res.json({
            success: true,
            data: category
        });
    } catch (error) {
        next(error);
    }
};

// Get all brands
const getBrands = async (req, res, next) => {
    try {
        const brands = await executeQuery(
            `SELECT 
                BrandID,
                BrandName,
                BrandSlug,
                LogoUrl,
                Description,
                Website,
                IsActive
             FROM Brands
             WHERE IsActive = 1
             ORDER BY BrandName ASC`
        );

        res.json({
            success: true,
            data: brands
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCategories,
    getCategoryById,
    getBrands
};
