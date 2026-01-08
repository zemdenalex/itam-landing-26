package auth

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"

	"github.com/itam-misis/itam-api/internal/response"
)

// Handler handles auth HTTP requests
type Handler struct {
	service *Service
}

// NewHandler creates a new auth handler
func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// Login handles POST /api/auth/login
func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	result, err := h.service.Login(r.Context(), &req)
	if err != nil {
		switch {
		case errors.Is(err, ErrEmailRequired), errors.Is(err, ErrPasswordRequired):
			response.ValidationError(w, err.Error())
		case errors.Is(err, ErrInvalidCredentials):
			response.Unauthorized(w, "invalid email or password")
		case errors.Is(err, ErrUserNotActive):
			response.Forbidden(w, "user account is not active")
		default:
			slog.Error("login failed", "error", err)
			response.InternalError(w, "login failed")
		}
		return
	}

	response.JSON(w, http.StatusOK, result)
}

// Logout handles POST /api/auth/logout
// Since we use simple logout (no server-side token invalidation),
// this just returns success. The client should remove the token.
func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	response.JSON(w, http.StatusOK, map[string]string{
		"message": "logged out successfully",
	})
}

// Me handles GET /api/auth/me
func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
	// Get user from context (set by auth middleware)
	user, ok := GetUserFromContext(r.Context())
	if !ok {
		response.Unauthorized(w, "not authenticated")
		return
	}

	response.JSON(w, http.StatusOK, user.ToResponse())
}
