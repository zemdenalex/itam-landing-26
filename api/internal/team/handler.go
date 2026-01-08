package team

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
	if cid, err := strconv.ParseInt(r.URL.Query().Get("club_id"), 10, 64); err == nil {
		params.ClubID = &cid
	}
	if vis := r.URL.Query().Get("is_visible"); vis != "" {
		v := vis == "true"
		params.IsVisible = &v
	}

	result, err := h.service.List(r.Context(), params)
	if err != nil {
		slog.Error("failed to list team members", "error", err)
		response.InternalError(w, "failed to list team members")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *Handler) ListPublic(w http.ResponseWriter, r *http.Request) {
	members, err := h.service.ListPublic(r.Context())
	if err != nil {
		slog.Error("failed to list public team members", "error", err)
		response.InternalError(w, "failed to list team members")
		return
	}
	response.JSON(w, http.StatusOK, members)
}

func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		response.BadRequest(w, "invalid id")
		return
	}

	member, err := h.service.GetByID(r.Context(), id)
	if errors.Is(err, ErrMemberNotFound) {
		response.NotFound(w, "team member not found")
		return
	}
	if err != nil {
		slog.Error("failed to get team member", "error", err)
		response.InternalError(w, "failed to get team member")
		return
	}
	response.JSON(w, http.StatusOK, member)
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	var req CreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	userID, _ := auth.GetUserIDFromContext(r.Context())
	member, err := h.service.Create(r.Context(), &req, userID, r.RemoteAddr)
	if err != nil {
		if errors.Is(err, ErrNameRequired) {
			response.ValidationError(w, err.Error())
			return
		}
		slog.Error("failed to create team member", "error", err)
		response.InternalError(w, "failed to create team member")
		return
	}
	response.JSON(w, http.StatusCreated, member)
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
	member, err := h.service.Update(r.Context(), id, &req, userID, r.RemoteAddr)
	if err != nil {
		if errors.Is(err, ErrMemberNotFound) {
			response.NotFound(w, "team member not found")
			return
		}
		if errors.Is(err, ErrNameRequired) {
			response.ValidationError(w, err.Error())
			return
		}
		slog.Error("failed to update team member", "error", err)
		response.InternalError(w, "failed to update team member")
		return
	}
	response.JSON(w, http.StatusOK, member)
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		response.BadRequest(w, "invalid id")
		return
	}

	userID, _ := auth.GetUserIDFromContext(r.Context())
	if err := h.service.Delete(r.Context(), id, userID, r.RemoteAddr); err != nil {
		if errors.Is(err, ErrMemberNotFound) {
			response.NotFound(w, "team member not found")
			return
		}
		slog.Error("failed to delete team member", "error", err)
		response.InternalError(w, "failed to delete team member")
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"message": "team member deleted"})
}
