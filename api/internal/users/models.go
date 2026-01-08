package users

import (
	"errors"
	"regexp"
	"time"
)

// Roles
const (
	RoleAdmin  = "admin"
	RoleEditor = "editor"
)

// Errors
var (
	ErrUserNotFound      = errors.New("user not found")
	ErrEmailExists       = errors.New("email already exists")
	ErrInvalidEmail      = errors.New("invalid email format")
	ErrPasswordTooShort  = errors.New("password must be at least 8 characters")
	ErrNameRequired      = errors.New("name is required")
	ErrInvalidRole       = errors.New("invalid role")
	ErrCannotDeleteSelf  = errors.New("cannot delete your own account")
	ErrLastAdmin         = errors.New("cannot delete or deactivate the last admin")
	ErrCannotChangeSelf  = errors.New("cannot change your own role or status")
)

var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)

// User represents a user in the database
type User struct {
	ID           int64
	Email        string
	PasswordHash string
	Name         string
	Role         string
	IsActive     bool
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

// UserResponse is the user data returned in responses (without password)
type UserResponse struct {
	ID        int64     `json:"id"`
	Email     string    `json:"email"`
	Name      string    `json:"name"`
	Role      string    `json:"role"`
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// ToResponse converts User to UserResponse
func (u *User) ToResponse() UserResponse {
	return UserResponse{
		ID:        u.ID,
		Email:     u.Email,
		Name:      u.Name,
		Role:      u.Role,
		IsActive:  u.IsActive,
		CreatedAt: u.CreatedAt,
		UpdatedAt: u.UpdatedAt,
	}
}

// CreateUserRequest is the request body for creating a user
type CreateUserRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name"`
	Role     string `json:"role"`
}

// Validate validates the create user request
func (r *CreateUserRequest) Validate() error {
	if r.Email == "" || !emailRegex.MatchString(r.Email) {
		return ErrInvalidEmail
	}
	if len(r.Password) < 8 {
		return ErrPasswordTooShort
	}
	if r.Name == "" {
		return ErrNameRequired
	}
	if r.Role != RoleAdmin && r.Role != RoleEditor {
		return ErrInvalidRole
	}
	return nil
}

// UpdateUserRequest is the request body for updating a user
type UpdateUserRequest struct {
	Email    *string `json:"email,omitempty"`
	Password *string `json:"password,omitempty"`
	Name     *string `json:"name,omitempty"`
	Role     *string `json:"role,omitempty"`
	IsActive *bool   `json:"is_active,omitempty"`
}

// Validate validates the update user request
func (r *UpdateUserRequest) Validate() error {
	if r.Email != nil && !emailRegex.MatchString(*r.Email) {
		return ErrInvalidEmail
	}
	if r.Password != nil && len(*r.Password) < 8 {
		return ErrPasswordTooShort
	}
	if r.Name != nil && *r.Name == "" {
		return ErrNameRequired
	}
	if r.Role != nil && *r.Role != RoleAdmin && *r.Role != RoleEditor {
		return ErrInvalidRole
	}
	return nil
}

// ListUsersParams contains parameters for listing users
type ListUsersParams struct {
	Page     int
	PageSize int
	Search   string
	Role     string
}

// ListUsersResponse is the response for listing users
type ListUsersResponse struct {
	Users      []UserResponse `json:"users"`
	Total      int            `json:"total"`
	Page       int            `json:"page"`
	PageSize   int            `json:"page_size"`
	TotalPages int            `json:"total_pages"`
}
