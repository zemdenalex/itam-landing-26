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
	"github.com/itam-misis/itam-api/internal/blog"
	"github.com/itam-misis/itam-api/internal/cache"
	"github.com/itam-misis/itam-api/internal/clubs"
	"github.com/itam-misis/itam-api/internal/config"
	"github.com/itam-misis/itam-api/internal/database"
	"github.com/itam-misis/itam-api/internal/logs"
	"github.com/itam-misis/itam-api/internal/middleware"
	"github.com/itam-misis/itam-api/internal/news"
	"github.com/itam-misis/itam-api/internal/partners"
	"github.com/itam-misis/itam-api/internal/projects"
	"github.com/itam-misis/itam-api/internal/stats"
	"github.com/itam-misis/itam-api/internal/team"
	"github.com/itam-misis/itam-api/internal/telegram"
	"github.com/itam-misis/itam-api/internal/upload"
	"github.com/itam-misis/itam-api/internal/users"
	"github.com/itam-misis/itam-api/internal/wins"
)

type App struct {
	config *config.Config
	db     *database.PostgresDB
	redis  *database.RedisDB
	router *chi.Mux

	// Services
	authService     *auth.Service
	usersService    *users.Service
	auditService    *audit.Service
	winsService     *wins.Service
	projectsService *projects.Service
	teamService     *team.Service
	newsService     *news.Service
	partnersService *partners.Service
	clubsService    *clubs.Service
	blogService     *blog.Service
	statsService    *stats.Service
	uploadService   *upload.Service
	cacheService    *cache.Service
	telegramService *telegram.Service
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
	auditService := audit.NewService(db.Pool)
	authService := auth.NewService(db.Pool, cfg.JWT.Secret, cfg.JWT.Expiry)
	usersService := users.NewService(db.Pool)
	winsService := wins.NewService(db.Pool, auditService)
	projectsService := projects.NewService(db.Pool, auditService)
	teamService := team.NewService(db.Pool, auditService)
	newsService := news.NewService(db.Pool, auditService)
	partnersService := partners.NewService(db.Pool, auditService)
	clubsService := clubs.NewService(db.Pool, auditService)
	blogService := blog.NewService(db.Pool, auditService)
	statsService := stats.NewService(db.Pool, auditService)
	uploadService := upload.NewService(upload.Config{
		UploadPath: cfg.Upload.Path,
		MaxSize:    cfg.Upload.MaxSize,
		BaseURL:    "/uploads",
	})
	cacheService := cache.NewService(redisDB.Client)
	telegramService := telegram.NewService(redisDB.Client)

	// Initialize app
	app := &App{
		config:          cfg,
		db:              db,
		redis:           redisDB,
		authService:     authService,
		usersService:    usersService,
		auditService:    auditService,
		winsService:     winsService,
		projectsService: projectsService,
		teamService:     teamService,
		newsService:     newsService,
		partnersService: partnersService,
		clubsService:    clubsService,
		blogService:     blogService,
		statsService:    statsService,
		uploadService:   uploadService,
		cacheService:    cacheService,
		telegramService: telegramService,
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
	projectsHandler := projects.NewHandler(a.projectsService)
	teamHandler := team.NewHandler(a.teamService)
	newsHandler := news.NewHandler(a.newsService)
	partnersHandler := partners.NewHandler(a.partnersService)
	clubsHandler := clubs.NewHandler(a.clubsService)
	blogHandler := blog.NewHandler(a.blogService)
	statsHandler := stats.NewHandler(a.statsService)
	logsHandler := logs.NewHandler(a.auditService)
	uploadHandler := upload.NewHandler(a.uploadService)
	telegramHandler := telegram.NewHandler(a.telegramService)

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

			// Wins
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

			// Projects
			r.Route("/projects", func(r chi.Router) {
				r.Get("/", projectsHandler.List)
				r.Post("/", projectsHandler.Create)
				r.Get("/tags", projectsHandler.ListTags)
				r.Put("/reorder", projectsHandler.Reorder)
				r.Get("/{id}", projectsHandler.Get)
				r.Put("/{id}", projectsHandler.Update)
				r.Delete("/{id}", projectsHandler.Delete)
			})

			// Team
			r.Route("/team", func(r chi.Router) {
				r.Get("/", teamHandler.List)
				r.Post("/", teamHandler.Create)
				r.Get("/{id}", teamHandler.Get)
				r.Put("/{id}", teamHandler.Update)
				r.Delete("/{id}", teamHandler.Delete)
			})

			// News
			r.Route("/news", func(r chi.Router) {
				r.Get("/", newsHandler.List)
				r.Post("/", newsHandler.Create)
				r.Get("/{id}", newsHandler.Get)
				r.Put("/{id}", newsHandler.Update)
				r.Delete("/{id}", newsHandler.Delete)
			})

			// Partners
			r.Route("/partners", func(r chi.Router) {
				r.Get("/", partnersHandler.List)
				r.Post("/", partnersHandler.Create)
				r.Put("/reorder", partnersHandler.Reorder)
				r.Get("/{id}", partnersHandler.Get)
				r.Put("/{id}", partnersHandler.Update)
				r.Delete("/{id}", partnersHandler.Delete)
			})

			// Clubs
			r.Route("/clubs", func(r chi.Router) {
				r.Get("/", clubsHandler.List)
				r.Post("/", clubsHandler.Create)
				r.Get("/{id}", clubsHandler.Get)
				r.Put("/{id}", clubsHandler.Update)
				r.Delete("/{id}", clubsHandler.Delete)
			})

			// Blog
			r.Route("/blog", func(r chi.Router) {
				r.Get("/", blogHandler.List)
				r.Post("/", blogHandler.Create)
				r.Get("/{id}", blogHandler.Get)
				r.Put("/{id}", blogHandler.Update)
				r.Delete("/{id}", blogHandler.Delete)
			})

			// Stats
			r.Route("/stats", func(r chi.Router) {
				r.Get("/", statsHandler.List)
				r.Put("/{key}", statsHandler.Update)
			})

			// Logs (admin only)
			r.Route("/logs", func(r chi.Router) {
				r.Use(middleware.RequireAdmin)
				r.Get("/", logsHandler.List)
			})

			// Upload
			r.Route("/upload", func(r chi.Router) {
				r.Post("/image", uploadHandler.UploadImage)
				r.Post("/svg", uploadHandler.UploadSVG)
				r.Delete("/{filename}", uploadHandler.Delete)
			})

			// Telegram
			r.Route("/telegram", func(r chi.Router) {
				r.Get("/", telegramHandler.GetAll)
				r.Get("/stats", telegramHandler.GetStats)
				r.Get("/posts", telegramHandler.GetPosts)
				r.With(middleware.RequireAdmin).Post("/refresh", telegramHandler.Refresh)
			})
		})

		// Public API (with caching)
		r.Route("/public", func(r chi.Router) {
			r.With(cache.Middleware(a.cacheService, cache.KeyPublicWins, cache.DefaultTTL)).Get("/wins", winsHandler.ListPublic)
			r.With(cache.Middleware(a.cacheService, cache.KeyPublicProjects, cache.DefaultTTL)).Get("/projects", projectsHandler.ListPublic)
			r.With(cache.Middleware(a.cacheService, cache.KeyPublicTeam, cache.DefaultTTL)).Get("/team", teamHandler.ListPublic)
			r.With(cache.Middleware(a.cacheService, cache.KeyPublicNews, cache.DefaultTTL)).Get("/news", newsHandler.ListPublic)
			r.With(cache.Middleware(a.cacheService, cache.KeyPublicPartners, cache.DefaultTTL)).Get("/partners", partnersHandler.ListPublic)
			r.With(cache.Middleware(a.cacheService, cache.KeyPublicClubs, cache.DefaultTTL)).Get("/clubs", clubsHandler.ListPublic)
			r.Get("/clubs/{slug}", clubsHandler.GetPublicBySlug)
			r.With(cache.Middleware(a.cacheService, cache.KeyPublicBlog, cache.DefaultTTL)).Get("/blog", blogHandler.ListPublic)
			r.Get("/blog/{slug}", blogHandler.GetPublicBySlug)
			r.With(cache.Middleware(a.cacheService, cache.KeyPublicStats, cache.DefaultTTL)).Get("/stats", statsHandler.ListPublic)
			r.With(cache.Middleware(a.cacheService, "cache:public:telegram", 15*time.Minute)).Get("/telegram", telegramHandler.GetPublic)
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
