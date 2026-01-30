# Build stage
FROM node:22.12-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy workspace package files
COPY shared/package*.json ./shared/
COPY backend/package*.json ./backend/

# Install all dependencies (including workspaces)
RUN npm ci --workspace=shared --workspace=backend

# Copy source code
COPY shared/ ./shared/
COPY backend/ ./backend/

# Build shared package
RUN npm run build --workspace=shared

# Build backend
RUN npm run build --workspace=backend

# Production stage
FROM node:22.12-alpine

WORKDIR /app

# Copy built files from builder
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/shared/package*.json ./shared/
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/package*.json ./backend/
COPY --from=builder /app/package*.json ./

# Install production dependencies only
RUN npm ci --workspace=shared --workspace=backend --omit=dev

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the server
CMD ["node", "backend/dist/server.js"]
