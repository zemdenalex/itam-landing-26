package clubs

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
	ErrClubNotFound = errors.New("club not found")
	ErrNameRequired = errors.New("name is required")
	ErrSlugExists   = errors.New("slug already exists")
)

type Club struct {
	ID           int64       `json:"id"`
	Name         string      `json:"name"`
	Slug         string      `json:"slug"`
	Description  *string     `json:"description"`
	Goal         *string     `json:"goal"`
	CoverImage   *string     `json:"cover_image"`
	ChatLink     *string     `json:"chat_link"`
	ChannelLink  *string     `json:"channel_link"`
	MembersCount int         `json:"members_count"`
	EventsCount  int         `json:"events_count"`
	WinsCount    int         `json:"wins_count"`
	SortOrder    int         `json:"sort_order"`
	IsVisible    bool        `json:"is_visible"`
	Images       []ClubImage `json:"images"`
	CreatedAt    time.Time   `json:"created_at"`
	UpdatedAt    time.Time   `json:"updated_at"`
}

type ClubImage struct {
	ID        int64  `json:"id"`
	ImageURL  string `json:"image_url"`
	SortOrder int    `json:"sort_order"`
}

type CreateRequest struct {
	Name         string   `json:"name"`
	Slug         string   `json:"slug,omitempty"`
	Description  *string  `json:"description"`
	Goal         *string  `json:"goal"`
	CoverImage   *string  `json:"cover_image"`
	ChatLink     *string  `json:"chat_link"`
	ChannelLink  *string  `json:"channel_link"`
	MembersCount int      `json:"members_count"`
	EventsCount  int      `json:"events_count"`
	WinsCount    int      `json:"wins_count"`
	SortOrder    int      `json:"sort_order"`
	IsVisible    bool     `json:"is_visible"`
	ImageURLs    []string `json:"image_urls"`
}

func (r *CreateRequest) Validate() error {
	if r.Name == "" {
		return ErrNameRequired
	}
	return nil
}

type UpdateRequest struct {
	Name         *string  `json:"name,omitempty"`
	Slug         *string  `json:"slug,omitempty"`
	Description  *string  `json:"description,omitempty"`
	Goal         *string  `json:"goal,omitempty"`
	CoverImage   *string  `json:"cover_image,omitempty"`
	ChatLink     *string  `json:"chat_link,omitempty"`
	ChannelLink  *string  `json:"channel_link,omitempty"`
	MembersCount *int     `json:"members_count,omitempty"`
	EventsCount  *int     `json:"events_count,omitempty"`
	WinsCount    *int     `json:"wins_count,omitempty"`
	SortOrder    *int     `json:"sort_order,omitempty"`
	IsVisible    *bool    `json:"is_visible,omitempty"`
	ImageURLs    []string `json:"image_urls,omitempty"`
}

type ListParams struct {
	Page      int
	PageSize  int
	Search    string
	IsVisible *bool
}

type ListResponse struct {
	Clubs      []Club `json:"clubs"`
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
	baseQuery := "FROM clubs WHERE 1=1"
	var args []any
	argNum := 1

	if params.Search != "" {
		baseQuery += fmt.Sprintf(" AND (name ILIKE $%d OR description ILIKE $%d)", argNum, argNum)
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

	query := fmt.Sprintf(`SELECT id, name, slug, description, goal, cover_image, chat_link, channel_link, members_count, events_count, wins_count, sort_order, is_visible, created_at, updated_at %s ORDER BY sort_order DESC LIMIT $%d OFFSET $%d`, baseQuery, argNum, argNum+1)
	args = append(args, params.PageSize, offset)

	rows, err := s.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var clubs []Club
	for rows.Next() {
		var c Club
		rows.Scan(&c.ID, &c.Name, &c.Slug, &c.Description, &c.Goal, &c.CoverImage, &c.ChatLink, &c.ChannelLink, &c.MembersCount, &c.EventsCount, &c.WinsCount, &c.SortOrder, &c.IsVisible, &c.CreatedAt, &c.UpdatedAt)
		c.Images, _ = s.getClubImages(ctx, c.ID)
		clubs = append(clubs, c)
	}
	if clubs == nil {
		clubs = []Club{}
	}

	return &ListResponse{Clubs: clubs, Total: total, Page: params.Page, PageSize: params.PageSize, TotalPages: (total + params.PageSize - 1) / params.PageSize}, nil
}

func (s *Service) ListPublic(ctx context.Context) ([]Club, error) {
	rows, err := s.db.Query(ctx, `SELECT id, name, slug, description, goal, cover_image, chat_link, channel_link, members_count, events_count, wins_count, sort_order, is_visible, created_at, updated_at FROM clubs WHERE is_visible = true ORDER BY sort_order DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var clubs []Club
	for rows.Next() {
		var c Club
		rows.Scan(&c.ID, &c.Name, &c.Slug, &c.Description, &c.Goal, &c.CoverImage, &c.ChatLink, &c.ChannelLink, &c.MembersCount, &c.EventsCount, &c.WinsCount, &c.SortOrder, &c.IsVisible, &c.CreatedAt, &c.UpdatedAt)
		c.Images, _ = s.getClubImages(ctx, c.ID)
		clubs = append(clubs, c)
	}
	if clubs == nil {
		clubs = []Club{}
	}
	return clubs, nil
}

func (s *Service) GetByID(ctx context.Context, id int64) (*Club, error) {
	var c Club
	err := s.db.QueryRow(ctx, `SELECT id, name, slug, description, goal, cover_image, chat_link, channel_link, members_count, events_count, wins_count, sort_order, is_visible, created_at, updated_at FROM clubs WHERE id = $1`, id).Scan(&c.ID, &c.Name, &c.Slug, &c.Description, &c.Goal, &c.CoverImage, &c.ChatLink, &c.ChannelLink, &c.MembersCount, &c.EventsCount, &c.WinsCount, &c.SortOrder, &c.IsVisible, &c.CreatedAt, &c.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrClubNotFound
	}
	if err != nil {
		return nil, err
	}
	c.Images, _ = s.getClubImages(ctx, c.ID)
	return &c, nil
}

func (s *Service) GetBySlug(ctx context.Context, clubSlug string) (*Club, error) {
	var c Club
	err := s.db.QueryRow(ctx, `SELECT id, name, slug, description, goal, cover_image, chat_link, channel_link, members_count, events_count, wins_count, sort_order, is_visible, created_at, updated_at FROM clubs WHERE slug = $1 AND is_visible = true`, clubSlug).Scan(&c.ID, &c.Name, &c.Slug, &c.Description, &c.Goal, &c.CoverImage, &c.ChatLink, &c.ChannelLink, &c.MembersCount, &c.EventsCount, &c.WinsCount, &c.SortOrder, &c.IsVisible, &c.CreatedAt, &c.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrClubNotFound
	}
	if err != nil {
		return nil, err
	}
	c.Images, _ = s.getClubImages(ctx, c.ID)
	return &c, nil
}

func (s *Service) Create(ctx context.Context, req *CreateRequest, userID int64, ip string) (*Club, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}

	clubSlug := req.Slug
	if clubSlug == "" {
		clubSlug = slug.Generate(req.Name)
	}

	var c Club
	err := s.db.QueryRow(ctx, `INSERT INTO clubs (name, slug, description, goal, cover_image, chat_link, channel_link, members_count, events_count, wins_count, sort_order, is_visible) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id, name, slug, description, goal, cover_image, chat_link, channel_link, members_count, events_count, wins_count, sort_order, is_visible, created_at, updated_at`,
		req.Name, clubSlug, req.Description, req.Goal, req.CoverImage, req.ChatLink, req.ChannelLink, req.MembersCount, req.EventsCount, req.WinsCount, req.SortOrder, req.IsVisible,
	).Scan(&c.ID, &c.Name, &c.Slug, &c.Description, &c.Goal, &c.CoverImage, &c.ChatLink, &c.ChannelLink, &c.MembersCount, &c.EventsCount, &c.WinsCount, &c.SortOrder, &c.IsVisible, &c.CreatedAt, &c.UpdatedAt)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return nil, ErrSlugExists
		}
		return nil, err
	}

	// Add images
	for i, url := range req.ImageURLs {
		s.db.Exec(ctx, "INSERT INTO club_images (club_id, image_url, sort_order) VALUES ($1, $2, $3)", c.ID, url, i)
	}

	c.Images, _ = s.getClubImages(ctx, c.ID)
	s.audit.LogAction(ctx, &userID, audit.ActionCreate, audit.EntityClub, &c.ID, c, ip)
	return &c, nil
}

func (s *Service) Update(ctx context.Context, id int64, req *UpdateRequest, userID int64, ip string) (*Club, error) {
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
	if req.Slug != nil {
		setParts = append(setParts, fmt.Sprintf("slug = $%d", argNum))
		args = append(args, *req.Slug)
		argNum++
	}
	if req.Description != nil {
		setParts = append(setParts, fmt.Sprintf("description = $%d", argNum))
		args = append(args, *req.Description)
		argNum++
	}
	if req.Goal != nil {
		setParts = append(setParts, fmt.Sprintf("goal = $%d", argNum))
		args = append(args, *req.Goal)
		argNum++
	}
	if req.CoverImage != nil {
		setParts = append(setParts, fmt.Sprintf("cover_image = $%d", argNum))
		args = append(args, *req.CoverImage)
		argNum++
	}
	if req.ChatLink != nil {
		setParts = append(setParts, fmt.Sprintf("chat_link = $%d", argNum))
		args = append(args, *req.ChatLink)
		argNum++
	}
	if req.ChannelLink != nil {
		setParts = append(setParts, fmt.Sprintf("channel_link = $%d", argNum))
		args = append(args, *req.ChannelLink)
		argNum++
	}
	if req.MembersCount != nil {
		setParts = append(setParts, fmt.Sprintf("members_count = $%d", argNum))
		args = append(args, *req.MembersCount)
		argNum++
	}
	if req.EventsCount != nil {
		setParts = append(setParts, fmt.Sprintf("events_count = $%d", argNum))
		args = append(args, *req.EventsCount)
		argNum++
	}
	if req.WinsCount != nil {
		setParts = append(setParts, fmt.Sprintf("wins_count = $%d", argNum))
		args = append(args, *req.WinsCount)
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

	var c Club
	if len(setParts) > 0 {
		args = append(args, id)
		err = s.db.QueryRow(ctx, fmt.Sprintf(`UPDATE clubs SET %s WHERE id = $%d RETURNING id, name, slug, description, goal, cover_image, chat_link, channel_link, members_count, events_count, wins_count, sort_order, is_visible, created_at, updated_at`, strings.Join(setParts, ", "), argNum), args...).Scan(&c.ID, &c.Name, &c.Slug, &c.Description, &c.Goal, &c.CoverImage, &c.ChatLink, &c.ChannelLink, &c.MembersCount, &c.EventsCount, &c.WinsCount, &c.SortOrder, &c.IsVisible, &c.CreatedAt, &c.UpdatedAt)
		if err != nil {
			var pgErr *pgconn.PgError
			if errors.As(err, &pgErr) && pgErr.Code == "23505" {
				return nil, ErrSlugExists
			}
			return nil, err
		}
	} else {
		c = *existing
	}

	// Update images if provided
	if req.ImageURLs != nil {
		s.db.Exec(ctx, "DELETE FROM club_images WHERE club_id = $1", id)
		for i, url := range req.ImageURLs {
			s.db.Exec(ctx, "INSERT INTO club_images (club_id, image_url, sort_order) VALUES ($1, $2, $3)", id, url, i)
		}
	}

	c.Images, _ = s.getClubImages(ctx, c.ID)
	s.audit.LogAction(ctx, &userID, audit.ActionUpdate, audit.EntityClub, &c.ID, map[string]any{"before": existing, "after": c}, ip)
	return &c, nil
}

func (s *Service) Delete(ctx context.Context, id int64, userID int64, ip string) error {
	existing, err := s.GetByID(ctx, id)
	if err != nil {
		return err
	}
	_, err = s.db.Exec(ctx, "DELETE FROM clubs WHERE id = $1", id)
	if err != nil {
		return err
	}
	s.audit.LogAction(ctx, &userID, audit.ActionDelete, audit.EntityClub, &id, existing, ip)
	return nil
}

func (s *Service) getClubImages(ctx context.Context, clubID int64) ([]ClubImage, error) {
	rows, err := s.db.Query(ctx, "SELECT id, image_url, sort_order FROM club_images WHERE club_id = $1 ORDER BY sort_order", clubID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var images []ClubImage
	for rows.Next() {
		var img ClubImage
		rows.Scan(&img.ID, &img.ImageURL, &img.SortOrder)
		images = append(images, img)
	}
	if images == nil {
		images = []ClubImage{}
	}
	return images, nil
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
		slog.Error("failed to list clubs", "error", err)
		response.InternalError(w, "failed to list clubs")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *Handler) ListPublic(w http.ResponseWriter, r *http.Request) {
	clubs, err := h.service.ListPublic(r.Context())
	if err != nil {
		response.InternalError(w, "failed to list clubs")
		return
	}
	response.JSON(w, http.StatusOK, clubs)
}

func (h *Handler) GetPublicBySlug(w http.ResponseWriter, r *http.Request) {
	clubSlug := chi.URLParam(r, "slug")
	club, err := h.service.GetBySlug(r.Context(), clubSlug)
	if errors.Is(err, ErrClubNotFound) {
		response.NotFound(w, "club not found")
		return
	}
	if err != nil {
		response.InternalError(w, "failed to get club")
		return
	}
	response.JSON(w, http.StatusOK, club)
}

func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	club, err := h.service.GetByID(r.Context(), id)
	if errors.Is(err, ErrClubNotFound) {
		response.NotFound(w, "club not found")
		return
	}
	if err != nil {
		response.InternalError(w, "failed to get club")
		return
	}
	response.JSON(w, http.StatusOK, club)
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	var req CreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}
	userID, _ := auth.GetUserIDFromContext(r.Context())
	club, err := h.service.Create(r.Context(), &req, userID, r.RemoteAddr)
	if err != nil {
		if errors.Is(err, ErrNameRequired) {
			response.ValidationError(w, err.Error())
			return
		}
		if errors.Is(err, ErrSlugExists) {
			response.Conflict(w, err.Error())
			return
		}
		response.InternalError(w, "failed to create club")
		return
	}
	response.JSON(w, http.StatusCreated, club)
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	var req UpdateRequest
	json.NewDecoder(r.Body).Decode(&req)
	userID, _ := auth.GetUserIDFromContext(r.Context())
	club, err := h.service.Update(r.Context(), id, &req, userID, r.RemoteAddr)
	if errors.Is(err, ErrClubNotFound) {
		response.NotFound(w, "club not found")
		return
	}
	if errors.Is(err, ErrSlugExists) {
		response.Conflict(w, err.Error())
		return
	}
	if err != nil {
		response.InternalError(w, "failed to update club")
		return
	}
	response.JSON(w, http.StatusOK, club)
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	userID, _ := auth.GetUserIDFromContext(r.Context())
	if err := h.service.Delete(r.Context(), id, userID, r.RemoteAddr); err != nil {
		if errors.Is(err, ErrClubNotFound) {
			response.NotFound(w, "club not found")
			return
		}
		response.InternalError(w, "failed to delete club")
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"message": "club deleted"})
}
