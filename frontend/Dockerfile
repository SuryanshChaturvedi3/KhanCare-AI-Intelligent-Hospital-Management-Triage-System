# ============================================
# KhanCare Frontend — Multi-Stage Dockerfile
# ============================================
# WHY multi-stage?
# Stage 1: Uses Node.js (big, ~1GB) to BUILD the React app
# Stage 2: Uses Nginx (tiny, ~25MB) to SERVE the static files
# Final image = only ~25MB instead of ~1GB!

# ==================== STAGE 1: BUILD ====================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first (layer caching)
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# WHY ARG instead of ENV?
# ARG = only available during build (docker build --build-arg VITE_API_URL=...)
# Vite bakes these into the JavaScript bundle at build time.
# They become hardcoded strings in the final JS files.
ARG VITE_API_URL
ARG VITE_AI_URL

# Make ARGs available as environment variables for Vite build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_AI_URL=$VITE_AI_URL

# Build the React app → produces /app/dist folder
RUN npm run build


# ==================== STAGE 2: SERVE ====================
# WHY nginx:alpine?
# Nginx = fastest web server for static files
# Uses 10MB RAM vs 100MB+ for a Node.js server
# Handles 10,000+ concurrent connections easily
FROM nginx:alpine

# Copy built React files from Stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx config (handles React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# WHY "daemon off"?
# Nginx normally runs as a background service (daemon).
# Docker needs the main process to stay in foreground, otherwise container exits.
CMD ["nginx", "-g", "daemon off;"]
