const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');
const { validationResult } = require('express-validator');
const { verifyIdToken } = require('../config/firebase');
const { saveActivityLog } = require('../services/firestoreService');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { HTTP_STATUS, MESSAGES } = require('../utils/constants');

// Register new user
const register = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { username, email, password, fullName, phoneNumber } = req.body;

        // Check if user exists
        const existingUser = await executeQuery(
            `SELECT UserID FROM Users WHERE Username = @username OR Email = @email`,
            { username, email }
        );

        if (existingUser && existingUser.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Username hoặc Email đã tồn tại'
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Insert user
        const result = await executeQuery(
            `INSERT INTO Users (Username, Email, PasswordHash, FullName, PhoneNumber, CreatedDate)
             OUTPUT INSERTED.UserID, INSERTED.Username, INSERTED.Email, INSERTED.FullName
             VALUES (@username, @email, @passwordHash, @fullName, @phoneNumber, GETDATE())`,
            { username, email, passwordHash, fullName, phoneNumber: phoneNumber || null }
        );

        const newUser = result[0];

        // Assign Customer role
        const customerRole = await executeQuery(
            `SELECT RoleID FROM Roles WHERE RoleName = 'Customer'`
        );

        if (customerRole && customerRole.length > 0) {
            await executeQuery(
                `INSERT INTO UserRoles (UserID, RoleID, AssignedDate) VALUES (@userID, @roleID, GETDATE())`,
                { userID: newUser.UserID, roleID: customerRole[0].RoleID }
            );
        }

        // Create cart for user
        await executeQuery(
            `INSERT INTO Carts (UserID, CreatedDate) VALUES (@userID, GETDATE())`,
            { userID: newUser.UserID }
        );

        // Create wishlist for user
        await executeQuery(
            `INSERT INTO Wishlists (UserID, CreatedDate) VALUES (@userID, GETDATE())`,
            { userID: newUser.UserID }
        );

        // Generate JWT
        const token = jwt.sign(
            { userId: newUser.UserID, username: newUser.Username, email: newUser.Email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'Đăng ký thành công',
            data: {
                user: {
                    userId: newUser.UserID,
                    username: newUser.Username,
                    email: newUser.Email,
                    fullName: newUser.FullName
                },
                token
            }
        });
    } catch (error) {
        next(error);
    }
};

// Login
const login = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const identifier = (req.body.username || req.body.email || '').trim();
        const password = req.body.password;

        if (!identifier) {
            return res.status(400).json({
                success: false,
                message: 'Username hoặc Email không được để trống'
            });
        }

        // Find user by username or email
        const users = await executeQuery(
            `SELECT UserID, Username, Email, PasswordHash, FullName, IsActive 
             FROM Users WHERE Username = @identifier OR Email = @identifier`,
            { identifier }
        );

        if (!users || users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Username hoặc password không đúng'
            });
        }

        const user = users[0];

        if (!user.IsActive) {
            return res.status(401).json({
                success: false,
                message: 'Tài khoản đã bị khóa'
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.PasswordHash);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Username hoặc password không đúng'
            });
        }

        // Update last login
        await executeQuery(
            `UPDATE Users SET LastLoginDate = GETDATE() WHERE UserID = @userID`,
            { userID: user.UserID }
        );

        // Get user roles
        const userRoles = await executeQuery(
            `SELECT r.RoleName 
             FROM UserRoles ur
             INNER JOIN Roles r ON ur.RoleID = r.RoleID
             WHERE ur.UserID = @userID AND r.IsActive = 1`,
            { userID: user.UserID }
        );

        // Generate JWT
        const token = jwt.sign(
            { userId: user.UserID, username: user.Username, email: user.Email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        res.json({
            success: true,
            message: 'Đăng nhập thành công',
            data: {
                user: {
                    userId: user.UserID,
                    username: user.Username,
                    email: user.Email,
                    fullName: user.FullName,
                    roles: userRoles.map(r => r.RoleName)
                },
                token
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get current user profile
const getProfile = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        const users = await executeQuery(
            `SELECT UserID, Username, Email, FullName, PhoneNumber, Avatar, 
                    DateOfBirth, Gender, Bio, FacebookLink, InstagramLink, 
                    FavoriteSports, CreatedDate, LastLoginDate, IsEmailVerified, IsPhoneVerified
             FROM Users WHERE UserID = @userId`,
            { userId }
        );

        if (!users || users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        const userRoles = await executeQuery(
            `SELECT r.RoleName, r.Description
             FROM UserRoles ur
             INNER JOIN Roles r ON ur.RoleID = r.RoleID
             WHERE ur.UserID = @userId AND r.IsActive = 1`,
            { userId }
        );

        res.json({
            success: true,
            data: {
                ...users[0],
                roles: userRoles
            }
        });
    } catch (error) {
        next(error);
    }
};

// Update profile
const updateProfile = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { fullName, phoneNumber, dateOfBirth, gender, bio, facebookLink, instagramLink, favoriteSports } = req.body;

        await executeQuery(
            `UPDATE Users 
             SET FullName = @fullName, PhoneNumber = @phoneNumber, DateOfBirth = @dateOfBirth,
                 Gender = @gender, Bio = @bio, FacebookLink = @facebookLink, 
                 InstagramLink = @instagramLink, FavoriteSports = @favoriteSports
             WHERE UserID = @userId`,
            {
                userId,
                fullName: fullName || null,
                phoneNumber: phoneNumber || null,
                dateOfBirth: dateOfBirth || null,
                gender: gender || null,
                bio: bio || null,
                facebookLink: facebookLink || null,
                instagramLink: instagramLink || null,
                favoriteSports: favoriteSports || null
            }
        );

        res.json({
            success: true,
            message: 'Cập nhật thông tin thành công'
        });
    } catch (error) {
        next(error);
    }
};

// Change password
const changePassword = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const userId = req.user.userId;
        const { oldPassword, newPassword } = req.body;

        // Get current password
        const users = await executeQuery(
            `SELECT PasswordHash FROM Users WHERE UserID = @userId`,
            { userId }
        );

        if (!users || users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        // Verify old password
        const isPasswordValid = await bcrypt.compare(oldPassword, users[0].PasswordHash);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu cũ không đúng'
            });
        }

        // Hash new password
        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        // Update password
        await executeQuery(
            `UPDATE Users SET PasswordHash = @newPasswordHash WHERE UserID = @userId`,
            { userId, newPasswordHash }
        );

        res.json({
            success: true,
            message: 'Đổi mật khẩu thành công'
        });
    } catch (error) {
        next(error);
    }
};

// Firebase Login (Google OAuth)
const firebaseLogin = async (req, res, next) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return errorResponse(res, 'Firebase ID token không được để trống', HTTP_STATUS.BAD_REQUEST);
        }

        // Verify Firebase token
        const decodedToken = await verifyIdToken(idToken);

        // Get or create user in database
        let users = await executeQuery(
            `SELECT UserID, Username, Email, FullName, Avatar, IsActive FROM Users WHERE Email = @email`,
            { email: decodedToken.email }
        );

        let user;
        if (!users || users.length === 0) {
            // Create new user from Firebase
            const username = decodedToken.email.split('@')[0] + '_' + Date.now();
            const fullName = decodedToken.name || decodedToken.email.split('@')[0];
            
            const result = await executeQuery(
                `INSERT INTO Users (Username, Email, PasswordHash, FullName, Avatar, IsEmailVerified, CreatedDate, LastLoginDate)
                 OUTPUT INSERTED.UserID, INSERTED.Username, INSERTED.Email, INSERTED.FullName, INSERTED.Avatar
                 VALUES (@username, @email, @passwordHash, @fullName, @avatar, 1, GETDATE(), GETDATE())`,
                {
                    username,
                    email: decodedToken.email,
                    passwordHash: 'firebase_auth', // Placeholder
                    fullName,
                    avatar: decodedToken.picture || null
                }
            );

            user = result[0];

            // Assign Customer role
            const customerRole = await executeQuery(
                `SELECT RoleID FROM Roles WHERE RoleName = 'Customer'`
            );

            if (customerRole && customerRole.length > 0) {
                await executeQuery(
                    `INSERT INTO UserRoles (UserID, RoleID, AssignedDate) VALUES (@userID, @roleID, GETDATE())`,
                    { userID: user.UserID, roleID: customerRole[0].RoleID }
                );
            }

            // Create cart and wishlist
            await executeQuery(
                `INSERT INTO Carts (UserID, CreatedDate) VALUES (@userID, GETDATE())`,
                { userID: user.UserID }
            );

            await executeQuery(
                `INSERT INTO Wishlists (UserID, CreatedDate) VALUES (@userID, GETDATE())`,
                { userID: user.UserID }
            );

            // Log activity to Firestore
            await saveActivityLog({
                userId: user.UserID,
                action: 'user_registered',
                resource: 'user',
                resourceId: user.UserID.toString(),
                metadata: { method: 'firebase_google' }
            });
        } else {
            user = users[0];
            
            // Update user info from Firebase if needed
            if (decodedToken.picture && !user.Avatar) {
                await executeQuery(
                    `UPDATE Users SET Avatar = @avatar WHERE UserID = @userID`,
                    { avatar: decodedToken.picture, userID: user.UserID }
                );
                user.Avatar = decodedToken.picture;
            }

            // Update last login
            await executeQuery(
                `UPDATE Users SET LastLoginDate = GETDATE() WHERE UserID = @userID`,
                { userID: user.UserID }
            );
        }

        if (!user.IsActive) {
            return errorResponse(res, 'Tài khoản đã bị khóa', HTTP_STATUS.FORBIDDEN);
        }

        // Get user roles
        const userRoles = await executeQuery(
            `SELECT r.RoleName 
             FROM UserRoles ur
             INNER JOIN Roles r ON ur.RoleID = r.RoleID
             WHERE ur.UserID = @userID AND r.IsActive = 1`,
            { userID: user.UserID }
        );

        // Generate JWT token (for consistency with regular login)
        const token = jwt.sign(
            { userId: user.UserID, username: user.Username, email: user.Email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        // Log activity to Firestore
        await saveActivityLog({
            userId: user.UserID,
            action: 'user_login',
            resource: 'auth',
            metadata: { method: 'firebase_google', firebaseUid: decodedToken.uid }
        });

        return successResponse(res, {
            user: {
                userId: user.UserID,
                username: user.Username,
                email: user.Email,
                fullName: user.FullName,
                avatar: user.Avatar,
                roles: userRoles.map(r => r.RoleName),
                firebaseUid: decodedToken.uid
            },
            token,
            firebaseToken: idToken // Return Firebase token as well
        }, 'Đăng nhập thành công');
    } catch (error) {
        if (error.code === 'auth/id-token-expired') {
            return errorResponse(res, 'Firebase token đã hết hạn', HTTP_STATUS.UNAUTHORIZED);
        }
        if (error.code === 'auth/argument-error') {
            return errorResponse(res, 'Firebase token không hợp lệ', HTTP_STATUS.UNAUTHORIZED);
        }
        next(error);
    }
};

module.exports = {
    register,
    login,
    firebaseLogin,
    getProfile,
    updateProfile,
    changePassword
};
