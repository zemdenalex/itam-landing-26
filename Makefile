.PHONY: help up down logs restart migrate migrate-down migrate-create \
        dev-api dev-admin dev-landing build prod prod-build clean

# Default target
help:
	@echo "ITAM CMS - Available commands:"
	@echo ""
	@echo "Docker:"
	@echo "  make up              - Start all services"
	@echo "  make down            - Stop all services"
	@echo "  make logs            - Show logs (follow)"
	@echo "  make restart         - Restart all services"
	@echo ""
	@echo "Database:"
	@echo "  make migrate         - Run database migrations"
	@echo "  make migrate-down    - Rollback last migration"
	@echo "  make migrate-create  - Create new migration (NAME=migration_name)"
	@echo ""
	@echo "Development:"
	@echo "  make dev-api         - Run API locally (requires Go)"
	@echo "  make dev-admin       - Run Admin Panel locally (requires Node)"
	@echo "  make dev-landing     - Run Landing locally (requires Node)"
	@echo "  make dev-all         - Run all frontend services"
	@echo ""
	@echo "Production:"
	@echo "  make build           - Build all services for production"
	@echo "  make prod            - Build and run production"
	@echo "  make prod-build      - Only build production images"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean           - Remove build artifacts"
	@echo "  make db-shell        - Open PostgreSQL shell"
	@echo "  make redis-shell     - Open Redis CLI"

# ===========================================
# Docker Commands
# ===========================================

up:
	docker compose up -d postgres redis api
	@echo "Services started. API available at http://localhost:8080"

up-all:
	docker compose up -d
	@echo "All services started"

down:
	docker compose down

logs:
	docker compose logs -f

logs-api:
	docker compose logs -f api

restart:
	docker compose restart

# ===========================================
# Database Commands
# ===========================================

migrate:
	docker compose run --rm migrate

migrate-down:
	docker compose run --rm migrate-down

migrate-create:
ifndef NAME
	$(error NAME is required. Usage: make migrate-create NAME=migration_name)
endif
	@mkdir -p api/migrations
	@touch api/migrations/$$(date +%Y%m%d%H%M%S)_$(NAME).up.sql
	@touch api/migrations/$$(date +%Y%m%d%H%M%S)_$(NAME).down.sql
	@echo "Created migration files for $(NAME)"

db-shell:
	docker compose exec postgres psql -U $${DB_USER:-itam} -d $${DB_NAME:-itam}

redis-shell:
	docker compose exec redis redis-cli

# ===========================================
# Development Commands
# ===========================================

dev-api:
	cd api && go run ./cmd/api

dev-admin:
	cd admin && npm install && npm run dev

dev-landing:
	cd landing && npm install && npm run dev

dev-all:
	@echo "Starting development servers..."
	@make -j3 dev-admin dev-landing dev-api

install-deps:
	cd admin && npm install
	cd landing && npm install
	cd api && go mod download

# ===========================================
# Build Commands
# ===========================================

build: build-landing build-admin
	@echo "Build complete!"

build-landing:
	cd landing && npm install && npm run build
	@echo "Landing built to landing/dist/"

build-admin:
	cd admin && npm install && npm run build
	@echo "Admin built to admin/dist/"

build-api:
	cd api && CGO_ENABLED=0 go build -o bin/api ./cmd/api

# ===========================================
# Production Commands
# ===========================================

prod: build
	docker compose up -d
	@echo "Production started at http://localhost"

prod-build:
	docker compose build

prod-logs:
	docker compose logs -f

# ===========================================
# Telegram Worker
# ===========================================

telegram-up:
	docker compose --profile telegram up -d telegram-worker

telegram-logs:
	docker compose logs -f telegram-worker

telegram-setup:
	@echo "Run this to generate session string:"
	@echo "cd telegram/worker && python scripts/generate_session.py"

# ===========================================
# Maintenance
# ===========================================

clean:
	rm -rf landing/dist admin/dist api/bin
	rm -rf landing/node_modules admin/node_modules
	@echo "Cleaned build artifacts"

prune:
	docker system prune -f
	docker volume prune -f

backup-db:
	@mkdir -p backups
	docker compose exec -T postgres pg_dump -U $${DB_USER:-itam} $${DB_NAME:-itam} > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "Database backup created"

# ===========================================
# Shortcuts
# ===========================================

# Quick restart API
ra: 
	docker compose restart api

# View API logs
la:
	docker compose logs -f api

# Quick rebuild and restart
rr: build-api
	docker compose up -d --build api
