package projects

import (
	"errors"
	"time"
)

var (
	ErrProjectNotFound = errors.New("project not found")
	ErrTitleRequired   = errors.New("title is required")
	ErrSlugExists      = errors.New("slug already exists")
)

type Project struct {
	ID          int64     `json:"id"`
	Title       string    `json:"title"`
	Slug        string    `json:"slug"`
	Description *string   `json:"description"`
	CoverImage  *string   `json:"cover_image"`
	SortOrder   int       `json:"sort_order"`
	IsPublished bool      `json:"is_published"`
	Tags        []Tag     `json:"tags"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Tag struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
}

type CreateRequest struct {
	Title       string   `json:"title"`
	Slug        string   `json:"slug,omitempty"`
	Description *string  `json:"description"`
	CoverImage  *string  `json:"cover_image"`
	SortOrder   int      `json:"sort_order"`
	IsPublished bool     `json:"is_published"`
	TagIDs      []int64  `json:"tag_ids"`
	TagNames    []string `json:"tag_names"` // Create new tags by name
}

func (r *CreateRequest) Validate() error {
	if r.Title == "" {
		return ErrTitleRequired
	}
	return nil
}

type UpdateRequest struct {
	Title       *string  `json:"title,omitempty"`
	Slug        *string  `json:"slug,omitempty"`
	Description *string  `json:"description,omitempty"`
	CoverImage  *string  `json:"cover_image,omitempty"`
	SortOrder   *int     `json:"sort_order,omitempty"`
	IsPublished *bool    `json:"is_published,omitempty"`
	TagIDs      []int64  `json:"tag_ids,omitempty"`
	TagNames    []string `json:"tag_names,omitempty"`
}

func (r *UpdateRequest) Validate() error {
	if r.Title != nil && *r.Title == "" {
		return ErrTitleRequired
	}
	return nil
}

type ListParams struct {
	Page        int
	PageSize    int
	Search      string
	IsPublished *bool
}

type ListResponse struct {
	Projects   []Project `json:"projects"`
	Total      int       `json:"total"`
	Page       int       `json:"page"`
	PageSize   int       `json:"page_size"`
	TotalPages int       `json:"total_pages"`
}

type ReorderRequest struct {
	IDs []int64 `json:"ids"`
}
