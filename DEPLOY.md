# ITAM CMS: Руководство по развёртыванию

## 📋 Содержание

1. [Архитектура файлов](#архитектура-файлов)
2. [Локальная разработка](#локальная-разработка)
3. [Тестирование без сервера](#тестирование-без-сервера)
4. [Подготовка к Production](#подготовка-к-production)
5. [Развёртывание на сервере](#развёртывание-на-сервере)
6. [Настройка SSL](#настройка-ssl)
7. [Telegram Worker](#telegram-worker)
8. [Резервное копирование](#резервное-копирование)
9. [Troubleshooting](#troubleshooting)

---

## 🗂️ Архитектура файлов

### Статические файлы Landing vs CMS Uploads

```
Статические файлы (bundled в build):
├── landing/public/images/    ← Иконки, SVG, фоны (в репозитории)
├── landing/public/fonts/     ← Шрифты (в репозитории)
└── После build → landing/dist/

CMS Uploads (динамические, через админку):
├── Docker volume: uploads_data
├── Внутри контейнера: /app/uploads/
├── Nginx раздаёт как: /uploads/*
└── URL: https://site.ru/uploads/images/uuid.jpg
```

**Важно:** 
- `landing/public/images/` — статика, не меняется через CMS
- `/uploads/` — файлы загруженные через админку (фото команды, логотипы партнёров, картинки блога)

---

## 💻 Локальная разработка

### Требования

- Docker Desktop (Windows/Mac) или Docker Engine (Linux)
- Node.js 20+ (для frontend разработки)
- Go 1.22+ (опционально, для backend разработки)

### Вариант 1: Всё через Docker (рекомендуется)

```bash
# 1. Клонировать/распаковать проект
cd itam-cms

# 2. Создать .env
cp .env.example .env
# Отредактировать .env - минимум заполнить:
# - DB_PASSWORD
# - JWT_SECRET  
# - ADMIN_EMAIL
# - ADMIN_PASSWORD

# 3. Запустить базы данных и API
docker compose up -d postgres redis api

# 4. Применить миграции (первый раз)
docker compose run --rm migrate

# 5. Проверить API
curl http://localhost:8080/api/health
# Ответ: {"status":"ok","db":"ok","redis":"ok"}

# 6. Запустить frontend для разработки
cd landing && npm install && npm run dev
# Landing: http://localhost:5173

cd ../admin && npm install && npm run dev  
# Admin: http://localhost:3000
```

### Вариант 2: API локально (для Go разработчиков)

```bash
# Запустить только базы
docker compose up -d postgres redis

# Запустить API через Go
cd api
cp ../.env .env  # или создать локальный
go run ./cmd/api

# Frontend как в варианте 1
```

### Команды Docker (без Make)

```bash
# Запуск
docker compose up -d                    # Всё
docker compose up -d postgres redis api # Только backend

# Остановка  
docker compose down                     # Остановить
docker compose down -v                  # + удалить volumes

# Логи
docker compose logs -f                  # Все сервисы
docker compose logs -f api              # Только API

# Миграции
docker compose run --rm migrate         # Применить
docker compose run --rm migrate-down    # Откатить

# Пересборка
docker compose build api                # Пересобрать API
docker compose up -d --build api        # Пересобрать и запустить
```

---

## 🧪 Тестирование без сервера

Да, можно полностью протестировать локально!

### Полный локальный стек

```bash
# 1. Запустить backend
docker compose up -d postgres redis api
docker compose run --rm migrate

# 2. Создать тестовые данные
# Войти в админку: http://localhost:3000
# Логин: значения ADMIN_EMAIL/ADMIN_PASSWORD из .env

# 3. Запустить landing
cd landing && npm run dev
# Открыть http://localhost:5173

# 4. Проверить что данные загружаются из API
# В DevTools → Network должны быть запросы к /api/public/*
```

### Тестирование production build локально

```bash
# 1. Собрать frontend
cd landing && npm run build
cd ../admin && npm run build

# 2. Запустить полный стек с nginx
docker compose up -d

# 3. Открыть http://localhost
# - Landing: http://localhost/
# - Admin: http://localhost/admin/
# - API: http://localhost/api/health
```

---

## 🏭 Подготовка к Production

### Чеклист перед деплоем

- [ ] Сгенерировать надёжные пароли:
  ```bash
  # JWT Secret (минимум 32 символа)
  openssl rand -base64 32
  
  # DB Password
  openssl rand -base64 24
  
  # Admin Password
  openssl rand -base64 16
  ```

- [ ] Заполнить `.env` production значениями

- [ ] Собрать frontend:
  ```bash
  cd landing && npm ci && npm run build
  cd ../admin && npm ci && npm run build
  ```

- [ ] Проверить что `dist/` папки созданы:
  ```bash
  ls -la landing/dist/
  ls -la admin/dist/
  ```

### Production .env пример

```bash
NODE_ENV=production

DB_USER=itam
DB_PASSWORD=<сгенерированный_пароль>
DB_NAME=itam
DB_HOST=postgres
DB_PORT=5432

REDIS_URL=redis://redis:6379

JWT_SECRET=<сгенерированный_секрет_32+_символов>
JWT_EXPIRY=720h

API_PORT=8080
UPLOAD_PATH=/app/uploads
UPLOAD_MAX_SIZE=5242880

ADMIN_EMAIL=admin@itam.misis.ru
ADMIN_PASSWORD=<надёжный_пароль>
ADMIN_NAME=Администратор

VITE_API_URL=
```

---

## 🚀 Развёртывание на сервере

### Требования к серверу

- Ubuntu 22.04+ / Debian 12+
- Docker Engine 24+
- Docker Compose v2
- 2GB RAM минимум
- 20GB диск

### Установка Docker (если нет)

```bash
# Установить Docker
curl -fsSL https://get.docker.com | sh

# Добавить пользователя в группу docker
sudo usermod -aG docker $USER
# Перелогиниться

# Проверить
docker --version
docker compose version
```

### Деплой

```bash
# 1. Загрузить проект на сервер
# Вариант A: Git
git clone https://github.com/your-org/itam-cms.git /opt/itam
cd /opt/itam

# Вариант B: SCP
scp -r ./itam-cms user@server:/opt/itam
ssh user@server
cd /opt/itam

# 2. Создать .env
cp .env.example .env
nano .env  # Заполнить production значения

# 3. Собрать frontend (если не собран локально)
# Нужен Node.js на сервере или собрать локально и скопировать dist/
docker run --rm -v $(pwd)/landing:/app -w /app node:20-alpine sh -c "npm ci && npm run build"
docker run --rm -v $(pwd)/admin:/app -w /app node:20-alpine sh -c "npm ci && npm run build"

# 4. Запустить
docker compose up -d

# 5. Применить миграции
docker compose run --rm migrate

# 6. Проверить
docker compose ps
curl http://localhost/api/health
```

### Обновление

```bash
cd /opt/itam

# Остановить
docker compose down

# Обновить код
git pull  # или scp новые файлы

# Пересобрать если нужно
docker compose build api

# Пересобрать frontend если изменился
docker run --rm -v $(pwd)/landing:/app -w /app node:20-alpine sh -c "npm ci && npm run build"

# Запустить
docker compose up -d

# Применить новые миграции
docker compose run --rm migrate
```

---

## 🔒 Настройка SSL

### Вариант 1: Внешний Reverse Proxy (Nginx/Traefik на хосте)

Убрать nginx из docker-compose и настроить внешний:

```bash
# Отключить nginx в docker-compose
docker compose up -d postgres redis api
# Порт 8080 для API
```

Пример nginx на хосте:
```nginx
server {
    listen 80;
    server_name itam.misis.ru;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name itam.misis.ru;

    ssl_certificate /etc/letsencrypt/live/itam.misis.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/itam.misis.ru/privkey.pem;

    # Landing
    location / {
        root /opt/itam/landing/dist;
        try_files $uri $uri/ /index.html;
    }

    # Admin
    location /admin {
        alias /opt/itam/admin/dist;
        try_files $uri $uri/ /admin/index.html;
    }

    # API
    location /api {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Uploads
    location /uploads {
        alias /var/lib/docker/volumes/itam-cms_uploads_data/_data;
        expires 30d;
    }
}
```

Получить SSL:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d itam.misis.ru
```

### Вариант 2: Traefik в Docker (автоматический SSL)

Добавить в docker-compose.yml labels для Traefik.

---

## 📱 Telegram Worker

### Получение credentials

1. Зайти на https://my.telegram.org
2. Создать приложение → получить `API_ID` и `API_HASH`
3. Сгенерировать session string:

```bash
cd telegram/worker

# Установить зависимости
pip install telethon

# Запустить скрипт
python scripts/generate_session.py
# Ввести номер телефона, код из Telegram
# Скопировать SESSION_STRING
```

### Запуск worker

```bash
# Добавить в .env
TG_API_ID=12345678
TG_API_HASH=abcdef1234567890
TG_SESSION_STRING=<длинная_строка>
TG_CHANNEL_USERNAME=itatmisis

# Запустить
docker compose --profile telegram up -d telegram-worker

# Проверить логи
docker compose logs -f telegram-worker
```

---

## 💾 Резервное копирование

### База данных

```bash
# Создать backup
docker compose exec -T postgres pg_dump -U itam itam > backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановить
docker compose exec -T postgres psql -U itam itam < backup_20250110_120000.sql
```

### Uploads

```bash
# Backup uploads volume
docker run --rm -v itam-cms_uploads_data:/data -v $(pwd):/backup alpine tar czf /backup/uploads_backup.tar.gz -C /data .

# Restore
docker run --rm -v itam-cms_uploads_data:/data -v $(pwd):/backup alpine tar xzf /backup/uploads_backup.tar.gz -C /data
```

### Автоматический backup (cron)

```bash
# /opt/itam/scripts/backup.sh
#!/bin/bash
BACKUP_DIR=/opt/backups
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Database
docker compose -f /opt/itam/docker-compose.yml exec -T postgres pg_dump -U itam itam > $BACKUP_DIR/db_$DATE.sql

# Uploads
docker run --rm -v itam-cms_uploads_data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/uploads_$DATE.tar.gz -C /data .

# Удалить старые (старше 7 дней)
find $BACKUP_DIR -type f -mtime +7 -delete

# crontab -e
# 0 3 * * * /opt/itam/scripts/backup.sh
```

---

## 🔧 Troubleshooting

### API не запускается

```bash
# Проверить логи
docker compose logs api

# Частые проблемы:
# - DB_PASSWORD не совпадает
# - JWT_SECRET не задан
# - Порт 8080 занят
```

### Frontend не видит API

```bash
# Проверить что API доступен
curl http://localhost:8080/api/health

# Проверить CORS в браузере DevTools
# Проверить что VITE_API_URL правильный (пустой для production)
```

### Миграции не применяются

```bash
# Проверить подключение к БД
docker compose exec postgres psql -U itam -c "SELECT 1"

# Посмотреть статус миграций
docker compose run --rm migrate version
```

### Uploads не работают

```bash
# Проверить volume
docker volume ls | grep uploads

# Проверить права
docker compose exec api ls -la /app/uploads/

# Проверить nginx конфиг
docker compose exec nginx cat /etc/nginx/conf.d/default.conf
```

### Сбросить всё и начать заново

```bash
docker compose down -v  # Удалит все volumes!
docker compose up -d
docker compose run --rm migrate
```

---

## 📞 Контакты

- Документация: `README.md`, `DEPLOY.md`
- Архитектура: `itam_cms_architecture_v2.md`
