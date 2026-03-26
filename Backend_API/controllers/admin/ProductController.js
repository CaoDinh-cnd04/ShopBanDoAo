const express = require('express');
const router = express.Router();
const BaseController = require('../base/BaseController');
const { body, validationResult } = require('express-validator');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');
const { authenticate, authorize } = require('../../middleware/auth');

class AdminProductController extends BaseController {
    /** Chi tiết sản phẩm cho admin (kể cả isActive: false), không tăng viewCount */
    async getProductById(req, res, next) {
        try {
            const { id } = req.params;
            if (!this.isValidObjectId(id)) {
                return errorResponse(res, 'ID sản phẩm không hợp lệ', 400);
            }
            const db = this.getDb();
            const product = await db.collection('products').findOne({ _id: new this.ObjectId(id) });
            if (!product) {
                return errorResponse(res, 'Không tìm thấy sản phẩm', 404);
            }
            const subCat = await db.collection('subCategories').findOne({ _id: product.subCategoryId });
            const brand = await db.collection('brands').findOne({ _id: product.brandId });
            const cat = subCat ? await db.collection('categories').findOne({ _id: subCat.categoryId }) : null;

            const data = {
                ...product,
                productId: product._id.toString(),
                subCategoryId: product.subCategoryId?.toString(),
                brandId: product.brandId?.toString(),
                subCategoryName: subCat?.subCategoryName,
                categoryId: cat?._id?.toString(),
                categoryName: cat?.categoryName,
                brandName: brand?.brandName
            };
            return successResponse(res, data, 'Lấy sản phẩm thành công');
        } catch (error) {
            next(error);
        }
    }

    async createProduct(req, res, next) {
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

            const db = this.getDb();
            const now = new Date();

            const result = await db.collection('products').insertOne({
                productCode,
                productName,
                productSlug,
                subCategoryId: new this.ObjectId(subCategoryId),
                brandId: new this.ObjectId(brandId),
                description: description || null,
                shortDescription: shortDescription || null,
                material: material || null,
                origin: origin || null,
                weight: weight || null,
                isFeatured: isFeatured === true || isFeatured === 'true',
                isNewArrival: isNewArrival === true || isNewArrival === 'true',
                isActive: true,
                viewCount: 0,
                avgRating: null,
                reviewCount: 0,
                createdDate: now,
                updatedDate: now
            });

            res.status(201).json({
                success: true,
                message: 'Tạo sản phẩm thành công',
                data: { productId: result.insertedId.toString() }
            });
        } catch (error) {
            next(error);
        }
    }

    async updateProduct(req, res, next) {
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

            const db = this.getDb();
            const update = {
                productName,
                productSlug,
                subCategoryId: subCategoryId ? new this.ObjectId(subCategoryId) : undefined,
                brandId: brandId ? new this.ObjectId(brandId) : undefined,
                description: description ?? null,
                shortDescription: shortDescription ?? null,
                material: material ?? null,
                origin: origin ?? null,
                weight: weight ?? null,
                isFeatured: isFeatured === true || isFeatured === 'true',
                isNewArrival: isNewArrival === true || isNewArrival === 'true',
                updatedDate: new Date()
            };
            if (isActive !== undefined) update.isActive = isActive === true || isActive === 'true';

            await db.collection('products').updateOne(
                { _id: new this.ObjectId(id) },
                { $set: update }
            );

            res.json({
                success: true,
                message: 'Cập nhật sản phẩm thành công'
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteProduct(req, res, next) {
        try {
            const { id } = req.params;
            const db = this.getDb();

            await db.collection('products').updateOne(
                { _id: new this.ObjectId(id) },
                { $set: { isActive: false } }
            );

            res.json({
                success: true,
                message: 'Xóa sản phẩm thành công'
            });
        } catch (error) {
            next(error);
        }
    }
}

const adminProductController = new AdminProductController();

router.use(authenticate);
router.use(authorize('Admin'));

router.get('/:id', (req, res, next) => adminProductController.getProductById(req, res, next));

router.post('/', [
    body('productCode').trim().notEmpty().withMessage('Mã sản phẩm không được để trống'),
    body('productName').trim().notEmpty().withMessage('Tên sản phẩm không được để trống'),
    body('productSlug').trim().notEmpty().withMessage('Slug không được để trống'),
    body('subCategoryId').notEmpty().withMessage('Danh mục con không hợp lệ'),
    body('brandId').notEmpty().withMessage('Thương hiệu không hợp lệ')
], (req, res, next) => adminProductController.createProduct(req, res, next));

router.put('/:id', (req, res, next) => adminProductController.updateProduct(req, res, next));

router.delete('/:id', (req, res, next) => adminProductController.deleteProduct(req, res, next));

module.exports = router;
