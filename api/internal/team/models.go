package team

import (
	"errors"
	"time"
)

var (
	ErrMemberNotFound = errors.New("team member not found")
	ErrNameRequired   = errors.New("name is required")
)

type Member struct {
	ID           int64     `json:"id"`
	Name         string    `json:"name"`
	Role         *string   `json:"role"`
	Photo        *string   `json:"photo"`
	ClubID       *int64    `json:"club_id"`
	ClubName     *string   `json:"club_name,omitempty"`
	Badge        *string   `json:"badge"`
	TelegramLink *string   `json:"telegram_link"`
	SortOrder    int       `json:"sort_order"`
	IsVisible    bool      `json:"is_visible"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type CreateRequest struct {
	Name         string  `json:"name"`
	Role         *string `json:"role"`
	Photo        *string `json:"photo"`
	ClubID       *int64  `json:"club_id"`
	Badge        *string `json:"badge"`
	TelegramLink *string `json:"telegram_link"`
	SortOrder    int     `json:"sort_order"`
	IsVisible    bool    `json:"is_visible"`
}

func (r *CreateRequest) Validate() error {
	if r.Name == "" {
		return ErrNameRequired
	}
	return nil
}

type UpdateRequest struct {
	Name         *string `json:"name,omitempty"`
	Role         *string `json:"role,omitempty"`
	Photo        *string `json:"photo,omitempty"`
	ClubID       *int64  `json:"club_id,omitempty"`
	Badge        *string `json:"badge,omitempty"`
	TelegramLink *string `json:"telegram_link,omitempty"`
	SortOrder    *int    `json:"sort_order,omitempty"`
	IsVisible    *bool   `json:"is_visible,omitempty"`
}

func (r *UpdateRequest) Validate() error {
	if r.Name != nil && *r.Name == "" {
		return ErrNameRequired
	}
	return nil
}

type ListParams struct {
	Page      int
	PageSize  int
	Search    string
	ClubID    *int64
	IsVisible *bool
}

type ListResponse struct {
	Members    []Member `json:"members"`
	Total      int      `json:"total"`
	Page       int      `json:"page"`
	PageSize   int      `json:"page_size"`
	TotalPages int      `json:"total_pages"`
}
