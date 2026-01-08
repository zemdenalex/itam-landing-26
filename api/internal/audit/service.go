package audit

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Action types
const (
	ActionCreate = "CREATE"
	ActionUpdate = "UPDATE"
	ActionDelete = "DELETE"
)

// Entity types
const (
	EntityWin     = "win"
	EntityProject = "project"
	EntityTeam    = "team"
	EntityNews    = "news"
	EntityPartner = "partner"
	EntityClub    = "club"
	EntityBlog    = "blog"
	EntityUser    = "user"
	EntityStat    = "stat"
)

// Log represents an audit log entry
type Log struct {
	ID         int64           `json:"id"`
	UserID     *int64          `json:"user_id"`
	Action     string          `json:"action"`
	EntityType string          `json:"entity_type"`
	EntityID   *int64          `json:"entity_id"`
	Changes    json.RawMessage `json:"changes,omitempty"`
	IPAddress  *string         `json:"ip_address"`
	CreatedAt  time.Time       `json:"created_at"`
}

// Service handles audit logging
type Service struct {
	db *pgxpool.Pool
}

// NewService creates a new audit service
func NewService(db *pgxpool.Pool) *Service {
	return &Service{db: db}
}

// LogAction logs an action to the audit log
func (s *Service) LogAction(ctx context.Context, userID *int64, action, entityType string, entityID *int64, changes any, ipAddress string) {
	var changesJSON []byte
	var err error

	if changes != nil {
		changesJSON, err = json.Marshal(changes)
		if err != nil {
			slog.Error("failed to marshal changes for audit log", "error", err)
			changesJSON = nil
		}
	}

	var ip *string
	if ipAddress != "" {
		ip = &ipAddress
	}

	query := `
		INSERT INTO audit_logs (user_id, action, entity_type, entity_id, changes, ip_address)
		VALUES ($1, $2, $3, $4, $5, $6)
	`

	_, err = s.db.Exec(ctx, query, userID, action, entityType, entityID, changesJSON, ip)
	if err != nil {
		slog.Error("failed to write audit log", 
			"error", err,
			"action", action,
			"entity_type", entityType,
			"entity_id", entityID,
		)
	}
}

// ListParams contains parameters for listing audit logs
type ListParams struct {
	Page       int
	PageSize   int
	UserID     *int64
	EntityType string
	DateFrom   *time.Time
	DateTo     *time.Time
}

// ListResponse is the response for listing audit logs
type ListResponse struct {
	Logs       []Log `json:"logs"`
	Total      int   `json:"total"`
	Page       int   `json:"page"`
	PageSize   int   `json:"page_size"`
	TotalPages int   `json:"total_pages"`
}

// List returns paginated audit logs
func (s *Service) List(ctx context.Context, params ListParams) (*ListResponse, error) {
	if params.Page < 1 {
		params.Page = 1
	}
	if params.PageSize < 1 || params.PageSize > 100 {
		params.PageSize = 20
	}

	offset := (params.Page - 1) * params.PageSize

	// Build query
	baseQuery := "FROM audit_logs WHERE 1=1"
	var args []any
	argNum := 1

	if params.UserID != nil {
		baseQuery += fmt.Sprintf(" AND user_id = $%d", argNum)
		args = append(args, *params.UserID)
		argNum++
	}

	if params.EntityType != "" {
		baseQuery += fmt.Sprintf(" AND entity_type = $%d", argNum)
		args = append(args, params.EntityType)
		argNum++
	}

	if params.DateFrom != nil {
		baseQuery += fmt.Sprintf(" AND created_at >= $%d", argNum)
		args = append(args, *params.DateFrom)
		argNum++
	}

	if params.DateTo != nil {
		baseQuery += fmt.Sprintf(" AND created_at <= $%d", argNum)
		args = append(args, *params.DateTo)
		argNum++
	}

	// Get total count
	var total int
	countQuery := "SELECT COUNT(*) " + baseQuery
	if err := s.db.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, err
	}

	// Get logs
	selectQuery := fmt.Sprintf("SELECT id, user_id, action, entity_type, entity_id, changes, ip_address, created_at %s ORDER BY created_at DESC LIMIT $%d OFFSET $%d",
		baseQuery, argNum, argNum+1)
	args = append(args, params.PageSize, offset)

	rows, err := s.db.Query(ctx, selectQuery, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []Log
	for rows.Next() {
		var l Log
		if err := rows.Scan(&l.ID, &l.UserID, &l.Action, &l.EntityType, &l.EntityID, &l.Changes, &l.IPAddress, &l.CreatedAt); err != nil {
			return nil, err
		}
		logs = append(logs, l)
	}

	if logs == nil {
		logs = []Log{}
	}

	totalPages := (total + params.PageSize - 1) / params.PageSize

	return &ListResponse{
		Logs:       logs,
		Total:      total,
		Page:       params.Page,
		PageSize:   params.PageSize,
		TotalPages: totalPages,
	}, nil
}
