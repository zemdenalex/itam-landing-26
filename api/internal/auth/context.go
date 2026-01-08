package auth

import (
	"context"
)

// Context keys
type contextKey string

const (
	userContextKey   contextKey = "user"
	claimsContextKey contextKey = "claims"
)

// ContextWithUser adds a user to the context
func ContextWithUser(ctx context.Context, user *User) context.Context {
	return context.WithValue(ctx, userContextKey, user)
}

// GetUserFromContext retrieves the user from context
func GetUserFromContext(ctx context.Context) (*User, bool) {
	user, ok := ctx.Value(userContextKey).(*User)
	return user, ok
}

// ContextWithClaims adds claims to the context
func ContextWithClaims(ctx context.Context, claims *Claims) context.Context {
	return context.WithValue(ctx, claimsContextKey, claims)
}

// GetClaimsFromContext retrieves claims from context
func GetClaimsFromContext(ctx context.Context) (*Claims, bool) {
	claims, ok := ctx.Value(claimsContextKey).(*Claims)
	return claims, ok
}

// GetUserIDFromContext retrieves the user ID from context
func GetUserIDFromContext(ctx context.Context) (int64, bool) {
	claims, ok := GetClaimsFromContext(ctx)
	if !ok {
		return 0, false
	}
	return claims.UserID, true
}

// GetUserRoleFromContext retrieves the user role from context
func GetUserRoleFromContext(ctx context.Context) (string, bool) {
	claims, ok := GetClaimsFromContext(ctx)
	if !ok {
		return "", false
	}
	return claims.Role, true
}

// IsAdmin checks if the current user is an admin
func IsAdmin(ctx context.Context) bool {
	role, ok := GetUserRoleFromContext(ctx)
	return ok && role == "admin"
}
