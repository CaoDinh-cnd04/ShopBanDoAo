/**
 * PM2 — chạy trên VPS sau khi: npm ci && npm run build
 * Tạo file .env cùng thư mục (MONGO_URI, JWT_SECRET, PORT=3000, …)
 *
 *   pm2 start ecosystem.config.cjs
 *   pm2 save
 *   pm2 startup
 */

module.exports = {
  apps: [
    {
      name: 'shop-api',
      cwd: __dirname,
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
