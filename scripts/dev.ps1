# ITAM CMS Development Script for PowerShell
# Usage: .\scripts\dev.ps1 [command]

param(
    [Parameter(Position=0)]
    [string]$Command = "help",
    
    [Parameter(Position=1)]
    [string]$Service = "api"
)

switch ($Command) {
    {$_ -in "up", "start"} {
        Write-Host "Starting development environment..." -ForegroundColor Green
        docker compose up -d postgres redis api
        Write-Host ""
        Write-Host "Backend started!" -ForegroundColor Green
        Write-Host "   API: http://localhost:8080/api/health"
        Write-Host ""
        Write-Host "Now run frontend:"
        Write-Host "   cd landing; npm run dev"
        Write-Host "   cd admin; npm run dev"
    }
    
    {$_ -in "down", "stop"} {
        Write-Host "Stopping all services..." -ForegroundColor Yellow
        docker compose down
    }
    
    "logs" {
        docker compose logs -f $Service
    }
    
    "migrate" {
        Write-Host "Running migrations..." -ForegroundColor Green
        docker compose run --rm migrate
    }
    
    "migrate-down" {
        Write-Host "Rolling back last migration..." -ForegroundColor Yellow
        docker compose run --rm migrate-down
    }
    
    "db" {
        Write-Host "Opening PostgreSQL shell..." -ForegroundColor Cyan
        $dbUser = if ($env:DB_USER) { $env:DB_USER } else { "itam" }
        $dbName = if ($env:DB_NAME) { $env:DB_NAME } else { "itam" }
        docker compose exec postgres psql -U $dbUser -d $dbName
    }
    
    "redis" {
        Write-Host "Opening Redis CLI..." -ForegroundColor Cyan
        docker compose exec redis redis-cli
    }
    
    "build" {
        Write-Host "Building frontend..." -ForegroundColor Green
        Push-Location landing
        npm ci
        npm run build
        Pop-Location
        
        Push-Location admin
        npm ci
        npm run build
        Pop-Location
        
        Write-Host "Build complete!" -ForegroundColor Green
    }
    
    "prod" {
        Write-Host "Starting production..." -ForegroundColor Green
        docker compose up -d
        Write-Host "Production started at http://localhost" -ForegroundColor Green
    }
    
    "restart" {
        docker compose restart $Service
    }
    
    "health" {
        Write-Host "Checking API health..." -ForegroundColor Cyan
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:8080/api/health" -Method Get
            Write-Host "API Status: $($response.status)" -ForegroundColor Green
            Write-Host "Database: $($response.db)"
            Write-Host "Redis: $($response.redis)"
        } catch {
            Write-Host "API not responding" -ForegroundColor Red
        }
    }
    
    default {
        Write-Host "ITAM CMS Development Helper" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Usage: .\scripts\dev.ps1 [command] [service]"
        Write-Host ""
        Write-Host "Commands:"
        Write-Host "  up, start      Start development (postgres, redis, api)"
        Write-Host "  down, stop     Stop all services"
        Write-Host "  logs [svc]     Show logs (default: api)"
        Write-Host "  migrate        Run database migrations"
        Write-Host "  migrate-down   Rollback last migration"
        Write-Host "  db             Open PostgreSQL shell"
        Write-Host "  redis          Open Redis CLI"
        Write-Host "  build          Build frontend for production"
        Write-Host "  prod           Start full production stack"
        Write-Host "  restart [svc]  Restart service"
        Write-Host "  health         Check API health"
    }
}
