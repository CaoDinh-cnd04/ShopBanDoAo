/**
 * Standardized API Response Formatter
 * Ensures consistent response format across all endpoints
 */

const successResponse = (res, data, message = 'Thành công', statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
        timestamp: new Date().toISOString()
    });
};

const errorResponse = (res, message = 'Có lỗi xảy ra', statusCode = 400, errors = null) => {
    const response = {
        success: false,
        message,
        timestamp: new Date().toISOString()
    };

    if (errors) {
        response.errors = errors;
    }

    return res.status(statusCode).json(response);
};

const paginationResponse = (res, data, pagination, message = 'Thành công') => {
    return res.status(200).json({
        success: true,
        message,
        data,
        pagination,
        timestamp: new Date().toISOString()
    });
};

module.exports = {
    successResponse,
    errorResponse,
    paginationResponse
};
