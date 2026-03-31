# Render / Docker: context = repo root (backend trong ./backend-nestjs)
FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY backend-nestjs/package.json backend-nestjs/package-lock.json ./
RUN npm ci
COPY backend-nestjs/ .
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY backend-nestjs/package.json backend-nestjs/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder /app/dist ./dist
RUN mkdir -p uploads
EXPOSE 3000
CMD ["node", "dist/main.js"]
