package wins

import (
	"errors"
	"time"
)

// Errors
var (
	ErrWinNotFound       = errors.New("win not found")
	ErrTeamNameRequired  = errors.New("team name is required")
	ErrHackathonRequired = errors.New("hackathon name is required")
	ErrResultRequired    = errors.New("result is required")
	ErrYearRequired      = errors.New("year is required")
	ErrInvalidYear       = errors.New("invalid year")
)

// Win represents a hackathon victory
type Win struct {
	ID            int64      `json:"id"`
	TeamName      string     `json:"team_name"`
	HackathonName string     `json:"hackathon_name"`
	Result        string     `json:"result"`
	Prize         int        `json:"prize"`
	AwardDate     *time.Time `json:"award_date"`
	Year          int        `json:"year"`
	Link          *string    `json:"link"`
	SortOrder     int        `json:"sort_order"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

// CreateWinRequest is the request body for creating a win
type CreateWinRequest struct {
	TeamName      string  `json:"team_name"`
	HackathonName string  `json:"hackathon_name"`
	Result        string  `json:"result"`
	Prize         int     `json:"prize"`
	AwardDate     *string `json:"award_date"` // Format: YYYY-MM-DD or DD.MM.YYYY
	Year          int     `json:"year"`
	Link          *string `json:"link"`
	SortOrder     int     `json:"sort_order"`
}

// Validate validates the create win request
func (r *CreateWinRequest) Validate() error {
	if r.TeamName == "" {
		return ErrTeamNameRequired
	}
	if r.HackathonName == "" {
		return ErrHackathonRequired
	}
	if r.Result == "" {
		return ErrResultRequired
	}
	if r.Year == 0 {
		return ErrYearRequired
	}
	if r.Year < 2000 || r.Year > 2100 {
		return ErrInvalidYear
	}
	return nil
}

// UpdateWinRequest is the request body for updating a win
type UpdateWinRequest struct {
	TeamName      *string `json:"team_name,omitempty"`
	HackathonName *string `json:"hackathon_name,omitempty"`
	Result        *string `json:"result,omitempty"`
	Prize         *int    `json:"prize,omitempty"`
	AwardDate     *string `json:"award_date,omitempty"`
	Year          *int    `json:"year,omitempty"`
	Link          *string `json:"link,omitempty"`
	SortOrder     *int    `json:"sort_order,omitempty"`
}

// Validate validates the update win request
func (r *UpdateWinRequest) Validate() error {
	if r.TeamName != nil && *r.TeamName == "" {
		return ErrTeamNameRequired
	}
	if r.HackathonName != nil && *r.HackathonName == "" {
		return ErrHackathonRequired
	}
	if r.Result != nil && *r.Result == "" {
		return ErrResultRequired
	}
	if r.Year != nil && (*r.Year < 2000 || *r.Year > 2100) {
		return ErrInvalidYear
	}
	return nil
}

// ListWinsParams contains parameters for listing wins
type ListWinsParams struct {
	Page     int
	PageSize int
	Search   string
	Year     int
}

// ListWinsResponse is the response for listing wins
type ListWinsResponse struct {
	Wins       []Win `json:"wins"`
	Total      int   `json:"total"`
	Page       int   `json:"page"`
	PageSize   int   `json:"page_size"`
	TotalPages int   `json:"total_pages"`
}

// ImportResult represents the result of a CSV import
type ImportResult struct {
	Total    int            `json:"total"`
	Imported int            `json:"imported"`
	Skipped  int            `json:"skipped"`
	Errors   []ImportError  `json:"errors,omitempty"`
}

// ImportError represents an error during import
type ImportError struct {
	Row     int    `json:"row"`
	Message string `json:"message"`
}

// CSVRow represents a row from the CSV file
type CSVRow struct {
	TeamName      string
	HackathonName string
	Result        string
	Prize         string
	AwardDate     string
	Year          string
	Link          string
}
