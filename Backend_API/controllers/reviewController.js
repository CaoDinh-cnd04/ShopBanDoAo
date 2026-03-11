const { executeQuery } = require('../config/database');
const { validationResult } = require('express-validator');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { HTTP_STATUS, MESSAGES } = require('../utils/constants');

// Create product review
const createProductReview = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return errorResponse(res, MESSAGES.INVALID_INPUT, HTTP_STATUS.BAD_REQUEST, errors.array());
        }

        const userId = req.user.userId;
        const { productId, rating, reviewTitle, reviewContent } = req.body;

        // Check if product exists
        const products = await executeQuery(
            `SELECT ProductID FROM Products WHERE ProductID = @productId AND IsActive = 1`,
            { productId: parseInt(productId) }
        );

        if (!products || products.length === 0) {
            return errorResponse(res, MESSAGES.PRODUCT_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
        }

        // Check if user already reviewed
        const existingReviews = await executeQuery(
            `SELECT ReviewID FROM ProductReviews WHERE ProductID = @productId AND UserID = @userId`,
            { productId: parseInt(productId), userId }
        );

        if (existingReviews && existingReviews.length > 0) {
            return errorResponse(res, 'Bạn đã đánh giá sản phẩm này rồi', HTTP_STATUS.CONFLICT);
        }

        // Check if user has purchased (for verified purchase badge)
        const hasPurchased = await executeQuery(
            `SELECT TOP 1 oi.OrderItemID
             FROM OrderItems oi
             INNER JOIN Orders o ON oi.OrderID = o.OrderID
             INNER JOIN ProductVariants pv ON oi.VariantID = pv.VariantID
             WHERE pv.ProductID = @productId AND o.UserID = @userId
             AND o.StatusID IN (SELECT StatusID FROM OrderStatus WHERE StatusName = N'Hoàn thành')`,
            { productId: parseInt(productId), userId }
        );

        const result = await executeQuery(
            `INSERT INTO ProductReviews (
                ProductID, UserID, Rating, ReviewTitle, ReviewContent, 
                IsVerifiedPurchase, IsApproved, CreatedDate
            )
            OUTPUT INSERTED.ReviewID
            VALUES (
                @productId, @userId, @rating, @reviewTitle, @reviewContent,
                @isVerifiedPurchase, 0, GETDATE()
            )`,
            {
                productId: parseInt(productId),
                userId,
                rating: parseInt(rating),
                reviewTitle: reviewTitle || null,
                reviewContent: reviewContent || null,
                isVerifiedPurchase: hasPurchased && hasPurchased.length > 0 ? 1 : 0
            }
        );

        return successResponse(res, { reviewId: result[0].ReviewID }, 'Đánh giá thành công', HTTP_STATUS.CREATED);
    } catch (error) {
        next(error);
    }
};

// Create court review
const createCourtReview = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return errorResponse(res, MESSAGES.INVALID_INPUT, HTTP_STATUS.BAD_REQUEST, errors.array());
        }

        const userId = req.user.userId;
        const { courtId, bookingId, rating, reviewTitle, reviewContent } = req.body;

        // Check if court exists
        const courts = await executeQuery(
            `SELECT CourtID FROM Courts WHERE CourtID = @courtId AND IsActive = 1`,
            { courtId: parseInt(courtId) }
        );

        if (!courts || courts.length === 0) {
            return errorResponse(res, 'Không tìm thấy sân', HTTP_STATUS.NOT_FOUND);
        }

        // Verify booking if provided
        if (bookingId) {
            const bookings = await executeQuery(
                `SELECT BookingID FROM Bookings 
                 WHERE BookingID = @bookingId AND UserID = @userId AND CourtID = @courtId`,
                { bookingId: parseInt(bookingId), userId, courtId: parseInt(courtId) }
            );

            if (!bookings || bookings.length === 0) {
                return errorResponse(res, 'Booking không hợp lệ', HTTP_STATUS.BAD_REQUEST);
            }
        }

        const result = await executeQuery(
            `INSERT INTO CourtReviews (
                CourtID, UserID, BookingID, Rating, ReviewTitle, ReviewContent,
                IsVerifiedBooking, IsApproved, CreatedDate
            )
            OUTPUT INSERTED.ReviewID
            VALUES (
                @courtId, @userId, @bookingId, @rating, @reviewTitle, @reviewContent,
                @isVerifiedBooking, 0, GETDATE()
            )`,
            {
                courtId: parseInt(courtId),
                userId,
                bookingId: bookingId ? parseInt(bookingId) : null,
                rating: parseInt(rating),
                reviewTitle: reviewTitle || null,
                reviewContent: reviewContent || null,
                isVerifiedBooking: bookingId ? 1 : 0
            }
        );

        return successResponse(res, { reviewId: result[0].ReviewID }, 'Đánh giá thành công', HTTP_STATUS.CREATED);
    } catch (error) {
        next(error);
    }
};

// Get product reviews
const getProductReviews = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

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
             ORDER BY pr.CreatedDate DESC
             OFFSET @offset ROWS
             FETCH NEXT @limit ROWS ONLY`,
            { productId: parseInt(productId), offset, limit: parseInt(limit) }
        );

        const countResult = await executeQuery(
            `SELECT COUNT(*) as Total FROM ProductReviews WHERE ProductID = @productId AND IsApproved = 1`,
            { productId: parseInt(productId) }
        );

        return res.json({
            success: true,
            data: reviews,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult[0].Total,
                totalPages: Math.ceil(countResult[0].Total / parseInt(limit))
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createProductReview,
    createCourtReview,
    getProductReviews
};
