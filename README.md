# ITAM CMS

Система управления контентом для лендинга IT-сообщества НИТУ МИСИС.

## 🏗️ Структура проекта

```
itam-cms/
├── api/                    # Go Backend API
├── admin/                  # React Admin Panel
├── landing/                # React Landing Page
├── telegram/               # Telegram Integration
├── nginx/                  # Nginx configuration
├── scripts/                # Helper scripts
│   ├── dev.sh             # Linux/Mac/WSL
│   └── dev.ps1            # PowerShell
├── docker-compose.yml
├── .env.example
├── DEPLOY.md              # Подробное руководство
└── README.md
```

## 🚀 Быстрый старт

### Требования

- Docker Desktop (Windows/Mac) или Docker Engine (Linux)
- Node.js 20+ (для разработки frontend)

### Установка и запуск

```bash
# 1. Клонировать/распаковать проект
cd itam-cms

# 2. Создать .env файл
cp .env.example .env
# Заполнить: DB_PASSWORD, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD

# 3. Запустить backend
docker compose up -d postgres redis api

# 4. Применить миграции (первый раз)
docker compose run --rm migrate

# 5. Проверить API
curl http://localhost:8080/api/health

# 6. Запустить frontend (в отдельных терминалах)
cd landing && npm install && npm run dev   # http://localhost:5173
cd admin && npm install && npm run dev     # http://localhost:3000
```

## 📋 Команды Docker

```bash
# Запуск
docker compose up -d postgres redis api    # Backend для разработки
docker compose up -d                       # Всё (включая nginx)

# Остановка
docker compose down                        # Остановить
docker compose down -v                     # + удалить данные

# Логи
docker compose logs -f api                 # Логи API
docker compose logs -f                     # Все логи

# Миграции
docker compose run --rm migrate            # Применить
docker compose run --rm migrate-down       # Откатить

# База данных
docker compose exec postgres psql -U itam -d itam

# Пересборка
docker compose up -d --build api
```

## 🔧 Скрипты-помощники

Вместо Make можно использовать скрипты:

**PowerShell (Windows):**
```powershell
.\scripts\dev.ps1 up        # Запустить
.\scripts\dev.ps1 logs      # Логи
.\scripts\dev.ps1 migrate   # Миграции
.\scripts\dev.ps1 build     # Собрать frontend
.\scripts\dev.ps1 help      # Справка
```

**Bash (Linux/Mac/WSL):**
```bash
./scripts/dev.sh up
./scripts/dev.sh logs
./scripts/dev.sh migrate
./scripts/dev.sh build
./scripts/dev.sh help
```

## 📁 Структура файлов

```
Статические файлы (в репозитории):
├── landing/public/images/    ← Иконки, SVG, фоны
└── landing/public/fonts/     ← Шрифты

CMS Uploads (через админку):
├── Docker volume: uploads_data
├── Внутри контейнера: /app/uploads/
└── URL: /uploads/images/*.jpg
```

## 🧪 Тестирование локально

Полный стек работает локально без сервера:

```bash
# 1. Backend
docker compose up -d postgres redis api
docker compose run --rm migrate

# 2. Войти в админку http://localhost:3000
#    Логин из .env: ADMIN_EMAIL / ADMIN_PASSWORD

# 3. Добавить тестовые данные через админку

# 4. Проверить landing http://localhost:5173
```

## 🏭 Production

```bash
# 1. Собрать frontend
cd landing && npm ci && npm run build
cd ../admin && npm ci && npm run build

# 2. Запустить полный стек
docker compose up -d

# Сайт доступен на http://localhost
```

## 📚 Документация

- **[DEPLOY.md](./DEPLOY.md)** — Полное руководство по развёртыванию
- **[api/README.md](./api/README.md)** — Документация API

## 📞 API Endpoints

```
# Public (без авторизации)
GET /api/public/wins        # Победы
GET /api/public/projects    # Проекты
GET /api/public/team        # Команда
GET /api/public/news        # Новости
GET /api/public/partners    # Партнёры
GET /api/public/clubs       # Клубы
GET /api/public/stats       # Статистика
GET /api/public/telegram    # Telegram данные

# Admin (требует JWT)
POST /api/auth/login
GET  /api/auth/me
# + CRUD для всех сущностей
```
