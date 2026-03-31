# Build: docker build -t shop-api ./backend-nestjs
# Run:   docker run -p 3000:3000 --env-file .env shop-api
FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
COPY . .
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
RUN mkdir -p uploads
EXPOSE 3000
CMD ["node", "dist/main.js"]
