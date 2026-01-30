# Multi-stage build for Node.js backend

# Stage 1: Build shared package
FROM node:20-alpine AS shared-builder
WORKDIR /app/shared
COPY shared/package*.json ./
RUN npm ci
COPY shared/ ./
RUN npm run build

# Stage 2: Build backend
FROM node:20-alpine AS backend-builder
WORKDIR /app

# Copy shared package
COPY --from=shared-builder /app/shared /app/shared

# Copy backend package files
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci

# Copy backend source
COPY backend/ ./

# Build TypeScript
RUN npx tsc

# Stage 3: Production image
FROM node:20-alpine AS production
WORKDIR /app

# Install production dependencies only
COPY --from=shared-builder /app/shared /app/shared
WORKDIR /app/shared
RUN npm ci --omit=dev

WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Copy built files
COPY --from=backend-builder /app/backend/dist ./dist
COPY backend/.env* ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the server
CMD ["node", "dist/server.js"]
