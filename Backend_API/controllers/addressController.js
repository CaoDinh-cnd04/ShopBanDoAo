const { executeQuery } = require('../config/database');
const { validationResult } = require('express-validator');

// Get user addresses
const getUserAddresses = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        const addresses = await executeQuery(
            `SELECT 
                AddressID,
                ReceiverName,
                ReceiverPhone,
                AddressLine,
                Ward,
                District,
                City,
                IsDefault,
                CreatedDate
             FROM UserAddresses
             WHERE UserID = @userId
             ORDER BY IsDefault DESC, CreatedDate DESC`,
            { userId }
        );

        res.json({
            success: true,
            data: addresses
        });
    } catch (error) {
        next(error);
    }
};

// Create address
const createAddress = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const userId = req.user.userId;
        const { receiverName, receiverPhone, addressLine, ward, district, city, isDefault } = req.body;

        // If this is set as default, unset other defaults
        if (isDefault === true || isDefault === 'true') {
            await executeQuery(
                `UPDATE UserAddresses SET IsDefault = 0 WHERE UserID = @userId`,
                { userId }
            );
        }

        const result = await executeQuery(
            `INSERT INTO UserAddresses (
                UserID, ReceiverName, ReceiverPhone, AddressLine, Ward, District, City, IsDefault, CreatedDate
            )
            OUTPUT INSERTED.AddressID
            VALUES (
                @userId, @receiverName, @receiverPhone, @addressLine, @ward, @district, @city, @isDefault, GETDATE()
            )`,
            {
                userId,
                receiverName,
                receiverPhone,
                addressLine,
                ward: ward || null,
                district,
                city,
                isDefault: isDefault === true || isDefault === 'true' ? 1 : 0
            }
        );

        res.status(201).json({
            success: true,
            message: 'Thêm địa chỉ thành công',
            data: { addressId: result[0].AddressID }
        });
    } catch (error) {
        next(error);
    }
};

// Update address
const updateAddress = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const userId = req.user.userId;
        const { id } = req.params;
        const { receiverName, receiverPhone, addressLine, ward, district, city, isDefault } = req.body;

        // Verify address belongs to user
        const addresses = await executeQuery(
            `SELECT AddressID FROM UserAddresses WHERE AddressID = @id AND UserID = @userId`,
            { id: parseInt(id), userId }
        );

        if (!addresses || addresses.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy địa chỉ'
            });
        }

        // If this is set as default, unset other defaults
        if (isDefault === true || isDefault === 'true') {
            await executeQuery(
                `UPDATE UserAddresses SET IsDefault = 0 WHERE UserID = @userId AND AddressID != @id`,
                { userId, id: parseInt(id) }
            );
        }

        await executeQuery(
            `UPDATE UserAddresses 
             SET ReceiverName = @receiverName,
                 ReceiverPhone = @receiverPhone,
                 AddressLine = @addressLine,
                 Ward = @ward,
                 District = @district,
                 City = @city,
                 IsDefault = @isDefault
             WHERE AddressID = @id AND UserID = @userId`,
            {
                id: parseInt(id),
                userId,
                receiverName,
                receiverPhone,
                addressLine,
                ward: ward || null,
                district,
                city,
                isDefault: isDefault !== undefined ? (isDefault === true || isDefault === 'true' ? 1 : 0) : undefined
            }
        );

        res.json({
            success: true,
            message: 'Cập nhật địa chỉ thành công'
        });
    } catch (error) {
        next(error);
    }
};

// Delete address
const deleteAddress = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        // Verify address belongs to user
        const addresses = await executeQuery(
            `SELECT AddressID FROM UserAddresses WHERE AddressID = @id AND UserID = @userId`,
            { id: parseInt(id), userId }
        );

        if (!addresses || addresses.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy địa chỉ'
            });
        }

        await executeQuery(
            `DELETE FROM UserAddresses WHERE AddressID = @id AND UserID = @userId`,
            { id: parseInt(id), userId }
        );

        res.json({
            success: true,
            message: 'Xóa địa chỉ thành công'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getUserAddresses,
    createAddress,
    updateAddress,
    deleteAddress
};
