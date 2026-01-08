package database

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/redis/go-redis/v9"
)

type RedisDB struct {
	Client *redis.Client
}

func NewRedis(ctx context.Context, url string) (*RedisDB, error) {
	opts, err := redis.ParseURL(url)
	if err != nil {
		return nil, fmt.Errorf("failed to parse redis URL: %w", err)
	}

	client := redis.NewClient(opts)

	// Verify connection
	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to ping redis: %w", err)
	}

	slog.Info("connected to Redis", "addr", opts.Addr)

	return &RedisDB{Client: client}, nil
}

func (r *RedisDB) Close() error {
	if r.Client != nil {
		slog.Info("Redis connection closed")
		return r.Client.Close()
	}
	return nil
}

func (r *RedisDB) Health(ctx context.Context) error {
	return r.Client.Ping(ctx).Err()
}
