const { verifyIdToken } = require('../config/firebase');
const { getDb, ObjectId } = require('../config/database.mongodb');
const { errorResponse } = require('../utils/responseFormatter');
const { HTTP_STATUS } = require('../utils/constants');

const authenticateFirebase = async (req, res, next) => {
    try {
        const idToken = req.header('Authorization')?.replace('Bearer ', '');

        if (!idToken) {
            return errorResponse(res, 'Không có Firebase token', HTTP_STATUS.UNAUTHORIZED);
        }

        const decodedToken = await verifyIdToken(idToken);
        const db = getDb();

        let user = await db.collection('users').findOne({ email: decodedToken.email });

        if (!user) {
            const username = decodedToken.email.split('@')[0] + '_' + Date.now();
            const fullName = decodedToken.name || decodedToken.email.split('@')[0];
            const now = new Date();

            await db.collection('users').insertOne({
                username,
                email: decodedToken.email,
                passwordHash: 'firebase_auth',
                fullName,
                avatar: decodedToken.picture || null,
                isEmailVerified: true,
                isActive: true,
                createdDate: now
            });

            user = await db.collection('users').findOne({ email: decodedToken.email });

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
        } else {
            if (decodedToken.picture && !user.avatar) {
                await db.collection('users').updateOne(
                    { _id: user._id },
                    { $set: { avatar: decodedToken.picture } }
                );
                user.avatar = decodedToken.picture;
            }
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

        req.user = {
            userId: user._id.toString(),
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            roles: userRoles.map(r => r.roleName),
            firebaseUid: decodedToken.uid,
            firebaseToken: decodedToken
        };

        next();
    } catch (error) {
        if (error.code === 'auth/id-token-expired') {
            return errorResponse(res, 'Firebase token đã hết hạn', HTTP_STATUS.UNAUTHORIZED);
        }
        if (error.code === 'auth/argument-error') {
            return errorResponse(res, 'Firebase token không hợp lệ', HTTP_STATUS.UNAUTHORIZED);
        }
        return errorResponse(res, 'Xác thực Firebase thất bại', HTTP_STATUS.UNAUTHORIZED);
    }
};

const optionalFirebaseAuth = async (req, res, next) => {
    const idToken = req.header('Authorization')?.replace('Bearer ', '');

    if (!idToken) {
        return next();
    }

    try {
        await authenticateFirebase(req, res, next);
    } catch (error) {
        next();
    }
};

module.exports = {
    authenticateFirebase,
    optionalFirebaseAuth
};
