# Multi-stage build for Strapi backend

# Stage 1: base - common base image
FROM node:22-alpine AS base
RUN apk update && apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev vips-dev git > /dev/null 2>&1
WORKDIR /opt/app

# Stage 2: dependencies - install dependencies
FROM base AS dependencies
COPY package.json package-lock.json ./
RUN npm ci --only=production && npm cache clean --force
COPY package.json package-lock.json ./
RUN npm ci --only=development && npm cache clean --force

# Stage 3: development - for local development
FROM base AS development
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV NODE_ENV=development
EXPOSE 1337
CMD ["npm", "run", "develop"]

# Stage 4: builder - build for production
FROM base AS builder
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV NODE_ENV=production
RUN npm run build

# Stage 5: production (default) - final production image
FROM base AS production
COPY --from=dependencies /opt/app/node_modules ./node_modules
COPY --from=builder /opt/app/dist/build ./build
COPY --from=builder /opt/app/dist/config ./config
COPY --from=builder /opt/app/dist/src ./src
COPY --from=builder /opt/app/public ./public
COPY --from=builder /opt/app/package.json ./package.json
COPY --from=builder /opt/app/database ./database

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S strapi -u 1001
RUN chown -R strapi:nodejs /opt/app
USER strapi

ENV NODE_ENV=production
EXPOSE 1337
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:1337/_health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
CMD ["npm", "run", "start"]
