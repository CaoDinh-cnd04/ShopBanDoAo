const { executeQuery } = require('../config/database');
const { validationResult } = require('express-validator');

// Get cart
const getCart = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        // Get or create cart
        let carts = await executeQuery(
            `SELECT CartID FROM Carts WHERE UserID = @userId`,
            { userId }
        );

        let cartId;
        if (!carts || carts.length === 0) {
            const result = await executeQuery(
                `INSERT INTO Carts (UserID, CreatedDate) OUTPUT INSERTED.CartID VALUES (@userId, GETDATE())`,
                { userId }
            );
            cartId = result[0].CartID;
        } else {
            cartId = carts[0].CartID;
        }

        // Get cart items
        const items = await executeQuery(
            `SELECT 
                ci.CartItemID,
                ci.Quantity,
                ci.AddedDate,
                pv.VariantID,
                pv.SKU,
                pv.OriginalPrice,
                pv.SalePrice,
                p.ProductID,
                p.ProductName,
                p.ProductSlug,
                s.SizeName,
                c.ColorName,
                c.ColorCode,
                pi.StockQuantity,
                (SELECT TOP 1 ImageUrl FROM ProductImages WHERE ProductID = p.ProductID AND IsPrimary = 1) as ProductImage
             FROM CartItems ci
             INNER JOIN ProductVariants pv ON ci.VariantID = pv.VariantID
             INNER JOIN Products p ON pv.ProductID = p.ProductID
             INNER JOIN Sizes s ON pv.SizeID = s.SizeID
             INNER JOIN Colors c ON pv.ColorID = c.ColorID
             LEFT JOIN ProductInventory pi ON pv.VariantID = pi.VariantID
             WHERE ci.CartID = @cartId AND p.IsActive = 1 AND pv.IsActive = 1
             ORDER BY ci.AddedDate DESC`,
            { cartId }
        );

        // Calculate totals
        let total = 0;
        items.forEach(item => {
            const price = item.SalePrice || item.OriginalPrice;
            total += price * item.Quantity;
        });

        res.json({
            success: true,
            data: {
                cartId,
                items,
                total,
                itemCount: items.length
            }
        });
    } catch (error) {
        next(error);
    }
};

// Add item to cart
const addToCart = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const userId = req.user.userId;
        const { variantId, quantity } = req.body;

        // Get or create cart
        let carts = await executeQuery(
            `SELECT CartID FROM Carts WHERE UserID = @userId`,
            { userId }
        );

        let cartId;
        if (!carts || carts.length === 0) {
            const result = await executeQuery(
                `INSERT INTO Carts (UserID, CreatedDate) OUTPUT INSERTED.CartID VALUES (@userId, GETDATE())`,
                { userId }
            );
            cartId = result[0].CartID;
        } else {
            cartId = carts[0].CartID;
        }

        // Check if item already in cart
        const existingItems = await executeQuery(
            `SELECT CartItemID, Quantity FROM CartItems WHERE CartID = @cartId AND VariantID = @variantId`,
            { cartId, variantId: parseInt(variantId) }
        );

        if (existingItems && existingItems.length > 0) {
            // Update quantity
            await executeQuery(
                `UPDATE CartItems SET Quantity = Quantity + @quantity WHERE CartItemID = @cartItemId`,
                { quantity: parseInt(quantity), cartItemId: existingItems[0].CartItemID }
            );
        } else {
            // Add new item
            await executeQuery(
                `INSERT INTO CartItems (CartID, VariantID, Quantity, AddedDate)
                 VALUES (@cartId, @variantId, @quantity, GETDATE())`,
                { cartId, variantId: parseInt(variantId), quantity: parseInt(quantity) }
            );
        }

        // Update cart updated date
        await executeQuery(
            `UPDATE Carts SET UpdatedDate = GETDATE() WHERE CartID = @cartId`,
            { cartId }
        );

        res.json({
            success: true,
            message: 'Thêm vào giỏ hàng thành công'
        });
    } catch (error) {
        next(error);
    }
};

// Update cart item
const updateCartItem = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const userId = req.user.userId;
        const { id } = req.params;
        const { quantity } = req.body;

        // Verify cart item belongs to user
        const items = await executeQuery(
            `SELECT ci.CartItemID 
             FROM CartItems ci
             INNER JOIN Carts c ON ci.CartID = c.CartID
             WHERE ci.CartItemID = @id AND c.UserID = @userId`,
            { id: parseInt(id), userId }
        );

        if (!items || items.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm trong giỏ hàng'
            });
        }

        if (parseInt(quantity) <= 0) {
            // Remove item
            await executeQuery(
                `DELETE FROM CartItems WHERE CartItemID = @id`,
                { id: parseInt(id) }
            );
        } else {
            // Update quantity
            await executeQuery(
                `UPDATE CartItems SET Quantity = @quantity WHERE CartItemID = @id`,
                { id: parseInt(id), quantity: parseInt(quantity) }
            );
        }

        res.json({
            success: true,
            message: 'Cập nhật giỏ hàng thành công'
        });
    } catch (error) {
        next(error);
    }
};

// Remove item from cart
const removeFromCart = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        // Verify cart item belongs to user
        const items = await executeQuery(
            `SELECT ci.CartItemID 
             FROM CartItems ci
             INNER JOIN Carts c ON ci.CartID = c.CartID
             WHERE ci.CartItemID = @id AND c.UserID = @userId`,
            { id: parseInt(id), userId }
        );

        if (!items || items.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm trong giỏ hàng'
            });
        }

        await executeQuery(
            `DELETE FROM CartItems WHERE CartItemID = @id`,
            { id: parseInt(id) }
        );

        res.json({
            success: true,
            message: 'Xóa sản phẩm khỏi giỏ hàng thành công'
        });
    } catch (error) {
        next(error);
    }
};

// Clear cart
const clearCart = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        const carts = await executeQuery(
            `SELECT CartID FROM Carts WHERE UserID = @userId`,
            { userId }
        );

        if (carts && carts.length > 0) {
            await executeQuery(
                `DELETE FROM CartItems WHERE CartID = @cartId`,
                { cartId: carts[0].CartID }
            );
        }

        res.json({
            success: true,
            message: 'Xóa giỏ hàng thành công'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
};
