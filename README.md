# Strapi + Next.js Boilerplate

A production-ready full-stack boilerplate with Strapi 5 CMS (backend) and Next.js 15 (frontend), fully containerized with Docker.

## Stack

- **Backend**: Strapi 5.30.1 (Node.js 22 LTS)
- **Frontend**: Next.js 15.5 with App Router & TypeScript
- **Database**: PostgreSQL 18
- **Styling**: Tailwind CSS
- **Containerization**: Docker & Docker Compose

## Features

- Multi-stage Docker builds for development and production
- Hot-reload in development mode for both frontend and backend
- PostgreSQL with persistent volumes
- TypeScript support
- CORS configured for frontend-backend communication
- Health checks for all services
- Security: non-root users, environment variables

## System Requirements

- Docker 24.0+
- Docker Compose 2.20+
- (Optional) Node.js 22.x for local development

## Project Structure

```
project-root/
├── frontend/          # Next.js 15 application
│   ├── Dockerfile     # Multi-stage: development + production
│   ├── app/           # Next.js App Router
│   └── ...
├── backend/           # Strapi 5 CMS
│   ├── Dockerfile     # Multi-stage: development + production
│   ├── config/        # Strapi configuration
│   └── ...
├── docker-compose.yml # Development environment (hot-reload)
├── .env               # Environment variables (DO NOT commit!)
└── .env.example       # Example environment variables
```

## Quick Start

### 1. Clone and Setup Environment

```bash
# Copy environment variables
cp .env.example .env

# Generate secure secrets (IMPORTANT for production!)
openssl rand -base64 32  # Run 6 times and replace values in .env
```

Edit `.env` and replace all `generate_random_string_here` values with generated secrets.

### 2. Start Development Environment

```bash
# Start all services (PostgreSQL, Strapi, Next.js)
docker compose up -d

# View logs
docker compose logs -f

# View specific service logs
docker compose logs -f backend
docker compose logs -f frontend
```

**First startup may take 3-5 minutes** to build images and install dependencies.

### 3. Access Services

- **Frontend**: http://localhost:3000
- **Strapi Admin**: http://localhost:1337/admin
- **Strapi API**: http://localhost:1337/api

### 4. First-time Strapi Setup

1. Navigate to http://localhost:1337/admin
2. Create your admin account (email, password)
3. Configure API permissions:
   - Go to **Settings** → **Users & Permissions Plugin** → **Roles** → **Public**
   - Enable public access to endpoints as needed

## Content Revalidation Strategy

This project uses **On-Demand Revalidation** to update Next.js pages when content changes in Strapi.

**⚠️ Important: We do NOT use ISR (Incremental Static Regeneration).**

When you update content in Strapi, it automatically triggers a webhook that invalidates the Next.js cache for affected pages.

**See [REVALIDATION.md](./REVALIDATION.md) for detailed documentation.**

### Quick Setup for Revalidation

The revalidation system is already configured in this boilerplate with a generated secret. To customize:

1. Generate a strong secret:
```bash
openssl rand -base64 32
```

2. Update in both `.env` files:
```bash
# Root .env (for Strapi)
NEXTJS_URL=http://frontend:3000
REVALIDATION_SECRET=your_generated_secret
ENABLE_WEBHOOKS=true

# Frontend: frontend/.env.local
REVALIDATION_SECRET=your_generated_secret
```

3. Restart services:
```bash
docker compose restart
```

4. Test by editing content in Strapi Admin Panel and checking logs:
```bash
docker compose logs -f frontend backend
```

You should see:
```
backend   | [Webhooks] ✅ Revalidated Next.js for product update
frontend  | [Revalidation] ✅ Revalidated /products/your-slug
```

## Internationalization (i18n)

This project supports **3 languages** out of the box:
- 🇷🇺 **Russian (ru)** - Default
- 🇺🇿 **Uzbek (uz)** - O'zbekcha
- 🇬🇧 **English (en)**

**Key Features:**
- ✅ Locale-based URL routing (`/ru/`, `/uz/`, `/en/`)
- ✅ Language switcher component (top-right corner)
- ✅ Localized UI translations via next-intl
- ✅ Localized content from Strapi i18n plugin
- ✅ SEO-optimized with hreflang tags
- ✅ Automatic cache revalidation for all locales

**See [I18N.md](./I18N.md) for complete documentation.**

### Quick i18n Guide

**URL Structure:**
```
http://localhost:3000/ru          → Russian home page
http://localhost:3000/uz          → Uzbek home page
http://localhost:3000/en          → English home page
http://localhost:3000/ru/products → Russian products
```

**Using Translations in Components:**

Server Components:
```typescript
import { getTranslations } from 'next-intl/server';

const t = await getTranslations('common');
<button>{t('addToCart')}</button>
```

Client Components:
```typescript
'use client';
import { useTranslations } from 'next-intl';

const t = useTranslations('common');
<button>{t('addToCart')}</button>
```

**Fetching Localized Content:**
```typescript
// Always include locale parameter when fetching from Strapi
const res = await fetch(
  `${process.env.STRAPI_URL}/api/products?locale=${locale}&populate=*`,
  { cache: 'force-cache' }
);
```

## Development Workflow

### Hot-Reload

Both frontend and backend support hot-reload in development mode:

- **Frontend**: Changes to files in `frontend/` automatically refresh the browser
- **Backend**: Changes to files in `backend/` automatically restart Strapi

### Rebuild After Dependencies Change

```bash
# Rebuild after adding npm packages
docker compose up -d --build

# Or rebuild specific service
docker compose up -d --build backend
docker compose up -d --build frontend
```

### Stop Services

```bash
# Stop containers (keep data)
docker compose down

# Stop and remove all data (including database)
docker compose down -v
```

### View Container Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f postgres
```

### Execute Commands in Container

```bash
# Backend shell
docker compose exec backend sh

# Frontend shell
docker compose exec frontend sh

# Database shell
docker compose exec postgres psql -U strapi -d strapi
```

## Production Build

Docker Compose is for **development only**. For production, build images separately:

### Using Makefile (Recommended)

The easiest way to build and run production images locally:

```bash
# Build production images
make prod-build

# Start production stack (automatically creates network, starts all containers)
make prod-up

# View logs
make prod-logs

# Stop production stack
make prod-down

# Restart production stack
make prod-restart

# Clean everything (images, volumes, network)
make prod-clean
```

The Makefile automatically:
- Loads environment variables from `.env`
- Creates Docker network for container communication
- Passes NEXT_PUBLIC_* variables as build args to frontend
- Configures all environment variables correctly
- Starts services in correct order (PostgreSQL → Backend → Frontend)

### Manual Build (Advanced)

```bash
# Build backend production image
docker build -t my-strapi:latest ./backend

# Build frontend production image with build args
docker build \
  --build-arg NEXT_PUBLIC_STRAPI_URL=http://localhost:1337 \
  --build-arg NEXT_PUBLIC_DEFAULT_LOCALE=ru \
  --build-arg NEXT_PUBLIC_AVAILABLE_LOCALES=ru,uz,en \
  -t my-nextjs:latest ./frontend
```

By default, `docker build` creates production images (optimized, minimal size).

### Manual Run (Advanced)

```bash
# Create network
docker network create strapi-next-prod

# Run PostgreSQL
docker run -d \
  --name postgres \
  --network strapi-next-prod \
  -e POSTGRES_USER=strapi \
  -e POSTGRES_PASSWORD=your_secure_password \
  -e POSTGRES_DB=strapi \
  -v postgres-data:/var/lib/postgresql/data \
  postgres:18-alpine

# Run Strapi backend
docker run -d \
  --name backend \
  --network strapi-next-prod \
  -p 1337:1337 \
  --env-file .env \
  -e DATABASE_HOST=postgres \
  -e NEXTJS_URL=http://frontend:3000 \
  my-strapi:latest

# Run Next.js frontend
docker run -d \
  --name frontend \
  --network strapi-next-prod \
  -p 3000:3000 \
  -e NEXT_PUBLIC_STRAPI_URL=http://localhost:1337 \
  -e STRAPI_URL=http://backend:1337 \
  -e REVALIDATION_SECRET=your_secret \
  my-nextjs:latest
```

### Push to Registry

```bash
# Login to Docker Hub or your registry
docker login

# Tag images
docker tag my-strapi:latest yourusername/strapi:1.0.0
docker tag my-nextjs:latest yourusername/nextjs:1.0.0

# Push images
docker push yourusername/strapi:1.0.0
docker push yourusername/nextjs:1.0.0
```

## Docker Architecture

### Multi-Stage Builds

Both `Dockerfile`s use multi-stage builds with separate targets:

**Development Target** (`target: development`):
- Used by `docker-compose.yml`
- Includes dev dependencies
- Hot-reload enabled
- Volume mounts for live code changes

**Production Target** (default):
- Minimal image size
- Only production dependencies
- Optimized build output
- Non-root user for security

### Build Targets

```bash
# Build specific target
docker build --target development -t my-app:dev .
docker build --target production -t my-app:prod .

# Default builds production
docker build -t my-app:prod .
```

## Environment Variables

See `.env.example` for all available variables.

### Required Variables

```env
# Database
POSTGRES_USER=strapi
POSTGRES_PASSWORD=change_me_in_production
POSTGRES_DB=strapi

# Strapi (generate with: openssl rand -base64 32)
APP_KEYS=required
API_TOKEN_SALT=required
ADMIN_JWT_SECRET=required
TRANSFER_TOKEN_SALT=required
JWT_SECRET=required
ENCRYPTION_KEY=required

# Frontend
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
```

## Troubleshooting

### Port Already in Use

```bash
# Check what's using port 3000 or 1337
lsof -i :3000
lsof -i :1337

# Stop conflicting services or change ports in docker-compose.yml
```

### Database Connection Issues

```bash
# Check if PostgreSQL is healthy
docker compose ps

# View PostgreSQL logs
docker compose logs postgres

# Recreate database volume
docker compose down -v
docker compose up -d
```

### Permission Errors

```bash
# Fix ownership (if needed)
sudo chown -R $USER:$USER backend frontend
```

### Fresh Start

```bash
# Complete reset
docker compose down -v
docker system prune -a
docker compose up -d --build
```

## Security Notes

1. **Never commit `.env` to git** - it's already in `.gitignore`
2. **Generate strong secrets** for production using `openssl rand -base64 32`
3. **Change default passwords** in `.env` before deploying
4. **Use HTTPS** in production (configure reverse proxy like Nginx)
5. **Update dependencies** regularly for security patches

## Package Updates

```bash
# Update backend dependencies
cd backend && npm update

# Update frontend dependencies
cd frontend && npm update

# Rebuild containers
docker compose up -d --build
```

## API Usage Example

### Frontend Integration

The boilerplate includes an example in `frontend/app/page.tsx`:

```typescript
const response = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api`);
const data = await response.json();
```

### Create Content Type in Strapi

1. Go to **Content-Type Builder** in Strapi admin
2. Create a new Collection Type (e.g., "Article")
3. Add fields
4. Save and restart Strapi (automatic in dev mode)
5. Add content in **Content Manager**
6. Set permissions in **Settings** → **Roles**

### Fetch Data from Frontend

```typescript
const response = await fetch('http://localhost:1337/api/articles?populate=*');
const { data } = await response.json();
```

## Performance

### Development Mode

- Frontend: ~50MB RAM, instant hot-reload
- Backend: ~150MB RAM, auto-restart on changes
- Total: ~300MB RAM for full stack

### Production Mode

- Frontend: Next.js standalone ~200-300MB image
- Backend: Strapi optimized ~300-400MB image
- Minimal dependencies, secure runtime

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `docker compose up`
5. Submit a pull request

## License

MIT License - feel free to use for personal or commercial projects.

## Support

- [Strapi Documentation](https://docs.strapi.io/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Docker Documentation](https://docs.docker.com/)

---

**Built with**:
- Strapi 5.30.1
- Next.js 15.5
- PostgreSQL 18
- Node.js 22 LTS
- Docker & Docker Compose
