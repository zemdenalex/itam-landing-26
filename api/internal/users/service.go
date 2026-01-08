package users

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

// Service handles user operations
type Service struct {
	db *pgxpool.Pool
}

// NewService creates a new users service
func NewService(db *pgxpool.Pool) *Service {
	return &Service{db: db}
}

// List returns a paginated list of users
func (s *Service) List(ctx context.Context, params ListUsersParams) (*ListUsersResponse, error) {
	// Set defaults
	if params.Page < 1 {
		params.Page = 1
	}
	if params.PageSize < 1 || params.PageSize > 100 {
		params.PageSize = 20
	}

	offset := (params.Page - 1) * params.PageSize

	// Build query
	baseQuery := "FROM users WHERE 1=1"
	var args []any
	argNum := 1

	if params.Search != "" {
		baseQuery += fmt.Sprintf(" AND (email ILIKE $%d OR name ILIKE $%d)", argNum, argNum)
		args = append(args, "%"+params.Search+"%")
		argNum++
	}

	if params.Role != "" {
		baseQuery += fmt.Sprintf(" AND role = $%d", argNum)
		args = append(args, params.Role)
		argNum++
	}

	// Get total count
	var total int
	countQuery := "SELECT COUNT(*) " + baseQuery
	if err := s.db.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, fmt.Errorf("failed to count users: %w", err)
	}

	// Get users
	selectQuery := fmt.Sprintf(`
		SELECT id, email, name, role, is_active, created_at, updated_at 
		%s 
		ORDER BY created_at DESC 
		LIMIT $%d OFFSET $%d
	`, baseQuery, argNum, argNum+1)
	args = append(args, params.PageSize, offset)

	rows, err := s.db.Query(ctx, selectQuery, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query users: %w", err)
	}
	defer rows.Close()

	var users []UserResponse
	for rows.Next() {
		var u UserResponse
		if err := rows.Scan(&u.ID, &u.Email, &u.Name, &u.Role, &u.IsActive, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan user: %w", err)
		}
		users = append(users, u)
	}

	if users == nil {
		users = []UserResponse{}
	}

	totalPages := (total + params.PageSize - 1) / params.PageSize

	return &ListUsersResponse{
		Users:      users,
		Total:      total,
		Page:       params.Page,
		PageSize:   params.PageSize,
		TotalPages: totalPages,
	}, nil
}

// GetByID returns a user by ID
func (s *Service) GetByID(ctx context.Context, id int64) (*User, error) {
	query := `
		SELECT id, email, password_hash, name, role, is_active, created_at, updated_at
		FROM users
		WHERE id = $1
	`

	var user User
	err := s.db.QueryRow(ctx, query, id).Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.Name,
		&user.Role,
		&user.IsActive,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return &user, nil
}

// Create creates a new user
func (s *Service) Create(ctx context.Context, req *CreateUserRequest) (*User, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}

	// Hash password
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	query := `
		INSERT INTO users (email, password_hash, name, role)
		VALUES ($1, $2, $3, $4)
		RETURNING id, email, password_hash, name, role, is_active, created_at, updated_at
	`

	var user User
	err = s.db.QueryRow(ctx, query,
		strings.ToLower(req.Email),
		string(passwordHash),
		req.Name,
		req.Role,
	).Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.Name,
		&user.Role,
		&user.IsActive,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return nil, ErrEmailExists
		}
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return &user, nil
}

// Update updates a user
func (s *Service) Update(ctx context.Context, id int64, req *UpdateUserRequest, currentUserID int64) (*User, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}

	// Check if user exists
	existing, err := s.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// Prevent changing own role or status
	if id == currentUserID {
		if req.Role != nil || req.IsActive != nil {
			return nil, ErrCannotChangeSelf
		}
	}

	// Check if this would remove the last admin
	if existing.Role == RoleAdmin {
		if (req.Role != nil && *req.Role != RoleAdmin) || (req.IsActive != nil && !*req.IsActive) {
			isLastAdmin, err := s.isLastActiveAdmin(ctx, id)
			if err != nil {
				return nil, err
			}
			if isLastAdmin {
				return nil, ErrLastAdmin
			}
		}
	}

	// Build update query
	setParts := []string{}
	args := []any{}
	argNum := 1

	if req.Email != nil {
		setParts = append(setParts, fmt.Sprintf("email = $%d", argNum))
		args = append(args, strings.ToLower(*req.Email))
		argNum++
	}
	if req.Password != nil {
		passwordHash, err := bcrypt.GenerateFromPassword([]byte(*req.Password), bcrypt.DefaultCost)
		if err != nil {
			return nil, fmt.Errorf("failed to hash password: %w", err)
		}
		setParts = append(setParts, fmt.Sprintf("password_hash = $%d", argNum))
		args = append(args, string(passwordHash))
		argNum++
	}
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
	if req.IsActive != nil {
		setParts = append(setParts, fmt.Sprintf("is_active = $%d", argNum))
		args = append(args, *req.IsActive)
		argNum++
	}

	if len(setParts) == 0 {
		return existing, nil
	}

	args = append(args, id)
	query := fmt.Sprintf(`
		UPDATE users SET %s
		WHERE id = $%d
		RETURNING id, email, password_hash, name, role, is_active, created_at, updated_at
	`, strings.Join(setParts, ", "), argNum)

	var user User
	err = s.db.QueryRow(ctx, query, args...).Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.Name,
		&user.Role,
		&user.IsActive,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return nil, ErrEmailExists
		}
		return nil, fmt.Errorf("failed to update user: %w", err)
	}

	return &user, nil
}

// Delete deletes a user
func (s *Service) Delete(ctx context.Context, id int64, currentUserID int64) error {
	// Cannot delete yourself
	if id == currentUserID {
		return ErrCannotDeleteSelf
	}

	// Check if user exists
	user, err := s.GetByID(ctx, id)
	if err != nil {
		return err
	}

	// Check if this is the last admin
	if user.Role == RoleAdmin {
		isLastAdmin, err := s.isLastActiveAdmin(ctx, id)
		if err != nil {
			return err
		}
		if isLastAdmin {
			return ErrLastAdmin
		}
	}

	query := "DELETE FROM users WHERE id = $1"
	result, err := s.db.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}

	if result.RowsAffected() == 0 {
		return ErrUserNotFound
	}

	return nil
}

// isLastActiveAdmin checks if the given user is the last active admin
func (s *Service) isLastActiveAdmin(ctx context.Context, excludeID int64) (bool, error) {
	query := "SELECT COUNT(*) FROM users WHERE role = 'admin' AND is_active = true AND id != $1"
	var count int
	if err := s.db.QueryRow(ctx, query, excludeID).Scan(&count); err != nil {
		return false, fmt.Errorf("failed to count admins: %w", err)
	}
	return count == 0, nil
}

// CountUsers returns the total number of users
func (s *Service) CountUsers(ctx context.Context) (int, error) {
	var count int
	err := s.db.QueryRow(ctx, "SELECT COUNT(*) FROM users").Scan(&count)
	return count, err
}

// CreateInitialAdmin creates the initial admin user if no users exist
func (s *Service) CreateInitialAdmin(ctx context.Context, email, password, name string) (*User, error) {
	count, err := s.CountUsers(ctx)
	if err != nil {
		return nil, err
	}

	if count > 0 {
		return nil, nil // Users already exist, skip
	}

	return s.Create(ctx, &CreateUserRequest{
		Email:    email,
		Password: password,
		Name:     name,
		Role:     RoleAdmin,
	})
}
