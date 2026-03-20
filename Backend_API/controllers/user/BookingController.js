const BaseController = require('../base/BaseController');
const { validationResult } = require('express-validator');

class BookingController extends BaseController {
    generateBookingCode() {
        return 'BK' + Date.now() + Math.floor(Math.random() * 1000);
    }

    async getAvailableTimeSlots(req, res, next) {
        try {
            const { courtId, date } = req.query;
            if (!courtId || !date) {
                return res.status(400).json({ success: false, message: 'Thiếu thông tin courtId hoặc date' });
            }

            const db = this.getDb();
            const court = await db.collection('courts').findOne({ _id: new this.ObjectId(courtId), isActive: true });
            if (!court) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy sân' });
            }

            const timeSlots = await db.collection('timeSlots').find({ isActive: true }).sort({ startTime: 1 }).toArray();

            const bookingDate = new Date(date);
            const dayOfWeek = bookingDate.getDay();

            const cancelledStatus = await db.collection('bookingStatus').findOne({ statusName: 'Đã hủy' });
            const activeBookings = await db.collection('bookings').find({
                courtId: court._id,
                bookingDate: bookingDate,
                ...(cancelledStatus ? { statusId: { $ne: cancelledStatus._id } } : {})
            }).project({ _id: 1 }).toArray();
            const bookingIds = activeBookings.map(b => b._id);
            const bookedDetails = await db.collection('bookingDetails').find({ bookingId: { $in: bookingIds } }).toArray();
            const bookedSet = new Set(bookedDetails.map(b => b.timeSlotId?.toString()));

            const pricing = await db.collection('courtPricing').aggregate([
                { $match: { courtId: court._id, dayOfWeek, isActive: true, effectiveDate: { $lte: bookingDate } } },
                { $lookup: { from: 'timeSlots', localField: 'timeSlotId', foreignField: '_id', as: 'ts' } },
                { $unwind: '$ts' },
                { $sort: { 'ts.startTime': 1 } }
            ]).toArray();

            const parseTime = (t) => {
                if (!t) return 0;
                const [h, m] = String(t).split(':').map(Number);
                return (h || 0) * 60 + (m || 0);
            };
            const courtOpen = parseTime(court.openTime);
            const courtClose = parseTime(court.closeTime);

            const availableSlots = timeSlots
                .filter(ts => {
                    const start = parseTime(ts.startTime);
                    const end = parseTime(ts.endTime);
                    return start >= courtOpen && end <= courtClose;
                })
                .map(ts => {
                    const priceInfo = pricing.find(p => p.timeSlotId?.toString() === ts._id?.toString());
                    const isBooked = bookedSet.has(ts._id?.toString());
                    return {
                        timeSlotId: ts._id.toString(),
                        startTime: ts.startTime,
                        endTime: ts.endTime,
                        slotName: ts.slotName,
                        price: priceInfo ? priceInfo.price : null,
                        currencyCode: priceInfo ? priceInfo.currencyCode : 'VND',
                        pricingId: priceInfo ? priceInfo._id?.toString() : null,
                        isAvailable: !isBooked && !!priceInfo
                    };
                });

            res.json({
                success: true,
                data: {
                    court: { courtId: court._id.toString(), courtName: court.courtName },
                    date,
                    availableSlots
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async createBooking(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const userId = req.user.userId;
            const { courtId, bookingDate, timeSlotIds, note } = req.body;
            const db = this.getDb();

            if (!timeSlotIds || timeSlotIds.length === 0) {
                return res.status(400).json({ success: false, message: 'Vui lòng chọn ít nhất một khung giờ' });
            }

            const cid = new this.ObjectId(courtId);
            const court = await db.collection('courts').findOne({ _id: cid, isActive: true });
            if (!court) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy sân' });
            }

            const cancelledStatus = await db.collection('bookingStatus').findOne({ statusName: 'Đã hủy' });
            const activeBookings = await db.collection('bookings').find({
                courtId: cid,
                bookingDate: new Date(bookingDate),
                ...(cancelledStatus ? { statusId: { $ne: cancelledStatus._id } } : {})
            }).project({ _id: 1 }).toArray();
            const existingBookingIds = activeBookings.map(b => b._id);
            const timeSlotIdObjs = timeSlotIds.map(id => new this.ObjectId(id));
            const conflicting = await db.collection('bookingDetails').findOne({
                bookingId: { $in: existingBookingIds },
                timeSlotId: { $in: timeSlotIdObjs }
            });
            if (conflicting) {
                return res.status(400).json({ success: false, message: 'Một số khung giờ đã được đặt' });
            }

            const bDate = new Date(bookingDate);
            const dayOfWeek = bDate.getDay();
            const pricingList = await db.collection('courtPricing').find({
                courtId: cid,
                dayOfWeek,
                isActive: true,
                effectiveDate: { $lte: bDate },
                timeSlotId: { $in: timeSlotIds.map(id => new this.ObjectId(id)) }
            }).toArray();

            if (pricingList.length !== timeSlotIds.length) {
                return res.status(400).json({ success: false, message: 'Không tìm thấy giá cho một số khung giờ' });
            }

            let totalAmount = 0;
            pricingList.forEach(p => { totalAmount += p.price || 0; });
            const taxAmount = totalAmount * 0.1;
            const finalTotal = totalAmount + taxAmount;

            const status = await db.collection('bookingStatus').findOne({ statusName: 'Chờ xác nhận' });
            if (!status) {
                return res.status(500).json({ success: false, message: 'Trạng thái đặt sân không tồn tại' });
            }

            const now = new Date();
            const bookingResult = await db.collection('bookings').insertOne({
                bookingCode: this.generateBookingCode(),
                userId: new this.ObjectId(userId),
                courtId: cid,
                statusId: status._id,
                bookingDate: bDate,
                discountAmount: 0,
                taxAmount,
                totalAmount: finalTotal,
                currencyCode: 'VND',
                note: note || '',
                createdDate: now,
                updatedDate: now
            });

            const bookingId = bookingResult.insertedId;

            for (const p of pricingList) {
                await db.collection('bookingDetails').insertOne({
                    bookingId,
                    timeSlotId: p.timeSlotId,
                    pricingId: p._id,
                    price: p.price
                });
            }

            res.status(201).json({
                success: true,
                message: 'Đặt sân thành công',
                data: { bookingId: bookingId.toString(), bookingCode: (await db.collection('bookings').findOne({ _id: bookingId }))?.bookingCode }
            });
        } catch (error) {
            next(error);
        }
    }

    async getUserBookings(req, res, next) {
        try {
            const userId = req.user.userId;
            const { page = 1, limit = 10, statusId } = req.query;
            const db = this.getDb();

            const skip = (parseInt(page) - 1) * parseInt(limit);
            const match = { userId: new this.ObjectId(userId) };
            if (statusId) match.statusId = new this.ObjectId(statusId);

            const bookings = await db.collection('bookings').aggregate([
                { $match: match },
                { $sort: { bookingDate: -1, createdDate: -1 } },
                { $skip: skip },
                { $limit: parseInt(limit) },
                { $lookup: { from: 'bookingStatus', localField: 'statusId', foreignField: '_id', as: 'status' } },
                { $unwind: '$status' },
                { $lookup: { from: 'courts', localField: 'courtId', foreignField: '_id', as: 'court' } },
                { $unwind: '$court' },
                { $lookup: { from: 'courtTypes', localField: 'court.courtTypeId', foreignField: '_id', as: 'ct' } },
                { $unwind: { path: '$ct', preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        bookingId: '$_id',
                        bookingCode: 1,
                        bookingDate: 1,
                        discountAmount: 1,
                        taxAmount: 1,
                        totalAmount: 1,
                        note: 1,
                        createdDate: 1,
                        updatedDate: 1,
                        statusId: '$status._id',
                        statusName: '$status.statusName',
                        courtId: '$court._id',
                        courtName: '$court.courtName',
                        location: '$court.location',
                        courtTypeName: '$ct.typeName'
                    }
                }
            ]).toArray();

            for (const b of bookings) {
                const details = await db.collection('bookingDetails').aggregate([
                    { $match: { bookingId: b._id } },
                    { $lookup: { from: 'timeSlots', localField: 'timeSlotId', foreignField: '_id', as: 'ts' } },
                    { $unwind: '$ts' },
                    { $sort: { 'ts.startTime': 1 } },
                    { $project: { bookingDetailId: '$_id', price: 1, timeSlotId: '$ts._id', startTime: '$ts.startTime', endTime: '$ts.endTime', slotName: '$ts.slotName' } }
                ]).toArray();
                b.timeSlots = details.map(d => ({ ...d, bookingDetailId: d.bookingDetailId?.toString(), timeSlotId: d.timeSlotId?.toString() }));
                b.bookingId = b._id?.toString();
            }

            const total = await db.collection('bookings').countDocuments(match);

            res.json({
                success: true,
                data: bookings,
                pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) }
            });
        } catch (error) {
            next(error);
        }
    }

    async getBookingById(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.userId;
            const db = this.getDb();

            const booking = await db.collection('bookings').aggregate([
                { $match: { _id: new this.ObjectId(id), userId: new this.ObjectId(userId) } },
                { $lookup: { from: 'bookingStatus', localField: 'statusId', foreignField: '_id', as: 'status' } },
                { $unwind: '$status' },
                { $lookup: { from: 'courts', localField: 'courtId', foreignField: '_id', as: 'court' } },
                { $unwind: '$court' },
                { $lookup: { from: 'courtTypes', localField: 'court.courtTypeId', foreignField: '_id', as: 'ct' } },
                { $unwind: { path: '$ct', preserveNullAndEmptyArrays: true } },
                { $limit: 1 }
            ]).toArray();

            if (!booking || booking.length === 0) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy đặt sân' });
            }

            const b = booking[0];
            b.statusName = b.status.statusName;
            b.courtName = b.court.courtName;
            b.location = b.court.location;
            b.address = b.court.address;
            b.description = b.court.description;
            b.facilities = b.court.facilities;
            b.courtTypeName = b.ct?.typeName;

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
            b.bookingId = b._id.toString();
            b.courtId = b.courtId?.toString();

            res.json({ success: true, data: b });
        } catch (error) {
            next(error);
        }
    }

    async cancelBooking(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.userId;
            const db = this.getDb();

            const booking = await db.collection('bookings').findOne({ _id: new this.ObjectId(id), userId: new this.ObjectId(userId) });
            if (!booking) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy đặt sân' });
            }

            const cancelledStatus = await db.collection('bookingStatus').findOne({ statusName: 'Đã hủy' });
            if (!cancelledStatus) {
                return res.status(500).json({ success: false, message: 'Trạng thái hủy không tồn tại' });
            }

            await db.collection('bookings').updateOne(
                { _id: booking._id },
                { $set: { statusId: cancelledStatus._id, updatedDate: new Date() } }
            );

            res.json({ success: true, message: 'Hủy đặt sân thành công' });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new BookingController();
