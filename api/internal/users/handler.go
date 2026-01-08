package users

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"

	"github.com/itam-misis/itam-api/internal/auth"
	"github.com/itam-misis/itam-api/internal/response"
)

// Handler handles user HTTP requests
type Handler struct {
	service *Service
}

// NewHandler creates a new users handler
func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// List handles GET /api/users
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	params := ListUsersParams{
		Search: r.URL.Query().Get("search"),
		Role:   r.URL.Query().Get("role"),
	}

	if page := r.URL.Query().Get("page"); page != "" {
		if p, err := strconv.Atoi(page); err == nil {
			params.Page = p
		}
	}
	if params.Page < 1 {
		params.Page = 1
	}

	if pageSize := r.URL.Query().Get("page_size"); pageSize != "" {
		if ps, err := strconv.Atoi(pageSize); err == nil {
			params.PageSize = ps
		}
	}
	if params.PageSize < 1 {
		params.PageSize = 20
	}

	result, err := h.service.List(r.Context(), params)
	if err != nil {
		slog.Error("failed to list users", "error", err)
		response.InternalError(w, "failed to list users")
		return
	}

	response.JSON(w, http.StatusOK, result)
}

// Get handles GET /api/users/:id
func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		response.BadRequest(w, "invalid user id")
		return
	}

	user, err := h.service.GetByID(r.Context(), id)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			response.NotFound(w, "user not found")
			return
		}
		slog.Error("failed to get user", "id", id, "error", err)
		response.InternalError(w, "failed to get user")
		return
	}

	response.JSON(w, http.StatusOK, user.ToResponse())
}

// Create handles POST /api/users
func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	var req CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	user, err := h.service.Create(r.Context(), &req)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidEmail):
			response.ValidationError(w, "invalid email format")
		case errors.Is(err, ErrPasswordTooShort):
			response.ValidationError(w, "password must be at least 8 characters")
		case errors.Is(err, ErrNameRequired):
			response.ValidationError(w, "name is required")
		case errors.Is(err, ErrInvalidRole):
			response.ValidationError(w, "role must be 'admin' or 'editor'")
		case errors.Is(err, ErrEmailExists):
			response.Conflict(w, "email already exists")
		default:
			slog.Error("failed to create user", "error", err)
			response.InternalError(w, "failed to create user")
		}
		return
	}

	response.JSON(w, http.StatusCreated, user.ToResponse())
}

// Update handles PUT /api/users/:id
func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		response.BadRequest(w, "invalid user id")
		return
	}

	var req UpdateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	currentUserID, _ := auth.GetUserIDFromContext(r.Context())

	user, err := h.service.Update(r.Context(), id, &req, currentUserID)
	if err != nil {
		switch {
		case errors.Is(err, ErrUserNotFound):
			response.NotFound(w, "user not found")
		case errors.Is(err, ErrInvalidEmail):
			response.ValidationError(w, "invalid email format")
		case errors.Is(err, ErrPasswordTooShort):
			response.ValidationError(w, "password must be at least 8 characters")
		case errors.Is(err, ErrNameRequired):
			response.ValidationError(w, "name is required")
		case errors.Is(err, ErrInvalidRole):
			response.ValidationError(w, "role must be 'admin' or 'editor'")
		case errors.Is(err, ErrEmailExists):
			response.Conflict(w, "email already exists")
		case errors.Is(err, ErrLastAdmin):
			response.BadRequest(w, "cannot change the last admin's role or status")
		case errors.Is(err, ErrCannotChangeSelf):
			response.BadRequest(w, "cannot change your own role or status")
		default:
			slog.Error("failed to update user", "id", id, "error", err)
			response.InternalError(w, "failed to update user")
		}
		return
	}

	response.JSON(w, http.StatusOK, user.ToResponse())
}

// Delete handles DELETE /api/users/:id
func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		response.BadRequest(w, "invalid user id")
		return
	}

	currentUserID, _ := auth.GetUserIDFromContext(r.Context())

	err = h.service.Delete(r.Context(), id, currentUserID)
	if err != nil {
		switch {
		case errors.Is(err, ErrUserNotFound):
			response.NotFound(w, "user not found")
		case errors.Is(err, ErrCannotDeleteSelf):
			response.BadRequest(w, "cannot delete your own account")
		case errors.Is(err, ErrLastAdmin):
			response.BadRequest(w, "cannot delete the last admin")
		default:
			slog.Error("failed to delete user", "id", id, "error", err)
			response.InternalError(w, "failed to delete user")
		}
		return
	}

	response.JSON(w, http.StatusOK, map[string]string{
		"message": "user deleted successfully",
	})
}
