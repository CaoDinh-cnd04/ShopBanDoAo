#!/usr/bin/env bash
# Chạy trên Ubuntu VPS (đã có quyền sudo). Đổi APP_DIR nếu cần.
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/shop-api}"

echo "==> Cài Node 20 + PM2 + Nginx (Ubuntu)"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get update
sudo apt-get install -y nodejs nginx

sudo npm install -g pm2

echo "==> Thư mục app: $APP_DIR"
echo "    Copy code backend-nestjs vào đó (git clone hoặc rsync), rồi:"
echo "    cd $APP_DIR"
echo "    npm ci --omit=dev"
echo "    cp .env.production .env   # hoặc tạo .env với MONGO_URI, JWT_SECRET, PORT=3000"
echo "    npm run build"
echo "    pm2 start ecosystem.config.cjs"
echo "    pm2 save && pm2 startup"
echo ""
echo "==> Nginx: sudo cp deploy/nginx-api.example.conf /etc/nginx/sites-available/shop-api"
echo "    Sửa server_name + certbot SSL."
