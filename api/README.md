# ITAM CMS API

Backend API для системы управления контентом IT-сообщества НИТУ МИСИС.

## Стек

- **Go 1.22** + chi router
- **PostgreSQL 16** + pgx/v5
- **Redis 7**
- **Docker Compose**

## Быстрый старт

### 1. Подготовка

```bash
# Клонирование репозитория
git clone <repository-url>
cd itam-api

# Копирование конфигурации
cp .env.example .env

# Отредактируйте .env - установите безопасные пароли!
nano .env
```

### 2. Установка зависимостей

```bash
# Установите golang-migrate CLI
# macOS:
brew install golang-migrate

# Linux:
curl -L https://github.com/golang-migrate/migrate/releases/download/v4.18.1/migrate.linux-amd64.tar.gz | tar xvz
sudo mv migrate /usr/local/bin/

# Скачивание Go зависимостей
go mod download
go mod tidy
```

### 3. Запуск через Docker Compose

```bash
# Запуск всех сервисов
make docker-up

# Проверка логов
make docker-logs

# Проверка здоровья API
curl http://localhost:8080/api/health
```

### 4. Запуск для разработки (локально)

```bash
# Запуск только БД и Redis
docker compose up -d postgres redis

# Запуск миграций
make migrate-up

# Запуск API локально
make dev
```

## Makefile команды

```bash
make help           # Показать все команды

# Разработка
make dev            # Запуск локально
make build          # Сборка бинарника

# Docker
make docker-up      # Запустить контейнеры
make docker-down    # Остановить контейнеры
make docker-logs    # Показать логи
make docker-clean   # Удалить контейнеры и volumes

# Миграции
make migrate-up     # Применить миграции
make migrate-down   # Откатить последнюю миграцию
make migrate-create name=create_users  # Создать новую миграцию
```

## API Endpoints

### Health Check

```
GET /api/health
```

Response:
```json
{
  "status": "ok",
  "db": "ok",
  "redis": "ok"
}
```

### Auth

**Login**
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "your_password"
}
```

Response:
```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "email": "admin@example.com",
      "name": "Admin",
      "role": "admin",
      "is_active": true,
      "created_at": "2025-01-07T12:00:00Z",
      "updated_at": "2025-01-07T12:00:00Z"
    }
  },
  "error": null
}
```

**Logout**
```
POST /api/auth/logout
Authorization: Bearer <token>
```

**Get Current User**
```
GET /api/auth/me
Authorization: Bearer <token>
```

### Users (Admin Only)

All user endpoints require `Authorization: Bearer <token>` header and admin role.

**List Users**
```
GET /api/users?page=1&page_size=20&search=john&role=admin
```

**Create User**
```
POST /api/users
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "min8chars",
  "name": "John Doe",
  "role": "editor"
}
```

**Get User**
```
GET /api/users/{id}
```

**Update User**
```
PUT /api/users/{id}
Content-Type: application/json

{
  "name": "New Name",
  "role": "admin",
  "is_active": false
}
```

**Delete User**
```
DELETE /api/users/{id}
```

### Error Response Format

All errors follow this format:
```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "password must be at least 8 characters"
  }
}
```

Error codes: `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `VALIDATION_ERROR`, `INTERNAL_ERROR`

### Auth

```
POST /api/auth/login        # { email, password } → { data: { token, user } }
POST /api/auth/logout       # Logout (client-side token removal)
GET  /api/auth/me           # Current user info (requires auth)
```

Пример login:
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@itam.misis.ru","password":"your_password"}'
```

### Users (admin only)

```
GET    /api/users           # List users (pagination: ?page=1&page_size=20)
POST   /api/users           # Create user
GET    /api/users/:id       # Get user
PUT    /api/users/:id       # Update user
DELETE /api/users/:id       # Delete user
```

Заголовок авторизации:
```
Authorization: Bearer <token>
```

### Response Format

Все ответы в формате:
```json
{
  "data": { ... },
  "error": null
}
```

Или при ошибке:
```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "email is required"
  }
}
```

## Структура проекта

```
itam-api/
├── cmd/
│   └── api/
│       └── main.go           # Entry point
├── internal/
│   ├── config/
│   │   └── config.go         # Конфигурация из ENV
│   └── database/
│       ├── db.go             # PostgreSQL connection
│       └── redis.go          # Redis connection
├── migrations/               # SQL миграции
├── docker-compose.yml
├── Dockerfile
├── Makefile
├── .env.example
└── go.mod
```

## Переменные окружения

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `DB_HOST` | Хост PostgreSQL | localhost |
| `DB_PORT` | Порт PostgreSQL | 5432 |
| `DB_USER` | Пользователь БД | itam |
| `DB_PASSWORD` | Пароль БД | (обязательно) |
| `DB_NAME` | Имя базы данных | itam |
| `REDIS_URL` | URL Redis | redis://localhost:6379 |
| `JWT_SECRET` | Секрет для JWT | (обязательно) |
| `JWT_EXPIRY` | Время жизни токена | 720h |
| `API_PORT` | Порт API | 8080 |
