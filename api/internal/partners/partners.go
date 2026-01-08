package partners

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/itam-misis/itam-api/internal/audit"
	"github.com/itam-misis/itam-api/internal/auth"
	"github.com/itam-misis/itam-api/internal/response"
)

var (
	ErrPartnerNotFound = errors.New("partner not found")
	ErrNameRequired    = errors.New("name is required")
)

type Partner struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	LogoSVG   *string   `json:"logo_svg"`
	Website   *string   `json:"website"`
	SortOrder int       `json:"sort_order"`
	IsVisible bool      `json:"is_visible"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type CreateRequest struct {
	Name      string  `json:"name"`
	LogoSVG   *string `json:"logo_svg"`
	Website   *string `json:"website"`
	SortOrder int     `json:"sort_order"`
	IsVisible bool    `json:"is_visible"`
}

func (r *CreateRequest) Validate() error {
	if r.Name == "" {
		return ErrNameRequired
	}
	return nil
}

type UpdateRequest struct {
	Name      *string `json:"name,omitempty"`
	LogoSVG   *string `json:"logo_svg,omitempty"`
	Website   *string `json:"website,omitempty"`
	SortOrder *int    `json:"sort_order,omitempty"`
	IsVisible *bool   `json:"is_visible,omitempty"`
}

type ListParams struct {
	Page      int
	PageSize  int
	IsVisible *bool
}

type ListResponse struct {
	Partners   []Partner `json:"partners"`
	Total      int       `json:"total"`
	Page       int       `json:"page"`
	PageSize   int       `json:"page_size"`
	TotalPages int       `json:"total_pages"`
}

type ReorderRequest struct {
	IDs []int64 `json:"ids"`
}

// Service
type Service struct {
	db    *pgxpool.Pool
	audit *audit.Service
}

func NewService(db *pgxpool.Pool, auditService *audit.Service) *Service {
	return &Service{db: db, audit: auditService}
}

func (s *Service) List(ctx context.Context, params ListParams) (*ListResponse, error) {
	if params.Page < 1 {
		params.Page = 1
	}
	if params.PageSize < 1 || params.PageSize > 100 {
		params.PageSize = 20
	}

	offset := (params.Page - 1) * params.PageSize
	baseQuery := "FROM partners WHERE 1=1"
	var args []any
	argNum := 1

	if params.IsVisible != nil {
		baseQuery += fmt.Sprintf(" AND is_visible = $%d", argNum)
		args = append(args, *params.IsVisible)
		argNum++
	}

	var total int
	s.db.QueryRow(ctx, "SELECT COUNT(*) "+baseQuery, args...).Scan(&total)

	query := fmt.Sprintf(`SELECT id, name, logo_svg, website, sort_order, is_visible, created_at, updated_at %s ORDER BY sort_order DESC, created_at DESC LIMIT $%d OFFSET $%d`, baseQuery, argNum, argNum+1)
	args = append(args, params.PageSize, offset)

	rows, err := s.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var partners []Partner
	for rows.Next() {
		var p Partner
		rows.Scan(&p.ID, &p.Name, &p.LogoSVG, &p.Website, &p.SortOrder, &p.IsVisible, &p.CreatedAt, &p.UpdatedAt)
		partners = append(partners, p)
	}
	if partners == nil {
		partners = []Partner{}
	}

	return &ListResponse{Partners: partners, Total: total, Page: params.Page, PageSize: params.PageSize, TotalPages: (total + params.PageSize - 1) / params.PageSize}, nil
}

func (s *Service) ListPublic(ctx context.Context) ([]Partner, error) {
	rows, err := s.db.Query(ctx, `SELECT id, name, logo_svg, website, sort_order, is_visible, created_at, updated_at FROM partners WHERE is_visible = true ORDER BY sort_order DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var partners []Partner
	for rows.Next() {
		var p Partner
		rows.Scan(&p.ID, &p.Name, &p.LogoSVG, &p.Website, &p.SortOrder, &p.IsVisible, &p.CreatedAt, &p.UpdatedAt)
		partners = append(partners, p)
	}
	if partners == nil {
		partners = []Partner{}
	}
	return partners, nil
}

func (s *Service) GetByID(ctx context.Context, id int64) (*Partner, error) {
	var p Partner
	err := s.db.QueryRow(ctx, `SELECT id, name, logo_svg, website, sort_order, is_visible, created_at, updated_at FROM partners WHERE id = $1`, id).Scan(&p.ID, &p.Name, &p.LogoSVG, &p.Website, &p.SortOrder, &p.IsVisible, &p.CreatedAt, &p.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrPartnerNotFound
	}
	return &p, err
}

func (s *Service) Create(ctx context.Context, req *CreateRequest, userID int64, ip string) (*Partner, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}

	var p Partner
	err := s.db.QueryRow(ctx, `INSERT INTO partners (name, logo_svg, website, sort_order, is_visible) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, logo_svg, website, sort_order, is_visible, created_at, updated_at`,
		req.Name, req.LogoSVG, req.Website, req.SortOrder, req.IsVisible,
	).Scan(&p.ID, &p.Name, &p.LogoSVG, &p.Website, &p.SortOrder, &p.IsVisible, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}

	s.audit.LogAction(ctx, &userID, audit.ActionCreate, audit.EntityPartner, &p.ID, p, ip)
	return &p, nil
}

func (s *Service) Update(ctx context.Context, id int64, req *UpdateRequest, userID int64, ip string) (*Partner, error) {
	existing, err := s.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	setParts := []string{}
	args := []any{}
	argNum := 1

	if req.Name != nil {
		setParts = append(setParts, fmt.Sprintf("name = $%d", argNum))
		args = append(args, *req.Name)
		argNum++
	}
	if req.LogoSVG != nil {
		setParts = append(setParts, fmt.Sprintf("logo_svg = $%d", argNum))
		args = append(args, *req.LogoSVG)
		argNum++
	}
	if req.Website != nil {
		setParts = append(setParts, fmt.Sprintf("website = $%d", argNum))
		args = append(args, *req.Website)
		argNum++
	}
	if req.SortOrder != nil {
		setParts = append(setParts, fmt.Sprintf("sort_order = $%d", argNum))
		args = append(args, *req.SortOrder)
		argNum++
	}
	if req.IsVisible != nil {
		setParts = append(setParts, fmt.Sprintf("is_visible = $%d", argNum))
		args = append(args, *req.IsVisible)
		argNum++
	}

	if len(setParts) == 0 {
		return existing, nil
	}

	args = append(args, id)
	var p Partner
	err = s.db.QueryRow(ctx, fmt.Sprintf(`UPDATE partners SET %s WHERE id = $%d RETURNING id, name, logo_svg, website, sort_order, is_visible, created_at, updated_at`, strings.Join(setParts, ", "), argNum), args...).Scan(&p.ID, &p.Name, &p.LogoSVG, &p.Website, &p.SortOrder, &p.IsVisible, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}

	s.audit.LogAction(ctx, &userID, audit.ActionUpdate, audit.EntityPartner, &p.ID, map[string]any{"before": existing, "after": p}, ip)
	return &p, nil
}

func (s *Service) Delete(ctx context.Context, id int64, userID int64, ip string) error {
	existing, err := s.GetByID(ctx, id)
	if err != nil {
		return err
	}
	_, err = s.db.Exec(ctx, "DELETE FROM partners WHERE id = $1", id)
	if err != nil {
		return err
	}
	s.audit.LogAction(ctx, &userID, audit.ActionDelete, audit.EntityPartner, &id, existing, ip)
	return nil
}

func (s *Service) Reorder(ctx context.Context, ids []int64, userID int64, ip string) error {
	for i, id := range ids {
		s.db.Exec(ctx, "UPDATE partners SET sort_order = $1 WHERE id = $2", len(ids)-i, id)
	}
	s.audit.LogAction(ctx, &userID, audit.ActionUpdate, audit.EntityPartner, nil, map[string]any{"action": "reorder", "ids": ids}, ip)
	return nil
}

// Handler
type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	params := ListParams{Page: 1, PageSize: 50}
	if p, _ := strconv.Atoi(r.URL.Query().Get("page")); p > 0 {
		params.Page = p
	}
	if ps, _ := strconv.Atoi(r.URL.Query().Get("page_size")); ps > 0 {
		params.PageSize = ps
	}
	if vis := r.URL.Query().Get("is_visible"); vis != "" {
		v := vis == "true"
		params.IsVisible = &v
	}

	result, err := h.service.List(r.Context(), params)
	if err != nil {
		slog.Error("failed to list partners", "error", err)
		response.InternalError(w, "failed to list partners")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *Handler) ListPublic(w http.ResponseWriter, r *http.Request) {
	partners, err := h.service.ListPublic(r.Context())
	if err != nil {
		response.InternalError(w, "failed to list partners")
		return
	}
	response.JSON(w, http.StatusOK, partners)
}

func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	partner, err := h.service.GetByID(r.Context(), id)
	if errors.Is(err, ErrPartnerNotFound) {
		response.NotFound(w, "partner not found")
		return
	}
	if err != nil {
		response.InternalError(w, "failed to get partner")
		return
	}
	response.JSON(w, http.StatusOK, partner)
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	var req CreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}
	userID, _ := auth.GetUserIDFromContext(r.Context())
	partner, err := h.service.Create(r.Context(), &req, userID, r.RemoteAddr)
	if errors.Is(err, ErrNameRequired) {
		response.ValidationError(w, err.Error())
		return
	}
	if err != nil {
		response.InternalError(w, "failed to create partner")
		return
	}
	response.JSON(w, http.StatusCreated, partner)
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	var req UpdateRequest
	json.NewDecoder(r.Body).Decode(&req)
	userID, _ := auth.GetUserIDFromContext(r.Context())
	partner, err := h.service.Update(r.Context(), id, &req, userID, r.RemoteAddr)
	if errors.Is(err, ErrPartnerNotFound) {
		response.NotFound(w, "partner not found")
		return
	}
	if err != nil {
		response.InternalError(w, "failed to update partner")
		return
	}
	response.JSON(w, http.StatusOK, partner)
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	userID, _ := auth.GetUserIDFromContext(r.Context())
	if err := h.service.Delete(r.Context(), id, userID, r.RemoteAddr); err != nil {
		if errors.Is(err, ErrPartnerNotFound) {
			response.NotFound(w, "partner not found")
			return
		}
		response.InternalError(w, "failed to delete partner")
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"message": "partner deleted"})
}

func (h *Handler) Reorder(w http.ResponseWriter, r *http.Request) {
	var req ReorderRequest
	json.NewDecoder(r.Body).Decode(&req)
	userID, _ := auth.GetUserIDFromContext(r.Context())
	h.service.Reorder(r.Context(), req.IDs, userID, r.RemoteAddr)
	response.JSON(w, http.StatusOK, map[string]string{"message": "reordered"})
}
