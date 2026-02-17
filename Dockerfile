# Stage 1: Build the application
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: Serve with lightweight static server
FROM node:20-alpine AS production

WORKDIR /app

# Install serve globally for static file serving
RUN npm install -g serve@14

# Copy built assets from build stage
COPY --from=build /app/dist ./dist

# Cloud Run injects PORT env variable (default 8080)
ENV PORT=8080
EXPOSE 8080

# Serve the SPA (-s flag enables single-page application mode)
CMD ["sh", "-c", "serve -s dist -l $PORT"]
