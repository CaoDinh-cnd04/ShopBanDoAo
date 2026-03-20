const BaseController = require('../base/BaseController');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');

class AdminCategoryController extends BaseController {
    async createCategory(req, res, next) {
        try {
            const db = this.getDb();
            const { categoryName, categorySlug, description, imageUrl, displayOrder } = req.body;
            if (!categoryName || !categorySlug) return errorResponse(res, 'Vui lòng cung cấp tên và slug cho category', 400);
            const existing = await db.collection('categories').findOne({ categoryName });
            if (existing) return errorResponse(res, 'Category đã tồn tại', 400);
            const result = await db.collection('categories').insertOne({ categoryName, categorySlug, description: description || null, imageUrl: imageUrl || null, displayOrder: displayOrder || 0, isActive: true, createdDate: new Date() });
            return successResponse(res, { categoryId: result.insertedId.toString() }, 'Tạo category thành công', 201);
        } catch (error) {
            return errorResponse(res, 'Lỗi khi tạo category', 500);
        }
    }

    async updateCategory(req, res, next) {
        try {
            const db = this.getDb();
            const { id } = req.params;
            const { categoryName, categorySlug, description, imageUrl, displayOrder, isActive } = req.body;
            const cat = await db.collection('categories').findOne({ _id: new this.ObjectId(id) });
            if (!cat) return errorResponse(res, 'Không tìm thấy category', 404);
            const update = {};
            if (categoryName !== undefined) update.categoryName = categoryName;
            if (categorySlug !== undefined) update.categorySlug = categorySlug;
            if (description !== undefined) update.description = description;
            if (imageUrl !== undefined) update.imageUrl = imageUrl;
            if (displayOrder !== undefined) update.displayOrder = displayOrder;
            if (isActive !== undefined) update.isActive = isActive;
            if (Object.keys(update).length) await db.collection('categories').updateOne({ _id: cat._id }, { $set: update });
            return successResponse(res, null, 'Cập nhật category thành công');
        } catch (error) {
            return errorResponse(res, 'Lỗi khi cập nhật category', 500);
        }
    }

    async deleteCategory(req, res, next) {
        try {
            const db = this.getDb();
            const { id } = req.params;
            const cat = await db.collection('categories').findOne({ _id: new this.ObjectId(id) });
            if (!cat) return errorResponse(res, 'Không tìm thấy category', 404);
            const subCount = await db.collection('subCategories').countDocuments({ categoryId: cat._id });
            if (subCount > 0) return errorResponse(res, 'Không thể xóa category có subcategories', 400);
            await db.collection('categories').updateOne({ _id: cat._id }, { $set: { isActive: false } });
            return successResponse(res, null, 'Xóa category thành công');
        } catch (error) {
            return errorResponse(res, 'Lỗi khi xóa category', 500);
        }
    }

    async createSubCategory(req, res, next) {
        try {
            const db = this.getDb();
            const { categoryId, subCategoryName, subCategorySlug, description, displayOrder } = req.body;
            if (!categoryId || !subCategoryName || !subCategorySlug) return errorResponse(res, 'Vui lòng cung cấp đầy đủ thông tin', 400);
            const cat = await db.collection('categories').findOne({ _id: new this.ObjectId(categoryId) });
            if (!cat) return errorResponse(res, 'Không tìm thấy category', 404);
            const result = await db.collection('subCategories').insertOne({ categoryId: cat._id, subCategoryName, subCategorySlug, description: description || null, displayOrder: displayOrder || 0, isActive: true, createdDate: new Date() });
            return successResponse(res, { subCategoryId: result.insertedId.toString() }, 'Tạo subcategory thành công', 201);
        } catch (error) {
            return errorResponse(res, 'Lỗi khi tạo subcategory', 500);
        }
    }

    async updateSubCategory(req, res, next) {
        try {
            const db = this.getDb();
            const { id } = req.params;
            const { categoryId, subCategoryName, subCategorySlug, description, displayOrder, isActive } = req.body;
            const sub = await db.collection('subCategories').findOne({ _id: new this.ObjectId(id) });
            if (!sub) return errorResponse(res, 'Không tìm thấy subcategory', 404);
            const update = {};
            if (categoryId !== undefined) {
                const cat = await db.collection('categories').findOne({ _id: new this.ObjectId(categoryId) });
                if (!cat) return errorResponse(res, 'Không tìm thấy category', 404);
                update.categoryId = cat._id;
            }
            if (subCategoryName !== undefined) update.subCategoryName = subCategoryName;
            if (subCategorySlug !== undefined) update.subCategorySlug = subCategorySlug;
            if (description !== undefined) update.description = description;
            if (displayOrder !== undefined) update.displayOrder = displayOrder;
            if (isActive !== undefined) update.isActive = isActive;
            if (Object.keys(update).length) {
                await db.collection('subCategories').updateOne({ _id: sub._id }, { $set: update });
            }
            return successResponse(res, null, 'Cập nhật subcategory thành công');
        } catch (error) {
            return errorResponse(res, 'Lỗi khi cập nhật subcategory', 500);
        }
    }

    async deleteSubCategory(req, res, next) {
        try {
            const db = this.getDb();
            const { id } = req.params;
            const sub = await db.collection('subCategories').findOne({ _id: new this.ObjectId(id) });
            if (!sub) return errorResponse(res, 'Không tìm thấy subcategory', 404);
            const prodCount = await db.collection('products').countDocuments({ subCategoryId: sub._id });
            if (prodCount > 0) return errorResponse(res, 'Không thể xóa subcategory đang có sản phẩm', 400);
            await db.collection('subCategories').updateOne({ _id: sub._id }, { $set: { isActive: false } });
            return successResponse(res, null, 'Xóa subcategory thành công');
        } catch (error) {
            return errorResponse(res, 'Lỗi khi xóa subcategory', 500);
        }
    }

    async getAllBrands(req, res, next) {
        try {
            const db = this.getDb();
            const brands = await db.collection('brands').aggregate([
                { $lookup: { from: 'products', localField: '_id', foreignField: 'brandId', as: 'prods' } },
                { $addFields: { productCount: { $size: '$prods' } } },
                { $project: { prods: 0 } },
                { $sort: { brandName: 1 } }
            ]).toArray();
            const data = brands.map(b => ({ ...b, brandId: b._id.toString() }));
            return successResponse(res, data, 'Lấy danh sách brands thành công');
        } catch (error) {
            return errorResponse(res, 'Lỗi khi lấy danh sách brands', 500);
        }
    }

    async createBrand(req, res, next) {
        try {
            const db = this.getDb();
            const { brandName, brandSlug, logoUrl, description, website } = req.body;
            if (!brandName || !brandSlug) return errorResponse(res, 'Vui lòng cung cấp tên và slug cho brand', 400);
            const existing = await db.collection('brands').findOne({ brandName });
            if (existing) return errorResponse(res, 'Brand đã tồn tại', 400);
            const result = await db.collection('brands').insertOne({ brandName, brandSlug, logoUrl: logoUrl || null, description: description || null, website: website || null, isActive: true, createdDate: new Date() });
            return successResponse(res, { brandId: result.insertedId.toString() }, 'Tạo brand thành công', 201);
        } catch (error) {
            return errorResponse(res, 'Lỗi khi tạo brand', 500);
        }
    }

    async updateBrand(req, res, next) {
        try {
            const db = this.getDb();
            const { id } = req.params;
            const { brandName, brandSlug, logoUrl, description, website, isActive } = req.body;
            const brand = await db.collection('brands').findOne({ _id: new this.ObjectId(id) });
            if (!brand) return errorResponse(res, 'Không tìm thấy brand', 404);
            const update = {};
            if (brandName !== undefined) update.brandName = brandName;
            if (brandSlug !== undefined) update.brandSlug = brandSlug;
            if (logoUrl !== undefined) update.logoUrl = logoUrl;
            if (description !== undefined) update.description = description;
            if (website !== undefined) update.website = website;
            if (isActive !== undefined) update.isActive = isActive;
            if (Object.keys(update).length) await db.collection('brands').updateOne({ _id: brand._id }, { $set: update });
            return successResponse(res, null, 'Cập nhật brand thành công');
        } catch (error) {
            return errorResponse(res, 'Lỗi khi cập nhật brand', 500);
        }
    }

    async deleteBrand(req, res, next) {
        try {
            const db = this.getDb();
            const { id } = req.params;
            const brand = await db.collection('brands').findOne({ _id: new this.ObjectId(id) });
            if (!brand) return errorResponse(res, 'Không tìm thấy brand', 404);
            const prodCount = await db.collection('products').countDocuments({ brandId: brand._id });
            if (prodCount > 0) return errorResponse(res, 'Không thể xóa brand có sản phẩm', 400);
            await db.collection('brands').updateOne({ _id: brand._id }, { $set: { isActive: false } });
            return successResponse(res, null, 'Xóa brand thành công');
        } catch (error) {
            return errorResponse(res, 'Lỗi khi xóa brand', 500);
        }
    }
}

module.exports = new AdminCategoryController();
