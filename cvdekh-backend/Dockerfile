# Use Alpine Linux with Node.js for minimal size
FROM node:22-alpine AS base

# Install system dependencies and Typst CLI
RUN apk add --no-cache \
    curl \
    ca-certificates \
    bash \
    && rm -rf /var/cache/apk/*

# Install Typst CLI from GitHub releases (latest version)
RUN TYPST_VERSION=$(curl -s https://api.github.com/repos/typst/typst/releases/latest | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/') \
    && curl -L "https://github.com/typst/typst/releases/download/${TYPST_VERSION}/typst-x86_64-unknown-linux-musl.tar.xz" -o typst.tar.xz \
    && tar -xf typst.tar.xz \
    && mv typst-x86_64-unknown-linux-musl/typst /usr/local/bin/typst \
    && chmod +x /usr/local/bin/typst \
    && rm -rf typst.tar.xz typst-x86_64-unknown-linux-musl \
    && typst --version

# Install Bun (for package management)
RUN curl -fsSL https://bun.com/install | bash
ENV PATH="/root/.bun/bin:$PATH"

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package.json bun.lock* ./

# Development stage
FROM base AS development
# Install all dependencies (including dev dependencies)
RUN bun install --frozen-lockfile
# Copy source code
COPY . .
# Create necessary directories
RUN mkdir -p temp temp-uploads fonts dist
RUN chmod 755 temp temp-uploads
# Default command for development
CMD ["npm", "run", "dev"]

# Build stage
FROM base AS builder
# Install all dependencies (including dev dependencies for build)
RUN bun install --frozen-lockfile
# Copy source code
COPY . .
# Build the application
RUN npm run build

# Production stage
FROM base AS production
# Install only production dependencies
RUN bun install --frozen-lockfile --production
# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
# Copy the Typst template file to the correct location
COPY --from=builder /app/src/config/resume_template.typ ./dist/config/resume_template.typ
# Copy other necessary files (fonts, etc.)
COPY --from=builder /app/fonts ./fonts
COPY --from=builder /app/package.json ./package.json

# Create necessary directories
RUN mkdir -p temp temp-uploads
RUN chmod 755 temp temp-uploads

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs \
    && adduser -S backend -u 1001
RUN chown -R backend:nodejs /app
USER backend

# Expose port 8080
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/api/v1/healthcheck || exit 1

# Start the application
CMD ["npm", "start"]