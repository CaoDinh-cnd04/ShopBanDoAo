/**
 * Rate Limiting Middleware
 * Prevents abuse and DDoS attacks
 */

// Simple in-memory rate limiter (for production, use Redis)
const rateLimitMap = new Map();

const rateLimiter = (windowMs = 15 * 60 * 1000, maxRequests = 100) => {
    return (req, res, next) => {
        // Skip rate limiting in development if DISABLE_RATE_LIMIT is set
        if (process.env.NODE_ENV !== 'production' && process.env.DISABLE_RATE_LIMIT === 'true') {
            return next();
        }

        const key = req.ip || req.connection.remoteAddress || 'unknown';
        const now = Date.now();
        
        if (!rateLimitMap.has(key)) {
            rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
            return next();
        }
        
        const record = rateLimitMap.get(key);
        
        // Reset if window expired
        if (now > record.resetTime) {
            record.count = 1;
            record.resetTime = now + windowMs;
            return next();
        }
        
        // Check limit
        if (record.count >= maxRequests) {
            return res.status(429).json({
                success: false,
                message: 'Quá nhiều requests. Vui lòng thử lại sau.',
                retryAfter: Math.ceil((record.resetTime - now) / 1000)
            });
        }
        
        record.count++;
        next();
    };
};

// Strict rate limiter for auth endpoints
// Development: 200 requests per 15 minutes (tăng lên để test dễ dàng hơn)
// Production: Nên giảm xuống 5 requests per 15 minutes
const authRateLimiter = rateLimiter(15 * 60 * 1000, process.env.NODE_ENV === 'production' ? 5 : 200);

// General API rate limiter
// Development: 1000 requests per 15 minutes (tăng lên để test)
// Production: 100 requests per 15 minutes
const apiRateLimiter = rateLimiter(15 * 60 * 1000, process.env.NODE_ENV === 'production' ? 100 : 1000);

module.exports = {
    rateLimiter,
    authRateLimiter,
    apiRateLimiter
};
