package upload

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/itam-misis/itam-api/internal/response"
)

var (
	ErrInvalidFileType = errors.New("invalid file type")
	ErrFileTooLarge    = errors.New("file too large")
	ErrFileNotFound    = errors.New("file not found")

	// Allowed image types
	allowedImageTypes = map[string]string{
		"image/jpeg": ".jpg",
		"image/png":  ".png",
		"image/webp": ".webp",
		"image/gif":  ".gif",
	}

	// SVG dangerous patterns
	svgDangerousPatterns = regexp.MustCompile(`(?i)<script|javascript:|on\w+\s*=|xlink:href\s*=\s*["']?\s*data:|href\s*=\s*["']?\s*javascript:`)
)

type Config struct {
	UploadPath string
	MaxSize    int64
	BaseURL    string // e.g., "/uploads"
}

type Service struct {
	config Config
}

func NewService(cfg Config) *Service {
	// Ensure directories exist
	os.MkdirAll(filepath.Join(cfg.UploadPath, "images"), 0755)
	os.MkdirAll(filepath.Join(cfg.UploadPath, "svg"), 0755)
	return &Service{config: cfg}
}

// UploadImage handles image upload
func (s *Service) UploadImage(file io.Reader, contentType string, size int64) (string, error) {
	// Check file size
	if size > s.config.MaxSize {
		return "", ErrFileTooLarge
	}

	// Check content type
	ext, ok := allowedImageTypes[contentType]
	if !ok {
		return "", ErrInvalidFileType
	}

	// Generate unique filename
	filename := generateUUID() + ext
	filePath := filepath.Join(s.config.UploadPath, "images", filename)

	// Create file
	dst, err := os.Create(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to create file: %w", err)
	}
	defer dst.Close()

	// Copy content
	if _, err := io.Copy(dst, file); err != nil {
		os.Remove(filePath)
		return "", fmt.Errorf("failed to save file: %w", err)
	}

	return s.config.BaseURL + "/images/" + filename, nil
}

// UploadSVG handles SVG upload with sanitization
func (s *Service) UploadSVG(file io.Reader, size int64) (string, error) {
	// Check file size (1MB max for SVG)
	if size > 1024*1024 {
		return "", ErrFileTooLarge
	}

	// Read content
	content, err := io.ReadAll(file)
	if err != nil {
		return "", fmt.Errorf("failed to read file: %w", err)
	}

	// Basic SVG validation
	contentStr := string(content)
	if !strings.Contains(contentStr, "<svg") {
		return "", ErrInvalidFileType
	}

	// Sanitize SVG
	sanitized := sanitizeSVG(contentStr)

	// Generate unique filename
	filename := generateUUID() + ".svg"
	filePath := filepath.Join(s.config.UploadPath, "svg", filename)

	// Write sanitized content
	if err := os.WriteFile(filePath, []byte(sanitized), 0644); err != nil {
		return "", fmt.Errorf("failed to save file: %w", err)
	}

	return s.config.BaseURL + "/svg/" + filename, nil
}

// DeleteFile deletes a file by URL
func (s *Service) DeleteFile(fileURL string) error {
	// Extract path from URL
	if !strings.HasPrefix(fileURL, s.config.BaseURL) {
		return ErrFileNotFound
	}

	relativePath := strings.TrimPrefix(fileURL, s.config.BaseURL)
	filePath := filepath.Join(s.config.UploadPath, relativePath)

	// Security check - ensure we're still within upload path
	absPath, err := filepath.Abs(filePath)
	if err != nil {
		return err
	}
	absUploadPath, _ := filepath.Abs(s.config.UploadPath)
	if !strings.HasPrefix(absPath, absUploadPath) {
		return ErrFileNotFound
	}

	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return ErrFileNotFound
	}

	return os.Remove(filePath)
}

// sanitizeSVG removes potentially dangerous elements from SVG
func sanitizeSVG(content string) string {
	// Remove dangerous patterns
	sanitized := svgDangerousPatterns.ReplaceAllString(content, "")

	// Remove script tags entirely
	scriptPattern := regexp.MustCompile(`(?i)<script[^>]*>[\s\S]*?</script>`)
	sanitized = scriptPattern.ReplaceAllString(sanitized, "")

	// Remove event handlers (onclick, onload, etc.)
	eventPattern := regexp.MustCompile(`(?i)\s+on\w+\s*=\s*["'][^"']*["']`)
	sanitized = eventPattern.ReplaceAllString(sanitized, "")

	return sanitized
}

// generateUUID generates a random UUID-like string
func generateUUID() string {
	bytes := make([]byte, 16)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

// Handler
type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// UploadImage handles POST /api/upload/image
func (h *Handler) UploadImage(w http.ResponseWriter, r *http.Request) {
	// Parse multipart form (max 10MB)
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		response.BadRequest(w, "failed to parse form")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		response.BadRequest(w, "file is required")
		return
	}
	defer file.Close()

	// Get content type
	contentType := header.Header.Get("Content-Type")
	if contentType == "" {
		// Try to detect from file
		buffer := make([]byte, 512)
		n, _ := file.Read(buffer)
		contentType = http.DetectContentType(buffer[:n])
		file.Seek(0, 0) // Reset reader
	}

	url, err := h.service.UploadImage(file, contentType, header.Size)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidFileType):
			response.BadRequest(w, "invalid file type, allowed: jpg, png, webp, gif")
		case errors.Is(err, ErrFileTooLarge):
			response.BadRequest(w, "file too large, max 5MB")
		default:
			slog.Error("failed to upload image", "error", err)
			response.InternalError(w, "failed to upload image")
		}
		return
	}

	response.JSON(w, http.StatusOK, map[string]string{"url": url})
}

// UploadSVG handles POST /api/upload/svg
func (h *Handler) UploadSVG(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(2 << 20); err != nil {
		response.BadRequest(w, "failed to parse form")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		response.BadRequest(w, "file is required")
		return
	}
	defer file.Close()

	url, err := h.service.UploadSVG(file, header.Size)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidFileType):
			response.BadRequest(w, "invalid file type, must be SVG")
		case errors.Is(err, ErrFileTooLarge):
			response.BadRequest(w, "file too large, max 1MB")
		default:
			slog.Error("failed to upload SVG", "error", err)
			response.InternalError(w, "failed to upload SVG")
		}
		return
	}

	response.JSON(w, http.StatusOK, map[string]string{"url": url})
}

// Delete handles DELETE /api/upload/:filename
func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	filename := chi.URLParam(r, "filename")
	if filename == "" {
		response.BadRequest(w, "filename is required")
		return
	}

	// Try images first, then svg
	var err error
	err = h.service.DeleteFile("/uploads/images/" + filename)
	if errors.Is(err, ErrFileNotFound) {
		err = h.service.DeleteFile("/uploads/svg/" + filename)
	}

	if errors.Is(err, ErrFileNotFound) {
		response.NotFound(w, "file not found")
		return
	}
	if err != nil {
		slog.Error("failed to delete file", "error", err)
		response.InternalError(w, "failed to delete file")
		return
	}

	response.JSON(w, http.StatusOK, map[string]string{"message": "file deleted"})
}
