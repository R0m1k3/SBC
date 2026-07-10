# Stage 1 — build the React frontend
FROM node:22-alpine AS webbuild
WORKDIR /build
COPY web/package.json web/package-lock.json* ./
RUN npm ci 2>/dev/null || npm install
COPY web/index.html web/vite.config.js ./
COPY web/public ./public
COPY web/src ./src
RUN npm run build

# Stage 2 — install API production dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY server/package.json server/package-lock.json* ./
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev

# Stage 3 — final image: Express serves the API, the frontend and the uploads
FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY server/package.json ./
COPY server/src ./src
COPY --from=webbuild /build/dist ./public
# Upload dir owned by the app user; a named volume mounted here inherits
# this ownership on first use
RUN mkdir -p /data/uploads && chown node:node /data/uploads
USER node
EXPOSE 8321
CMD ["node", "src/index.js"]
