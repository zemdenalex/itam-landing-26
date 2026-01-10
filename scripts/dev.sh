#!/bin/bash
# ITAM CMS Development Script
# Usage: ./scripts/dev.sh [command]

set -e

case "$1" in
  up|start)
    echo "Starting development environment..."
    docker compose up -d postgres redis api
    echo ""
    echo "✅ Backend started!"
    echo "   API: http://localhost:8080/api/health"
    echo ""
    echo "Now run frontend:"
    echo "   cd landing && npm run dev"
    echo "   cd admin && npm run dev"
    ;;
    
  down|stop)
    echo "Stopping all services..."
    docker compose down
    ;;
    
  logs)
    docker compose logs -f ${2:-api}
    ;;
    
  migrate)
    echo "Running migrations..."
    docker compose run --rm migrate
    ;;
    
  migrate-down)
    echo "Rolling back last migration..."
    docker compose run --rm migrate-down
    ;;
    
  db)
    echo "Opening PostgreSQL shell..."
    docker compose exec postgres psql -U ${DB_USER:-itam} -d ${DB_NAME:-itam}
    ;;
    
  redis)
    echo "Opening Redis CLI..."
    docker compose exec redis redis-cli
    ;;
    
  build)
    echo "Building frontend..."
    cd landing && npm ci && npm run build
    cd ../admin && npm ci && npm run build
    echo "✅ Build complete!"
    ;;
    
  prod)
    echo "Starting production..."
    docker compose up -d
    echo "✅ Production started at http://localhost"
    ;;
    
  restart)
    docker compose restart ${2:-api}
    ;;
    
  *)
    echo "ITAM CMS Development Helper"
    echo ""
    echo "Usage: ./scripts/dev.sh [command]"
    echo ""
    echo "Commands:"
    echo "  up, start      Start development (postgres, redis, api)"
    echo "  down, stop     Stop all services"
    echo "  logs [svc]     Show logs (default: api)"
    echo "  migrate        Run database migrations"
    echo "  migrate-down   Rollback last migration"
    echo "  db             Open PostgreSQL shell"
    echo "  redis          Open Redis CLI"
    echo "  build          Build frontend for production"
    echo "  prod           Start full production stack"
    echo "  restart [svc]  Restart service"
    ;;
esac
