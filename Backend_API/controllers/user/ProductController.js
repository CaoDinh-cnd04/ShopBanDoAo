const express = require('express');
const router = express.Router();
const BaseController = require('../base/BaseController');

class ProductController extends BaseController {
    async getProducts(req, res, next) {
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
                sortBy = 'createdDate',
                sortOrder = 'desc'
            } = req.query;

            const db = this.getDb();
            const skip = (parseInt(page) - 1) * parseInt(limit);
            const match = { isActive: true };

            if (subCategoryId) match.subCategoryId = new this.ObjectId(subCategoryId);
            if (brandId) match.brandId = new this.ObjectId(brandId);
            if (categoryId) {
                const subIds = await db.collection('subCategories').find({ categoryId: new this.ObjectId(categoryId) }).project({ _id: 1 }).toArray();
                match.subCategoryId = { $in: subIds.map(s => s._id) };
            }
            if (search) {
                match.$or = [
                    { productName: new RegExp(search, 'i') },
                    { description: new RegExp(search, 'i') }
                ];
            }
            if (isFeatured === 'true') match.isFeatured = true;
            if (isNewArrival === 'true') match.isNewArrival = true;

            const sortOpt = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
            if (sortBy === 'price') sortOpt.minPrice = sortOrder === 'asc' ? 1 : -1;

            const pipeline = [
                { $match: match },
                {
                    $lookup: {
                        from: 'subCategories',
                        localField: 'subCategoryId',
                        foreignField: '_id',
                        as: 'subCat'
                    }
                },
                { $unwind: { path: '$subCat', preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: 'categories',
                        localField: 'subCat.categoryId',
                        foreignField: '_id',
                        as: 'cat'
                    }
                },
                { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: 'brands',
                        localField: 'brandId',
                        foreignField: '_id',
                        as: 'brand'
                    }
                },
                { $unwind: { path: '$brand', preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: 'productVariants',
                        let: { pid: '$_id' },
                        pipeline: [
                            { $match: { $expr: { $eq: ['$productId', '$$pid'] }, isActive: true } },
                            { $group: { _id: null, minSale: { $min: '$salePrice' }, minOrig: { $min: '$originalPrice' }, maxOrig: { $max: '$originalPrice' } } }
                        ],
                        as: 'prices'
                    }
                },
                {
                    $addFields: {
                        minPrice: { $ifNull: [{ $arrayElemAt: ['$prices.minSale', 0] }, { $arrayElemAt: ['$prices.minOrig', 0] }] },
                        maxPrice: { $arrayElemAt: ['$prices.maxOrig', 0] }
                    }
                },
                ...(minPrice || maxPrice ? [{
                    $match: Object.assign(
                        {},
                        minPrice && { minPrice: { $gte: parseFloat(minPrice) } },
                        maxPrice && { maxPrice: { $lte: parseFloat(maxPrice) } }
                    )
                }] : []),
                {
                    $lookup: {
                        from: 'productImages',
                        let: { pid: '$_id' },
                        pipeline: [
                            { $match: { $expr: { $eq: ['$productId', '$$pid'] }, isPrimary: true } },
                            { $limit: 1 },
                            { $project: { imageUrl: 1 } }
                        ],
                        as: 'primaryImg'
                    }
                },
                {
                    $addFields: {
                        primaryImage: { $arrayElemAt: ['$primaryImg.imageUrl', 0] },
                        subCategoryId: '$subCat._id',
                        subCategoryName: '$subCat.subCategoryName',
                        categoryId: '$cat._id',
                        categoryName: '$cat.categoryName',
                        brandId: '$brand._id',
                        brandName: '$brand.brandName',
                        brandLogo: '$brand.logoUrl'
                    }
                },
                { $sort: sortOpt },
                { $skip: skip },
                { $limit: parseInt(limit) },
                { $project: { subCat: 0, cat: 0, brand: 0, prices: 0, primaryImg: 0 } }
            ].filter(Boolean);

            const products = await db.collection('products').aggregate(pipeline).toArray();

            const countPipeline = [
                { $match: match },
                ...(categoryId ? [{ $lookup: { from: 'subCategories', localField: 'subCategoryId', foreignField: '_id', as: 'sc' } }, { $match: { 'sc.categoryId': new this.ObjectId(categoryId) } }] : []),
                { $count: 'total' }
            ];
            const countResult = await db.collection('products').aggregate(countPipeline).toArray();
            const total = countResult[0]?.total || 0;

            const data = products.map(p => ({
                ...p,
                productId: p._id.toString(),
                subCategoryId: p.subCategoryId?.toString(),
                categoryId: p.categoryId?.toString(),
                brandId: p.brandId?.toString()
            }));

            res.json({
                success: true,
                data,
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
    }

    async getProductById(req, res, next) {
        try {
            const { id } = req.params;
            const db = this.getDb();

            const isObjectId = this.isValidObjectId(id);
            const filter = isObjectId
                ? { _id: new this.ObjectId(id), isActive: true }
                : { productSlug: id, isActive: true };

            const product = await db.collection('products').findOne(filter);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy sản phẩm'
                });
            }

            await db.collection('products').updateOne(
                { _id: product._id },
                { $inc: { viewCount: 1 } }
            );
            product.viewCount = (product.viewCount || 0) + 1;

            const images = await db.collection('productImages').find({ productId: product._id })
                .sort({ isPrimary: -1, displayOrder: 1 })
                .toArray();

            const variants = await db.collection('productVariants').aggregate([
                { $match: { productId: product._id, isActive: true } },
                { $lookup: { from: 'sizes', localField: 'sizeId', foreignField: '_id', as: 'size' } },
                { $unwind: '$size' },
                { $lookup: { from: 'colors', localField: 'colorId', foreignField: '_id', as: 'color' } },
                { $unwind: '$color' },
                { $lookup: { from: 'productInventory', localField: '_id', foreignField: 'variantId', as: 'inv' } },
                { $unwind: { path: '$inv', preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        variantId: '$_id',
                        sku: 1,
                        originalPrice: 1,
                        salePrice: 1,
                        currencyCode: 1,
                        isActive: 1,
                        sizeId: '$size._id',
                        sizeName: '$size.sizeName',
                        colorId: '$color._id',
                        colorName: '$color.colorName',
                        colorCode: '$color.colorCode',
                        stockQuantity: '$inv.stockQuantity',
                        reorderLevel: '$inv.reorderLevel'
                    }
                },
                { $sort: { 'size.sizeOrder': 1, colorName: 1 } }
            ]).toArray();

            const reviews = await db.collection('productReviews').aggregate([
                { $match: { productId: product._id, isApproved: true } },
                { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
                { $unwind: '$user' },
                {
                    $project: {
                        reviewId: '$_id',
                        rating: 1,
                        reviewTitle: 1,
                        reviewContent: 1,
                        isVerifiedPurchase: 1,
                        createdDate: 1,
                        userId: '$user._id',
                        username: '$user.username',
                        fullName: '$user.fullName',
                        avatar: '$user.avatar'
                    }
                },
                { $sort: { createdDate: -1 } }
            ]).toArray();

            const subCat = await db.collection('subCategories').findOne({ _id: product.subCategoryId });
            const cat = subCat ? await db.collection('categories').findOne({ _id: subCat.categoryId }) : null;
            const brand = await db.collection('brands').findOne({ _id: product.brandId });

            res.json({
                success: true,
                data: {
                    ...product,
                    productId: product._id.toString(),
                    subCategoryId: product.subCategoryId?.toString(),
                    subCategoryName: subCat?.subCategoryName,
                    subCategorySlug: subCat?.subCategorySlug,
                    categoryId: cat?._id?.toString(),
                    categoryName: cat?.categoryName,
                    categorySlug: cat?.categorySlug,
                    brandId: brand?._id?.toString(),
                    brandName: brand?.brandName,
                    brandSlug: brand?.brandSlug,
                    brandLogo: brand?.logoUrl,
                    brandDescription: brand?.description,
                    images,
                    variants: variants.map(v => ({ ...v, variantId: v.variantId?.toString(), sizeId: v.sizeId?.toString(), colorId: v.colorId?.toString() })),
                    reviews: reviews.map(r => ({ ...r, reviewId: r.reviewId?.toString(), userId: r.userId?.toString() }))
                }
            });
        } catch (error) {
            next(error);
        }
    }
}

const userProductController = new ProductController();

router.get('/', (req, res, next) => userProductController.getProducts(req, res, next));
router.get('/:id', (req, res, next) => userProductController.getProductById(req, res, next));

module.exports = router;
