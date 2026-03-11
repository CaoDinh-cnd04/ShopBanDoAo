const { executeQuery } = require('../config/database');
const { validationResult } = require('express-validator');
const moment = require('moment');

// Generate booking code
const generateBookingCode = () => {
    return 'BK' + moment().format('YYYYMMDDHHmmss') + Math.floor(Math.random() * 1000);
};

// Get available time slots for a court on a date
const getAvailableTimeSlots = async (req, res, next) => {
    try {
        const { courtId, date } = req.query;

        if (!courtId || !date) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin courtId hoặc date'
            });
        }

        // Get court info
        const courts = await executeQuery(
            `SELECT CourtID, CourtName, OpenTime, CloseTime FROM Courts WHERE CourtID = @courtId AND IsActive = 1`,
            { courtId: parseInt(courtId) }
        );

        if (!courts || courts.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sân'
            });
        }

        const court = courts[0];

        // Get all time slots
        const timeSlots = await executeQuery(
            `SELECT TimeSlotID, StartTime, EndTime, SlotName FROM TimeSlots WHERE IsActive = 1 ORDER BY StartTime`
        );

        // Get booked time slots for the date
        const bookedSlots = await executeQuery(
            `SELECT bd.TimeSlotID
             FROM Bookings b
             INNER JOIN BookingDetails bd ON b.BookingID = bd.BookingID
             WHERE b.CourtID = @courtId 
             AND b.BookingDate = @date
             AND b.StatusID NOT IN (SELECT StatusID FROM BookingStatus WHERE StatusName IN (N'Đã hủy'))`,
            { courtId: parseInt(courtId), date }
        );

        const bookedTimeSlotIds = bookedSlots.map(bs => bs.TimeSlotID);

        // Get pricing for the date (day of week: 0=Sunday, 1=Monday, etc.)
        const bookingDate = moment(date);
        const dayOfWeek = bookingDate.day(); // 0-6

        const pricing = await executeQuery(
            `SELECT 
                cp.PricingID,
                cp.TimeSlotID,
                cp.Price,
                cp.CurrencyCode,
                ts.StartTime,
                ts.EndTime,
                ts.SlotName
             FROM CourtPricing cp
             INNER JOIN TimeSlots ts ON cp.TimeSlotID = ts.TimeSlotID
             WHERE cp.CourtID = @courtId 
             AND cp.DayOfWeek = @dayOfWeek
             AND cp.IsActive = 1
             AND cp.EffectiveDate <= @date
             ORDER BY ts.StartTime`,
            { courtId: parseInt(courtId), dayOfWeek, date }
        );

        // Combine available slots with pricing
        const availableSlots = timeSlots
            .filter(ts => {
                // Check if time slot is within court operating hours
                const slotStart = moment(ts.StartTime, 'HH:mm:ss');
                const courtOpen = moment(court.OpenTime, 'HH:mm:ss');
                const courtClose = moment(court.CloseTime, 'HH:mm:ss');
                
                return slotStart.isSameOrAfter(courtOpen) && 
                       moment(ts.EndTime, 'HH:mm:ss').isSameOrBefore(courtClose);
            })
            .map(ts => {
                const priceInfo = pricing.find(p => p.TimeSlotID === ts.TimeSlotID);
                const isBooked = bookedTimeSlotIds.includes(ts.TimeSlotID);

                return {
                    timeSlotId: ts.TimeSlotID,
                    startTime: ts.StartTime,
                    endTime: ts.EndTime,
                    slotName: ts.SlotName,
                    price: priceInfo ? priceInfo.Price : null,
                    currencyCode: priceInfo ? priceInfo.CurrencyCode : 'VND',
                    pricingId: priceInfo ? priceInfo.PricingID : null,
                    isAvailable: !isBooked && priceInfo !== null
                };
            });

        res.json({
            success: true,
            data: {
                court: {
                    courtId: court.CourtID,
                    courtName: court.CourtName
                },
                date,
                availableSlots
            }
        });
    } catch (error) {
        next(error);
    }
};

// Create booking
const createBooking = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const userId = req.user.userId;
        const { courtId, bookingDate, timeSlotIds, note } = req.body;

        if (!timeSlotIds || timeSlotIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng chọn ít nhất một khung giờ'
            });
        }

        // Verify court exists
        const courts = await executeQuery(
            `SELECT CourtID, CourtName FROM Courts WHERE CourtID = @courtId AND IsActive = 1`,
            { courtId: parseInt(courtId) }
        );

        if (!courts || courts.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sân'
            });
        }

        // Check if time slots are available
        const bookedSlots = await executeQuery(
            `SELECT bd.TimeSlotID
             FROM Bookings b
             INNER JOIN BookingDetails bd ON b.BookingID = bd.BookingID
             WHERE b.CourtID = @courtId 
             AND b.BookingDate = @bookingDate
             AND b.StatusID NOT IN (SELECT StatusID FROM BookingStatus WHERE StatusName IN (N'Đã hủy'))
             AND bd.TimeSlotID IN (${timeSlotIds.map((_, i) => `@ts${i}`).join(',')})`,
            { 
                courtId: parseInt(courtId), 
                bookingDate,
                ...timeSlotIds.reduce((acc, id, i) => {
                    acc[`ts${i}`] = parseInt(id);
                    return acc;
                }, {})
            }
        );

        if (bookedSlots && bookedSlots.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Một số khung giờ đã được đặt'
            });
        }

        // Get pricing for selected time slots
        const bookingMoment = moment(bookingDate);
        const dayOfWeek = bookingMoment.day();

        const pricing = await executeQuery(
            `SELECT 
                cp.PricingID,
                cp.TimeSlotID,
                cp.Price
             FROM CourtPricing cp
             WHERE cp.CourtID = @courtId 
             AND cp.DayOfWeek = @dayOfWeek
             AND cp.IsActive = 1
             AND cp.EffectiveDate <= @bookingDate
             AND cp.TimeSlotID IN (${timeSlotIds.map((_, i) => `@ts${i}`).join(',')})`,
            {
                courtId: parseInt(courtId),
                dayOfWeek,
                bookingDate,
                ...timeSlotIds.reduce((acc, id, i) => {
                    acc[`ts${i}`] = parseInt(id);
                    return acc;
                }, {})
            }
        );

        if (!pricing || pricing.length !== timeSlotIds.length) {
            return res.status(400).json({
                success: false,
                message: 'Không tìm thấy giá cho một số khung giờ'
            });
        }

        // Calculate total
        let totalAmount = 0;
        pricing.forEach(p => {
            totalAmount += parseFloat(p.Price);
        });

        // Calculate tax (10% VAT)
        const taxAmount = totalAmount * 0.1;
        const finalTotal = totalAmount + taxAmount;

        // Get default status (Chờ xác nhận)
        const statuses = await executeQuery(
            `SELECT StatusID FROM BookingStatus WHERE StatusName = N'Chờ xác nhận'`
        );
        const statusId = statuses[0].StatusID;

        // Create booking
        const bookingCode = generateBookingCode();
        const bookingResult = await executeQuery(
            `INSERT INTO Bookings (
                BookingCode, UserID, CourtID, StatusID, BookingDate,
                DiscountAmount, TaxAmount, TotalAmount, Note, CreatedDate
            )
            OUTPUT INSERTED.BookingID
            VALUES (
                @bookingCode, @userId, @courtId, @statusId, @bookingDate,
                0, @taxAmount, @finalTotal, @note, GETDATE()
            )`,
            {
                bookingCode,
                userId,
                courtId: parseInt(courtId),
                statusId,
                bookingDate,
                taxAmount,
                finalTotal,
                note: note || null
            }
        );

        const bookingId = bookingResult[0].BookingID;

        // Create booking details
        for (const priceInfo of pricing) {
            await executeQuery(
                `INSERT INTO BookingDetails (BookingID, TimeSlotID, PricingID, Price)
                 VALUES (@bookingId, @timeSlotId, @pricingId, @price)`,
                {
                    bookingId,
                    timeSlotId: priceInfo.TimeSlotID,
                    pricingId: priceInfo.PricingID,
                    price: priceInfo.Price
                }
            );
        }

        res.status(201).json({
            success: true,
            message: 'Đặt sân thành công',
            data: { bookingId, bookingCode }
        });
    } catch (error) {
        next(error);
    }
};

// Get user bookings
const getUserBookings = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { page = 1, limit = 10, statusId } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let whereClause = 'WHERE b.UserID = @userId';
        const params = { userId, limit: parseInt(limit), offset };

        if (statusId) {
            whereClause += ' AND b.StatusID = @statusId';
            params.statusId = parseInt(statusId);
        }

        const bookings = await executeQuery(
            `SELECT 
                b.BookingID,
                b.BookingCode,
                b.BookingDate,
                b.DiscountAmount,
                b.TaxAmount,
                b.TotalAmount,
                b.Note,
                b.CreatedDate,
                b.UpdatedDate,
                bs.StatusID,
                bs.StatusName,
                c.CourtID,
                c.CourtName,
                c.Location,
                ct.TypeName as CourtTypeName
             FROM Bookings b
             INNER JOIN BookingStatus bs ON b.StatusID = bs.StatusID
             INNER JOIN Courts c ON b.CourtID = c.CourtID
             INNER JOIN CourtTypes ct ON c.CourtTypeID = ct.CourtTypeID
             ${whereClause}
             ORDER BY b.BookingDate DESC, b.CreatedDate DESC
             OFFSET @offset ROWS
             FETCH NEXT @limit ROWS ONLY`,
            params
        );

        // Get booking details for each booking
        for (let booking of bookings) {
            const details = await executeQuery(
                `SELECT 
                    bd.BookingDetailID,
                    bd.Price,
                    ts.TimeSlotID,
                    ts.StartTime,
                    ts.EndTime,
                    ts.SlotName
                 FROM BookingDetails bd
                 INNER JOIN TimeSlots ts ON bd.TimeSlotID = ts.TimeSlotID
                 WHERE bd.BookingID = @bookingId
                 ORDER BY ts.StartTime`,
                { bookingId: booking.BookingID }
            );
            booking.timeSlots = details;
        }

        // Get total count
        const countResult = await executeQuery(
            `SELECT COUNT(*) as Total FROM Bookings b ${whereClause}`,
            params
        );
        const total = countResult[0].Total;

        res.json({
            success: true,
            data: bookings,
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

// Get booking by ID
const getBookingById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const bookings = await executeQuery(
            `SELECT 
                b.*,
                bs.StatusName,
                c.CourtID,
                c.CourtName,
                c.Location,
                c.Address,
                c.Description,
                c.Facilities,
                ct.TypeName as CourtTypeName
             FROM Bookings b
             INNER JOIN BookingStatus bs ON b.StatusID = bs.StatusID
             INNER JOIN Courts c ON b.CourtID = c.CourtID
             INNER JOIN CourtTypes ct ON c.CourtTypeID = ct.CourtTypeID
             WHERE b.BookingID = @id AND b.UserID = @userId`,
            { id: parseInt(id), userId }
        );

        if (!bookings || bookings.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đặt sân'
            });
        }

        const booking = bookings[0];

        // Get booking details
        const details = await executeQuery(
            `SELECT 
                bd.BookingDetailID,
                bd.Price,
                ts.TimeSlotID,
                ts.StartTime,
                ts.EndTime,
                ts.SlotName
             FROM BookingDetails bd
             INNER JOIN TimeSlots ts ON bd.TimeSlotID = ts.TimeSlotID
             WHERE bd.BookingID = @bookingId
             ORDER BY ts.StartTime`,
            { bookingId: booking.BookingID }
        );
        booking.timeSlots = details;

        // Get payment info
        const payments = await executeQuery(
            `SELECT 
                bp.*,
                pm.MethodName as PaymentMethodName
             FROM BookingPayments bp
             INNER JOIN PaymentMethods pm ON bp.PaymentMethodID = pm.PaymentMethodID
             WHERE bp.BookingID = @bookingId`,
            { bookingId: booking.BookingID }
        );
        booking.payments = payments;

        res.json({
            success: true,
            data: booking
        });
    } catch (error) {
        next(error);
    }
};

// Cancel booking
const cancelBooking = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        // Verify booking belongs to user
        const bookings = await executeQuery(
            `SELECT BookingID, StatusID FROM Bookings WHERE BookingID = @id AND UserID = @userId`,
            { id: parseInt(id), userId }
        );

        if (!bookings || bookings.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đặt sân'
            });
        }

        // Get cancelled status
        const cancelledStatus = await executeQuery(
            `SELECT StatusID FROM BookingStatus WHERE StatusName = N'Đã hủy'`
        );

        await executeQuery(
            `UPDATE Bookings SET StatusID = @statusId, UpdatedDate = GETDATE() WHERE BookingID = @id`,
            { id: parseInt(id), statusId: cancelledStatus[0].StatusID }
        );

        res.json({
            success: true,
            message: 'Hủy đặt sân thành công'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAvailableTimeSlots,
    createBooking,
    getUserBookings,
    getBookingById,
    cancelBooking
};
