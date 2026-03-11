const { getPool } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

/**
 * Admin Review Management Controller
 */

// Lấy tất cả reviews (admin)
exports.getAllReviews = async (req, res) => {
    try {
        const pool = await getPool();
        const {
            page = 1,
            limit = 20,
            type = 'all', // 'product', 'court', 'all'
            isApproved,
            rating
        } = req.query;

        const offset = (page - 1) * limit;

        let query = '';
        let whereConditions = [];
        const request = pool.request();

        if (isApproved !== undefined) {
            whereConditions.push('IsApproved = @isApproved');
            request.input('isApproved', isApproved === 'true' ? 1 : 0);
        }

        if (rating) {
            whereConditions.push('Rating = @rating');
            request.input('rating', parseInt(rating));
        }

        const whereClause = whereConditions.length > 0
            ? `WHERE ${whereConditions.join(' AND ')}`
            : '';

        if (type === 'product' || type === 'all') {
            const productReviewsQuery = `
                SELECT 
                    pr.ReviewID,
                    'Product' as ReviewType,
                    pr.ProductID as ItemID,
                    p.ProductName as ItemName,
                    pr.UserID,
                    u.FullName as UserName,
                    u.Email as UserEmail,
                    pr.Rating,
                    pr.ReviewTitle,
                    pr.ReviewContent,
                    pr.IsVerifiedPurchase,
                    pr.IsApproved,
                    pr.CreatedDate,
                    pr.UpdatedDate
                FROM ProductReviews pr
                INNER JOIN Products p ON pr.ProductID = p.ProductID
                INNER JOIN Users u ON pr.UserID = u.UserID
                ${whereClause}
            `;
            query = productReviewsQuery;
        }

        if (type === 'court' || type === 'all') {
            const courtReviewsQuery = `
                SELECT 
                    cr.ReviewID,
                    'Court' as ReviewType,
                    cr.CourtID as ItemID,
                    c.CourtName as ItemName,
                    cr.UserID,
                    u.FullName as UserName,
                    u.Email as UserEmail,
                    cr.Rating,
                    cr.ReviewTitle,
                    cr.ReviewContent,
                    cr.IsVerifiedBooking as IsVerifiedPurchase,
                    cr.IsApproved,
                    cr.CreatedDate,
                    cr.UpdatedDate
                FROM CourtReviews cr
                INNER JOIN Courts c ON cr.CourtID = c.CourtID
                INNER JOIN Users u ON cr.UserID = u.UserID
                ${whereClause}
            `;

            if (type === 'all') {
                query = `${query} UNION ALL ${courtReviewsQuery}`;
            } else {
                query = courtReviewsQuery;
            }
        }

        // Add ordering and pagination
        query = `
            WITH AllReviews AS (
                ${query}
            )
            SELECT * FROM AllReviews
            ORDER BY CreatedDate DESC
            OFFSET @offset ROWS
            FETCH NEXT @limit ROWS ONLY
        `;

        request.input('offset', offset);
        request.input('limit', parseInt(limit));

        const result = await request.query(query);

        // Get total count
        let countQuery = '';
        if (type === 'product') {
            countQuery = `SELECT COUNT(*) as Total FROM ProductReviews ${whereClause}`;
        } else if (type === 'court') {
            countQuery = `SELECT COUNT(*) as Total FROM CourtReviews ${whereClause}`;
        } else {
            countQuery = `
                SELECT 
                    (SELECT COUNT(*) FROM ProductReviews ${whereClause}) +
                    (SELECT COUNT(*) FROM CourtReviews ${whereClause}) as Total
            `;
        }

        const countRequest = pool.request();
        if (isApproved !== undefined) countRequest.input('isApproved', isApproved === 'true' ? 1 : 0);
        if (rating) countRequest.input('rating', parseInt(rating));

        const countResult = await countRequest.query(countQuery);
        const totalReviews = countResult.recordset[0].Total;

        return successResponse(res, {
            reviews: result.recordset,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalReviews / limit),
                totalReviews: totalReviews,
                limit: parseInt(limit)
            }
        }, 'Lấy danh sách reviews thành công');

    } catch (error) {
        console.error('Get all reviews error:', error);
        return errorResponse(res, 'Lỗi khi lấy danh sách reviews', 500);
    }
};

// Approve/Reject review
exports.updateReviewStatus = async (req, res) => {
    try {
        const pool = await getPool();
        const { id } = req.params;
        const { type, isApproved } = req.body; // type: 'product' or 'court'

        if (!type || isApproved === undefined) {
            return errorResponse(res, 'Vui lòng cung cấp đầy đủ thông tin', 400);
        }

        let query = '';
        if (type === 'product') {
            query = `
                UPDATE ProductReviews
                SET IsApproved = @isApproved, UpdatedDate = GETDATE()
                WHERE ReviewID = @reviewId
            `;
        } else if (type === 'court') {
            query = `
                UPDATE CourtReviews
                SET IsApproved = @isApproved, UpdatedDate = GETDATE()
                WHERE ReviewID = @reviewId
            `;
        } else {
            return errorResponse(res, 'Loại review không hợp lệ', 400);
        }

        const result = await pool.request()
            .input('reviewId', id)
            .input('isApproved', isApproved)
            .query(query);

        if (result.rowsAffected[0] === 0) {
            return errorResponse(res, 'Không tìm thấy review', 404);
        }

        const message = isApproved ? 'Duyệt review thành công' : 'Từ chối review thành công';
        return successResponse(res, null, message);

    } catch (error) {
        console.error('Update review status error:', error);
        return errorResponse(res, 'Lỗi khi cập nhật trạng thái review', 500);
    }
};

// Xóa review
exports.deleteReview = async (req, res) => {
    try {
        const pool = await getPool();
        const { id } = req.params;
        const { type } = req.body; // type: 'product' or 'court'

        if (!type) {
            return errorResponse(res, 'Vui lòng cung cấp loại review', 400);
        }

        let query = '';
        if (type === 'product') {
            query = 'DELETE FROM ProductReviews WHERE ReviewID = @reviewId';
        } else if (type === 'court') {
            query = 'DELETE FROM CourtReviews WHERE ReviewID = @reviewId';
        } else {
            return errorResponse(res, 'Loại review không hợp lệ', 400);
        }

        const result = await pool.request()
            .input('reviewId', id)
            .query(query);

        if (result.rowsAffected[0] === 0) {
            return errorResponse(res, 'Không tìm thấy review', 404);
        }

        return successResponse(res, null, 'Xóa review thành công');

    } catch (error) {
        console.error('Delete review error:', error);
        return errorResponse(res, 'Lỗi khi xóa review', 500);
    }
};

// Lấy thống kê reviews
exports.getReviewStats = async (req, res) => {
    try {
        const pool = await getPool();

        const statsQuery = `
            SELECT 
                (SELECT COUNT(*) FROM ProductReviews) as TotalProductReviews,
                (SELECT COUNT(*) FROM CourtReviews) as TotalCourtReviews,
                (SELECT COUNT(*) FROM ProductReviews WHERE IsApproved = 1) as ApprovedProductReviews,
                (SELECT COUNT(*) FROM CourtReviews WHERE IsApproved = 1) as ApprovedCourtReviews,
                (SELECT COUNT(*) FROM ProductReviews WHERE IsApproved = 0) as PendingProductReviews,
                (SELECT COUNT(*) FROM CourtReviews WHERE IsApproved = 0) as PendingCourtReviews,
                (SELECT AVG(CAST(Rating AS FLOAT)) FROM ProductReviews WHERE IsApproved = 1) as AvgProductRating,
                (SELECT AVG(CAST(Rating AS FLOAT)) FROM CourtReviews WHERE IsApproved = 1) as AvgCourtRating
        `;

        const result = await pool.request().query(statsQuery);

        // Get rating distribution for products
        const productRatingDistQuery = `
            SELECT 
                Rating,
                COUNT(*) as Count
            FROM ProductReviews
            WHERE IsApproved = 1
            GROUP BY Rating
            ORDER BY Rating DESC
        `;

        const productRatingDist = await pool.request().query(productRatingDistQuery);

        // Get rating distribution for courts
        const courtRatingDistQuery = `
            SELECT 
                Rating,
                COUNT(*) as Count
            FROM CourtReviews
            WHERE IsApproved = 1
            GROUP BY Rating
            ORDER BY Rating DESC
        `;

        const courtRatingDist = await pool.request().query(courtRatingDistQuery);

        return successResponse(res, {
            overview: result.recordset[0],
            productRatingDistribution: productRatingDist.recordset,
            courtRatingDistribution: courtRatingDist.recordset
        }, 'Lấy thống kê reviews thành công');

    } catch (error) {
        console.error('Get review stats error:', error);
        return errorResponse(res, 'Lỗi khi lấy thống kê reviews', 500);
    }
};
