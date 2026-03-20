const BaseController = require('../base/BaseController');
const { validationResult } = require('express-validator');

class AddressController extends BaseController {
    async getUserAddresses(req, res, next) {
        try {
            const userId = req.user.userId;
            const db = this.getDb();

            const addresses = await db.collection('userAddresses').find({ userId: new this.ObjectId(userId) })
                .sort({ isDefault: -1, createdDate: -1 })
                .toArray();

            res.json({
                success: true,
                data: addresses.map(a => ({ ...a, addressId: a._id.toString(), userId: a.userId?.toString() }))
            });
        } catch (error) {
            next(error);
        }
    }

    async createAddress(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const userId = req.user.userId;
            const { receiverName, receiverPhone, addressLine, ward, district, city, isDefault } = req.body;
            const db = this.getDb();

            const uid = new this.ObjectId(userId);

            if (isDefault === true || isDefault === 'true') {
                await db.collection('userAddresses').updateMany(
                    { userId: uid },
                    { $set: { isDefault: false } }
                );
            }

            const result = await db.collection('userAddresses').insertOne({
                userId: uid,
                receiverName,
                receiverPhone,
                addressLine,
                ward: ward || null,
                district,
                city,
                isDefault: isDefault === true || isDefault === 'true',
                createdDate: new Date()
            });

            res.status(201).json({
                success: true,
                message: 'Thêm địa chỉ thành công',
                data: { addressId: result.insertedId.toString() }
            });
        } catch (error) {
            next(error);
        }
    }

    async updateAddress(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const userId = req.user.userId;
            const { id } = req.params;
            const { receiverName, receiverPhone, addressLine, ward, district, city, isDefault } = req.body;
            const db = this.getDb();

            const addressId = new this.ObjectId(id);
            const uid = new this.ObjectId(userId);

            const address = await db.collection('userAddresses').findOne({ _id: addressId, userId: uid });
            if (!address) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy địa chỉ'
                });
            }

            if (isDefault === true || isDefault === 'true') {
                await db.collection('userAddresses').updateMany(
                    { userId: uid, _id: { $ne: addressId } },
                    { $set: { isDefault: false } }
                );
            }

            const updateFields = {
                receiverName,
                receiverPhone,
                addressLine,
                ward: ward ?? null,
                district,
                city
            };
            if (isDefault !== undefined) {
                updateFields.isDefault = isDefault === true || isDefault === 'true';
            }

            await db.collection('userAddresses').updateOne(
                { _id: addressId, userId: uid },
                { $set: updateFields }
            );

            res.json({
                success: true,
                message: 'Cập nhật địa chỉ thành công'
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteAddress(req, res, next) {
        try {
            const userId = req.user.userId;
            const { id } = req.params;
            const db = this.getDb();

            const result = await db.collection('userAddresses').deleteOne({
                _id: new this.ObjectId(id),
                userId: new this.ObjectId(userId)
            });

            if (result.deletedCount === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy địa chỉ'
                });
            }

            res.json({
                success: true,
                message: 'Xóa địa chỉ thành công'
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AddressController();
