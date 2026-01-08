package team

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/itam-misis/itam-api/internal/audit"
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
	baseQuery := "FROM team_members tm LEFT JOIN clubs c ON tm.club_id = c.id WHERE 1=1"
	var args []any
	argNum := 1

	if params.Search != "" {
		baseQuery += fmt.Sprintf(" AND (tm.name ILIKE $%d OR tm.role ILIKE $%d)", argNum, argNum)
		args = append(args, "%"+params.Search+"%")
		argNum++
	}
	if params.ClubID != nil {
		baseQuery += fmt.Sprintf(" AND tm.club_id = $%d", argNum)
		args = append(args, *params.ClubID)
		argNum++
	}
	if params.IsVisible != nil {
		baseQuery += fmt.Sprintf(" AND tm.is_visible = $%d", argNum)
		args = append(args, *params.IsVisible)
		argNum++
	}

	var total int
	if err := s.db.QueryRow(ctx, "SELECT COUNT(*) "+baseQuery, args...).Scan(&total); err != nil {
		return nil, err
	}

	query := fmt.Sprintf(`SELECT tm.id, tm.name, tm.role, tm.photo, tm.club_id, c.name, tm.badge, tm.telegram_link, tm.sort_order, tm.is_visible, tm.created_at, tm.updated_at %s ORDER BY tm.sort_order DESC, tm.created_at DESC LIMIT $%d OFFSET $%d`, baseQuery, argNum, argNum+1)
	args = append(args, params.PageSize, offset)

	rows, err := s.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var members []Member
	for rows.Next() {
		var m Member
		if err := rows.Scan(&m.ID, &m.Name, &m.Role, &m.Photo, &m.ClubID, &m.ClubName, &m.Badge, &m.TelegramLink, &m.SortOrder, &m.IsVisible, &m.CreatedAt, &m.UpdatedAt); err != nil {
			return nil, err
		}
		members = append(members, m)
	}
	if members == nil {
		members = []Member{}
	}

	return &ListResponse{Members: members, Total: total, Page: params.Page, PageSize: params.PageSize, TotalPages: (total + params.PageSize - 1) / params.PageSize}, nil
}

func (s *Service) ListPublic(ctx context.Context) ([]Member, error) {
	rows, err := s.db.Query(ctx, `SELECT tm.id, tm.name, tm.role, tm.photo, tm.club_id, c.name, tm.badge, tm.telegram_link, tm.sort_order, tm.is_visible, tm.created_at, tm.updated_at FROM team_members tm LEFT JOIN clubs c ON tm.club_id = c.id WHERE tm.is_visible = true ORDER BY tm.sort_order DESC, tm.created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var members []Member
	for rows.Next() {
		var m Member
		if err := rows.Scan(&m.ID, &m.Name, &m.Role, &m.Photo, &m.ClubID, &m.ClubName, &m.Badge, &m.TelegramLink, &m.SortOrder, &m.IsVisible, &m.CreatedAt, &m.UpdatedAt); err != nil {
			return nil, err
		}
		members = append(members, m)
	}
	if members == nil {
		members = []Member{}
	}
	return members, nil
}

func (s *Service) GetByID(ctx context.Context, id int64) (*Member, error) {
	var m Member
	err := s.db.QueryRow(ctx, `SELECT tm.id, tm.name, tm.role, tm.photo, tm.club_id, c.name, tm.badge, tm.telegram_link, tm.sort_order, tm.is_visible, tm.created_at, tm.updated_at FROM team_members tm LEFT JOIN clubs c ON tm.club_id = c.id WHERE tm.id = $1`, id).Scan(&m.ID, &m.Name, &m.Role, &m.Photo, &m.ClubID, &m.ClubName, &m.Badge, &m.TelegramLink, &m.SortOrder, &m.IsVisible, &m.CreatedAt, &m.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrMemberNotFound
	}
	return &m, err
}

func (s *Service) Create(ctx context.Context, req *CreateRequest, userID int64, ip string) (*Member, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}

	var m Member
	err := s.db.QueryRow(ctx, `INSERT INTO team_members (name, role, photo, club_id, badge, telegram_link, sort_order, is_visible) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, name, role, photo, club_id, badge, telegram_link, sort_order, is_visible, created_at, updated_at`,
		req.Name, req.Role, req.Photo, req.ClubID, req.Badge, req.TelegramLink, req.SortOrder, req.IsVisible,
	).Scan(&m.ID, &m.Name, &m.Role, &m.Photo, &m.ClubID, &m.Badge, &m.TelegramLink, &m.SortOrder, &m.IsVisible, &m.CreatedAt, &m.UpdatedAt)
	if err != nil {
		return nil, err
	}

	s.audit.LogAction(ctx, &userID, audit.ActionCreate, audit.EntityTeam, &m.ID, m, ip)
	return &m, nil
}

func (s *Service) Update(ctx context.Context, id int64, req *UpdateRequest, userID int64, ip string) (*Member, error) {
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

	if req.Name != nil {
		setParts = append(setParts, fmt.Sprintf("name = $%d", argNum))
		args = append(args, *req.Name)
		argNum++
	}
	if req.Role != nil {
		setParts = append(setParts, fmt.Sprintf("role = $%d", argNum))
		args = append(args, *req.Role)
		argNum++
	}
	if req.Photo != nil {
		setParts = append(setParts, fmt.Sprintf("photo = $%d", argNum))
		args = append(args, *req.Photo)
		argNum++
	}
	if req.ClubID != nil {
		setParts = append(setParts, fmt.Sprintf("club_id = $%d", argNum))
		args = append(args, *req.ClubID)
		argNum++
	}
	if req.Badge != nil {
		setParts = append(setParts, fmt.Sprintf("badge = $%d", argNum))
		args = append(args, *req.Badge)
		argNum++
	}
	if req.TelegramLink != nil {
		setParts = append(setParts, fmt.Sprintf("telegram_link = $%d", argNum))
		args = append(args, *req.TelegramLink)
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
	var m Member
	err = s.db.QueryRow(ctx, fmt.Sprintf(`UPDATE team_members SET %s WHERE id = $%d RETURNING id, name, role, photo, club_id, badge, telegram_link, sort_order, is_visible, created_at, updated_at`, strings.Join(setParts, ", "), argNum), args...).Scan(&m.ID, &m.Name, &m.Role, &m.Photo, &m.ClubID, &m.Badge, &m.TelegramLink, &m.SortOrder, &m.IsVisible, &m.CreatedAt, &m.UpdatedAt)
	if err != nil {
		return nil, err
	}

	s.audit.LogAction(ctx, &userID, audit.ActionUpdate, audit.EntityTeam, &m.ID, map[string]any{"before": existing, "after": m}, ip)
	return &m, nil
}

func (s *Service) Delete(ctx context.Context, id int64, userID int64, ip string) error {
	existing, err := s.GetByID(ctx, id)
	if err != nil {
		return err
	}

	_, err = s.db.Exec(ctx, "DELETE FROM team_members WHERE id = $1", id)
	if err != nil {
		return err
	}

	s.audit.LogAction(ctx, &userID, audit.ActionDelete, audit.EntityTeam, &id, existing, ip)
	return nil
}
