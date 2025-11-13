# Multi-stage build for Next.js frontend

# Stage 1: base - common base image
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Stage 2: deps - install production dependencies
FROM base AS deps
COPY package.json package-lock.json* .npmrc* ./
RUN npm ci

# Stage 3: development - for local development with hot-reload
FROM base AS development
COPY package.json package-lock.json* .npmrc* ./
RUN npm ci
COPY . .
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Stage 4: builder - build for production
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Accept build arguments for Next.js public variables
ARG NEXT_PUBLIC_STRAPI_URL
ARG NEXT_PUBLIC_DEFAULT_LOCALE
ARG NEXT_PUBLIC_AVAILABLE_LOCALES

# Set environment variables from build args
ENV NEXT_PUBLIC_STRAPI_URL=$NEXT_PUBLIC_STRAPI_URL
ENV NEXT_PUBLIC_DEFAULT_LOCALE=$NEXT_PUBLIC_DEFAULT_LOCALE
ENV NEXT_PUBLIC_AVAILABLE_LOCALES=$NEXT_PUBLIC_AVAILABLE_LOCALES

# Enable standalone output for optimal image size
# next.config.js must contain: output: 'standalone'
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 5: production (default) - final production image
FROM base AS production
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Copy standalone output and static files
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "server.js"]
