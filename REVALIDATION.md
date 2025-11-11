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
STRAPI_URL=http://backend:1337
```

**Strapi** (`backend/.env` или root `.env`):
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

## Использование в Next.js

### Server Components с fetch

**ПРАВИЛЬНЫЙ способ** (используй это):
```typescript
async function getProducts() {
  const res = await fetch(`${process.env.STRAPI_URL}/api/products?populate=*`, {
    cache: 'force-cache', // Кешировать навсегда, обновление только через revalidation
  });

  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}
```

**НЕПРАВИЛЬНЫЙ способ** (НЕ используй ISR):
```typescript
// ❌ НЕ ДЕЛАЙ ТАК - мы не используем ISR
async function getProducts() {
  const res = await fetch(`${process.env.STRAPI_URL}/api/products`, {
    next: { revalidate: 3600 }, // ❌ Убрать это
  });
  return res.json();
}
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
frontend  | [Revalidation] 📥 Received: product update { id: 1, slug: 'test-product' }
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
