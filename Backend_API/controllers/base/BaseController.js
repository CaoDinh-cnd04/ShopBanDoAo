/**
 * Base Controller - Lớp cơ sở cho tất cả controllers (OOP)
 */
const { getDb, ObjectId } = require('../../config/database.mongodb');

class BaseController {
    constructor() {
        this.getDb = getDb;
        this.ObjectId = ObjectId;
    }

    /**
     * Wrap async handler để bắt lỗi và chuyển sang next()
     */
    wrapAsync(fn) {
        return (req, res, next) => {
            Promise.resolve(fn.call(this, req, res, next)).catch(next);
        };
    }

    /**
     * Kiểm tra ObjectId hợp lệ
     */
    isValidObjectId(id) {
        return /^[0-9a-fA-F]{24}$/.test(id);
    }
}

module.exports = BaseController;
