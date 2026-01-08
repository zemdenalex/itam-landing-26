package wins

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

// Handler handles win HTTP requests
type Handler struct {
	service *Service
}

// NewHandler creates a new wins handler
func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// List handles GET /api/wins
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	params := ListWinsParams{
		Search: r.URL.Query().Get("search"),
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

	if year := r.URL.Query().Get("year"); year != "" {
		if y, err := strconv.Atoi(year); err == nil {
			params.Year = y
		}
	}

	result, err := h.service.List(r.Context(), params)
	if err != nil {
		slog.Error("failed to list wins", "error", err)
		response.InternalError(w, "failed to list wins")
		return
	}

	response.JSON(w, http.StatusOK, result)
}

// ListPublic handles GET /api/public/wins
func (h *Handler) ListPublic(w http.ResponseWriter, r *http.Request) {
	wins, err := h.service.ListPublic(r.Context())
	if err != nil {
		slog.Error("failed to list public wins", "error", err)
		response.InternalError(w, "failed to list wins")
		return
	}

	response.JSON(w, http.StatusOK, wins)
}

// Get handles GET /api/wins/:id
func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		response.BadRequest(w, "invalid win id")
		return
	}

	win, err := h.service.GetByID(r.Context(), id)
	if err != nil {
		if errors.Is(err, ErrWinNotFound) {
			response.NotFound(w, "win not found")
			return
		}
		slog.Error("failed to get win", "id", id, "error", err)
		response.InternalError(w, "failed to get win")
		return
	}

	response.JSON(w, http.StatusOK, win)
}

// Create handles POST /api/wins
func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	var req CreateWinRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	userID, _ := auth.GetUserIDFromContext(r.Context())
	ipAddress := r.RemoteAddr

	win, err := h.service.Create(r.Context(), &req, userID, ipAddress)
	if err != nil {
		switch {
		case errors.Is(err, ErrTeamNameRequired):
			response.ValidationError(w, "team name is required")
		case errors.Is(err, ErrHackathonRequired):
			response.ValidationError(w, "hackathon name is required")
		case errors.Is(err, ErrResultRequired):
			response.ValidationError(w, "result is required")
		case errors.Is(err, ErrYearRequired):
			response.ValidationError(w, "year is required")
		case errors.Is(err, ErrInvalidYear):
			response.ValidationError(w, "year must be between 2000 and 2100")
		default:
			slog.Error("failed to create win", "error", err)
			response.InternalError(w, "failed to create win")
		}
		return
	}

	response.JSON(w, http.StatusCreated, win)
}

// Update handles PUT /api/wins/:id
func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		response.BadRequest(w, "invalid win id")
		return
	}

	var req UpdateWinRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	userID, _ := auth.GetUserIDFromContext(r.Context())
	ipAddress := r.RemoteAddr

	win, err := h.service.Update(r.Context(), id, &req, userID, ipAddress)
	if err != nil {
		switch {
		case errors.Is(err, ErrWinNotFound):
			response.NotFound(w, "win not found")
		case errors.Is(err, ErrTeamNameRequired):
			response.ValidationError(w, "team name is required")
		case errors.Is(err, ErrHackathonRequired):
			response.ValidationError(w, "hackathon name is required")
		case errors.Is(err, ErrResultRequired):
			response.ValidationError(w, "result is required")
		case errors.Is(err, ErrInvalidYear):
			response.ValidationError(w, "year must be between 2000 and 2100")
		default:
			slog.Error("failed to update win", "id", id, "error", err)
			response.InternalError(w, "failed to update win")
		}
		return
	}

	response.JSON(w, http.StatusOK, win)
}

// Delete handles DELETE /api/wins/:id
func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		response.BadRequest(w, "invalid win id")
		return
	}

	userID, _ := auth.GetUserIDFromContext(r.Context())
	ipAddress := r.RemoteAddr

	err = h.service.Delete(r.Context(), id, userID, ipAddress)
	if err != nil {
		if errors.Is(err, ErrWinNotFound) {
			response.NotFound(w, "win not found")
			return
		}
		slog.Error("failed to delete win", "id", id, "error", err)
		response.InternalError(w, "failed to delete win")
		return
	}

	response.JSON(w, http.StatusOK, map[string]string{
		"message": "win deleted successfully",
	})
}

// Import handles POST /api/wins/import
func (h *Handler) Import(w http.ResponseWriter, r *http.Request) {
	// Parse multipart form
	err := r.ParseMultipartForm(10 << 20) // 10MB max
	if err != nil {
		response.BadRequest(w, "failed to parse form data")
		return
	}

	// Get file
	file, _, err := r.FormFile("file")
	if err != nil {
		response.BadRequest(w, "file is required")
		return
	}
	defer file.Close()

	userID, _ := auth.GetUserIDFromContext(r.Context())
	ipAddress := r.RemoteAddr

	result, err := h.service.ImportCSV(r.Context(), file, userID, ipAddress)
	if err != nil {
		slog.Error("failed to import wins", "error", err)
		response.BadRequest(w, err.Error())
		return
	}

	response.JSON(w, http.StatusOK, result)
}

// GetYears handles GET /api/wins/years
func (h *Handler) GetYears(w http.ResponseWriter, r *http.Request) {
	years, err := h.service.GetYears(r.Context())
	if err != nil {
		slog.Error("failed to get years", "error", err)
		response.InternalError(w, "failed to get years")
		return
	}

	response.JSON(w, http.StatusOK, years)
}

// GetStats handles GET /api/wins/stats
func (h *Handler) GetStats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.service.GetStats(r.Context())
	if err != nil {
		slog.Error("failed to get stats", "error", err)
		response.InternalError(w, "failed to get stats")
		return
	}

	response.JSON(w, http.StatusOK, stats)
}
