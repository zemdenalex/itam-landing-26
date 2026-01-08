package main

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"

	"github.com/itam-misis/itam-api/internal/audit"
	"github.com/itam-misis/itam-api/internal/auth"
	"github.com/itam-misis/itam-api/internal/config"
	"github.com/itam-misis/itam-api/internal/database"
	"github.com/itam-misis/itam-api/internal/middleware"
	"github.com/itam-misis/itam-api/internal/users"
	"github.com/itam-misis/itam-api/internal/wins"
)

type App struct {
	config       *config.Config
	db           *database.PostgresDB
	redis        *database.RedisDB
	router       *chi.Mux
	authService  *auth.Service
	usersService *users.Service
	auditService *audit.Service
	winsService  *wins.Service
}

func main() {
	// Setup structured logging
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
	slog.SetDefault(logger)

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		slog.Error("failed to load config", "error", err)
		os.Exit(1)
	}

	// Create context for initialization
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Connect to PostgreSQL
	db, err := database.NewPostgres(ctx, cfg.Database.DSN())
	if err != nil {
		slog.Error("failed to connect to PostgreSQL", "error", err)
		os.Exit(1)
	}
	defer db.Close()

	// Connect to Redis
	redisDB, err := database.NewRedis(ctx, cfg.Redis.URL)
	if err != nil {
		slog.Error("failed to connect to Redis", "error", err)
		os.Exit(1)
	}
	defer redisDB.Close()

	// Initialize services
	authService := auth.NewService(db.Pool, cfg.JWT.Secret, cfg.JWT.Expiry)
	usersService := users.NewService(db.Pool)
	auditService := audit.NewService(db.Pool)
	winsService := wins.NewService(db.Pool, auditService)

	// Initialize app
	app := &App{
		config:       cfg,
		db:           db,
		redis:        redisDB,
		authService:  authService,
		usersService: usersService,
		auditService: auditService,
		winsService:  winsService,
	}

	// Seed initial admin if needed
	if err := app.seedAdmin(ctx); err != nil {
		slog.Error("failed to seed admin", "error", err)
		os.Exit(1)
	}

	// Setup router
	app.setupRouter()

	// Create HTTP server
	server := &http.Server{
		Addr:         ":" + cfg.Server.Port,
		Handler:      app.router,
		ReadTimeout:  cfg.Server.ReadTimeout,
		WriteTimeout: cfg.Server.WriteTimeout,
		IdleTimeout:  time.Minute,
	}

	// Start server in goroutine
	go func() {
		slog.Info("starting server", "port", cfg.Server.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("server error", "error", err)
			os.Exit(1)
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("shutting down server...")

	// Graceful shutdown with timeout
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer shutdownCancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		slog.Error("server forced to shutdown", "error", err)
	}

	slog.Info("server stopped")
}

func (a *App) seedAdmin(ctx context.Context) error {
	adminEmail := os.Getenv("ADMIN_EMAIL")
	adminPassword := os.Getenv("ADMIN_PASSWORD")
	adminName := os.Getenv("ADMIN_NAME")

	if adminEmail == "" || adminPassword == "" {
		slog.Debug("ADMIN_EMAIL or ADMIN_PASSWORD not set, skipping seed")
		return nil
	}

	if adminName == "" {
		adminName = "Admin"
	}

	user, err := a.usersService.CreateInitialAdmin(ctx, adminEmail, adminPassword, adminName)
	if err != nil {
		return err
	}

	if user != nil {
		slog.Info("initial admin created", "email", user.Email)
	}

	return nil
}

func (a *App) setupRouter() {
	r := chi.NewRouter()

	// Global middleware
	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.RealIP)
	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.Timeout(60 * time.Second))
	r.Use(middleware.CORS)

	// Initialize handlers
	authHandler := auth.NewHandler(a.authService)
	usersHandler := users.NewHandler(a.usersService)
	winsHandler := wins.NewHandler(a.winsService)

	// Routes
	r.Route("/api", func(r chi.Router) {
		// Health check (public)
		r.Get("/health", a.healthHandler)

		// Auth routes (public)
		r.Route("/auth", func(r chi.Router) {
			r.Post("/login", authHandler.Login)
			r.Post("/logout", authHandler.Logout)

			// Protected auth routes
			r.Group(func(r chi.Router) {
				r.Use(middleware.Auth(a.authService))
				r.Get("/me", authHandler.Me)
			})
		})

		// Protected routes
		r.Group(func(r chi.Router) {
			r.Use(middleware.Auth(a.authService))

			// Users (admin only)
			r.Route("/users", func(r chi.Router) {
				r.Use(middleware.RequireAdmin)
				r.Get("/", usersHandler.List)
				r.Post("/", usersHandler.Create)
				r.Get("/{id}", usersHandler.Get)
				r.Put("/{id}", usersHandler.Update)
				r.Delete("/{id}", usersHandler.Delete)
			})

			// Wins (authenticated users)
			r.Route("/wins", func(r chi.Router) {
				r.Get("/", winsHandler.List)
				r.Post("/", winsHandler.Create)
				r.Get("/years", winsHandler.GetYears)
				r.Get("/stats", winsHandler.GetStats)
				r.Post("/import", winsHandler.Import)
				r.Get("/{id}", winsHandler.Get)
				r.Put("/{id}", winsHandler.Update)
				r.Delete("/{id}", winsHandler.Delete)
			})
		})

		// Public API
		r.Route("/public", func(r chi.Router) {
			r.Get("/wins", winsHandler.ListPublic)
		})
	})

	a.router = r
}

type HealthResponse struct {
	Status string `json:"status"`
	DB     string `json:"db"`
	Redis  string `json:"redis"`
}

func (a *App) healthHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	response := HealthResponse{
		Status: "ok",
		DB:     "ok",
		Redis:  "ok",
	}

	// Check PostgreSQL
	if err := a.db.Health(ctx); err != nil {
		response.Status = "degraded"
		response.DB = "error"
		slog.Error("database health check failed", "error", err)
	}

	// Check Redis
	if err := a.redis.Health(ctx); err != nil {
		response.Status = "degraded"
		response.Redis = "error"
		slog.Error("redis health check failed", "error", err)
	}

	statusCode := http.StatusOK
	if response.Status != "ok" {
		statusCode = http.StatusServiceUnavailable
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(response)
}
