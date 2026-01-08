package blog

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
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/itam-misis/itam-api/internal/audit"
	"github.com/itam-misis/itam-api/internal/auth"
	"github.com/itam-misis/itam-api/internal/response"
	"github.com/itam-misis/itam-api/internal/slug"
)

var (
	ErrPostNotFound  = errors.New("blog post not found")
	ErrTitleRequired = errors.New("title is required")
	ErrSlugExists    = errors.New("slug already exists")
)

type Post struct {
	ID          int64           `json:"id"`
	Title       string          `json:"title"`
	Slug        string          `json:"slug"`
	ContentJSON json.RawMessage `json:"content_json,omitempty"`
	ContentHTML *string         `json:"content_html,omitempty"`
	CoverImage  *string         `json:"cover_image"`
	PublishedAt *time.Time      `json:"published_at"`
	IsPublished bool            `json:"is_published"`
	SortOrder   int             `json:"sort_order"`
	CreatedAt   time.Time       `json:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at"`
}

type CreateRequest struct {
	Title       string          `json:"title"`
	Slug        string          `json:"slug,omitempty"`
	ContentJSON json.RawMessage `json:"content_json"`
	ContentHTML *string         `json:"content_html"`
	CoverImage  *string         `json:"cover_image"`
	IsPublished bool            `json:"is_published"`
	SortOrder   int             `json:"sort_order"`
}

func (r *CreateRequest) Validate() error {
	if r.Title == "" {
		return ErrTitleRequired
	}
	return nil
}

type UpdateRequest struct {
	Title       *string          `json:"title,omitempty"`
	Slug        *string          `json:"slug,omitempty"`
	ContentJSON *json.RawMessage `json:"content_json,omitempty"`
	ContentHTML *string          `json:"content_html,omitempty"`
	CoverImage  *string          `json:"cover_image,omitempty"`
	IsPublished *bool            `json:"is_published,omitempty"`
	SortOrder   *int             `json:"sort_order,omitempty"`
}

type ListParams struct {
	Page        int
	PageSize    int
	Search      string
	IsPublished *bool
}

type ListResponse struct {
	Posts      []Post `json:"posts"`
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
	baseQuery := "FROM blog_posts WHERE 1=1"
	var args []any
	argNum := 1

	if params.Search != "" {
		baseQuery += fmt.Sprintf(" AND title ILIKE $%d", argNum)
		args = append(args, "%"+params.Search+"%")
		argNum++
	}
	if params.IsPublished != nil {
		baseQuery += fmt.Sprintf(" AND is_published = $%d", argNum)
		args = append(args, *params.IsPublished)
		argNum++
	}

	var total int
	s.db.QueryRow(ctx, "SELECT COUNT(*) "+baseQuery, args...).Scan(&total)

	query := fmt.Sprintf(`SELECT id, title, slug, content_json, content_html, cover_image, published_at, is_published, sort_order, created_at, updated_at %s ORDER BY sort_order DESC, published_at DESC NULLS LAST LIMIT $%d OFFSET $%d`, baseQuery, argNum, argNum+1)
	args = append(args, params.PageSize, offset)

	rows, err := s.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []Post
	for rows.Next() {
		var p Post
		rows.Scan(&p.ID, &p.Title, &p.Slug, &p.ContentJSON, &p.ContentHTML, &p.CoverImage, &p.PublishedAt, &p.IsPublished, &p.SortOrder, &p.CreatedAt, &p.UpdatedAt)
		posts = append(posts, p)
	}
	if posts == nil {
		posts = []Post{}
	}

	return &ListResponse{Posts: posts, Total: total, Page: params.Page, PageSize: params.PageSize, TotalPages: (total + params.PageSize - 1) / params.PageSize}, nil
}

func (s *Service) ListPublic(ctx context.Context) ([]Post, error) {
	rows, err := s.db.Query(ctx, `SELECT id, title, slug, content_html, cover_image, published_at, is_published, sort_order, created_at, updated_at FROM blog_posts WHERE is_published = true ORDER BY sort_order DESC, published_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []Post
	for rows.Next() {
		var p Post
		rows.Scan(&p.ID, &p.Title, &p.Slug, &p.ContentHTML, &p.CoverImage, &p.PublishedAt, &p.IsPublished, &p.SortOrder, &p.CreatedAt, &p.UpdatedAt)
		posts = append(posts, p)
	}
	if posts == nil {
		posts = []Post{}
	}
	return posts, nil
}

func (s *Service) GetByID(ctx context.Context, id int64) (*Post, error) {
	var p Post
	err := s.db.QueryRow(ctx, `SELECT id, title, slug, content_json, content_html, cover_image, published_at, is_published, sort_order, created_at, updated_at FROM blog_posts WHERE id = $1`, id).Scan(&p.ID, &p.Title, &p.Slug, &p.ContentJSON, &p.ContentHTML, &p.CoverImage, &p.PublishedAt, &p.IsPublished, &p.SortOrder, &p.CreatedAt, &p.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrPostNotFound
	}
	return &p, err
}

func (s *Service) GetBySlug(ctx context.Context, postSlug string) (*Post, error) {
	var p Post
	err := s.db.QueryRow(ctx, `SELECT id, title, slug, content_json, content_html, cover_image, published_at, is_published, sort_order, created_at, updated_at FROM blog_posts WHERE slug = $1 AND is_published = true`, postSlug).Scan(&p.ID, &p.Title, &p.Slug, &p.ContentJSON, &p.ContentHTML, &p.CoverImage, &p.PublishedAt, &p.IsPublished, &p.SortOrder, &p.CreatedAt, &p.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrPostNotFound
	}
	return &p, err
}

func (s *Service) Create(ctx context.Context, req *CreateRequest, userID int64, ip string) (*Post, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}

	postSlug := req.Slug
	if postSlug == "" {
		postSlug = slug.Generate(req.Title)
	}

	var publishedAt *time.Time
	if req.IsPublished {
		now := time.Now()
		publishedAt = &now
	}

	var p Post
	err := s.db.QueryRow(ctx, `INSERT INTO blog_posts (title, slug, content_json, content_html, cover_image, published_at, is_published, sort_order) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, title, slug, content_json, content_html, cover_image, published_at, is_published, sort_order, created_at, updated_at`,
		req.Title, postSlug, req.ContentJSON, req.ContentHTML, req.CoverImage, publishedAt, req.IsPublished, req.SortOrder,
	).Scan(&p.ID, &p.Title, &p.Slug, &p.ContentJSON, &p.ContentHTML, &p.CoverImage, &p.PublishedAt, &p.IsPublished, &p.SortOrder, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return nil, ErrSlugExists
		}
		return nil, err
	}

	s.audit.LogAction(ctx, &userID, audit.ActionCreate, audit.EntityBlog, &p.ID, p, ip)
	return &p, nil
}

func (s *Service) Update(ctx context.Context, id int64, req *UpdateRequest, userID int64, ip string) (*Post, error) {
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
	if req.Slug != nil {
		setParts = append(setParts, fmt.Sprintf("slug = $%d", argNum))
		args = append(args, *req.Slug)
		argNum++
	}
	if req.ContentJSON != nil {
		setParts = append(setParts, fmt.Sprintf("content_json = $%d", argNum))
		args = append(args, *req.ContentJSON)
		argNum++
	}
	if req.ContentHTML != nil {
		setParts = append(setParts, fmt.Sprintf("content_html = $%d", argNum))
		args = append(args, *req.ContentHTML)
		argNum++
	}
	if req.CoverImage != nil {
		setParts = append(setParts, fmt.Sprintf("cover_image = $%d", argNum))
		args = append(args, *req.CoverImage)
		argNum++
	}
	if req.IsPublished != nil {
		setParts = append(setParts, fmt.Sprintf("is_published = $%d", argNum))
		args = append(args, *req.IsPublished)
		argNum++
		// Set published_at if publishing
		if *req.IsPublished && existing.PublishedAt == nil {
			setParts = append(setParts, fmt.Sprintf("published_at = $%d", argNum))
			args = append(args, time.Now())
			argNum++
		}
	}
	if req.SortOrder != nil {
		setParts = append(setParts, fmt.Sprintf("sort_order = $%d", argNum))
		args = append(args, *req.SortOrder)
		argNum++
	}

	if len(setParts) == 0 {
		return existing, nil
	}

	args = append(args, id)
	var p Post
	err = s.db.QueryRow(ctx, fmt.Sprintf(`UPDATE blog_posts SET %s WHERE id = $%d RETURNING id, title, slug, content_json, content_html, cover_image, published_at, is_published, sort_order, created_at, updated_at`, strings.Join(setParts, ", "), argNum), args...).Scan(&p.ID, &p.Title, &p.Slug, &p.ContentJSON, &p.ContentHTML, &p.CoverImage, &p.PublishedAt, &p.IsPublished, &p.SortOrder, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return nil, ErrSlugExists
		}
		return nil, err
	}

	s.audit.LogAction(ctx, &userID, audit.ActionUpdate, audit.EntityBlog, &p.ID, map[string]any{"before": existing, "after": p}, ip)
	return &p, nil
}

func (s *Service) Delete(ctx context.Context, id int64, userID int64, ip string) error {
	existing, err := s.GetByID(ctx, id)
	if err != nil {
		return err
	}
	_, err = s.db.Exec(ctx, "DELETE FROM blog_posts WHERE id = $1", id)
	if err != nil {
		return err
	}
	s.audit.LogAction(ctx, &userID, audit.ActionDelete, audit.EntityBlog, &id, existing, ip)
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
	if pub := r.URL.Query().Get("is_published"); pub != "" {
		v := pub == "true"
		params.IsPublished = &v
	}

	result, err := h.service.List(r.Context(), params)
	if err != nil {
		slog.Error("failed to list blog posts", "error", err)
		response.InternalError(w, "failed to list blog posts")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *Handler) ListPublic(w http.ResponseWriter, r *http.Request) {
	posts, err := h.service.ListPublic(r.Context())
	if err != nil {
		response.InternalError(w, "failed to list blog posts")
		return
	}
	response.JSON(w, http.StatusOK, posts)
}

func (h *Handler) GetPublicBySlug(w http.ResponseWriter, r *http.Request) {
	postSlug := chi.URLParam(r, "slug")
	post, err := h.service.GetBySlug(r.Context(), postSlug)
	if errors.Is(err, ErrPostNotFound) {
		response.NotFound(w, "blog post not found")
		return
	}
	if err != nil {
		response.InternalError(w, "failed to get blog post")
		return
	}
	response.JSON(w, http.StatusOK, post)
}

func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	post, err := h.service.GetByID(r.Context(), id)
	if errors.Is(err, ErrPostNotFound) {
		response.NotFound(w, "blog post not found")
		return
	}
	if err != nil {
		response.InternalError(w, "failed to get blog post")
		return
	}
	response.JSON(w, http.StatusOK, post)
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	var req CreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}
	userID, _ := auth.GetUserIDFromContext(r.Context())
	post, err := h.service.Create(r.Context(), &req, userID, r.RemoteAddr)
	if err != nil {
		if errors.Is(err, ErrTitleRequired) {
			response.ValidationError(w, err.Error())
			return
		}
		if errors.Is(err, ErrSlugExists) {
			response.Conflict(w, err.Error())
			return
		}
		response.InternalError(w, "failed to create blog post")
		return
	}
	response.JSON(w, http.StatusCreated, post)
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	var req UpdateRequest
	json.NewDecoder(r.Body).Decode(&req)
	userID, _ := auth.GetUserIDFromContext(r.Context())
	post, err := h.service.Update(r.Context(), id, &req, userID, r.RemoteAddr)
	if errors.Is(err, ErrPostNotFound) {
		response.NotFound(w, "blog post not found")
		return
	}
	if errors.Is(err, ErrSlugExists) {
		response.Conflict(w, err.Error())
		return
	}
	if err != nil {
		response.InternalError(w, "failed to update blog post")
		return
	}
	response.JSON(w, http.StatusOK, post)
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	userID, _ := auth.GetUserIDFromContext(r.Context())
	if err := h.service.Delete(r.Context(), id, userID, r.RemoteAddr); err != nil {
		if errors.Is(err, ErrPostNotFound) {
			response.NotFound(w, "blog post not found")
			return
		}
		response.InternalError(w, "failed to delete blog post")
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"message": "blog post deleted"})
}
