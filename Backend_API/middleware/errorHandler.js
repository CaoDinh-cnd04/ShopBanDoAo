const { logError } = require('./logger');
const { errorResponse } = require('../utils/responseFormatter');
const { HTTP_STATUS, MESSAGES } = require('../utils/constants');

const errorHandler = (err, req, res, next) => {
    // Log error
    logError(err, req);

    // SQL Server errors
    if (err.code === 'EREQUEST' || err.code === 'ETIMEOUT') {
        return errorResponse(
            res,
            'Lỗi truy vấn database',
            HTTP_STATUS.INTERNAL_SERVER_ERROR
        );
    }

    // SQL Server connection errors
    if (err.code === 'ECONNREFUSED' || err.code === 'ELOGIN') {
        return errorResponse(
            res,
            'Không thể kết nối database',
            HTTP_STATUS.INTERNAL_SERVER_ERROR
        );
    }

    // Validation errors
    if (err.name === 'ValidationError') {
        return errorResponse(
            res,
            MESSAGES.INVALID_INPUT,
            HTTP_STATUS.BAD_REQUEST,
            err.errors
        );
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return errorResponse(
            res,
            MESSAGES.TOKEN_INVALID,
            HTTP_STATUS.UNAUTHORIZED
        );
    }

    if (err.name === 'TokenExpiredError') {
        return errorResponse(
            res,
            MESSAGES.TOKEN_EXPIRED,
            HTTP_STATUS.UNAUTHORIZED
        );
    }

    // Cast errors (invalid ID format)
    if (err.name === 'CastError') {
        return errorResponse(
            res,
            'ID không hợp lệ',
            HTTP_STATUS.BAD_REQUEST
        );
    }

    // Duplicate key errors
    if (err.number === 2627 || err.number === 2601) {
        return errorResponse(
            res,
            'Dữ liệu đã tồn tại',
            HTTP_STATUS.CONFLICT
        );
    }

    // Default error
    const statusCode = err.statusCode || err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const message = err.message || MESSAGES.SERVER_ERROR;

    return errorResponse(
        res,
        message,
        statusCode,
        process.env.NODE_ENV === 'development' ? { stack: err.stack } : undefined
    );
};

module.exports = errorHandler;
