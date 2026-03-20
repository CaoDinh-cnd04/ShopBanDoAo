const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { verifyIdToken } = require('../../config/firebase');
const { saveActivityLog } = require('../../services/firestoreService');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');
const { HTTP_STATUS, MESSAGES } = require('../../utils/constants');
const BaseController = require('../base/BaseController');

class AuthController extends BaseController {
    async register(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { username, email, password, fullName, phoneNumber } = req.body;
            const db = this.getDb();

            const existingUser = await db.collection('users').findOne({
                $or: [{ username }, { email }]
            });

            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Username hoặc Email đã tồn tại'
                });
            }

            const passwordHash = await bcrypt.hash(password, 10);
            const now = new Date();

            const userResult = await db.collection('users').insertOne({
                username,
                email,
                passwordHash,
                fullName: fullName || null,
                phoneNumber: phoneNumber || null,
                isActive: true,
                isEmailVerified: false,
                createdDate: now,
                lastLoginDate: null
            });

            const newUserId = userResult.insertedId;

            const customerRole = await db.collection('roles').findOne({ roleName: 'Customer' });
            if (customerRole) {
                await db.collection('userRoles').insertOne({
                    userId: newUserId,
                    roleId: customerRole._id,
                    assignedDate: now
                });
            }

            await db.collection('carts').insertOne({ userId: newUserId, createdDate: now, updatedDate: now });
            await db.collection('wishlists').insertOne({ userId: newUserId, createdDate: now, updatedDate: now });

            const newUser = await db.collection('users').findOne({ _id: newUserId }, { projection: { username: 1, email: 1, fullName: 1 } });

            const token = jwt.sign(
                { userId: newUserId.toString(), username: newUser.username, email: newUser.email },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRE || '7d' }
            );

            res.status(201).json({
                success: true,
                message: 'Đăng ký thành công',
                data: {
                    user: {
                        userId: newUserId.toString(),
                        username: newUser.username,
                        email: newUser.email,
                        fullName: newUser.fullName
                    },
                    token
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async login(req, res, next) {
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

            const db = this.getDb();
            const user = await db.collection('users').findOne({
                $or: [{ username: identifier }, { email: identifier }]
            });

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Username hoặc password không đúng'
                });
            }

            if (!user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: 'Tài khoản đã bị khóa'
                });
            }

            const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Username hoặc password không đúng'
                });
            }

            await db.collection('users').updateOne(
                { _id: user._id },
                { $set: { lastLoginDate: new Date() } }
            );

            const userRoles = await db.collection('userRoles').aggregate([
                { $match: { userId: user._id } },
                { $lookup: { from: 'roles', localField: 'roleId', foreignField: '_id', as: 'role' } },
                { $unwind: '$role' },
                { $match: { 'role.isActive': true } },
                { $project: { roleName: '$role.roleName' } }
            ]).toArray();

            const token = jwt.sign(
                { userId: user._id.toString(), username: user.username, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRE || '7d' }
            );

            res.json({
                success: true,
                message: 'Đăng nhập thành công',
                data: {
                    user: {
                        userId: user._id.toString(),
                        username: user.username,
                        email: user.email,
                        fullName: user.fullName,
                        roles: userRoles.map(r => r.roleName)
                    },
                    token
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async getProfile(req, res, next) {
        try {
            const userId = req.user.userId;
            const db = this.getDb();

            const user = await db.collection('users').findOne(
                { _id: new this.ObjectId(userId) },
                { projection: { passwordHash: 0 } }
            );

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy người dùng'
                });
            }

            const userRoles = await db.collection('userRoles').aggregate([
                { $match: { userId: new this.ObjectId(userId) } },
                { $lookup: { from: 'roles', localField: 'roleId', foreignField: '_id', as: 'role' } },
                { $unwind: '$role' },
                { $match: { 'role.isActive': true } },
                { $project: { roleName: '$role.roleName', description: '$role.description' } }
            ]).toArray();

            const { passwordHash, ...userSafe } = user;
            res.json({
                success: true,
                data: {
                    ...userSafe,
                    userId: user._id.toString(),
                    roles: userRoles
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async updateProfile(req, res, next) {
        try {
            const userId = req.user.userId;
            const { fullName, phoneNumber, dateOfBirth, gender, bio, facebookLink, instagramLink, favoriteSports } = req.body;
            const db = this.getDb();

            await db.collection('users').updateOne(
                { _id: new this.ObjectId(userId) },
                {
                    $set: {
                        fullName: fullName ?? null,
                        phoneNumber: phoneNumber ?? null,
                        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                        gender: gender ?? null,
                        bio: bio ?? null,
                        facebookLink: facebookLink ?? null,
                        instagramLink: instagramLink ?? null,
                        favoriteSports: favoriteSports ?? null
                    }
                }
            );

            res.json({
                success: true,
                message: 'Cập nhật thông tin thành công'
            });
        } catch (error) {
            next(error);
        }
    }

    async changePassword(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const userId = req.user.userId;
            const { oldPassword, newPassword } = req.body;
            const db = this.getDb();

            const user = await db.collection('users').findOne(
                { _id: new this.ObjectId(userId) },
                { projection: { passwordHash: 1 } }
            );

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy người dùng'
                });
            }

            const isPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
            if (!isPasswordValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Mật khẩu cũ không đúng'
                });
            }

            const newPasswordHash = await bcrypt.hash(newPassword, 10);
            await db.collection('users').updateOne(
                { _id: new this.ObjectId(userId) },
                { $set: { passwordHash: newPasswordHash } }
            );

            res.json({
                success: true,
                message: 'Đổi mật khẩu thành công'
            });
        } catch (error) {
            next(error);
        }
    }

    async firebaseLogin(req, res, next) {
        try {
            const { idToken } = req.body;

            if (!idToken) {
                return errorResponse(res, 'Firebase ID token không được để trống', HTTP_STATUS.BAD_REQUEST);
            }

            const decodedToken = await verifyIdToken(idToken);
            const db = this.getDb();

            let user = await db.collection('users').findOne({ email: decodedToken.email });

            if (!user) {
                const username = decodedToken.email.split('@')[0] + '_' + Date.now();
                const fullName = decodedToken.name || decodedToken.email.split('@')[0];
                const now = new Date();

                const insertResult = await db.collection('users').insertOne({
                    username,
                    email: decodedToken.email,
                    passwordHash: 'firebase_auth',
                    fullName,
                    avatar: decodedToken.picture || null,
                    isEmailVerified: true,
                    isActive: true,
                    createdDate: now,
                    lastLoginDate: now
                });

                user = await db.collection('users').findOne({ _id: insertResult.insertedId });

                const customerRole = await db.collection('roles').findOne({ roleName: 'Customer' });
                if (customerRole) {
                    await db.collection('userRoles').insertOne({
                        userId: user._id,
                        roleId: customerRole._id,
                        assignedDate: now
                    });
                }

                await db.collection('carts').insertOne({ userId: user._id, createdDate: now, updatedDate: now });
                await db.collection('wishlists').insertOne({ userId: user._id, createdDate: now, updatedDate: now });

                await saveActivityLog({
                    userId: user._id.toString(),
                    action: 'user_registered',
                    resource: 'user',
                    resourceId: user._id.toString(),
                    metadata: { method: 'firebase_google' }
                });
            } else {
                if (decodedToken.picture && !user.avatar) {
                    await db.collection('users').updateOne(
                        { _id: user._id },
                        { $set: { avatar: decodedToken.picture } }
                    );
                    user.avatar = decodedToken.picture;
                }
                await db.collection('users').updateOne(
                    { _id: user._id },
                    { $set: { lastLoginDate: new Date() } }
                );
            }

            if (!user.isActive) {
                return errorResponse(res, 'Tài khoản đã bị khóa', HTTP_STATUS.FORBIDDEN);
            }

            const userRoles = await db.collection('userRoles').aggregate([
                { $match: { userId: user._id } },
                { $lookup: { from: 'roles', localField: 'roleId', foreignField: '_id', as: 'role' } },
                { $unwind: '$role' },
                { $match: { 'role.isActive': true } },
                { $project: { roleName: '$role.roleName' } }
            ]).toArray();

            const token = jwt.sign(
                { userId: user._id.toString(), username: user.username, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRE || '7d' }
            );

            await saveActivityLog({
                userId: user._id.toString(),
                action: 'user_login',
                resource: 'auth',
                metadata: { method: 'firebase_google', firebaseUid: decodedToken.uid }
            });

            return successResponse(res, {
                user: {
                    userId: user._id.toString(),
                    username: user.username,
                    email: user.email,
                    fullName: user.fullName,
                    avatar: user.avatar,
                    roles: userRoles.map(r => r.roleName),
                    firebaseUid: decodedToken.uid
                },
                token,
                firebaseToken: idToken
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
    }
}

module.exports = new AuthController();
