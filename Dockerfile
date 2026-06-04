FROM oven/bun:1 AS client-build

WORKDIR /client
COPY ./client/package.json ./
RUN bun install
COPY ./client ./
RUN bun run build

FROM oven/bun:1 AS server-build

WORKDIR /myspeed

COPY ./server /myspeed/server
COPY ./scripts /myspeed/scripts
COPY ./package.json /myspeed/package.json

RUN bun install
RUN bun run generate-migrations
RUN bun run generate-integrations

# Embed client assets into server for standalone mode
COPY --from=client-build /client/build /myspeed/build
RUN bun run generate-client-embed

FROM oven/bun:1

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

VOLUME ["/myspeed/data"]

EXPOSE 5216

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:5216/api/info/version || exit 1

CMD ["bun", "run", "server/index.js"]
