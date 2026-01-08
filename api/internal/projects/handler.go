package projects

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

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	params := ListParams{Search: r.URL.Query().Get("search")}
	if p, _ := strconv.Atoi(r.URL.Query().Get("page")); p > 0 {
		params.Page = p
	} else {
		params.Page = 1
	}
	if ps, _ := strconv.Atoi(r.URL.Query().Get("page_size")); ps > 0 {
		params.PageSize = ps
	} else {
		params.PageSize = 20
	}
	if pub := r.URL.Query().Get("is_published"); pub != "" {
		v := pub == "true"
		params.IsPublished = &v
	}

	result, err := h.service.List(r.Context(), params)
	if err != nil {
		slog.Error("failed to list projects", "error", err)
		response.InternalError(w, "failed to list projects")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *Handler) ListPublic(w http.ResponseWriter, r *http.Request) {
	projects, err := h.service.ListPublic(r.Context())
	if err != nil {
		slog.Error("failed to list public projects", "error", err)
		response.InternalError(w, "failed to list projects")
		return
	}
	response.JSON(w, http.StatusOK, projects)
}

func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		response.BadRequest(w, "invalid id")
		return
	}

	project, err := h.service.GetByID(r.Context(), id)
	if errors.Is(err, ErrProjectNotFound) {
		response.NotFound(w, "project not found")
		return
	}
	if err != nil {
		slog.Error("failed to get project", "error", err)
		response.InternalError(w, "failed to get project")
		return
	}
	response.JSON(w, http.StatusOK, project)
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	var req CreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	userID, _ := auth.GetUserIDFromContext(r.Context())
	project, err := h.service.Create(r.Context(), &req, userID, r.RemoteAddr)
	if err != nil {
		switch {
		case errors.Is(err, ErrTitleRequired):
			response.ValidationError(w, err.Error())
		case errors.Is(err, ErrSlugExists):
			response.Conflict(w, err.Error())
		default:
			slog.Error("failed to create project", "error", err)
			response.InternalError(w, "failed to create project")
		}
		return
	}
	response.JSON(w, http.StatusCreated, project)
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		response.BadRequest(w, "invalid id")
		return
	}

	var req UpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	userID, _ := auth.GetUserIDFromContext(r.Context())
	project, err := h.service.Update(r.Context(), id, &req, userID, r.RemoteAddr)
	if err != nil {
		switch {
		case errors.Is(err, ErrProjectNotFound):
			response.NotFound(w, "project not found")
		case errors.Is(err, ErrTitleRequired):
			response.ValidationError(w, err.Error())
		case errors.Is(err, ErrSlugExists):
			response.Conflict(w, err.Error())
		default:
			slog.Error("failed to update project", "error", err)
			response.InternalError(w, "failed to update project")
		}
		return
	}
	response.JSON(w, http.StatusOK, project)
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		response.BadRequest(w, "invalid id")
		return
	}

	userID, _ := auth.GetUserIDFromContext(r.Context())
	if err := h.service.Delete(r.Context(), id, userID, r.RemoteAddr); err != nil {
		if errors.Is(err, ErrProjectNotFound) {
			response.NotFound(w, "project not found")
			return
		}
		slog.Error("failed to delete project", "error", err)
		response.InternalError(w, "failed to delete project")
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"message": "project deleted"})
}

func (h *Handler) Reorder(w http.ResponseWriter, r *http.Request) {
	var req ReorderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	userID, _ := auth.GetUserIDFromContext(r.Context())
	if err := h.service.Reorder(r.Context(), req.IDs, userID, r.RemoteAddr); err != nil {
		slog.Error("failed to reorder projects", "error", err)
		response.InternalError(w, "failed to reorder")
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"message": "reordered"})
}

func (h *Handler) ListTags(w http.ResponseWriter, r *http.Request) {
	tags, err := h.service.ListTags(r.Context())
	if err != nil {
		slog.Error("failed to list tags", "error", err)
		response.InternalError(w, "failed to list tags")
		return
	}
	response.JSON(w, http.StatusOK, tags)
}
