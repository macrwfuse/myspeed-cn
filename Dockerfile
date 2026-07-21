
FROM docker.1ms.run/node:20-slim AS client-build

WORKDIR /client
RUN set -eux; \
    if [ -f /etc/apt/sources.list.d/debian.sources ]; then \
      sed -i \
        -e 's|deb.debian.org|mirrors.aliyun.com|g' \
        -e 's|security.debian.org|mirrors.aliyun.com/debian-security|g' \
        /etc/apt/sources.list.d/debian.sources; \
    else \
      sed -i \
        -e 's|deb.debian.org|mirrors.aliyun.com|g' \
        -e 's|security.debian.org|mirrors.aliyun.com/debian-security|g' \
        /etc/apt/sources.list; \
    fi

COPY ./client/package.json ./
RUN npm install
COPY ./client ./
RUN npm run build

FROM  docker.1ms.run/oven/bun:1 AS server-build


WORKDIR /myspeed

RUN set -eux; \
    if [ -f /etc/apt/sources.list.d/debian.sources ]; then \
      sed -i \
        -e 's|deb.debian.org|mirrors.aliyun.com|g' \
        -e 's|security.debian.org|mirrors.aliyun.com/debian-security|g' \
        /etc/apt/sources.list.d/debian.sources; \
    else \
      sed -i \
        -e 's|deb.debian.org|mirrors.aliyun.com|g' \
        -e 's|security.debian.org|mirrors.aliyun.com/debian-security|g' \
        /etc/apt/sources.list; \
    fi

COPY ./server /myspeed/server
COPY ./scripts /myspeed/scripts
COPY ./package.json /myspeed/package.json

RUN bun install
RUN bun run generate-migrations
RUN bun run generate-integrations

# Embed client assets into server for standalone mode
COPY --from=client-build /client/build /myspeed/build
RUN bun run generate-client-embed

# Download speed test CLI binaries for Linux x86_64
FROM  docker.1ms.run/debian:bookworm-slim AS binaries

RUN set -eux; \
    if [ -f /etc/apt/sources.list.d/debian.sources ]; then \
      sed -i \
        -e 's|deb.debian.org|mirrors.aliyun.com|g' \
        -e 's|security.debian.org|mirrors.aliyun.com/debian-security|g' \
        /etc/apt/sources.list.d/debian.sources; \
    else \
      sed -i \
        -e 's|deb.debian.org|mirrors.aliyun.com|g' \
        -e 's|security.debian.org|mirrors.aliyun.com/debian-security|g' \
        /etc/apt/sources.list; \
    fi

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates tar gzip unzip && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /bins

# Ookla Speedtest CLI v1.2.0
RUN curl -fsSL "https://install.speedtest.net/app/cli/ookla-speedtest-1.2.0-linux-x86_64.tgz" -o /tmp/ookla.tgz && \
    tar -xzf /tmp/ookla.tgz -C /bins speedtest && \
    chmod +x /bins/speedtest && \
    rm /tmp/ookla.tgz

# LibreSpeed CLI v1.0.10
RUN curl -fsSL "https://gh.xxooo.cf/https://github.com/librespeed/speedtest-cli/releases/download/v1.0.10/librespeed-cli_1.0.10_linux_amd64.tar.gz" -o /tmp/libre.tar.gz && \
    tar -xzf /tmp/libre.tar.gz -C /bins librespeed-cli && \
    chmod +x /bins/librespeed-cli && \
    rm /tmp/libre.tar.gz

# Cloudflare cfspeedtest v2.2.2
RUN curl -fsSL "https://gh.xxooo.cf/https://github.com/code-inflation/cfspeedtest/releases/download/v2.2.2/cfspeedtest-x86_64-unknown-linux-gnu.tar.gz" -o /tmp/cf.tar.gz && \
    tar -xzf /tmp/cf.tar.gz -C /bins cfspeedtest && \
    chmod +x /bins/cfspeedtest && \
    rm /tmp/cf.tar.gz

FROM  docker.1ms.run/oven/bun:1

RUN apt-get update && apt-get install -y --no-install-recommends \
    tzdata ca-certificates openssl curl \
    && rm -rf /var/lib/apt/lists/*

# 默认时区设为 Asia/Shanghai
ENV TZ=Asia/Shanghai

WORKDIR /myspeed

COPY --from=server-build /myspeed/server /myspeed/server
COPY --from=server-build /myspeed/package.json /myspeed/package.json
COPY --from=server-build /myspeed/node_modules /myspeed/node_modules
COPY --from=client-build /client/build /myspeed/build

# Copy pre-downloaded speed test binaries
COPY --from=binaries /bins/speedtest /myspeed/bin/speedtest
COPY --from=binaries /bins/librespeed-cli /myspeed/bin/librespeed-cli
COPY --from=binaries /bins/cfspeedtest /myspeed/bin/cfspeedtest

VOLUME ["/myspeed/data"]

EXPOSE 5216

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:5216/api/info/version || exit 1

CMD ["bun", "run", "server/index.js"]
