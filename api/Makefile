.PHONY: dev build run docker-up docker-down docker-logs migrate-up migrate-down migrate-create clean help

# Load .env file if exists
ifneq (,$(wildcard ./.env))
    include .env
    export
endif

# Variables
BINARY_NAME=api
DB_DSN=postgres://$(DB_USER):$(DB_PASSWORD)@$(DB_HOST):$(DB_PORT)/$(DB_NAME)?sslmode=$(DB_SSLMODE)
MIGRATE_PATH=./migrations

# Development
dev: ## Run the API locally (requires postgres and redis running)
	go run ./cmd/api

run: dev ## Alias for dev

# Build
build: ## Build the binary
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-w -s" -o ./bin/$(BINARY_NAME) ./cmd/api

build-local: ## Build for local OS
	go build -o ./bin/$(BINARY_NAME) ./cmd/api

# Docker
docker-up: ## Start all containers
	docker compose up -d

docker-down: ## Stop all containers
	docker compose down

docker-build: ## Build and start containers
	docker compose up -d --build

docker-logs: ## Show logs from all containers
	docker compose logs -f

docker-logs-api: ## Show logs from API container
	docker compose logs -f api

docker-restart: ## Restart API container
	docker compose restart api

docker-clean: ## Stop containers and remove volumes
	docker compose down -v

# Database Migrations (using golang-migrate)
migrate-up: ## Run all up migrations
	migrate -path $(MIGRATE_PATH) -database "$(DB_DSN)" up

migrate-down: ## Rollback last migration
	migrate -path $(MIGRATE_PATH) -database "$(DB_DSN)" down 1

migrate-down-all: ## Rollback all migrations
	migrate -path $(MIGRATE_PATH) -database "$(DB_DSN)" down

migrate-create: ## Create a new migration (usage: make migrate-create name=create_users)
	migrate create -ext sql -dir $(MIGRATE_PATH) -seq $(name)

migrate-force: ## Force migration version (usage: make migrate-force version=1)
	migrate -path $(MIGRATE_PATH) -database "$(DB_DSN)" force $(version)

migrate-version: ## Show current migration version
	migrate -path $(MIGRATE_PATH) -database "$(DB_DSN)" version

# Dependencies
deps: ## Download dependencies
	go mod download
	go mod tidy

# Testing
test: ## Run tests
	go test -v ./...

test-coverage: ## Run tests with coverage
	go test -v -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html

# Linting
lint: ## Run linter
	golangci-lint run ./...

# Utilities
clean: ## Remove build artifacts
	rm -rf ./bin
	rm -f coverage.out coverage.html

seed: ## Show info about seeding (seeding happens automatically on API start)
	@echo "Seeding happens automatically when API starts if no users exist."
	@echo "Make sure ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME are set in .env"
	@echo ""
	@echo "To manually trigger, just restart the API:"
	@echo "  docker compose restart api"

fmt: ## Format code
	go fmt ./...

vet: ## Run go vet
	go vet ./...

# Help
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
