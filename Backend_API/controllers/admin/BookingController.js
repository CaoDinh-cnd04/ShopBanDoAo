const BaseController = require('../base/BaseController');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');

class AdminBookingController extends BaseController {
    async getAllBookings(req, res, next) {
        try {
            const db = this.getDb();
            const { page = 1, limit = 20, search = '', status = '', courtId = '', startDate = '', endDate = '', sortBy = 'bookingDate', sortOrder = 'DESC' } = req.query;
            const skip = (parseInt(page) - 1) * parseInt(limit);

            const lookup = [
                { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'u' } },
                { $unwind: '$u' },
                { $lookup: { from: 'courts', localField: 'courtId', foreignField: '_id', as: 'c' } },
                { $unwind: '$c' },
                { $lookup: { from: 'bookingStatus', localField: 'statusId', foreignField: '_id', as: 'bs' } },
                { $unwind: '$bs' }
            ];
            const match = {};
            if (search) match.$or = [{ bookingCode: new RegExp(search, 'i') }, { 'u.fullName': new RegExp(search, 'i') }, { 'u.email': new RegExp(search, 'i') }, { 'c.courtName': new RegExp(search, 'i') }];
            if (status) match['bs.statusName'] = status;
            if (courtId) match.courtId = new this.ObjectId(courtId);
            if (startDate) match.bookingDate = { ...match.bookingDate, $gte: new Date(startDate) };
            if (endDate) match.bookingDate = { ...match.bookingDate, $lte: new Date(endDate) };

            const pipeline = [...lookup];
            if (Object.keys(match).length) pipeline.push({ $match: match });

            const countResult = await db.collection('bookings').aggregate([...pipeline, { $count: 'total' }]).toArray();
            const totalBookings = countResult[0]?.total || 0;

            const bookings = await db.collection('bookings').aggregate([
                ...pipeline,
                { $sort: { [sortBy]: sortOrder === 'ASC' ? 1 : -1 } },
                { $skip: skip },
                { $limit: parseInt(limit) },
                { $addFields: { customerName: '$u.fullName', customerEmail: '$u.email', courtName: '$c.courtName', statusName: '$bs.statusName' } },
                { $project: { u: 0, c: 0, bs: 0 } }
            ]).toArray();

            const data = bookings.map(b => ({ ...b, bookingId: b._id.toString(), userId: b.userId?.toString(), courtId: b.courtId?.toString() }));
            return successResponse(res, { bookings: data, pagination: { currentPage: parseInt(page), totalPages: Math.ceil(totalBookings / limit), totalBookings, limit: parseInt(limit) } }, 'Lấy danh sách đặt sân thành công');
        } catch (error) {
            return errorResponse(res, 'Lỗi khi lấy danh sách đặt sân', 500);
        }
    }

    async getBookingById(req, res, next) {
        try {
            const { id } = req.params;
            const db = this.getDb();

            const booking = await db.collection('bookings').aggregate([
                { $match: { _id: new this.ObjectId(id) } },
                { $lookup: { from: 'bookingStatus', localField: 'statusId', foreignField: '_id', as: 'status' } },
                { $unwind: '$status' },
                { $lookup: { from: 'courts', localField: 'courtId', foreignField: '_id', as: 'court' } },
                { $unwind: '$court' },
                { $lookup: { from: 'courtTypes', localField: 'court.courtTypeId', foreignField: '_id', as: 'ct' } },
                { $unwind: { path: '$ct', preserveNullAndEmptyArrays: true } },
                { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'u' } },
                { $unwind: '$u' },
                { $limit: 1 }
            ]).toArray();

            if (!booking?.length) {
                return errorResponse(res, 'Không tìm thấy đặt sân', 404);
            }

            const b = booking[0];
            b.statusName = b.status.statusName;
            b.courtName = b.court.courtName;
            b.location = b.court.location;
            b.address = b.court.address;
            b.description = b.court.description;
            b.facilities = b.court.facilities;
            b.courtTypeName = b.ct?.typeName;
            b.customerName = b.u.fullName;
            b.customerEmail = b.u.email;
            b.customerPhone = b.u.phoneNumber;

            const details = await db.collection('bookingDetails').aggregate([
                { $match: { bookingId: b._id } },
                { $lookup: { from: 'timeSlots', localField: 'timeSlotId', foreignField: '_id', as: 'ts' } },
                { $unwind: '$ts' },
                { $sort: { 'ts.startTime': 1 } },
                { $project: { bookingDetailId: '$_id', price: 1, timeSlotId: '$ts._id', startTime: '$ts.startTime', endTime: '$ts.endTime', slotName: '$ts.slotName' } }
            ]).toArray();
            b.timeSlots = details.map(d => ({ ...d, bookingDetailId: d.bookingDetailId?.toString(), timeSlotId: d.timeSlotId?.toString() }));

            const payments = await db.collection('bookingPayments').aggregate([
                { $match: { bookingId: b._id } },
                { $lookup: { from: 'paymentMethods', localField: 'paymentMethodId', foreignField: '_id', as: 'pm' } },
                { $unwind: '$pm' },
                { $project: { paymentMethodName: '$pm.methodName', amount: 1 } }
            ]).toArray();
            b.payments = payments;

            delete b.status;
            delete b.court;
            delete b.ct;
            delete b.u;
            b.bookingId = b._id.toString();
            b.courtId = b.courtId?.toString();
            b.userId = b.userId?.toString();

            return successResponse(res, b, 'Lấy đặt sân thành công');
        } catch (error) {
            next(error);
        }
    }

    async getBookingStats(req, res, next) {
        try {
            const db = this.getDb();
            const total = await db.collection('bookings').countDocuments();
            const statusCounts = await db.collection('bookings').aggregate([
                { $lookup: { from: 'bookingStatus', localField: 'statusId', foreignField: '_id', as: 's' } },
                { $unwind: '$s' },
                { $group: { _id: '$s.statusName', count: { $sum: 1 } } }
            ]).toArray();
            return successResponse(res, { totalBookings: total, byStatus: statusCounts }, 'Lấy thống kê đặt sân thành công');
        } catch (error) {
            return errorResponse(res, 'Lỗi khi lấy thống kê đặt sân', 500);
        }
    }

    async updateBookingStatus(req, res, next) {
        try {
            const db = this.getDb();
            const { id } = req.params;
            const { statusName } = req.body;
            if (!statusName) return errorResponse(res, 'Vui lòng cung cấp trạng thái', 400);
            const status = await db.collection('bookingStatus').findOne({ statusName });
            if (!status) return errorResponse(res, 'Trạng thái không hợp lệ', 400);
            const result = await db.collection('bookings').updateOne({ _id: new this.ObjectId(id) }, { $set: { statusId: status._id, updatedDate: new Date() } });
            if (result.matchedCount === 0) return errorResponse(res, 'Không tìm thấy đặt sân', 404);
            return successResponse(res, null, 'Cập nhật trạng thái thành công');
        } catch (error) {
            return errorResponse(res, 'Lỗi khi cập nhật trạng thái', 500);
        }
    }

    async cancelBooking(req, res, next) {
        try {
            const db = this.getDb();
            const { id } = req.params;
            const cancelStatus = await db.collection('bookingStatus').findOne({ statusName: 'Đã hủy' });
            if (!cancelStatus) return errorResponse(res, 'Không tìm thấy trạng thái Đã hủy', 500);
            const result = await db.collection('bookings').updateOne({ _id: new this.ObjectId(id) }, { $set: { statusId: cancelStatus._id, updatedDate: new Date() } });
            if (result.matchedCount === 0) return errorResponse(res, 'Không tìm thấy đặt sân', 404);
            return successResponse(res, null, 'Hủy đặt sân thành công');
        } catch (error) {
            return errorResponse(res, 'Lỗi khi hủy đặt sân', 500);
        }
    }
}

module.exports = new AdminBookingController();
