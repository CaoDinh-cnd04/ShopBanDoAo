const { executeQuery } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { HTTP_STATUS, MESSAGES } = require('../utils/constants');

// Get wishlist
const getWishlist = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        // Get or create wishlist
        let wishlists = await executeQuery(
            `SELECT WishlistID FROM Wishlists WHERE UserID = @userId`,
            { userId }
        );

        let wishlistId;
        if (!wishlists || wishlists.length === 0) {
            const result = await executeQuery(
                `INSERT INTO Wishlists (UserID, CreatedDate) OUTPUT INSERTED.WishlistID VALUES (@userId, GETDATE())`,
                { userId }
            );
            wishlistId = result[0].WishlistID;
        } else {
            wishlistId = wishlists[0].WishlistID;
        }

        // Get wishlist items
        const items = await executeQuery(
            `SELECT 
                wi.WishlistItemID,
                wi.AddedDate,
                p.ProductID,
                p.ProductName,
                p.ProductSlug,
                p.ShortDescription,
                p.AvgRating,
                p.ReviewCount,
                (SELECT TOP 1 ImageUrl FROM ProductImages WHERE ProductID = p.ProductID AND IsPrimary = 1) as PrimaryImage,
                (SELECT MIN(SalePrice) FROM ProductVariants WHERE ProductID = p.ProductID AND IsActive = 1) as MinPrice
             FROM WishlistItems wi
             INNER JOIN Products p ON wi.ProductID = p.ProductID
             WHERE wi.WishlistID = @wishlistId AND p.IsActive = 1
             ORDER BY wi.AddedDate DESC`,
            { wishlistId }
        );

        return successResponse(res, { wishlistId, items, itemCount: items.length });
    } catch (error) {
        next(error);
    }
};

// Add to wishlist
const addToWishlist = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { productId } = req.body;

        // Verify product exists
        const products = await executeQuery(
            `SELECT ProductID FROM Products WHERE ProductID = @productId AND IsActive = 1`,
            { productId: parseInt(productId) }
        );

        if (!products || products.length === 0) {
            return errorResponse(res, MESSAGES.PRODUCT_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
        }

        // Get or create wishlist
        let wishlists = await executeQuery(
            `SELECT WishlistID FROM Wishlists WHERE UserID = @userId`,
            { userId }
        );

        let wishlistId;
        if (!wishlists || wishlists.length === 0) {
            const result = await executeQuery(
                `INSERT INTO Wishlists (UserID, CreatedDate) OUTPUT INSERTED.WishlistID VALUES (@userId, GETDATE())`,
                { userId }
            );
            wishlistId = result[0].WishlistID;
        } else {
            wishlistId = wishlists[0].WishlistID;
        }

        // Check if already in wishlist
        const existing = await executeQuery(
            `SELECT WishlistItemID FROM WishlistItems 
             WHERE WishlistID = @wishlistId AND ProductID = @productId`,
            { wishlistId, productId: parseInt(productId) }
        );

        if (existing && existing.length > 0) {
            return errorResponse(res, 'Sản phẩm đã có trong wishlist', HTTP_STATUS.CONFLICT);
        }

        // Add to wishlist
        await executeQuery(
            `INSERT INTO WishlistItems (WishlistID, ProductID, AddedDate)
             VALUES (@wishlistId, @productId, GETDATE())`,
            { wishlistId, productId: parseInt(productId) }
        );

        return successResponse(res, null, 'Thêm vào wishlist thành công');
    } catch (error) {
        next(error);
    }
};

// Remove from wishlist
const removeFromWishlist = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        // Verify item belongs to user
        const items = await executeQuery(
            `SELECT wi.WishlistItemID 
             FROM WishlistItems wi
             INNER JOIN Wishlists w ON wi.WishlistID = w.WishlistID
             WHERE wi.WishlistItemID = @id AND w.UserID = @userId`,
            { id: parseInt(id), userId }
        );

        if (!items || items.length === 0) {
            return errorResponse(res, 'Không tìm thấy sản phẩm trong wishlist', HTTP_STATUS.NOT_FOUND);
        }

        await executeQuery(
            `DELETE FROM WishlistItems WHERE WishlistItemID = @id`,
            { id: parseInt(id) }
        );

        return successResponse(res, null, 'Xóa khỏi wishlist thành công');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getWishlist,
    addToWishlist,
    removeFromWishlist
};
