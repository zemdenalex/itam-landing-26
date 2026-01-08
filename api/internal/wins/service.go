package wins

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/itam-misis/itam-api/internal/audit"
)

// Service handles win operations
type Service struct {
	db    *pgxpool.Pool
	audit *audit.Service
}

// NewService creates a new wins service
func NewService(db *pgxpool.Pool, auditService *audit.Service) *Service {
	return &Service{
		db:    db,
		audit: auditService,
	}
}

// List returns a paginated list of wins
func (s *Service) List(ctx context.Context, params ListWinsParams) (*ListWinsResponse, error) {
	if params.Page < 1 {
		params.Page = 1
	}
	if params.PageSize < 1 || params.PageSize > 100 {
		params.PageSize = 20
	}

	offset := (params.Page - 1) * params.PageSize

	// Build query
	baseQuery := "FROM wins WHERE 1=1"
	var args []any
	argNum := 1

	if params.Search != "" {
		baseQuery += fmt.Sprintf(" AND (team_name ILIKE $%d OR hackathon_name ILIKE $%d)", argNum, argNum)
		args = append(args, "%"+params.Search+"%")
		argNum++
	}

	if params.Year != 0 {
		baseQuery += fmt.Sprintf(" AND year = $%d", argNum)
		args = append(args, params.Year)
		argNum++
	}

	// Get total count
	var total int
	countQuery := "SELECT COUNT(*) " + baseQuery
	if err := s.db.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, fmt.Errorf("failed to count wins: %w", err)
	}

	// Get wins
	selectQuery := fmt.Sprintf(`
		SELECT id, team_name, hackathon_name, result, prize, award_date, year, link, sort_order, created_at, updated_at 
		%s 
		ORDER BY year DESC, sort_order DESC, award_date DESC NULLS LAST
		LIMIT $%d OFFSET $%d
	`, baseQuery, argNum, argNum+1)
	args = append(args, params.PageSize, offset)

	rows, err := s.db.Query(ctx, selectQuery, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query wins: %w", err)
	}
	defer rows.Close()

	var wins []Win
	for rows.Next() {
		var w Win
		if err := rows.Scan(
			&w.ID, &w.TeamName, &w.HackathonName, &w.Result, &w.Prize,
			&w.AwardDate, &w.Year, &w.Link, &w.SortOrder, &w.CreatedAt, &w.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan win: %w", err)
		}
		wins = append(wins, w)
	}

	if wins == nil {
		wins = []Win{}
	}

	totalPages := (total + params.PageSize - 1) / params.PageSize

	return &ListWinsResponse{
		Wins:       wins,
		Total:      total,
		Page:       params.Page,
		PageSize:   params.PageSize,
		TotalPages: totalPages,
	}, nil
}

// ListPublic returns all wins for public API (sorted, no pagination)
func (s *Service) ListPublic(ctx context.Context) ([]Win, error) {
	query := `
		SELECT id, team_name, hackathon_name, result, prize, award_date, year, link, sort_order, created_at, updated_at 
		FROM wins
		ORDER BY year DESC, sort_order DESC, award_date DESC NULLS LAST
	`

	rows, err := s.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query wins: %w", err)
	}
	defer rows.Close()

	var wins []Win
	for rows.Next() {
		var w Win
		if err := rows.Scan(
			&w.ID, &w.TeamName, &w.HackathonName, &w.Result, &w.Prize,
			&w.AwardDate, &w.Year, &w.Link, &w.SortOrder, &w.CreatedAt, &w.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan win: %w", err)
		}
		wins = append(wins, w)
	}

	if wins == nil {
		wins = []Win{}
	}

	return wins, nil
}

// GetByID returns a win by ID
func (s *Service) GetByID(ctx context.Context, id int64) (*Win, error) {
	query := `
		SELECT id, team_name, hackathon_name, result, prize, award_date, year, link, sort_order, created_at, updated_at
		FROM wins
		WHERE id = $1
	`

	var w Win
	err := s.db.QueryRow(ctx, query, id).Scan(
		&w.ID, &w.TeamName, &w.HackathonName, &w.Result, &w.Prize,
		&w.AwardDate, &w.Year, &w.Link, &w.SortOrder, &w.CreatedAt, &w.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrWinNotFound
		}
		return nil, fmt.Errorf("failed to get win: %w", err)
	}

	return &w, nil
}

// Create creates a new win
func (s *Service) Create(ctx context.Context, req *CreateWinRequest, userID int64, ipAddress string) (*Win, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}

	// Parse award date
	var awardDate *time.Time
	if req.AwardDate != nil && *req.AwardDate != "" {
		parsed, err := parseDate(*req.AwardDate)
		if err != nil {
			return nil, fmt.Errorf("invalid award_date format: %w", err)
		}
		awardDate = &parsed
	}

	query := `
		INSERT INTO wins (team_name, hackathon_name, result, prize, award_date, year, link, sort_order)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, team_name, hackathon_name, result, prize, award_date, year, link, sort_order, created_at, updated_at
	`

	var w Win
	err := s.db.QueryRow(ctx, query,
		req.TeamName, req.HackathonName, req.Result, req.Prize,
		awardDate, req.Year, req.Link, req.SortOrder,
	).Scan(
		&w.ID, &w.TeamName, &w.HackathonName, &w.Result, &w.Prize,
		&w.AwardDate, &w.Year, &w.Link, &w.SortOrder, &w.CreatedAt, &w.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create win: %w", err)
	}

	// Audit log
	s.audit.LogAction(ctx, &userID, audit.ActionCreate, audit.EntityWin, &w.ID, w, ipAddress)

	return &w, nil
}

// Update updates a win
func (s *Service) Update(ctx context.Context, id int64, req *UpdateWinRequest, userID int64, ipAddress string) (*Win, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}

	// Check if win exists
	existing, err := s.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// Build update query
	setParts := []string{}
	args := []any{}
	argNum := 1

	if req.TeamName != nil {
		setParts = append(setParts, fmt.Sprintf("team_name = $%d", argNum))
		args = append(args, *req.TeamName)
		argNum++
	}
	if req.HackathonName != nil {
		setParts = append(setParts, fmt.Sprintf("hackathon_name = $%d", argNum))
		args = append(args, *req.HackathonName)
		argNum++
	}
	if req.Result != nil {
		setParts = append(setParts, fmt.Sprintf("result = $%d", argNum))
		args = append(args, *req.Result)
		argNum++
	}
	if req.Prize != nil {
		setParts = append(setParts, fmt.Sprintf("prize = $%d", argNum))
		args = append(args, *req.Prize)
		argNum++
	}
	if req.AwardDate != nil {
		if *req.AwardDate == "" {
			setParts = append(setParts, fmt.Sprintf("award_date = $%d", argNum))
			args = append(args, nil)
		} else {
			parsed, err := parseDate(*req.AwardDate)
			if err != nil {
				return nil, fmt.Errorf("invalid award_date format: %w", err)
			}
			setParts = append(setParts, fmt.Sprintf("award_date = $%d", argNum))
			args = append(args, parsed)
		}
		argNum++
	}
	if req.Year != nil {
		setParts = append(setParts, fmt.Sprintf("year = $%d", argNum))
		args = append(args, *req.Year)
		argNum++
	}
	if req.Link != nil {
		setParts = append(setParts, fmt.Sprintf("link = $%d", argNum))
		if *req.Link == "" {
			args = append(args, nil)
		} else {
			args = append(args, *req.Link)
		}
		argNum++
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
	query := fmt.Sprintf(`
		UPDATE wins SET %s
		WHERE id = $%d
		RETURNING id, team_name, hackathon_name, result, prize, award_date, year, link, sort_order, created_at, updated_at
	`, strings.Join(setParts, ", "), argNum)

	var w Win
	err = s.db.QueryRow(ctx, query, args...).Scan(
		&w.ID, &w.TeamName, &w.HackathonName, &w.Result, &w.Prize,
		&w.AwardDate, &w.Year, &w.Link, &w.SortOrder, &w.CreatedAt, &w.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to update win: %w", err)
	}

	// Audit log with changes
	changes := map[string]any{
		"before": existing,
		"after":  w,
	}
	s.audit.LogAction(ctx, &userID, audit.ActionUpdate, audit.EntityWin, &w.ID, changes, ipAddress)

	return &w, nil
}

// Delete deletes a win
func (s *Service) Delete(ctx context.Context, id int64, userID int64, ipAddress string) error {
	// Check if win exists
	existing, err := s.GetByID(ctx, id)
	if err != nil {
		return err
	}

	query := "DELETE FROM wins WHERE id = $1"
	result, err := s.db.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete win: %w", err)
	}

	if result.RowsAffected() == 0 {
		return ErrWinNotFound
	}

	// Audit log
	s.audit.LogAction(ctx, &userID, audit.ActionDelete, audit.EntityWin, &id, existing, ipAddress)

	return nil
}

// GetYears returns list of available years
func (s *Service) GetYears(ctx context.Context) ([]int, error) {
	query := "SELECT DISTINCT year FROM wins ORDER BY year DESC"
	rows, err := s.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var years []int
	for rows.Next() {
		var year int
		if err := rows.Scan(&year); err != nil {
			return nil, err
		}
		years = append(years, year)
	}

	if years == nil {
		years = []int{}
	}

	return years, nil
}

// GetStats returns statistics for dashboard
func (s *Service) GetStats(ctx context.Context) (map[string]any, error) {
	var totalWins int
	var totalPrize int64
	var currentYearPrize int64
	currentYear := time.Now().Year()

	// Total wins
	s.db.QueryRow(ctx, "SELECT COUNT(*) FROM wins").Scan(&totalWins)

	// Total prize
	s.db.QueryRow(ctx, "SELECT COALESCE(SUM(prize), 0) FROM wins").Scan(&totalPrize)

	// Current year prize
	s.db.QueryRow(ctx, "SELECT COALESCE(SUM(prize), 0) FROM wins WHERE year = $1", currentYear).Scan(&currentYearPrize)

	return map[string]any{
		"total_wins":         totalWins,
		"total_prize":        totalPrize,
		"current_year_prize": currentYearPrize,
		"current_year":       currentYear,
	}, nil
}

// parseDate parses date in DD.MM.YYYY or YYYY-MM-DD format
func parseDate(s string) (time.Time, error) {
	// Try DD.MM.YYYY first (CSV format)
	if t, err := time.Parse("02.01.2006", s); err == nil {
		return t, nil
	}
	// Try YYYY-MM-DD (ISO format)
	if t, err := time.Parse("2006-01-02", s); err == nil {
		return t, nil
	}
	return time.Time{}, fmt.Errorf("unsupported date format: %s (use DD.MM.YYYY or YYYY-MM-DD)", s)
}
