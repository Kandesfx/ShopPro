# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
COPY frontend/apps/website/package*.json ./frontend/apps/website/
COPY frontend/apps/admin/package*.json ./frontend/apps/admin/
COPY frontend/apps/pos/package*.json ./frontend/apps/pos/
COPY frontend/packages/ui/package*.json ./frontend/packages/ui/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build backend
WORKDIR /app/backend
RUN npm run build

# Build frontend apps
WORKDIR /app/frontend/apps/website
RUN npm run build

WORKDIR /app/frontend/apps/admin
RUN npm run build

WORKDIR /app/frontend/apps/pos
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
COPY backend/package*.json ./backend/
RUN npm ci --only=production --workspace=backend

# Copy built artifacts
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/frontend/apps/website/dist ./frontend/website
COPY --from=builder /app/frontend/apps/admin/dist ./frontend/admin
COPY --from=builder /app/frontend/apps/pos/dist ./frontend/pos

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

USER nodejs

# Expose ports
EXPOSE 3000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start command
CMD ["sh", "-c", "node backend/dist/index.js"]
