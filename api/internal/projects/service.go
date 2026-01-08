package projects

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/itam-misis/itam-api/internal/audit"
	"github.com/itam-misis/itam-api/internal/slug"
)

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
	baseQuery := "FROM projects WHERE 1=1"
	var args []any
	argNum := 1

	if params.Search != "" {
		baseQuery += fmt.Sprintf(" AND (title ILIKE $%d OR description ILIKE $%d)", argNum, argNum)
		args = append(args, "%"+params.Search+"%")
		argNum++
	}

	if params.IsPublished != nil {
		baseQuery += fmt.Sprintf(" AND is_published = $%d", argNum)
		args = append(args, *params.IsPublished)
		argNum++
	}

	var total int
	if err := s.db.QueryRow(ctx, "SELECT COUNT(*) "+baseQuery, args...).Scan(&total); err != nil {
		return nil, err
	}

	query := fmt.Sprintf(`SELECT id, title, slug, description, cover_image, sort_order, is_published, created_at, updated_at %s ORDER BY sort_order DESC, created_at DESC LIMIT $%d OFFSET $%d`, baseQuery, argNum, argNum+1)
	args = append(args, params.PageSize, offset)

	rows, err := s.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var projects []Project
	for rows.Next() {
		var p Project
		if err := rows.Scan(&p.ID, &p.Title, &p.Slug, &p.Description, &p.CoverImage, &p.SortOrder, &p.IsPublished, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		p.Tags, _ = s.getProjectTags(ctx, p.ID)
		projects = append(projects, p)
	}

	if projects == nil {
		projects = []Project{}
	}

	return &ListResponse{
		Projects:   projects,
		Total:      total,
		Page:       params.Page,
		PageSize:   params.PageSize,
		TotalPages: (total + params.PageSize - 1) / params.PageSize,
	}, nil
}

func (s *Service) ListPublic(ctx context.Context) ([]Project, error) {
	rows, err := s.db.Query(ctx, `SELECT id, title, slug, description, cover_image, sort_order, is_published, created_at, updated_at FROM projects WHERE is_published = true ORDER BY sort_order DESC, created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var projects []Project
	for rows.Next() {
		var p Project
		if err := rows.Scan(&p.ID, &p.Title, &p.Slug, &p.Description, &p.CoverImage, &p.SortOrder, &p.IsPublished, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		p.Tags, _ = s.getProjectTags(ctx, p.ID)
		projects = append(projects, p)
	}

	if projects == nil {
		projects = []Project{}
	}
	return projects, nil
}

func (s *Service) GetByID(ctx context.Context, id int64) (*Project, error) {
	var p Project
	err := s.db.QueryRow(ctx, `SELECT id, title, slug, description, cover_image, sort_order, is_published, created_at, updated_at FROM projects WHERE id = $1`, id).Scan(&p.ID, &p.Title, &p.Slug, &p.Description, &p.CoverImage, &p.SortOrder, &p.IsPublished, &p.CreatedAt, &p.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrProjectNotFound
	}
	if err != nil {
		return nil, err
	}
	p.Tags, _ = s.getProjectTags(ctx, p.ID)
	return &p, nil
}

func (s *Service) Create(ctx context.Context, req *CreateRequest, userID int64, ip string) (*Project, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}

	projectSlug := req.Slug
	if projectSlug == "" {
		projectSlug = slug.Generate(req.Title)
	}

	var p Project
	err := s.db.QueryRow(ctx, `INSERT INTO projects (title, slug, description, cover_image, sort_order, is_published) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, title, slug, description, cover_image, sort_order, is_published, created_at, updated_at`,
		req.Title, projectSlug, req.Description, req.CoverImage, req.SortOrder, req.IsPublished,
	).Scan(&p.ID, &p.Title, &p.Slug, &p.Description, &p.CoverImage, &p.SortOrder, &p.IsPublished, &p.CreatedAt, &p.UpdatedAt)

	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return nil, ErrSlugExists
		}
		return nil, err
	}

	// Handle tags
	if err := s.syncTags(ctx, p.ID, req.TagIDs, req.TagNames); err != nil {
		return nil, err
	}

	p.Tags, _ = s.getProjectTags(ctx, p.ID)
	s.audit.LogAction(ctx, &userID, audit.ActionCreate, audit.EntityProject, &p.ID, p, ip)
	return &p, nil
}

func (s *Service) Update(ctx context.Context, id int64, req *UpdateRequest, userID int64, ip string) (*Project, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}

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
	if req.Description != nil {
		setParts = append(setParts, fmt.Sprintf("description = $%d", argNum))
		args = append(args, *req.Description)
		argNum++
	}
	if req.CoverImage != nil {
		setParts = append(setParts, fmt.Sprintf("cover_image = $%d", argNum))
		args = append(args, *req.CoverImage)
		argNum++
	}
	if req.SortOrder != nil {
		setParts = append(setParts, fmt.Sprintf("sort_order = $%d", argNum))
		args = append(args, *req.SortOrder)
		argNum++
	}
	if req.IsPublished != nil {
		setParts = append(setParts, fmt.Sprintf("is_published = $%d", argNum))
		args = append(args, *req.IsPublished)
		argNum++
	}

	var p Project
	if len(setParts) > 0 {
		args = append(args, id)
		query := fmt.Sprintf(`UPDATE projects SET %s WHERE id = $%d RETURNING id, title, slug, description, cover_image, sort_order, is_published, created_at, updated_at`, strings.Join(setParts, ", "), argNum)
		err = s.db.QueryRow(ctx, query, args...).Scan(&p.ID, &p.Title, &p.Slug, &p.Description, &p.CoverImage, &p.SortOrder, &p.IsPublished, &p.CreatedAt, &p.UpdatedAt)
		if err != nil {
			var pgErr *pgconn.PgError
			if errors.As(err, &pgErr) && pgErr.Code == "23505" {
				return nil, ErrSlugExists
			}
			return nil, err
		}
	} else {
		p = *existing
	}

	// Handle tags if provided
	if req.TagIDs != nil || req.TagNames != nil {
		tagIDs := req.TagIDs
		if tagIDs == nil {
			tagIDs = []int64{}
		}
		tagNames := req.TagNames
		if tagNames == nil {
			tagNames = []string{}
		}
		if err := s.syncTags(ctx, p.ID, tagIDs, tagNames); err != nil {
			return nil, err
		}
	}

	p.Tags, _ = s.getProjectTags(ctx, p.ID)
	s.audit.LogAction(ctx, &userID, audit.ActionUpdate, audit.EntityProject, &p.ID, map[string]any{"before": existing, "after": p}, ip)
	return &p, nil
}

func (s *Service) Delete(ctx context.Context, id int64, userID int64, ip string) error {
	existing, err := s.GetByID(ctx, id)
	if err != nil {
		return err
	}

	_, err = s.db.Exec(ctx, "DELETE FROM projects WHERE id = $1", id)
	if err != nil {
		return err
	}

	s.audit.LogAction(ctx, &userID, audit.ActionDelete, audit.EntityProject, &id, existing, ip)
	return nil
}

func (s *Service) Reorder(ctx context.Context, ids []int64, userID int64, ip string) error {
	for i, id := range ids {
		_, err := s.db.Exec(ctx, "UPDATE projects SET sort_order = $1 WHERE id = $2", len(ids)-i, id)
		if err != nil {
			return err
		}
	}
	s.audit.LogAction(ctx, &userID, audit.ActionUpdate, audit.EntityProject, nil, map[string]any{"action": "reorder", "ids": ids}, ip)
	return nil
}

func (s *Service) getProjectTags(ctx context.Context, projectID int64) ([]Tag, error) {
	rows, err := s.db.Query(ctx, `SELECT t.id, t.name FROM tags t JOIN project_tags pt ON t.id = pt.tag_id WHERE pt.project_id = $1 ORDER BY t.name`, projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tags []Tag
	for rows.Next() {
		var t Tag
		if err := rows.Scan(&t.ID, &t.Name); err != nil {
			return nil, err
		}
		tags = append(tags, t)
	}
	if tags == nil {
		tags = []Tag{}
	}
	return tags, nil
}

func (s *Service) syncTags(ctx context.Context, projectID int64, tagIDs []int64, tagNames []string) error {
	// Delete existing
	_, err := s.db.Exec(ctx, "DELETE FROM project_tags WHERE project_id = $1", projectID)
	if err != nil {
		return err
	}

	// Create new tags by name
	for _, name := range tagNames {
		var tagID int64
		err := s.db.QueryRow(ctx, `INSERT INTO tags (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id`, name).Scan(&tagID)
		if err != nil {
			return err
		}
		tagIDs = append(tagIDs, tagID)
	}

	// Insert project_tags
	for _, tagID := range tagIDs {
		_, err := s.db.Exec(ctx, "INSERT INTO project_tags (project_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", projectID, tagID)
		if err != nil {
			return err
		}
	}

	return nil
}

// Tags CRUD
func (s *Service) ListTags(ctx context.Context) ([]Tag, error) {
	rows, err := s.db.Query(ctx, "SELECT id, name FROM tags ORDER BY name")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tags []Tag
	for rows.Next() {
		var t Tag
		if err := rows.Scan(&t.ID, &t.Name); err != nil {
			return nil, err
		}
		tags = append(tags, t)
	}
	if tags == nil {
		tags = []Tag{}
	}
	return tags, nil
}
