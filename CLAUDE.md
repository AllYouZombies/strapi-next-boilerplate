# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A production-ready monorepo boilerplate with Strapi 5 CMS (backend) and Next.js 15 (frontend), fully Dockerized with multi-stage builds. The project implements On-Demand Revalidation for cache management and supports 3 languages (Russian, Uzbek, English) via next-intl.

**Stack:**
- Backend: Strapi 5.30.1 (Node.js 22 LTS)
- Frontend: Next.js 15.5 with App Router & TypeScript
- Database: PostgreSQL 18
- Styling: Tailwind CSS v3
- Containerization: Docker & Docker Compose

## Development Commands

### Starting the Stack
```bash
# Start all services (first startup: 3-5 minutes)
docker compose up -d

# View logs
docker compose logs -f

# View specific service logs
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres

# Rebuild after dependency changes
docker compose up -d --build

# Rebuild specific service
docker compose up -d --build backend
docker compose up -d --build frontend
```

### Stopping & Cleanup
```bash
# Stop containers (keep data)
docker compose down

# Stop and remove all data including database
docker compose down -v

# Complete reset
docker compose down -v
docker system prune -a
docker compose up -d --build
```

### Container Access
```bash
# Backend shell
docker compose exec backend sh

# Frontend shell
docker compose exec frontend sh

# Database shell
docker compose exec postgres psql -U strapi -d strapi
```

### Production Builds

**Using Makefile (Recommended):**
```bash
# Build production images
make prod-build

# Start production stack
make prod-up

# View production logs
make prod-logs

# Stop production stack
make prod-down

# Restart production stack
make prod-restart

# Clean everything (images, volumes, network)
make prod-clean
```

**Manual (Advanced):**
```bash
# Build production images (default target)
docker build -t my-strapi:latest ./backend
docker build \
  --build-arg NEXT_PUBLIC_STRAPI_URL=http://localhost:1337 \
  --build-arg NEXT_PUBLIC_DEFAULT_LOCALE=ru \
  --build-arg NEXT_PUBLIC_AVAILABLE_LOCALES=ru,uz,en \
  -t my-nextjs:latest ./frontend

# Build development target explicitly
docker build --target development -t my-app:dev ./backend
```

## Architecture

### Docker Architecture
- **Multi-stage Dockerfiles**: Each service has separate `development` and `production` targets
- **Development mode**: Uses `docker-compose.yml` with `target: development`, hot-reload enabled via volume mounts
- **Production mode**: Build images directly with `docker build` (defaults to production target)
- **Volume mounts**: `node_modules` are isolated via anonymous volumes to prevent conflicts between host and container

### Service Communication
- **Frontend → Backend (internal)**: Uses `http://backend:1337` (Docker network)
- **Frontend → Backend (external)**: Uses `http://localhost:1337` (browser)
- **Strapi → Next.js webhooks**: Uses `http://frontend:3000` (Docker network)

### Port Mappings
- Frontend: `3000:3000`
- Backend: `1337:1337`
- PostgreSQL: Internal only (no host port mapping)

## On-Demand Revalidation System

**Critical: This project does NOT use ISR (Incremental Static Regeneration).**

### How It Works
1. Content is edited in Strapi CMS
2. Strapi lifecycle hook (`backend/src/index.ts`) triggers webhook
3. Webhook sends POST to `frontend/app/api/revalidate/route.ts`
4. Next.js clears cache via `revalidatePath()` for all locales
5. Next request fetches fresh data from Strapi

### Adding New Content Types to Revalidation

**Backend** (`backend/src/index.ts`):
```typescript
const contentTypes = ['product', 'category', 'page', 'blog-post', 'YOUR-TYPE'];
```

**Frontend** (`frontend/app/api/revalidate/route.ts`):
```typescript
case 'YOUR-TYPE':
  if (entry?.slug) {
    for (const locale of locales) {
      revalidatePath(`/${locale}/your-type/${entry.slug}`);
    }
  }
  for (const locale of locales) {
    revalidatePath(`/${locale}/your-type`);
  }
  break;
```

### Environment Variables Required
```bash
# Root .env (for Strapi)
NEXTJS_URL=http://frontend:3000
REVALIDATION_SECRET=your_generated_secret
ENABLE_WEBHOOKS=true

# Frontend: frontend/.env.local
REVALIDATION_SECRET=your_generated_secret
```

### Debugging Revalidation
```bash
# Watch logs from both services
docker compose logs -f frontend backend

# Expected output when content is updated:
# backend   | [Webhooks] ✅ Revalidated Next.js for product update
# frontend  | [Revalidation] ✅ Revalidated /ru/products/your-slug
```

## Internationalization (i18n)

### Supported Locales
- Russian (ru) - Default
- Uzbek (uz)
- English (en)

### Architecture
- **Frontend**: next-intl v3.26.3 with locale-based routing
- **Backend**: Strapi i18n plugin
- **Config**: `frontend/src/i18n/request.ts` (required by next-intl)
- **Middleware**: `frontend/middleware.ts` intercepts all requests and adds locale prefix
- **Translations**: Stored in `frontend/messages/{locale}.json`

### URL Structure
All pages are prefixed with locale:
- `/ru/` - Russian home
- `/uz/products` - Uzbek products
- `/en/blog/slug` - English blog post

### Using Translations

**Server Components:**
```typescript
import { getTranslations } from 'next-intl/server';

const t = await getTranslations({ locale, namespace: 'common' });
<button>{t('addToCart')}</button>
```

**Client Components:**
```typescript
'use client';
import { useTranslations } from 'next-intl';

const t = useTranslations('common');
<button>{t('addToCart')}</button>
```

### Fetching Localized Content from Strapi
Always include `locale` parameter:
```typescript
const res = await fetch(
  `${process.env.STRAPI_URL}/api/products?locale=${locale}&populate=*`,
  { cache: 'force-cache' }
);
```

### Adding New Locale

1. **Update frontend config** (`frontend/src/i18n/request.ts`):
```typescript
export const locales = ['ru', 'uz', 'en', 'NEW'] as const;
// Also update getLocaleName() and getLocaleFlag()
```

2. **Create translation file**: `frontend/messages/NEW.json`

3. **Update backend config** (`backend/config/plugins.ts`):
```typescript
locales: env.array('AVAILABLE_LOCALES', ['ru', 'uz', 'en', 'NEW']),
```

4. **Update environment variables**:
```bash
# .env and .env.example
AVAILABLE_LOCALES=ru,uz,en,NEW
NEXT_PUBLIC_AVAILABLE_LOCALES=ru,uz,en,NEW
```

5. **Restart services**: `docker compose restart backend frontend`

### Revalidation with i18n
The revalidation system automatically handles all locales. When content is updated in Strapi, `revalidatePath()` is called for each locale in a loop. See `frontend/app/api/revalidate/route.ts`.

## Strapi Configuration

### Creating Content Types
1. Go to http://localhost:1337/admin
2. Navigate to **Content-Type Builder**
3. Create new Collection Type
4. **For localized content**, edit schema JSON:

```json
{
  "kind": "collectionType",
  "collectionName": "products",
  "pluginOptions": {
    "i18n": {
      "localized": true
    }
  },
  "attributes": {
    "name": {
      "type": "string",
      "pluginOptions": {
        "i18n": {
          "localized": true
        }
      }
    },
    "price": {
      "type": "decimal",
      "pluginOptions": {
        "i18n": {
          "localized": false
        }
      }
    }
  }
}
```

### Setting Permissions
1. Go to **Settings** → **Users & Permissions Plugin** → **Roles** → **Public**
2. Enable public access to required endpoints
3. For authenticated-only endpoints, keep them disabled

## Next.js Architecture

### App Router Structure
```
frontend/app/
├── [locale]/                  # Locale-based routing
│   ├── layout.tsx            # Locale layout with NextIntlClientProvider
│   └── page.tsx              # Home page
├── api/
│   └── revalidate/
│       └── route.ts          # Revalidation endpoint
├── layout.tsx                # Root layout (passthrough)
└── globals.css               # Global styles (Tailwind v3)
```

### Important Patterns

**Accessing params in Next.js 15:**
```typescript
// params is now a Promise
export default async function Page({ params }: Props) {
  const { locale, slug } = await params;
}
```

**Caching strategy:**
- Use `cache: 'force-cache'` for Strapi API calls
- Never use ISR (`revalidate` option)
- Cache is cleared via On-Demand Revalidation only

## Environment Variables

### Required Strapi Secrets
Generate 6 secrets with: `openssl rand -base64 32`
```bash
APP_KEYS=
API_TOKEN_SALT=
ADMIN_JWT_SECRET=
TRANSFER_TOKEN_SALT=
JWT_SECRET=
ENCRYPTION_KEY=
```

### Database Configuration
```bash
POSTGRES_USER=strapi
POSTGRES_PASSWORD=change_me_in_production
POSTGRES_DB=strapi
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_CLIENT=postgres
```

### Revalidation & i18n
```bash
# Backend
NEXTJS_URL=http://frontend:3000
REVALIDATION_SECRET=generate_random_string_here
ENABLE_WEBHOOKS=true
DEFAULT_LOCALE=ru
AVAILABLE_LOCALES=ru,uz,en

# Frontend
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
STRAPI_URL=http://backend:1337
REVALIDATION_SECRET=same_as_backend
NEXT_PUBLIC_DEFAULT_LOCALE=ru
NEXT_PUBLIC_AVAILABLE_LOCALES=ru,uz,en
```

## Common Issues

### Frontend Showing 404 on /api
This is expected when Strapi is empty. The frontend checks if Strapi is running, and 404 is a valid response.

### Revalidation Not Working
1. Check `ENABLE_WEBHOOKS=true` in backend
2. Verify `REVALIDATION_SECRET` matches in both services
3. Check logs: `docker compose logs -f frontend backend`
4. Ensure `NEXTJS_URL=http://frontend:3000` (Docker network, not localhost)

### Hot-Reload Not Working
1. Ensure using `docker-compose.yml` (development target)
2. Check volume mounts are correct
3. Verify anonymous volumes for `node_modules` are in place

### Permission Errors
```bash
sudo chown -R $USER:$USER backend frontend
```

### Port Already in Use
```bash
lsof -i :3000
lsof -i :1337
# Either stop conflicting service or change ports in docker-compose.yml
```

## Key Files Reference

- `docker-compose.yml` - Development environment configuration
- `backend/src/index.ts` - Strapi lifecycle hooks for revalidation webhooks
- `backend/config/plugins.ts` - Strapi i18n plugin configuration
- `frontend/src/i18n/request.ts` - next-intl configuration and locale helpers
- `frontend/middleware.ts` - Locale routing middleware
- `frontend/app/api/revalidate/route.ts` - Revalidation endpoint
- `frontend/messages/{locale}.json` - UI translation files
- `.env` - Environment variables (never commit!)
- `.env.example` - Example environment variables

## Documentation Files

- `README.md` - Main project documentation
- `REVALIDATION.md` - Detailed On-Demand Revalidation guide
- `I18N.md` - Comprehensive i18n guide with examples
- `CLAUDE.md` - This file
