package middleware

import (
	"log/slog"
	"net/http"
	"strings"

	"github.com/itam-misis/itam-api/internal/auth"
	"github.com/itam-misis/itam-api/internal/response"
)

// Auth is middleware that validates JWT tokens
func Auth(authService *auth.Service) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Get Authorization header
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				response.Unauthorized(w, "authorization header required")
				return
			}

			// Check Bearer prefix
			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
				response.Unauthorized(w, "invalid authorization header format")
				return
			}

			tokenString := parts[1]

			// Validate token
			claims, err := authService.ValidateToken(tokenString)
			if err != nil {
				slog.Debug("token validation failed", "error", err)
				response.Unauthorized(w, "invalid or expired token")
				return
			}

			// Get user from database to ensure they still exist and are active
			user, err := authService.GetUserByID(r.Context(), claims.UserID)
			if err != nil {
				slog.Debug("user not found", "user_id", claims.UserID, "error", err)
				response.Unauthorized(w, "user not found")
				return
			}

			if !user.IsActive {
				response.Forbidden(w, "user account is not active")
				return
			}

			// Add user and claims to context
			ctx := auth.ContextWithClaims(r.Context(), claims)
			ctx = auth.ContextWithUser(ctx, user)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RequireAdmin is middleware that requires the user to be an admin
func RequireAdmin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !auth.IsAdmin(r.Context()) {
			response.Forbidden(w, "admin access required")
			return
		}
		next.ServeHTTP(w, r)
	})
}

// RequireRole is middleware that requires the user to have one of the specified roles
func RequireRole(roles ...string) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			userRole, ok := auth.GetUserRoleFromContext(r.Context())
			if !ok {
				response.Unauthorized(w, "not authenticated")
				return
			}

			for _, role := range roles {
				if userRole == role {
					next.ServeHTTP(w, r)
					return
				}
			}

			response.Forbidden(w, "insufficient permissions")
		})
	}
}
