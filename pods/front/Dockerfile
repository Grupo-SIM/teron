FROM oven/bun:1.3.9-alpine AS site-dependencies
WORKDIR /site

COPY site/package.json site/bun.lock ./
RUN bun install --frozen-lockfile

FROM node:22-alpine AS site-builder
WORKDIR /site

ARG TERON_WORKSPACE_SEAT_AMOUNT=9.99
# The marketing site is exported into teron_front, so this public value must
# be present while `next build` runs; changing it on a running container has
# no effect on the generated browser bundle.
ENV NEXT_PUBLIC_WORKSPACE_SEAT_AMOUNT=${TERON_WORKSPACE_SEAT_AMOUNT}

COPY --from=site-dependencies /site/node_modules ./node_modules
COPY site/ ./
RUN node scripts/copy-rive-wasm.mjs \
    && node node_modules/next/dist/bin/next build

FROM hardcoreeng/front-base:v20250916
WORKDIR /app

COPY bundle/bundle.js ./
COPY bundle/bundle.js.map ./
COPY dist/ ./dist/
COPY --from=site-builder /site/out/ ./dist/site/

EXPOSE 8080
CMD [ "node", "./bundle.js" ]
