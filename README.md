# Strapi + Next.js Boilerplate

A production-ready full-stack boilerplate with Strapi 5 CMS (backend) and Next.js 15 (frontend), fully containerized with Docker.

## Stack

- **Backend**: Strapi 5.30.1 (Node.js 22 LTS)
- **Frontend**: Next.js 15.5 with App Router & TypeScript
- **Database**: PostgreSQL 18
- **Styling**: Tailwind CSS
- **Containerization**: Docker & Docker Compose

## Features

- ✅ Multi-stage Docker builds for development and production
- ✅ Hot-reload in development mode for both frontend and backend
- ✅ PostgreSQL with persistent volumes
- ✅ TypeScript support
- ✅ CORS configured for frontend-backend communication
- ✅ Health checks for all services
- ✅ Security: non-root users, environment variables
- ✅ **Dokku deployment support** with Makefile commands
- ✅ **CI/CD with GitHub Actions** (parallel deployment)
- ✅ **On-Demand Revalidation** (Strapi webhooks → Next.js)
- ✅ **Multi-language support** (i18n with next-intl)

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

## Content Revalidation

Uses **On-Demand Revalidation** (not ISR). Strapi webhooks → Next.js cache invalidation.

**Already configured.** To customize:

```bash
# Generate secret
openssl rand -base64 32

# Update .env
NEXTJS_URL=http://frontend:3000
REVALIDATION_SECRET=your_secret
ENABLE_WEBHOOKS=true

# Update frontend/.env.local
REVALIDATION_SECRET=your_secret

# Restart and test
docker compose restart
docker compose logs -f frontend backend
```

**See [REVALIDATION.md](./REVALIDATION.md) for details.**

## Internationalization (i18n)

**Supported:** Russian (ru), Uzbek (uz), English (en)
**URL format:** `/ru/`, `/uz/`, `/en/`

**Usage:**
```typescript
// Server components
import { getTranslations } from 'next-intl/server';
const t = await getTranslations('common');

// Client components
'use client';
import { useTranslations } from 'next-intl';
const t = useTranslations('common');

// Fetch from Strapi
fetch(`${process.env.STRAPI_URL}/api/products?locale=${locale}&populate=*`)
```

**See [I18N.md](./I18N.md) for details.**

## Development Commands

```bash
# View logs
docker compose logs -f               # All services
docker compose logs -f backend       # Backend only

# Rebuild after package changes
docker compose up -d --build         # All services
docker compose up -d --build backend # Backend only

# Stop services
docker compose down      # Keep data
docker compose down -v   # Remove data

# Execute commands in container
docker compose exec backend sh
docker compose exec frontend sh
docker compose exec postgres psql -U strapi -d strapi
```

**Hot-reload** enabled for both frontend and backend.

## Production Build (Local)

Test production build locally before deploying to Dokku:

```bash
make prod-build    # Build production images
make prod-up       # Start all services (Postgres, backend, frontend)
make prod-logs     # View logs
make prod-down     # Stop services
make prod-clean    # Remove images and volumes
```

**Note:** Makefile loads `.env`, creates network, passes build args automatically.

## Dokku Deployment

Deploy to Dokku using tar archives (monorepo-compatible).

### Server Setup (One-Time)

**Set environment variables:**
```bash
export DOKKU_HOST=<dokku-host>
export BACKEND_DOMAIN=home-admin.example.com
export FRONTEND_DOMAIN=home.example.com
```

**1. Create Dokku apps:**
```bash
ssh dokku@$DOKKU_HOST apps:create home-backend
ssh dokku@$DOKKU_HOST apps:create home-frontend
```

**2. Install required Dokku plugins:**
```bash
# PostgreSQL
ssh root@$DOKKU_HOST "sudo dokku plugin:install https://github.com/dokku/dokku-postgres.git"

# Let's Encrypt for SSL
ssh root@$DOKKU_HOST "sudo dokku plugin:install https://github.com/dokku/dokku-letsencrypt.git"

# Verify installation
ssh root@$DOKKU_HOST "dokku plugin:list" | grep -E "postgres|letsencrypt"
```

**3. Configure persistent storage for media files:**
```bash
# CRITICAL: Without this, uploaded media files will be lost on every redeploy
ssh dokku@$DOKKU_HOST storage:ensure-directory home-backend
ssh dokku@$DOKKU_HOST storage:mount home-backend /var/lib/dokku/data/storage/home-backend/uploads:/opt/app/public/uploads

# Fix permissions (required for Strapi to write files)
# UID 1001 = strapi user, GID 65533 = nogroup
ssh root@$DOKKU_HOST "chown -R 1001:65533 /var/lib/dokku/data/storage/home-backend/uploads"
ssh root@$DOKKU_HOST "chmod -R 755 /var/lib/dokku/data/storage/home-backend/uploads"

# Verify mount
ssh dokku@$DOKKU_HOST storage:list home-backend
```

**4. Create and link database:**
```bash
ssh dokku@$DOKKU_HOST postgres:create home-db
ssh dokku@$DOKKU_HOST postgres:link home-db home-backend
```

**6. Configure backend environment:**
```bash
ssh dokku@$DOKKU_HOST config:set home-backend \
  NODE_ENV=production \
  DATABASE_CLIENT=postgres \
  APP_KEYS="key1,key2,key3" \
  API_TOKEN_SALT="$(openssl rand -base64 32)" \
  ADMIN_JWT_SECRET="$(openssl rand -base64 32)" \
  TRANSFER_TOKEN_SALT="$(openssl rand -base64 32)" \
  JWT_SECRET="$(openssl rand -base64 32)" \
  ENCRYPTION_KEY="$(openssl rand -base64 32)" \
  REVALIDATION_SECRET="$(openssl rand -base64 32)" \
  NEXTJS_URL=https://$FRONTEND_DOMAIN \
  ENABLE_WEBHOOKS=true \
  DEFAULT_LOCALE=ru \
  AVAILABLE_LOCALES=ru,uz,en
```

**7. Configure frontend environment:**
```bash
ssh dokku@$DOKKU_HOST config:set home-frontend \
  NODE_ENV=production \
  NEXT_PUBLIC_STRAPI_URL=https://$BACKEND_DOMAIN \
  STRAPI_URL=http://$BACKEND_DOMAIN \
  REVALIDATION_SECRET="same_as_backend" \
  NEXT_PUBLIC_DEFAULT_LOCALE=ru \
  NEXT_PUBLIC_AVAILABLE_LOCALES=ru,uz,en
```

**8. Configure port mappings:**
```bash
ssh dokku@$DOKKU_HOST ports:add home-backend http:80:1337
ssh dokku@$DOKKU_HOST ports:add home-frontend http:80:3000
```

**9. Setup domains:**
```bash
ssh dokku@$DOKKU_HOST domains:clear-global
ssh dokku@$DOKKU_HOST domains:add home-backend $BACKEND_DOMAIN
ssh dokku@$DOKKU_HOST domains:add home-frontend $FRONTEND_DOMAIN
```

**10. Create Docker network (for inter-app communication):**
```bash
ssh dokku@$DOKKU_HOST network:create dokku-network
ssh dokku@$DOKKU_HOST network:set home-backend attach-post-deploy dokku-network
ssh dokku@$DOKKU_HOST network:set home-frontend attach-post-deploy dokku-network
```

**11. Setup SSL (after first deployment):**
```bash
# Enable Let's Encrypt for both apps
ssh dokku@$DOKKU_HOST letsencrypt:enable home-backend
ssh dokku@$DOKKU_HOST letsencrypt:enable home-frontend

# Configure auto-renewal (runs monthly)
ssh dokku@$DOKKU_HOST letsencrypt:cron-job --add
```

### Deploy Commands

**Set variables (or override Makefile defaults):**
```bash
export DOKKU_HOST=31.130.147.156
export BACKEND_DOMAIN=home-admin.uzb-dev.com
export FRONTEND_DOMAIN=home.uzb-dev.com
```

**Deploy:**
```bash
make deploy-all          # All at once
make deploy-backend      # Backend only
make deploy-frontend     # Frontend only
make deploy-ports        # Port mappings
make deploy-domains      # Domains
```

**Monitor:**
```bash
make deploy-status           # Status
make deploy-logs-backend     # Backend logs
make deploy-logs-frontend    # Frontend logs
```

### CI/CD with GitHub Actions

**Setup (one-time):**

Generate SSH key:
```bash
ssh-keygen -t ed25519 -C "github-actions@dokku" -f ~/.ssh/github_actions_dokku
cat ~/.ssh/github_actions_dokku.pub | ssh root@$DOKKU_HOST "dokku ssh-keys:add github-actions"
```

Add to GitHub (**Settings → Secrets and variables → Actions**):

**Secret:** `DOKKU_SSH_PRIVATE_KEY` (content of `~/.ssh/github_actions_dokku`)

**Variables:** `DOKKU_HOST`, `DOKKU_BACKEND_APP`, `DOKKU_FRONTEND_APP`, `BACKEND_DOMAIN`, `FRONTEND_DOMAIN`

Push to deploy:
```bash
git push origin main  # Auto-deploys (includes port mappings)
```

**Notes:**
- Workflow automatically configures port mappings on first deploy
- If no code changes detected, deployment is marked as successful (no rebuild needed)

### Migrating Existing Media Files

If you already have media files in a previous deployment:

```bash
# 1. Enter backend container and create backup
ssh dokku@$DOKKU_HOST enter home-backend web
tar -czf /tmp/uploads-backup.tar.gz /opt/app/public/uploads
exit

# 2. Copy from container to local machine
ssh dokku@$DOKKU_HOST ps:inspect home-backend | grep Id  # Get container ID
ssh dokku@$DOKKU_HOST "docker cp <container-id>:/tmp/uploads-backup.tar.gz /tmp/"
scp dokku@$DOKKU_HOST:/tmp/uploads-backup.tar.gz ./

# 3. Upload and extract to persistent storage
scp uploads-backup.tar.gz dokku@$DOKKU_HOST:/tmp/
ssh dokku@$DOKKU_HOST "sudo mkdir -p /var/lib/dokku/data/storage/home-backend/uploads"
ssh dokku@$DOKKU_HOST "sudo tar -xzf /tmp/uploads-backup.tar.gz -C /var/lib/dokku/data/storage/home-backend/uploads --strip-components=5"

# 4. Fix permissions (UID 1001 = strapi user, GID 65533 = nogroup)
ssh dokku@$DOKKU_HOST "sudo chown -R 1001:65533 /var/lib/dokku/data/storage/home-backend/uploads"
ssh dokku@$DOKKU_HOST "sudo chmod -R 755 /var/lib/dokku/data/storage/home-backend/uploads"

# 5. Restart backend
ssh dokku@$DOKKU_HOST ps:restart home-backend
```

### Troubleshooting

**View logs:**
```bash
ssh dokku@$DOKKU_HOST logs home-backend --tail
ssh dokku@$DOKKU_HOST logs home-frontend --tail
```

**Restart services:**
```bash
ssh dokku@$DOKKU_HOST ps:restart home-backend
ssh dokku@$DOKKU_HOST ps:restart home-frontend
```

**Check configuration:**
```bash
ssh dokku@$DOKKU_HOST config home-backend
ssh dokku@$DOKKU_HOST domains:report home-backend
ssh dokku@$DOKKU_HOST ports:list home-backend
ssh dokku@$DOKKU_HOST storage:list home-backend
```

### Common Issues

**Media files disappear after redeploy:**
```bash
# Check if storage is mounted
ssh dokku@$DOKKU_HOST storage:list home-backend

# Should show:
# /var/lib/dokku/data/storage/home-backend/uploads:/opt/app/public/uploads

# If not mounted, mount it:
ssh dokku@$DOKKU_HOST storage:mount home-backend /var/lib/dokku/data/storage/home-backend/uploads:/opt/app/public/uploads
ssh dokku@$DOKKU_HOST ps:restart home-backend
```

**Permission errors when uploading:**
```bash
# UID 1001 = strapi user inside container, GID 65533 = nogroup
ssh dokku@$DOKKU_HOST "sudo chown -R 1001:65533 /var/lib/dokku/data/storage/home-backend/uploads"
ssh dokku@$DOKKU_HOST "sudo chmod -R 755 /var/lib/dokku/data/storage/home-backend/uploads"
ssh dokku@$DOKKU_HOST ps:restart home-backend
```

**Backend uses SQLite instead of PostgreSQL:**
```bash
ssh dokku@$DOKKU_HOST config:set home-backend DATABASE_CLIENT=postgres
```

**nginx shows default page:**
```bash
ssh dokku@$DOKKU_HOST ports:list home-backend  # Check
ssh dokku@$DOKKU_HOST ports:add home-backend http:80:1337  # Add if missing
ssh dokku@$DOKKU_HOST proxy:build-config home-backend
```

**Frontend can't reach backend:**
- Use public URL: `STRAPI_URL=https://$BACKEND_DOMAIN`

---

## Environment Variables

Generate secrets:
```bash
openssl rand -base64 32  # Run 6 times for Strapi secrets
```

Required in `.env`:
```env
# Database
POSTGRES_USER=strapi
POSTGRES_PASSWORD=secure_password
POSTGRES_DB=strapi

# Strapi
APP_KEYS=generated_secret
API_TOKEN_SALT=generated_secret
ADMIN_JWT_SECRET=generated_secret
TRANSFER_TOKEN_SALT=generated_secret
JWT_SECRET=generated_secret
ENCRYPTION_KEY=generated_secret

# Frontend
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
```

See `.env.example` for all variables.

## Troubleshooting (Local)

```bash
# Port in use
lsof -i :3000
lsof -i :1337

# Database issues
docker compose logs postgres
docker compose down -v && docker compose up -d

# Complete reset
docker compose down -v
docker system prune -a
docker compose up -d --build
```

## Strapi Usage

**Create content type:**
1. Open http://localhost:1337/admin → **Content-Type Builder**
2. Create Collection Type, add fields, save
3. Add content in **Content Manager**
4. Set permissions: **Settings → Roles → Public**

**Fetch from frontend:**
```typescript
const res = await fetch(`${process.env.STRAPI_URL}/api/articles?locale=${locale}&populate=*`);
const { data } = await res.json();
```

## Updates

```bash
cd backend && npm update
cd frontend && npm update
docker compose up -d --build
```

---

**Stack:** Strapi 5.30.1, Next.js 15.5, PostgreSQL 18, Node.js 22, Docker
