const { executeQuery } = require('../config/database');

// Get all courts
const getCourts = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, courtTypeId, search, sortBy = 'CourtName', sortOrder = 'ASC' } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let whereConditions = ['c.IsActive = 1'];
        const params = { limit: parseInt(limit), offset };

        if (courtTypeId) {
            whereConditions.push('c.CourtTypeID = @courtTypeId');
            params.courtTypeId = parseInt(courtTypeId);
        }

        if (search) {
            whereConditions.push('(c.CourtName LIKE @search OR c.Location LIKE @search)');
            params.search = `%${search}%`;
        }

        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

        const courts = await executeQuery(
            `SELECT 
                c.CourtID,
                c.CourtName,
                c.CourtCode,
                c.Location,
                c.Address,
                c.Description,
                c.Facilities,
                c.Capacity,
                c.OpenTime,
                c.CloseTime,
                c.AvgRating,
                c.ReviewCount,
                c.IsActive,
                ct.CourtTypeID,
                ct.TypeName as CourtTypeName,
                (SELECT TOP 1 ImageUrl FROM CourtImages WHERE CourtID = c.CourtID AND IsPrimary = 1) as PrimaryImage
             FROM Courts c
             INNER JOIN CourtTypes ct ON c.CourtTypeID = ct.CourtTypeID
             ${whereClause}
             ORDER BY c.${sortBy} ${sortOrder}
             OFFSET @offset ROWS
             FETCH NEXT @limit ROWS ONLY`,
            params
        );

        // Get total count
        const countResult = await executeQuery(
            `SELECT COUNT(*) as Total FROM Courts c ${whereClause}`,
            params
        );
        const total = countResult[0].Total;

        res.json({
            success: true,
            data: courts,
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
};

// Get court by ID
const getCourtById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const courts = await executeQuery(
            `SELECT 
                c.*,
                ct.TypeName as CourtTypeName,
                ct.Description as CourtTypeDescription
             FROM Courts c
             INNER JOIN CourtTypes ct ON c.CourtTypeID = ct.CourtTypeID
             WHERE c.CourtID = @id AND c.IsActive = 1`,
            { id: parseInt(id) }
        );

        if (!courts || courts.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sân'
            });
        }

        const court = courts[0];

        // Get images
        const images = await executeQuery(
            `SELECT ImageID, ImageUrl, AltText, DisplayOrder, IsPrimary
             FROM CourtImages
             WHERE CourtID = @courtId
             ORDER BY IsPrimary DESC, DisplayOrder ASC`,
            { courtId: court.CourtID }
        );

        // Get reviews
        const reviews = await executeQuery(
            `SELECT 
                cr.ReviewID,
                cr.Rating,
                cr.ReviewTitle,
                cr.ReviewContent,
                cr.IsVerifiedBooking,
                cr.CreatedDate,
                u.UserID,
                u.Username,
                u.FullName,
                u.Avatar
             FROM CourtReviews cr
             INNER JOIN Users u ON cr.UserID = u.UserID
             WHERE cr.CourtID = @courtId AND cr.IsApproved = 1
             ORDER BY cr.CreatedDate DESC`,
            { courtId: court.CourtID }
        );

        // Get court types
        const courtTypes = await executeQuery(
            `SELECT CourtTypeID, TypeName, Description FROM CourtTypes WHERE IsActive = 1`
        );

        court.images = images;
        court.reviews = reviews;
        court.courtTypes = courtTypes;

        res.json({
            success: true,
            data: court
        });
    } catch (error) {
        next(error);
    }
};

// Get court types
const getCourtTypes = async (req, res, next) => {
    try {
        const courtTypes = await executeQuery(
            `SELECT CourtTypeID, TypeName, Description, IsActive
             FROM CourtTypes
             WHERE IsActive = 1
             ORDER BY TypeName`
        );

        res.json({
            success: true,
            data: courtTypes
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCourts,
    getCourtById,
    getCourtTypes
};
