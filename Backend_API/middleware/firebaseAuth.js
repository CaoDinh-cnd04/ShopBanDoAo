const { verifyIdToken } = require('../config/firebase');
const { executeQuery } = require('../config/database');
const { errorResponse } = require('../utils/responseFormatter');
const { HTTP_STATUS, MESSAGES } = require('../utils/constants');

/**
 * Middleware to authenticate Firebase token
 * Verifies Firebase ID token and syncs user with database
 */
const authenticateFirebase = async (req, res, next) => {
    try {
        const idToken = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!idToken) {
            return errorResponse(res, 'Không có Firebase token', HTTP_STATUS.UNAUTHORIZED);
        }

        // Verify Firebase token
        const decodedToken = await verifyIdToken(idToken);
        
        // Get or create user in database
        let users = await executeQuery(
            `SELECT UserID, Username, Email, FullName, IsActive FROM Users WHERE Email = @email`,
            { email: decodedToken.email }
        );

        let user;
        if (!users || users.length === 0) {
            // Create new user from Firebase
            const username = decodedToken.email.split('@')[0] + '_' + Date.now();
            const fullName = decodedToken.name || decodedToken.email.split('@')[0];
            
            const result = await executeQuery(
                `INSERT INTO Users (Username, Email, PasswordHash, FullName, Avatar, IsEmailVerified, CreatedDate)
                 OUTPUT INSERTED.UserID, INSERTED.Username, INSERTED.Email, INSERTED.FullName
                 VALUES (@username, @email, @passwordHash, @fullName, @avatar, 1, GETDATE())`,
                {
                    username,
                    email: decodedToken.email,
                    passwordHash: 'firebase_auth', // Placeholder, user can't login with password
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
        } else {
            user = users[0];
            
            // Update user info from Firebase if needed
            if (decodedToken.picture && !user.Avatar) {
                await executeQuery(
                    `UPDATE Users SET Avatar = @avatar WHERE UserID = @userID`,
                    { avatar: decodedToken.picture, userID: user.UserID }
                );
            }
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

        req.user = {
            userId: user.UserID,
            username: user.Username,
            email: user.Email,
            fullName: user.FullName,
            roles: userRoles.map(r => r.RoleName),
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

/**
 * Optional Firebase authentication - doesn't fail if token is missing
 */
const optionalFirebaseAuth = async (req, res, next) => {
    const idToken = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!idToken) {
        return next(); // Continue without authentication
    }

    try {
        await authenticateFirebase(req, res, next);
    } catch (error) {
        next(); // Continue even if Firebase auth fails
    }
};

module.exports = {
    authenticateFirebase,
    optionalFirebaseAuth
};
