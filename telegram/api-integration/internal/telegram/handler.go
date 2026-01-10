package telegram

import (
	"errors"
	"log/slog"
	"net/http"

	"github.com/itam-misis/itam-api/internal/response"
)

// Handler handles Telegram HTTP requests
type Handler struct {
	service *Service
}

// NewHandler creates a new telegram handler
func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// GetStats handles GET /api/telegram/stats
// Returns channel statistics from Redis
func (h *Handler) GetStats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.service.GetStats(r.Context())
	if err != nil {
		if errors.Is(err, ErrNoData) {
			response.JSON(w, http.StatusOK, map[string]any{
				"message": "Telegram data not yet available. Worker may be initializing.",
				"stats":   nil,
			})
			return
		}
		slog.Error("failed to get telegram stats", "error", err)
		response.InternalError(w, "failed to get telegram stats")
		return
	}

	response.JSON(w, http.StatusOK, stats)
}

// GetPosts handles GET /api/telegram/posts
// Returns recent posts from Redis
func (h *Handler) GetPosts(w http.ResponseWriter, r *http.Request) {
	posts, err := h.service.GetPosts(r.Context())
	if err != nil {
		if errors.Is(err, ErrNoData) {
			response.JSON(w, http.StatusOK, []ChannelPost{})
			return
		}
		slog.Error("failed to get telegram posts", "error", err)
		response.InternalError(w, "failed to get telegram posts")
		return
	}

	response.JSON(w, http.StatusOK, posts)
}

// GetAll handles GET /api/telegram (admin) and GET /api/public/telegram
// Returns combined stats + posts + last update time
func (h *Handler) GetAll(w http.ResponseWriter, r *http.Request) {
	data, err := h.service.GetAll(r.Context())
	if err != nil {
		if errors.Is(err, ErrNoData) {
			response.JSON(w, http.StatusOK, &TelegramData{
				Stats:      nil,
				Posts:      []ChannelPost{},
				LastUpdate: nil,
			})
			return
		}
		slog.Error("failed to get telegram data", "error", err)
		response.InternalError(w, "failed to get telegram data")
		return
	}

	response.JSON(w, http.StatusOK, data)
}

// Refresh handles POST /api/telegram/refresh (admin only)
// Triggers data refresh (placeholder - actual refresh done by Python worker)
func (h *Handler) Refresh(w http.ResponseWriter, r *http.Request) {
	if err := h.service.ForceRefresh(r.Context()); err != nil {
		slog.Error("failed to trigger telegram refresh", "error", err)
		response.InternalError(w, "failed to trigger refresh")
		return
	}

	response.JSON(w, http.StatusOK, map[string]string{
		"message": "Refresh requested. Data will be updated by the worker within 15 minutes.",
	})
}

// GetPublic handles GET /api/public/telegram
// Returns data for public API (same as GetAll but may be cached differently)
func (h *Handler) GetPublic(w http.ResponseWriter, r *http.Request) {
	h.GetAll(w, r)
}
