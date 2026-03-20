const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Validate environment variables
const validateEnv = require('./middleware/validateEnv');
validateEnv();

// Import routes - OOP structure (user/ và admin/)
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const { logger, logError } = require('./middleware/logger');
const { helmetConfig, sanitizeInput, xssProtection } = require('./middleware/security');
const { apiRateLimiter, authRateLimiter } = require('./middleware/rateLimiter');
const { connectMongo, closeMongo } = require('./config/database.mongodb');

// Initialize Express app
const app = express();

// Security middleware
app.use(helmetConfig);
app.use(sanitizeInput);
app.use(xssProtection);

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001'];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
            callback(null, true);
        } else {
            callback(null, true); // Allow all origins in development
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(logger);

// Rate limiting
app.use('/api/auth', authRateLimiter);
app.use('/api/', apiRateLimiter);

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// API Routes - User
app.use('/api/auth', userRoutes.authRoutes);
app.use('/api/products', userRoutes.productRoutes);
app.use('/api/categories', userRoutes.categoryRoutes);
app.use('/api/orders', userRoutes.orderRoutes);
app.use('/api/cart', userRoutes.cartRoutes);
app.use('/api/bookings', userRoutes.bookingRoutes);
app.use('/api/courts', userRoutes.courtRoutes);
app.use('/api/addresses', userRoutes.addressRoutes);
app.use('/api/reviews', userRoutes.reviewRoutes);
app.use('/api/vouchers', userRoutes.voucherRoutes);
app.use('/api/wishlist', userRoutes.wishlistRoutes);
app.use('/api/notifications', userRoutes.notificationRoutes);

// API Routes - Admin
app.use('/api/admin/users', adminRoutes.userRoutes);
app.use('/api/admin/orders', adminRoutes.orderRoutes);
app.use('/api/admin/bookings', adminRoutes.bookingRoutes);
app.use('/api/admin/categories', adminRoutes.categoryRoutes);
app.use('/api/admin/products', adminRoutes.productRoutes);
app.use('/api/admin/courts', adminRoutes.courtRoutes);
app.use('/api/admin/vouchers', adminRoutes.voucherRoutes);
app.use('/api/admin/reviews', adminRoutes.reviewRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint không tồn tại'
    });
});

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        // Test database connection (MongoDB)
        await connectMongo();

        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
            console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
        });
    } catch (error) {
        logError(error);
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    await closeMongo();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT signal received: closing HTTP server');
    await closeMongo();
    process.exit(0);
});

startServer();

module.exports = app;
