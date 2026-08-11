FROM oven/bun:1.3.9-alpine AS landing-dependencies
WORKDIR /landing

COPY landing/package.json landing/bun.lock ./
RUN bun install --frozen-lockfile

FROM node:22-alpine AS landing-builder
WORKDIR /landing

COPY --from=landing-dependencies /landing/node_modules ./node_modules
COPY landing/ ./
RUN node scripts/copy-rive-wasm.mjs \
    && node node_modules/next/dist/bin/next build

FROM hardcoreeng/front-base:v20250916
WORKDIR /app

COPY bundle/bundle.js ./
COPY bundle/bundle.js.map ./
COPY dist/ ./dist/
COPY --from=landing-builder /landing/out/ ./dist/landing/

EXPOSE 8080
CMD [ "node", "./bundle.js" ]
