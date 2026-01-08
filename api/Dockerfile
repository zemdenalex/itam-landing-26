# Build stage
FROM golang:1.22-alpine AS builder

WORKDIR /build

# Install dependencies for CGO (if needed) and certificates
RUN apk add --no-cache ca-certificates tzdata

# Copy go mod files first for better caching
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-w -s" \
    -o /build/api \
    ./cmd/api

# Final stage
FROM alpine:3.20

WORKDIR /app

# Install ca-certificates for HTTPS and tzdata for timezones
RUN apk --no-cache add ca-certificates tzdata

# Copy binary from builder
COPY --from=builder /build/api /app/api

# Copy migrations (will be added later)
COPY --from=builder /build/migrations /app/migrations

# Create non-root user
RUN adduser -D -g '' appuser
USER appuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

# Run binary
CMD ["/app/api"]
