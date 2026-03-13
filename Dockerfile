# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache libc6-compat

FROM base AS deps
RUN apk add --no-cache python3 make g++
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
COPY package.json pnpm-lock.yaml* package-lock.json* ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store \
    && if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; else pnpm import && pnpm install --frozen-lockfile; fi

FROM deps AS builder
COPY . .
RUN --mount=type=cache,id=next-cache,target=/app/.next/cache \
    --mount=type=cache,id=next-swc-cache,target=/root/.cache/next-swc \
    NODE_OPTIONS=--max-old-space-size=2560 pnpm exec next build --webpack

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apk add --no-cache libc6-compat && addgroup -S nodejs && adduser -S nextjs -G nodejs
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh && chown -R nextjs:nodejs /app/public

USER nextjs

EXPOSE 3000

ENTRYPOINT ["sh", "/entrypoint.sh"]


