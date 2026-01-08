package cache

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"time"

	"github.com/redis/go-redis/v9"
)

// Cache keys
const (
	KeyPublicWins     = "cache:public:wins"
	KeyPublicProjects = "cache:public:projects"
	KeyPublicTeam     = "cache:public:team"
	KeyPublicNews     = "cache:public:news"
	KeyPublicPartners = "cache:public:partners"
	KeyPublicClubs    = "cache:public:clubs"
	KeyPublicBlog     = "cache:public:blog"
	KeyPublicStats    = "cache:public:stats"
)

// Default TTL
const DefaultTTL = 5 * time.Minute

// Service handles cache operations
type Service struct {
	client *redis.Client
}

// NewService creates a new cache service
func NewService(client *redis.Client) *Service {
	return &Service{client: client}
}

// Get retrieves a cached value
func (s *Service) Get(ctx context.Context, key string) ([]byte, error) {
	return s.client.Get(ctx, key).Bytes()
}

// Set stores a value in cache
func (s *Service) Set(ctx context.Context, key string, value []byte, ttl time.Duration) error {
	return s.client.Set(ctx, key, value, ttl).Err()
}

// Delete removes a key from cache
func (s *Service) Delete(ctx context.Context, keys ...string) error {
	if len(keys) == 0 {
		return nil
	}
	return s.client.Del(ctx, keys...).Err()
}

// InvalidateWins removes wins cache
func (s *Service) InvalidateWins(ctx context.Context) {
	s.Delete(ctx, KeyPublicWins)
}

// InvalidateProjects removes projects cache
func (s *Service) InvalidateProjects(ctx context.Context) {
	s.Delete(ctx, KeyPublicProjects)
}

// InvalidateTeam removes team cache
func (s *Service) InvalidateTeam(ctx context.Context) {
	s.Delete(ctx, KeyPublicTeam)
}

// InvalidateNews removes news cache
func (s *Service) InvalidateNews(ctx context.Context) {
	s.Delete(ctx, KeyPublicNews)
}

// InvalidatePartners removes partners cache
func (s *Service) InvalidatePartners(ctx context.Context) {
	s.Delete(ctx, KeyPublicPartners)
}

// InvalidateClubs removes clubs cache
func (s *Service) InvalidateClubs(ctx context.Context) {
	s.Delete(ctx, KeyPublicClubs)
}

// InvalidateBlog removes blog cache
func (s *Service) InvalidateBlog(ctx context.Context) {
	s.Delete(ctx, KeyPublicBlog)
}

// InvalidateStats removes stats cache
func (s *Service) InvalidateStats(ctx context.Context) {
	s.Delete(ctx, KeyPublicStats)
}

// InvalidateAll removes all public caches
func (s *Service) InvalidateAll(ctx context.Context) {
	s.Delete(ctx,
		KeyPublicWins,
		KeyPublicProjects,
		KeyPublicTeam,
		KeyPublicNews,
		KeyPublicPartners,
		KeyPublicClubs,
		KeyPublicBlog,
		KeyPublicStats,
	)
}

// Middleware returns a caching middleware for specific cache key
func Middleware(cacheService *Service, cacheKey string, ttl time.Duration) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := r.Context()

			// Only cache GET requests
			if r.Method != http.MethodGet {
				next.ServeHTTP(w, r)
				return
			}

			// Try to get from cache
			cached, err := cacheService.Get(ctx, cacheKey)
			if err == nil && len(cached) > 0 {
				w.Header().Set("Content-Type", "application/json")
				w.Header().Set("X-Cache", "HIT")
				w.Write(cached)
				return
			}

			// Cache miss - call handler
			rec := httptest.NewRecorder()
			next.ServeHTTP(rec, r)

			// Copy response to client
			for k, v := range rec.Header() {
				w.Header()[k] = v
			}
			w.Header().Set("X-Cache", "MISS")
			w.WriteHeader(rec.Code)
			w.Write(rec.Body.Bytes())

			// Cache successful responses
			if rec.Code == http.StatusOK {
				cacheService.Set(ctx, cacheKey, rec.Body.Bytes(), ttl)
			}
		})
	}
}

// responseRecorder wraps http.ResponseWriter to capture response
type responseRecorder struct {
	http.ResponseWriter
	body       *bytes.Buffer
	statusCode int
}

func newResponseRecorder(w http.ResponseWriter) *responseRecorder {
	return &responseRecorder{
		ResponseWriter: w,
		body:           &bytes.Buffer{},
		statusCode:     http.StatusOK,
	}
}

func (r *responseRecorder) WriteHeader(code int) {
	r.statusCode = code
	r.ResponseWriter.WriteHeader(code)
}

func (r *responseRecorder) Write(b []byte) (int, error) {
	r.body.Write(b)
	return r.ResponseWriter.Write(b)
}

// CachedResponse is a helper to manually cache JSON responses
type CachedResponse struct {
	Data  interface{} `json:"data"`
	Error interface{} `json:"error"`
}

// WriteJSONWithCache writes JSON response and caches it
func WriteJSONWithCache(w http.ResponseWriter, cacheService *Service, cacheKey string, ttl time.Duration, data interface{}) {
	resp := CachedResponse{Data: data, Error: nil}
	jsonData, _ := json.Marshal(resp)

	// Cache the response
	cacheService.Set(context.Background(), cacheKey, jsonData, ttl)

	// Write response
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("X-Cache", "MISS")
	w.WriteHeader(http.StatusOK)
	w.Write(jsonData)
}
