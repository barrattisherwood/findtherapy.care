# Build stage
FROM node:22.12-alpine AS builder

WORKDIR /app

# Copy all package files for workspace resolution
COPY package*.json ./
COPY shared/ ./shared/
COPY backend/ ./backend/

# Install all dependencies
RUN npm ci

# Build shared package first
RUN cd shared && npm run build

# Build backend
RUN cd backend && npm run build

# Production stage
FROM node:22.12-alpine

WORKDIR /app/backend

# Copy built backend files
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/package*.json ./

# Copy built shared package
COPY --from=builder /app/shared/dist ../shared/dist
COPY --from=builder /app/shared/package*.json ../shared/

# Install production dependencies only for backend
RUN npm install --omit=dev

# Expose port
EXPOSE 3000

# Start the server
CMD ["node", "dist/server.js"]
