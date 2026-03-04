FROM node:25-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY public/ ./public/
COPY src/ ./src/

RUN npm run build

FROM nginx:alpine AS production

COPY --from=builder /app/build /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
