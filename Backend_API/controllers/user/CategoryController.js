const express = require('express');
const router = express.Router();
const BaseController = require('../base/BaseController');

class CategoryController extends BaseController {
    async getCategories(req, res, next) {
        try {
            const db = this.getDb();

            const categories = await db.collection('categories').find({ isActive: true })
                .sort({ displayOrder: 1, categoryName: 1 })
                .toArray();

            for (const category of categories) {
                const subCategories = await db.collection('subCategories').find({
                    categoryId: category._id,
                    isActive: true
                }).sort({ displayOrder: 1, subCategoryName: 1 }).toArray();

                category.subCategories = subCategories.map(sc => ({
                    ...sc,
                    subCategoryId: sc._id.toString(),
                    categoryId: sc.categoryId.toString()
                }));
                category.categoryId = category._id.toString();
            }

            res.json({
                success: true,
                data: categories
            });
        } catch (error) {
            next(error);
        }
    }

    async getCategoryById(req, res, next) {
        try {
            const { id } = req.params;
            const db = this.getDb();

            const isObjectId = this.isValidObjectId(id);
            const filter = isObjectId
                ? { _id: new this.ObjectId(id), isActive: true }
                : { categorySlug: id, isActive: true };

            const category = await db.collection('categories').findOne(filter);

            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy danh mục'
                });
            }

            const subCategories = await db.collection('subCategories').find({
                categoryId: category._id,
                isActive: true
            }).sort({ displayOrder: 1, subCategoryName: 1 }).toArray();

            category.subCategories = subCategories.map(sc => ({
                ...sc,
                subCategoryId: sc._id.toString(),
                categoryId: sc.categoryId.toString()
            }));
            category.categoryId = category._id.toString();

            res.json({
                success: true,
                data: category
            });
        } catch (error) {
            next(error);
        }
    }

    async getBrands(req, res, next) {
        try {
            const db = this.getDb();

            const brands = await db.collection('brands').find({ isActive: true })
                .sort({ brandName: 1 })
                .toArray();

            res.json({
                success: true,
                data: brands.map(b => ({ ...b, brandId: b._id.toString() }))
            });
        } catch (error) {
            next(error);
        }
    }
}

const categoryController = new CategoryController();

router.get('/', (req, res, next) => categoryController.getCategories(req, res, next));
router.get('/brands', (req, res, next) => categoryController.getBrands(req, res, next));
router.get('/:id', (req, res, next) => categoryController.getCategoryById(req, res, next));

module.exports = router;
