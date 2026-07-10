FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev

FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
# Upload dir owned by the app user; a named volume mounted here inherits
# this ownership on first use
RUN mkdir -p /data/uploads && chown node:node /data/uploads
# Run as the unprivileged built-in user
USER node
EXPOSE 3000
CMD ["node", "src/index.js"]
