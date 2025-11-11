# Задача: Настроить On-Demand Revalidation между Strapi и Next.js

## Контекст
У нас boilerplate проект с:
- Frontend: Next.js 15.5 (App Router)
- Backend: Strapi 5.30.1
- Database: PostgreSQL 18
- Node.js: 22-alpine

Мы НЕ используем ISR (Incremental Static Regeneration).
Мы используем только On-Demand Revalidation через Strapi webhooks.

## Что нужно сделать

### 1. Next.js: Создать API endpoint для revalidation

Создай файл `frontend/app/api/revalidate/route.ts`:

```typescript
// Этот endpoint будет вызываться из Strapi webhooks
// Когда контент обновляется в Strapi, он триггерит ревалидацию страниц в Next.js

import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Защита от несанкционированных запросов
  const authHeader = request.headers.get('authorization');
  const secret = process.env.REVALIDATION_SECRET;
  
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json(
      { message: 'Invalid authorization' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { model, event, entry } = body;

    console.log(`[Revalidation] Received: ${model} ${event}`, entry);

    // Логика ревалидации в зависимости от модели
    switch (model) {
      case 'product':
        // Ревалидировать конкретную страницу товара
        if (entry?.slug) {
          revalidatePath(`/products/${entry.slug}`);
          console.log(`[Revalidation] ✅ Revalidated /products/${entry.slug}`);
        }
        // Ревалидировать страницу каталога
        revalidatePath('/products');
        console.log(`[Revalidation] ✅ Revalidated /products`);
        break;

      case 'category':
        if (entry?.slug) {
          revalidatePath(`/categories/${entry.slug}`);
          console.log(`[Revalidation] ✅ Revalidated /categories/${entry.slug}`);
        }
        revalidatePath('/products');
        console.log(`[Revalidation] ✅ Revalidated /products`);
        break;

      case 'page':
        if (entry?.slug) {
          revalidatePath(`/${entry.slug}`);
          console.log(`[Revalidation] ✅ Revalidated /${entry.slug}`);
        }
        break;

      default:
        // Ревалидировать главную страницу для других изменений
        revalidatePath('/');
        console.log(`[Revalidation] ✅ Revalidated /`);
    }

    return NextResponse.json({
      revalidated: true,
      model,
      event,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('[Revalidation] ❌ Error:', error);
    return NextResponse.json(
      { message: 'Error revalidating', error: String(error) },
      { status: 500 }
    );
  }
}
```

Добавь переменную в `frontend/.env.local`:
```bash
REVALIDATION_SECRET=generate_strong_random_string_here
```

Добавь в `frontend/.env.example`:
```bash
# On-Demand Revalidation Secret (for Strapi webhooks)
REVALIDATION_SECRET=your_secret_here
```

### 2. Strapi: Настроить Webhooks через lifecycle hooks

Создай файл `backend/src/index.ts`:

```typescript
export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }) {
    // Регистрация webhook для Next.js revalidation
    const nextjsUrl = process.env.NEXTJS_URL;
    const revalidationSecret = process.env.REVALIDATION_SECRET;
    const enableWebhooks = process.env.ENABLE_WEBHOOKS === 'true';

    if (!enableWebhooks) {
      console.log('[Webhooks] Disabled (ENABLE_WEBHOOKS is not true)');
      return;
    }

    if (!nextjsUrl || !revalidationSecret) {
      console.warn('[Webhooks] ⚠️ NEXTJS_URL or REVALIDATION_SECRET not set, skipping webhook registration');
      return;
    }

    console.log('[Webhooks] ✅ Registering Next.js revalidation webhooks');

    // Подписываемся на все события content types
    // Добавь сюда свои модели по мере их создания
    const contentTypes = ['product', 'category', 'page'];

    contentTypes.forEach((contentType) => {
      strapi.db.lifecycles.subscribe({
        models: [`api::${contentType}.${contentType}`],
        
        async afterCreate(event) {
          await triggerRevalidation(event, 'create', contentType);
        },
        
        async afterUpdate(event) {
          await triggerRevalidation(event, 'update', contentType);
        },
        
        async afterDelete(event) {
          await triggerRevalidation(event, 'delete', contentType);
        },
      });
    });

    async function triggerRevalidation(event, eventType, contentType) {
      try {
        const entry = event.result || event.params?.data;

        const payload = {
          model: contentType,
          event: eventType,
          entry: {
            id: entry?.id,
            slug: entry?.slug,
            documentId: entry?.documentId, // Strapi 5
          },
        };

        console.log(`[Webhooks] 🔄 Triggering revalidation for ${contentType} ${eventType}`, payload);

        const response = await fetch(`${nextjsUrl}/api/revalidate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${revalidationSecret}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[Webhooks] ❌ Revalidation failed: ${response.status} ${response.statusText}`, errorText);
        } else {
          const result = await response.json();
          console.log(`[Webhooks] ✅ Revalidated Next.js for ${contentType} ${eventType}`, result);
        }
      } catch (error) {
        console.error('[Webhooks] ❌ Error triggering revalidation:', error);
      }
    }
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap(/* { strapi } */) {},
};
```

Добавь переменные в `backend/.env`:
```bash
# Next.js Integration for On-Demand Revalidation
NEXTJS_URL=http://frontend:3000
REVALIDATION_SECRET=same_secret_as_in_nextjs
ENABLE_WEBHOOKS=true
```

Добавь в `backend/.env.example`:
```bash
# Next.js Integration
NEXTJS_URL=http://frontend:3000
REVALIDATION_SECRET=your_secret_here
ENABLE_WEBHOOKS=true
```

**ВАЖНО**: В docker-compose для production используй внутреннее имя сервиса:
- Локально: `NEXTJS_URL=http://frontend:3000`
- Production: `NEXTJS_URL=https://your-production-domain.com`

### 3. Next.js: Убрать ISR из fetch запросов

Проверь ВСЕ fetch запросы в Next.js и убедись что они НЕ используют `next: { revalidate }`.

**ПРАВИЛЬНЫЙ fetch** (использовать):
```typescript
async function getProducts() {
  const res = await fetch(`${process.env.STRAPI_URL}/api/products?populate=*`, {
    cache: 'force-cache', // Кешировать навсегда, обновление только через revalidation
  });
  
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}
```

**НЕПРАВИЛЬНЫЙ fetch** (НЕ использовать):
```typescript
// ❌ НЕ ДЕЛАЙ ТАК - мы не используем ISR
async function getProducts() {
  const res = await fetch(`${process.env.STRAPI_URL}/api/products`, {
    next: { revalidate: 3600 }, // ❌ Убрать это
  });
  return res.json();
}
```

Найди все существующие fetch с `next: { revalidate }` и замени на `cache: 'force-cache'`.

### 4. Документация: Создать REVALIDATION.md

Создай файл `REVALIDATION.md` в корне проекта:

```markdown
# On-Demand Revalidation Strategy

## Наш подход

Мы используем **On-Demand Revalidation** для обновления контента в Next.js при изменениях в Strapi.

**Мы НЕ используем ISR (Incremental Static Regeneration).**

## Как это работает

1. Контент редактируется в Strapi CMS (например, обновляется товар)
2. Strapi lifecycle hook триггерит webhook
3. Webhook отправляет POST запрос на `/api/revalidate` в Next.js
4. Next.js сбрасывает кеш для затронутых страниц через `revalidatePath()`
5. Следующий запрос к странице получает свежие данные из Strapi

## Схема работы

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Strapi     │      │   Next.js    │      │     User     │
│     CMS      │      │    Server    │      │              │
└──────┬───────┘      └──────┬───────┘      └──────┬───────┘
       │                     │                     │
       │ 1. Update content   │                     │
       │                     │                     │
       │ 2. Lifecycle hook   │                     │
       │────────────────────>│                     │
       │  POST /api/revalidate                     │
       │                     │                     │
       │                  3. revalidatePath()      │
       │                     │                     │
       │<────────────────────│                     │
       │   200 OK            │                     │
       │                     │                     │
       │                     │ 4. Request page     │
       │                     │<────────────────────│
       │                     │                     │
       │ 5. Fetch fresh data │                     │
       │<────────────────────│                     │
       │                     │                     │
       │────────────────────>│                     │
       │  Return data        │                     │
       │                     │                     │
       │                     │ 6. Render + cache   │
       │                     │────────────────────>│
       │                     │  Fresh HTML         │
```

## Преимущества

- ✅ Мгновенное обновление после изменений в Strapi
- ✅ Страницы кешируются навсегда до следующего изменения
- ✅ Не нужно ждать time-based revalidation
- ✅ Полный контроль над обновлениями
- ✅ Минимальная нагрузка на Strapi API
- ✅ Оптимальная производительность для пользователей

## Настройка

### Переменные окружения

**Next.js** (`frontend/.env.local`):
```bash
REVALIDATION_SECRET=your_strong_random_secret_here
```

**Strapi** (`backend/.env`):
```bash
# Для Docker Compose используй имя сервиса
NEXTJS_URL=http://frontend:3000

# Для production используй публичный URL
# NEXTJS_URL=https://your-production-domain.com

REVALIDATION_SECRET=same_secret_as_nextjs
ENABLE_WEBHOOKS=true
```

### Генерация секрета

```bash
openssl rand -base64 32
```

## Добавление новых content types

Когда создаешь новый content type в Strapi, добавь его в:

**1. backend/src/index.ts** - в массив `contentTypes`:
```typescript
const contentTypes = ['product', 'category', 'page', 'blog-post']; // добавь свой
```

**2. frontend/app/api/revalidate/route.ts** - добавь case в switch:
```typescript
case 'blog-post':
  if (entry?.slug) {
    revalidatePath(`/blog/${entry.slug}`);
    console.log(`[Revalidation] ✅ Revalidated /blog/${entry.slug}`);
  }
  revalidatePath('/blog');
  console.log(`[Revalidation] ✅ Revalidated /blog`);
  break;
```

## Тестирование

### Локальное тестирование

1. Запусти оба сервиса:
```bash
docker compose up -d
```

2. Создай или измени контент в Strapi admin panel (http://localhost:1337/admin)

3. Проверь логи Next.js:
```bash
docker compose logs -f frontend
```

Ожидаемый вывод:
```
frontend  | [Revalidation] Received: product update { id: 1, slug: 'test-product' }
frontend  | [Revalidation] ✅ Revalidated /products/test-product
frontend  | [Revalidation] ✅ Revalidated /products
```

4. Проверь логи Strapi:
```bash
docker compose logs -f backend
```

Ожидаемый вывод:
```
backend   | [Webhooks] 🔄 Triggering revalidation for product update
backend   | [Webhooks] ✅ Revalidated Next.js for product update
```

### Ручное тестирование webhook

```bash
curl -X POST http://localhost:3000/api/revalidate \
  -H "Authorization: Bearer your_secret_here" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "product",
    "event": "update",
    "entry": {
      "id": 1,
      "slug": "test-product"
    }
  }'
```

Ожидаемый ответ:
```json
{
  "revalidated": true,
  "model": "product",
  "event": "update",
  "timestamp": 1234567890
}
```

## Production deployment

В production убедись что:

1. **NEXTJS_URL** указывает на production домен:
   ```bash
   NEXTJS_URL=https://your-domain.com
   ```

2. **REVALIDATION_SECRET** - это сильный случайный секрет (сгенерированный через `openssl rand -base64 32`)

3. **ENABLE_WEBHOOKS=true** в Strapi

4. **Network connectivity**: Next.js и Strapi могут общаться друг с другом:
   - Если на одном сервере: используй docker network или localhost
   - Если на разных серверах: убедись что firewall разрешает соединение

5. **HTTPS**: В production используй HTTPS для webhook endpoint

## Troubleshooting

### Webhook не срабатывает

**Симптомы**: Изменения в Strapi не обновляют Next.js страницы

**Решения**:
- Проверь логи Strapi: `docker compose logs -f backend`
- Убедись что `ENABLE_WEBHOOKS=true`
- Проверь что `NEXTJS_URL` правильный и доступен из Strapi контейнера
- Убедись что content type добавлен в массив `contentTypes` в `backend/src/index.ts`

### 401 Unauthorized

**Симптомы**: В логах Strapi ошибка `401 Unauthorized`

**Решения**:
- Убедись что `REVALIDATION_SECRET` одинаковый в обоих `.env` файлах
- Проверь что secret правильно передается в Authorization header (с префиксом `Bearer `)
- Убедись что в Next.js `.env.local` переменная называется именно `REVALIDATION_SECRET`

### Страницы не обновляются

**Симптомы**: Webhook срабатывает (видно в логах), но страницы показывают старый контент

**Решения**:
- Проверь что `cache: 'force-cache'` используется в fetch запросах
- Убедись что `revalidatePath()` вызывается с правильными путями
- Проверь что пути в `revalidatePath()` соответствуют реальным роутам в Next.js
- Попробуй hard refresh в браузере (Ctrl+Shift+R) чтобы исключить browser cache

### Network connectivity issues

**Симптомы**: `ECONNREFUSED` или timeout ошибки в Strapi логах

**Решения**:
- В Docker Compose используй имя сервиса: `http://frontend:3000`
- Убедись что оба контейнера в одной docker network
- Проверь что Next.js контейнер запущен: `docker compose ps`
- Попробуй `docker compose exec backend ping frontend` для проверки связи

### Strapi 5 specific issues

**Симптомы**: Lifecycle hooks не срабатывают

**Решения**:
- Проверь что используешь правильный формат модели: `api::content-type.content-type`
- Убедись что файл `backend/src/index.ts` существует и правильно экспортирован
- Перезапусти Strapi после изменений в lifecycle hooks

## Мониторинг

Рекомендуется настроить мониторинг для webhook calls:

1. **Application logs**: Регулярно проверяй логи на ошибки
2. **Alerting**: Настрой алерты на частые 401/500 ошибки
3. **Metrics**: Отслеживай количество revalidation requests

## Best practices

1. **Используй конкретные пути**: Вызывай `revalidatePath()` с конкретными путями, а не `revalidatePath('/', { recursive: true })`
2. **Логирование**: Всегда логируй успешные и неуспешные revalidation
3. **Тестирование**: Тестируй webhooks после каждого добавления нового content type
4. **Секреты**: Регулярно меняй `REVALIDATION_SECRET` в production
5. **Rate limiting**: Рассмотри добавление rate limiting для `/api/revalidate` endpoint

## Альтернативы (которые мы НЕ используем)

- ❌ **ISR (Incremental Static Regeneration)**: Time-based revalidation - не дает контроля
- ❌ **No caching**: Каждый запрос идет в Strapi - медленно и нагружает API
- ❌ **Manual revalidation**: Требует вмешательства разработчика

## Ссылки

- [Next.js Revalidating Data](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating#revalidating-data)
- [Next.js revalidatePath](https://nextjs.org/docs/app/api-reference/functions/revalidatePath)
- [Strapi Lifecycles](https://docs.strapi.io/dev-docs/backend-customization/models#lifecycle-hooks)
- [Strapi 5 Document Service](https://docs.strapi.io/dev-docs/api/document-service)
```

### 5. Обновить главный README.md

Добавь секцию в `README.md` (после раздела "Доступ к сервисам"):

```markdown
## Content Revalidation Strategy

This project uses **On-Demand Revalidation** to update Next.js pages when content changes in Strapi.

**⚠️ Important: We do NOT use ISR (Incremental Static Regeneration).**

When you update content in Strapi, it automatically triggers a webhook that invalidates the Next.js cache for affected pages.

**See [REVALIDATION.md](./REVALIDATION.md) for detailed documentation.**

### Quick Setup for Revalidation

1. Generate a strong secret:
```bash
openssl rand -base64 32
```

2. Add to both `.env` files:
```bash
# Frontend: frontend/.env.local
REVALIDATION_SECRET=your_generated_secret

# Backend: backend/.env
NEXTJS_URL=http://frontend:3000
REVALIDATION_SECRET=your_generated_secret
ENABLE_WEBHOOKS=true
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
```

### 6. Обновить docker-compose.yml

Убедись что сервисы могут общаться через docker network. Проверь что в `docker-compose.yml`:

```yaml
services:
  frontend:
    # ... existing config ...
    environment:
      - NEXT_PUBLIC_STRAPI_URL=http://localhost:1337  # для браузера
      - STRAPI_URL=http://backend:1337  # для server-side fetch
      - REVALIDATION_SECRET=${REVALIDATION_SECRET}
    networks:
      - app-network

  backend:
    # ... existing config ...
    environment:
      - NEXTJS_URL=http://frontend:3000  # внутреннее имя сервиса!
      - REVALIDATION_SECRET=${REVALIDATION_SECRET}
      - ENABLE_WEBHOOKS=true
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

### 7. Создать пример content type для тестирования

Создай example collection в Strapi для демонстрации:

В Strapi Admin:
1. Перейди в Content-Type Builder
2. Создай новый Collection Type: "Product"
3. Добавь поля:
   - Text (Short): `name` (required)
   - UID: `slug` (based on name)
   - Rich Text: `description`
   - Number (Decimal): `price`
   - Media (Single): `image`

4. Save и убедись что добавил `'product'` в `contentTypes` массив в `backend/src/index.ts`

## Дополнительные инструкции для Claude Code

1. **Проверь все существующие fetch()**: Найди все fetch запросы в Next.js проекте и убедись что они используют `cache: 'force-cache'`, а не `next: { revalidate: number }`

2. **Добавь логирование**: Убедись что все webhook calls логируются с префиксами `[Webhooks]` и `[Revalidation]` для легкой отладки

3. **TypeScript types**: Убедись что все TypeScript типы правильные для Strapi 5 (используй `documentId` вместо старых полей)

4. **Error handling**: Добавь обработку ошибок во все async функции с понятными сообщениями

5. **Environment variables**: Проверь что все ENV переменные документированы в `.env.example` файлах

