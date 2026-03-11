/**
 * Environment Variables Validation
 * Ensures all required environment variables are set
 */

const validateEnv = () => {
    const required = [
        'DB_SERVER',
        'DB_DATABASE',
        'DB_USER',
        'DB_PASSWORD',
        'JWT_SECRET'
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        console.error('❌ Missing required environment variables:');
        missing.forEach(key => console.error(`   - ${key}`));
        throw new Error('Missing required environment variables');
    }

    // Validate JWT_SECRET strength in production
    if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET.length < 32) {
        console.warn('⚠️  WARNING: JWT_SECRET should be at least 32 characters long in production');
    }

    console.log('✅ Environment variables validated');
};

module.exports = validateEnv;
