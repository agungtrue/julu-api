# --- STAGE 1: Base & Dependencies ---
FROM node:22-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
# Install semua deps termasuk devDeps untuk proses build
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# --- STAGE 2: Runner ---
FROM node:22-alpine AS runner
# Install netcat & wget untuk healthcheck
RUN apk add --no-cache netcat-openbsd wget

WORKDIR /usr/src/app

# Ambil hanya hasil build dan dependencies produksi dari Stage 1
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package*.json ./
# COPY --from=builder /usr/src/app/ca-certificate.crt ./ca-certificate.crt

# Re-install hanya dependencies produksi (mengurangi ukuran image drastis)
RUN npm install --only=production --legacy-peer-deps

# Setup User & Security
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
RUN chown -R nestjs:nodejs /usr/src/app
USER nestjs

EXPOSE 3006

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3006/ping || exit 1

# Jalankan langsung dari main.js (lebih cepat & ringan daripada npm run)
CMD ["node", "dist/src/main.js"]