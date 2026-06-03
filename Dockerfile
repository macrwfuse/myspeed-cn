# MySpeed-CN with xxir Speed Test Provider
# Multi-stage build for optimized image size
# Includes: Ookla, LibreSpeed, Cloudflare, xxir (CDN) providers

# Stage 1: Build frontend
FROM oven/bun:1 AS client-build

WORKDIR /client
COPY ./client/package.json ./
RUN bun install --frozen-lockfile
COPY ./client ./
RUN bun run build

# Stage 2: Build server
FROM oven/bun:1 AS server-build

WORKDIR /myspeed

# Copy the full original MySpeed server
COPY ./server /myspeed/server
COPY ./scripts /myspeed/scripts
COPY ./package.json /myspeed/package.json

# Copy xxir provider and patched files
COPY ./server/util/providers/xxir.js /myspeed/server/util/providers/xxir.js

RUN bun install --frozen-lockfile
RUN bun run generate-migrations
RUN bun run generate-integrations

# Stage 3: Production image
FROM oven/bun:1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    tzdata \
    ca-certificates \
    openssl \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set timezone
ENV TZ=Etc/UTC

WORKDIR /myspeed

# Copy built artifacts
COPY --from=server-build /myspeed/server /myspeed/server
COPY --from=server-build /myspeed/package.json /myspeed/package.json
COPY --from=server-build /myspeed/node_modules /myspeed/node_modules
COPY --from=client-build /client/build /myspeed/build

# Create data directories
RUN mkdir -p /myspeed/data/servers /myspeed/data/logs /myspeed/data/certs /myspeed/bin

# Set permissions
RUN chown -R bun:bun /myspeed

# Switch to non-root user
USER bun

# Expose ports
# 5216: HTTP
# 5217: HTTPS (optional)
EXPOSE 5216 5217

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:5216/api/info || exit 1

# Volume for persistent data
VOLUME ["/myspeed/data"]

# Start server
CMD ["bun", "run", "server/index.js"]
