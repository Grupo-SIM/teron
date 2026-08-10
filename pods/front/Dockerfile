FROM oven/bun:1.3.9-alpine AS landing-builder
WORKDIR /landing

COPY landing/package.json landing/bun.lock ./
RUN bun install --frozen-lockfile

COPY landing/ ./
RUN bun run build

FROM hardcoreeng/front-base:v20250916
WORKDIR /app

COPY bundle/bundle.js ./
COPY bundle/bundle.js.map ./
COPY dist/ ./dist/
COPY --from=landing-builder /landing/out/ ./dist/landing/

EXPOSE 8080
CMD [ "node", "./bundle.js" ]
