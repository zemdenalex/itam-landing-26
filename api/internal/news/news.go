package news

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
	ErrNewsNotFound   = errors.New("news not found")
	ErrTitleRequired  = errors.New("title is required")
	ErrSourceRequired = errors.New("source is required")
)

type News struct {
	ID            int64      `json:"id"`
	Title         string     `json:"title"`
	Source        string     `json:"source"`
	SourceLink    *string    `json:"source_link"`
	Image         *string    `json:"image"`
	PublishedDate *time.Time `json:"published_date"`
	SortOrder     int        `json:"sort_order"`
	IsVisible     bool       `json:"is_visible"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

type CreateRequest struct {
	Title         string  `json:"title"`
	Source        string  `json:"source"`
	SourceLink    *string `json:"source_link"`
	Image         *string `json:"image"`
	PublishedDate *string `json:"published_date"`
	SortOrder     int     `json:"sort_order"`
	IsVisible     bool    `json:"is_visible"`
}

func (r *CreateRequest) Validate() error {
	if r.Title == "" {
		return ErrTitleRequired
	}
	if r.Source == "" {
		return ErrSourceRequired
	}
	return nil
}

type UpdateRequest struct {
	Title         *string `json:"title,omitempty"`
	Source        *string `json:"source,omitempty"`
	SourceLink    *string `json:"source_link,omitempty"`
	Image         *string `json:"image,omitempty"`
	PublishedDate *string `json:"published_date,omitempty"`
	SortOrder     *int    `json:"sort_order,omitempty"`
	IsVisible     *bool   `json:"is_visible,omitempty"`
}

type ListParams struct {
	Page      int
	PageSize  int
	Search    string
	IsVisible *bool
}

type ListResponse struct {
	News       []News `json:"news"`
	Total      int    `json:"total"`
	Page       int    `json:"page"`
	PageSize   int    `json:"page_size"`
	TotalPages int    `json:"total_pages"`
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
	baseQuery := "FROM news WHERE 1=1"
	var args []any
	argNum := 1

	if params.Search != "" {
		baseQuery += fmt.Sprintf(" AND (title ILIKE $%d OR source ILIKE $%d)", argNum, argNum)
		args = append(args, "%"+params.Search+"%")
		argNum++
	}
	if params.IsVisible != nil {
		baseQuery += fmt.Sprintf(" AND is_visible = $%d", argNum)
		args = append(args, *params.IsVisible)
		argNum++
	}

	var total int
	s.db.QueryRow(ctx, "SELECT COUNT(*) "+baseQuery, args...).Scan(&total)

	query := fmt.Sprintf(`SELECT id, title, source, source_link, image, published_date, sort_order, is_visible, created_at, updated_at %s ORDER BY sort_order DESC, published_date DESC NULLS LAST LIMIT $%d OFFSET $%d`, baseQuery, argNum, argNum+1)
	args = append(args, params.PageSize, offset)

	rows, err := s.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var news []News
	for rows.Next() {
		var n News
		rows.Scan(&n.ID, &n.Title, &n.Source, &n.SourceLink, &n.Image, &n.PublishedDate, &n.SortOrder, &n.IsVisible, &n.CreatedAt, &n.UpdatedAt)
		news = append(news, n)
	}
	if news == nil {
		news = []News{}
	}

	return &ListResponse{News: news, Total: total, Page: params.Page, PageSize: params.PageSize, TotalPages: (total + params.PageSize - 1) / params.PageSize}, nil
}

func (s *Service) ListPublic(ctx context.Context) ([]News, error) {
	rows, err := s.db.Query(ctx, `SELECT id, title, source, source_link, image, published_date, sort_order, is_visible, created_at, updated_at FROM news WHERE is_visible = true ORDER BY sort_order DESC, published_date DESC NULLS LAST`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var news []News
	for rows.Next() {
		var n News
		rows.Scan(&n.ID, &n.Title, &n.Source, &n.SourceLink, &n.Image, &n.PublishedDate, &n.SortOrder, &n.IsVisible, &n.CreatedAt, &n.UpdatedAt)
		news = append(news, n)
	}
	if news == nil {
		news = []News{}
	}
	return news, nil
}

func (s *Service) GetByID(ctx context.Context, id int64) (*News, error) {
	var n News
	err := s.db.QueryRow(ctx, `SELECT id, title, source, source_link, image, published_date, sort_order, is_visible, created_at, updated_at FROM news WHERE id = $1`, id).Scan(&n.ID, &n.Title, &n.Source, &n.SourceLink, &n.Image, &n.PublishedDate, &n.SortOrder, &n.IsVisible, &n.CreatedAt, &n.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNewsNotFound
	}
	return &n, err
}

func (s *Service) Create(ctx context.Context, req *CreateRequest, userID int64, ip string) (*News, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}

	var pubDate *time.Time
	if req.PublishedDate != nil && *req.PublishedDate != "" {
		if t, err := time.Parse("2006-01-02", *req.PublishedDate); err == nil {
			pubDate = &t
		}
	}

	var n News
	err := s.db.QueryRow(ctx, `INSERT INTO news (title, source, source_link, image, published_date, sort_order, is_visible) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, title, source, source_link, image, published_date, sort_order, is_visible, created_at, updated_at`,
		req.Title, req.Source, req.SourceLink, req.Image, pubDate, req.SortOrder, req.IsVisible,
	).Scan(&n.ID, &n.Title, &n.Source, &n.SourceLink, &n.Image, &n.PublishedDate, &n.SortOrder, &n.IsVisible, &n.CreatedAt, &n.UpdatedAt)
	if err != nil {
		return nil, err
	}

	s.audit.LogAction(ctx, &userID, audit.ActionCreate, audit.EntityNews, &n.ID, n, ip)
	return &n, nil
}

func (s *Service) Update(ctx context.Context, id int64, req *UpdateRequest, userID int64, ip string) (*News, error) {
	existing, err := s.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	setParts := []string{}
	args := []any{}
	argNum := 1

	if req.Title != nil {
		setParts = append(setParts, fmt.Sprintf("title = $%d", argNum))
		args = append(args, *req.Title)
		argNum++
	}
	if req.Source != nil {
		setParts = append(setParts, fmt.Sprintf("source = $%d", argNum))
		args = append(args, *req.Source)
		argNum++
	}
	if req.SourceLink != nil {
		setParts = append(setParts, fmt.Sprintf("source_link = $%d", argNum))
		args = append(args, *req.SourceLink)
		argNum++
	}
	if req.Image != nil {
		setParts = append(setParts, fmt.Sprintf("image = $%d", argNum))
		args = append(args, *req.Image)
		argNum++
	}
	if req.PublishedDate != nil {
		var pubDate *time.Time
		if *req.PublishedDate != "" {
			if t, err := time.Parse("2006-01-02", *req.PublishedDate); err == nil {
				pubDate = &t
			}
		}
		setParts = append(setParts, fmt.Sprintf("published_date = $%d", argNum))
		args = append(args, pubDate)
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
	var n News
	err = s.db.QueryRow(ctx, fmt.Sprintf(`UPDATE news SET %s WHERE id = $%d RETURNING id, title, source, source_link, image, published_date, sort_order, is_visible, created_at, updated_at`, strings.Join(setParts, ", "), argNum), args...).Scan(&n.ID, &n.Title, &n.Source, &n.SourceLink, &n.Image, &n.PublishedDate, &n.SortOrder, &n.IsVisible, &n.CreatedAt, &n.UpdatedAt)
	if err != nil {
		return nil, err
	}

	s.audit.LogAction(ctx, &userID, audit.ActionUpdate, audit.EntityNews, &n.ID, map[string]any{"before": existing, "after": n}, ip)
	return &n, nil
}

func (s *Service) Delete(ctx context.Context, id int64, userID int64, ip string) error {
	existing, err := s.GetByID(ctx, id)
	if err != nil {
		return err
	}
	_, err = s.db.Exec(ctx, "DELETE FROM news WHERE id = $1", id)
	if err != nil {
		return err
	}
	s.audit.LogAction(ctx, &userID, audit.ActionDelete, audit.EntityNews, &id, existing, ip)
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
	params := ListParams{Search: r.URL.Query().Get("search"), Page: 1, PageSize: 20}
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
		slog.Error("failed to list news", "error", err)
		response.InternalError(w, "failed to list news")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *Handler) ListPublic(w http.ResponseWriter, r *http.Request) {
	news, err := h.service.ListPublic(r.Context())
	if err != nil {
		slog.Error("failed to list public news", "error", err)
		response.InternalError(w, "failed to list news")
		return
	}
	response.JSON(w, http.StatusOK, news)
}

func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	news, err := h.service.GetByID(r.Context(), id)
	if errors.Is(err, ErrNewsNotFound) {
		response.NotFound(w, "news not found")
		return
	}
	if err != nil {
		response.InternalError(w, "failed to get news")
		return
	}
	response.JSON(w, http.StatusOK, news)
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	var req CreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}
	userID, _ := auth.GetUserIDFromContext(r.Context())
	news, err := h.service.Create(r.Context(), &req, userID, r.RemoteAddr)
	if err != nil {
		if errors.Is(err, ErrTitleRequired) || errors.Is(err, ErrSourceRequired) {
			response.ValidationError(w, err.Error())
			return
		}
		response.InternalError(w, "failed to create news")
		return
	}
	response.JSON(w, http.StatusCreated, news)
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	var req UpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}
	userID, _ := auth.GetUserIDFromContext(r.Context())
	news, err := h.service.Update(r.Context(), id, &req, userID, r.RemoteAddr)
	if errors.Is(err, ErrNewsNotFound) {
		response.NotFound(w, "news not found")
		return
	}
	if err != nil {
		response.InternalError(w, "failed to update news")
		return
	}
	response.JSON(w, http.StatusOK, news)
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	userID, _ := auth.GetUserIDFromContext(r.Context())
	if err := h.service.Delete(r.Context(), id, userID, r.RemoteAddr); err != nil {
		if errors.Is(err, ErrNewsNotFound) {
			response.NotFound(w, "news not found")
			return
		}
		response.InternalError(w, "failed to delete news")
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"message": "news deleted"})
}
