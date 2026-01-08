package wins

import (
	"context"
	"encoding/csv"
	"fmt"
	"io"
	"strconv"
	"strings"

	"github.com/itam-misis/itam-api/internal/audit"
)

// ImportCSV imports wins from CSV data
// CSV format: Название команды;Название хакатона;Результат;Призовой;Дата награждения;Год;Ссылка
// Delimiter: ;
func (s *Service) ImportCSV(ctx context.Context, reader io.Reader, userID int64, ipAddress string) (*ImportResult, error) {
	csvReader := csv.NewReader(reader)
	csvReader.Comma = ';'
	csvReader.LazyQuotes = true
	csvReader.TrimLeadingSpace = true

	result := &ImportResult{
		Errors: []ImportError{},
	}

	// Skip header row
	header, err := csvReader.Read()
	if err != nil {
		return nil, fmt.Errorf("failed to read CSV header: %w", err)
	}

	// Validate header (optional, just log)
	expectedHeaders := []string{"Название команды", "Название хакатона", "Результат", "Призовой", "Дата награждения", "Год", "Ссылка"}
	if len(header) < 6 {
		return nil, fmt.Errorf("CSV must have at least 6 columns, got %d", len(header))
	}

	_ = expectedHeaders // Used for documentation

	rowNum := 1 // Start from 1 (after header)
	var importedWins []Win

	for {
		rowNum++
		record, err := csvReader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			result.Errors = append(result.Errors, ImportError{
				Row:     rowNum,
				Message: fmt.Sprintf("failed to read row: %v", err),
			})
			result.Skipped++
			continue
		}

		result.Total++

		// Parse row
		row, err := parseCSVRow(record)
		if err != nil {
			result.Errors = append(result.Errors, ImportError{
				Row:     rowNum,
				Message: err.Error(),
			})
			result.Skipped++
			continue
		}

		// Create win request
		req := &CreateWinRequest{
			TeamName:      row.TeamName,
			HackathonName: row.HackathonName,
			Result:        row.Result,
			Prize:         parsePrize(row.Prize),
			Year:          parseYear(row.Year),
		}

		if row.AwardDate != "" {
			req.AwardDate = &row.AwardDate
		}

		if row.Link != "" {
			req.Link = &row.Link
		}

		// Validate
		if err := req.Validate(); err != nil {
			result.Errors = append(result.Errors, ImportError{
				Row:     rowNum,
				Message: err.Error(),
			})
			result.Skipped++
			continue
		}

		// Create win (without individual audit logs)
		win, err := s.createWithoutAudit(ctx, req)
		if err != nil {
			result.Errors = append(result.Errors, ImportError{
				Row:     rowNum,
				Message: fmt.Sprintf("failed to create: %v", err),
			})
			result.Skipped++
			continue
		}

		importedWins = append(importedWins, *win)
		result.Imported++
	}

	// Single audit log for the entire import
	if len(importedWins) > 0 {
		importLog := map[string]any{
			"action":   "bulk_import",
			"total":    result.Total,
			"imported": result.Imported,
			"skipped":  result.Skipped,
		}
		s.audit.LogAction(ctx, &userID, audit.ActionCreate, audit.EntityWin, nil, importLog, ipAddress)
	}

	return result, nil
}

// createWithoutAudit creates a win without audit logging (for bulk import)
func (s *Service) createWithoutAudit(ctx context.Context, req *CreateWinRequest) (*Win, error) {
	// Parse award date
	var awardDate interface{}
	if req.AwardDate != nil && *req.AwardDate != "" {
		parsed, err := parseDate(*req.AwardDate)
		if err != nil {
			return nil, err
		}
		awardDate = parsed
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
		return nil, err
	}

	return &w, nil
}

// parseCSVRow parses a CSV record into CSVRow
func parseCSVRow(record []string) (*CSVRow, error) {
	if len(record) < 6 {
		return nil, fmt.Errorf("row must have at least 6 columns, got %d", len(record))
	}

	row := &CSVRow{
		TeamName:      strings.TrimSpace(record[0]),
		HackathonName: strings.TrimSpace(record[1]),
		Result:        strings.TrimSpace(record[2]),
		Prize:         strings.TrimSpace(record[3]),
		AwardDate:     strings.TrimSpace(record[4]),
		Year:          strings.TrimSpace(record[5]),
	}

	// Link is optional (column 7)
	if len(record) > 6 {
		row.Link = strings.TrimSpace(record[6])
	}

	return row, nil
}

// parsePrize parses prize string to int
// Handles formats: "170000", "170 000", "170,000", "" (empty = 0)
func parsePrize(s string) int {
	if s == "" {
		return 0
	}

	// Remove spaces and commas
	s = strings.ReplaceAll(s, " ", "")
	s = strings.ReplaceAll(s, ",", "")
	s = strings.ReplaceAll(s, "₽", "")
	s = strings.TrimSpace(s)

	prize, err := strconv.Atoi(s)
	if err != nil {
		return 0
	}

	return prize
}

// parseYear parses year string to int
func parseYear(s string) int {
	year, err := strconv.Atoi(strings.TrimSpace(s))
	if err != nil {
		return 0
	}
	return year
}
