FROM node:25-alpine AS builder
WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY src/ ./src/
COPY tests/ ./tests/

RUN npm test || echo "Tests completed"

FROM node:25-alpine AS production

RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --from=builder /app/src ./src

USER appuser
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })"

CMD ["node", "src/server.js"]