# ITAM Telegram Stats Worker

Python worker для сбора статистики Telegram канала @itatmisis.

## Что делает

- Собирает статистику канала (подписчики, количество постов)
- Собирает последние 5 постов с просмотрами, реакциями и комментариями
- Записывает данные в Redis каждые 15 минут
- Go API читает данные из Redis и отдаёт фронтенду

## Требования

- Python 3.11+
- Redis
- Telegram API credentials (api_id, api_hash)
- Session string от авторизованного аккаунта Telegram

## Быстрый старт

### 1. Получение Telegram API credentials

1. Перейдите на https://my.telegram.org/apps
2. Войдите со своим номером телефона
3. Создайте новое приложение:
   - **App title**: `ITAM CMS Stats`
   - **Short name**: `itamcms`
   - **Platform**: `Desktop`
4. Сохраните **api_id** и **api_hash**

### 2. Генерация Session String

```bash
# Установите зависимости локально
pip install telethon

# Запустите скрипт генерации
python scripts/generate_session.py
```

Скрипт:
1. Попросит ввести api_id и api_hash
2. Отправит код подтверждения в Telegram
3. Выдаст session string для .env файла

### 3. Настройка

```bash
cp .env.example .env
# Отредактируйте .env - добавьте credentials и session string
```

### 4. Запуск через Docker Compose

Добавьте в основной `docker-compose.yml`:

```yaml
telegram-worker:
  build:
    context: ./itam-telegram
    dockerfile: Dockerfile
  container_name: itam-telegram
  restart: unless-stopped
  environment:
    - TG_API_ID=${TG_API_ID}
    - TG_API_HASH=${TG_API_HASH}
    - TG_SESSION_STRING=${TG_SESSION_STRING}
    - TG_CHANNEL_USERNAME=itatmisis
    - REDIS_URL=redis://redis:6379
    - TG_UPDATE_INTERVAL=900
    - TG_POSTS_COUNT=5
    - LOG_LEVEL=INFO
  depends_on:
    redis:
      condition: service_healthy
  networks:
    - itam-network
```

## Redis Keys

Worker записывает данные в следующие ключи:

| Key | Содержимое |
|-----|------------|
| `tg:channel:stats` | JSON с статистикой канала |
| `tg:channel:posts` | JSON массив последних постов |
| `tg:last_update` | ISO timestamp последнего обновления |

### Формат tg:channel:stats

```json
{
  "channel_id": -1001234567890,
  "username": "itatmisis",
  "title": "IT at MISIS",
  "subscribers_count": 5500,
  "posts_count": 1200,
  "last_post_date": "2025-01-07T12:00:00+00:00",
  "collected_at": "2025-01-07T12:15:00+00:00"
}
```

### Формат tg:channel:posts

```json
[
  {
    "id": 1556,
    "text": "🏆 Победа на TulaHackDays...",
    "date": "2025-01-05T15:30:00+00:00",
    "views": 1234,
    "forwards": 45,
    "reactions": { "👍": 89, "🔥": 34, "❤️": 12 },
    "reactions_total": 135,
    "comments_count": 23,
    "link": "https://t.me/itatmisis/1556",
    "has_media": true,
    "media_type": "photo"
  }
]
```

## Обработка ошибок

- **FloodWait**: При rate limit от Telegram worker ждёт указанное время
- **Redis недоступен**: Worker перезапускается (Docker restart policy)
- **5 подряд ошибок**: Worker завершается для перезапуска контейнера

## Разработка

```bash
# Создайте виртуальное окружение
python -m venv venv
source venv/bin/activate  # или venv\Scripts\activate на Windows

# Установите зависимости
pip install -r requirements.txt

# Запустите локально (нужен Redis)
python -m src.main
```

## Безопасность

⚠️ **Важно:**
- Session string даёт полный доступ к вашему Telegram аккаунту
- НИКОГДА не коммитьте .env или session string в git
- Используйте отдельный Telegram аккаунт для бота если возможно
