package response

import (
	"encoding/json"
	"net/http"
)

// Response is the standard API response format
type Response struct {
	Data  any    `json:"data"`
	Error *Error `json:"error"`
}

// Error represents an API error
type Error struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// Common error codes
const (
	ErrCodeBadRequest     = "BAD_REQUEST"
	ErrCodeUnauthorized   = "UNAUTHORIZED"
	ErrCodeForbidden      = "FORBIDDEN"
	ErrCodeNotFound       = "NOT_FOUND"
	ErrCodeConflict       = "CONFLICT"
	ErrCodeInternal       = "INTERNAL_ERROR"
	ErrCodeValidation     = "VALIDATION_ERROR"
)

// JSON sends a successful response with data
func JSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(Response{
		Data:  data,
		Error: nil,
	})
}

// Error sends an error response
func Err(w http.ResponseWriter, status int, code, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(Response{
		Data: nil,
		Error: &Error{
			Code:    code,
			Message: message,
		},
	})
}

// Convenience error functions

func BadRequest(w http.ResponseWriter, message string) {
	Err(w, http.StatusBadRequest, ErrCodeBadRequest, message)
}

func Unauthorized(w http.ResponseWriter, message string) {
	Err(w, http.StatusUnauthorized, ErrCodeUnauthorized, message)
}

func Forbidden(w http.ResponseWriter, message string) {
	Err(w, http.StatusForbidden, ErrCodeForbidden, message)
}

func NotFound(w http.ResponseWriter, message string) {
	Err(w, http.StatusNotFound, ErrCodeNotFound, message)
}

func Conflict(w http.ResponseWriter, message string) {
	Err(w, http.StatusConflict, ErrCodeConflict, message)
}

func InternalError(w http.ResponseWriter, message string) {
	Err(w, http.StatusInternalServerError, ErrCodeInternal, message)
}

func ValidationError(w http.ResponseWriter, message string) {
	Err(w, http.StatusBadRequest, ErrCodeValidation, message)
}
