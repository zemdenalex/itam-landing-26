package stats

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/itam-misis/itam-api/internal/audit"
	"github.com/itam-misis/itam-api/internal/auth"
	"github.com/itam-misis/itam-api/internal/response"
)

var (
	ErrStatNotFound   = errors.New("stat not found")
	ErrValueRequired  = errors.New("value is required")
)

type Stat struct {
	ID        int64     `json:"id"`
	Key       string    `json:"key"`
	Value     string    `json:"value"`
	Label     *string   `json:"label"`
	UpdatedAt time.Time `json:"updated_at"`
}

type UpdateRequest struct {
	Value string  `json:"value"`
	Label *string `json:"label,omitempty"`
}

func (r *UpdateRequest) Validate() error {
	if r.Value == "" {
		return ErrValueRequired
	}
	return nil
}

// Service
type Service struct {
	db    *pgxpool.Pool
	audit *audit.Service
}

func NewService(db *pgxpool.Pool, auditService *audit.Service) *Service {
	return &Service{db: db, audit: auditService}
}

func (s *Service) List(ctx context.Context) ([]Stat, error) {
	rows, err := s.db.Query(ctx, "SELECT id, key, value, label, updated_at FROM stats ORDER BY key")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var stats []Stat
	for rows.Next() {
		var st Stat
		rows.Scan(&st.ID, &st.Key, &st.Value, &st.Label, &st.UpdatedAt)
		stats = append(stats, st)
	}
	if stats == nil {
		stats = []Stat{}
	}
	return stats, nil
}

func (s *Service) GetPublic(ctx context.Context) (map[string]string, error) {
	rows, err := s.db.Query(ctx, "SELECT key, value FROM stats")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make(map[string]string)
	for rows.Next() {
		var key, value string
		rows.Scan(&key, &value)
		result[key] = value
	}
	return result, nil
}

func (s *Service) GetByKey(ctx context.Context, key string) (*Stat, error) {
	var st Stat
	err := s.db.QueryRow(ctx, "SELECT id, key, value, label, updated_at FROM stats WHERE key = $1", key).Scan(&st.ID, &st.Key, &st.Value, &st.Label, &st.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrStatNotFound
	}
	return &st, err
}

func (s *Service) Update(ctx context.Context, key string, req *UpdateRequest, userID int64, ip string) (*Stat, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}

	existing, err := s.GetByKey(ctx, key)
	if err != nil {
		return nil, err
	}

	var st Stat
	if req.Label != nil {
		err = s.db.QueryRow(ctx, "UPDATE stats SET value = $1, label = $2, updated_at = NOW() WHERE key = $3 RETURNING id, key, value, label, updated_at", req.Value, *req.Label, key).Scan(&st.ID, &st.Key, &st.Value, &st.Label, &st.UpdatedAt)
	} else {
		err = s.db.QueryRow(ctx, "UPDATE stats SET value = $1, updated_at = NOW() WHERE key = $2 RETURNING id, key, value, label, updated_at", req.Value, key).Scan(&st.ID, &st.Key, &st.Value, &st.Label, &st.UpdatedAt)
	}
	if err != nil {
		return nil, err
	}

	s.audit.LogAction(ctx, &userID, audit.ActionUpdate, audit.EntityStat, &st.ID, map[string]any{"before": existing, "after": st}, ip)
	return &st, nil
}

// Handler
type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	stats, err := h.service.List(r.Context())
	if err != nil {
		slog.Error("failed to list stats", "error", err)
		response.InternalError(w, "failed to list stats")
		return
	}
	response.JSON(w, http.StatusOK, stats)
}

func (h *Handler) ListPublic(w http.ResponseWriter, r *http.Request) {
	stats, err := h.service.GetPublic(r.Context())
	if err != nil {
		response.InternalError(w, "failed to get stats")
		return
	}
	response.JSON(w, http.StatusOK, stats)
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	key := chi.URLParam(r, "key")
	var req UpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	userID, _ := auth.GetUserIDFromContext(r.Context())
	stat, err := h.service.Update(r.Context(), key, &req, userID, r.RemoteAddr)
	if errors.Is(err, ErrStatNotFound) {
		response.NotFound(w, "stat not found")
		return
	}
	if errors.Is(err, ErrValueRequired) {
		response.ValidationError(w, err.Error())
		return
	}
	if err != nil {
		response.InternalError(w, "failed to update stat")
		return
	}
	response.JSON(w, http.StatusOK, stat)
}
