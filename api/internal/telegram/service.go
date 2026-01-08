package telegram

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"time"

	"github.com/redis/go-redis/v9"
)

var (
	ErrNoData      = errors.New("no telegram data available")
	ErrInvalidData = errors.New("invalid telegram data in cache")
)

// Service handles Telegram data from Redis
type Service struct {
	redis *redis.Client
}

// NewService creates a new telegram service
func NewService(redisClient *redis.Client) *Service {
	return &Service{redis: redisClient}
}

// GetStats retrieves channel statistics from Redis
func (s *Service) GetStats(ctx context.Context) (*ChannelStats, error) {
	data, err := s.redis.Get(ctx, KeyChannelStats).Bytes()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return nil, ErrNoData
		}
		return nil, err
	}

	var stats ChannelStats
	if err := json.Unmarshal(data, &stats); err != nil {
		slog.Error("failed to unmarshal telegram stats", "error", err)
		return nil, ErrInvalidData
	}

	return &stats, nil
}

// GetPosts retrieves recent posts from Redis
func (s *Service) GetPosts(ctx context.Context) ([]ChannelPost, error) {
	data, err := s.redis.Get(ctx, KeyChannelPosts).Bytes()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return nil, ErrNoData
		}
		return nil, err
	}

	var posts []ChannelPost
	if err := json.Unmarshal(data, &posts); err != nil {
		slog.Error("failed to unmarshal telegram posts", "error", err)
		return nil, ErrInvalidData
	}

	if posts == nil {
		posts = []ChannelPost{}
	}

	return posts, nil
}

// GetLastUpdate retrieves the timestamp of last data update
func (s *Service) GetLastUpdate(ctx context.Context) (*time.Time, error) {
	data, err := s.redis.Get(ctx, KeyLastUpdate).Result()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return nil, nil
		}
		return nil, err
	}

	// Try RFC3339 first (Python's isoformat)
	t, err := time.Parse(time.RFC3339, data)
	if err != nil {
		// Try without timezone
		t, err = time.Parse("2006-01-02T15:04:05", data)
		if err != nil {
			return nil, err
		}
	}

	return &t, nil
}

// GetAll retrieves all telegram data (stats + posts + timestamp)
func (s *Service) GetAll(ctx context.Context) (*TelegramData, error) {
	// Use pipeline for efficiency
	pipe := s.redis.Pipeline()

	statsCmd := pipe.Get(ctx, KeyChannelStats)
	postsCmd := pipe.Get(ctx, KeyChannelPosts)
	updateCmd := pipe.Get(ctx, KeyLastUpdate)

	_, err := pipe.Exec(ctx)
	if err != nil && !errors.Is(err, redis.Nil) {
		return nil, err
	}

	result := &TelegramData{
		Posts: []ChannelPost{},
	}

	// Parse stats
	if statsData, err := statsCmd.Bytes(); err == nil {
		var stats ChannelStats
		if json.Unmarshal(statsData, &stats) == nil {
			result.Stats = &stats
		}
	}

	// Parse posts
	if postsData, err := postsCmd.Bytes(); err == nil {
		var posts []ChannelPost
		if json.Unmarshal(postsData, &posts) == nil {
			result.Posts = posts
		}
	}

	// Parse timestamp
	if updateData, err := updateCmd.Result(); err == nil {
		if t, err := time.Parse(time.RFC3339, updateData); err == nil {
			result.LastUpdate = &t
		}
	}

	// Return error only if no data at all
	if result.Stats == nil && len(result.Posts) == 0 {
		return nil, ErrNoData
	}

	return result, nil
}

// ForceRefresh is a placeholder - actual refresh is done by Python worker
// In the future, this could send a message to trigger immediate refresh
func (s *Service) ForceRefresh(ctx context.Context) error {
	slog.Info("telegram data refresh requested (handled by Python worker)")
	return nil
}

// IsDataFresh checks if data was updated within the given duration
func (s *Service) IsDataFresh(ctx context.Context, maxAge time.Duration) bool {
	lastUpdate, err := s.GetLastUpdate(ctx)
	if err != nil || lastUpdate == nil {
		return false
	}
	return time.Since(*lastUpdate) < maxAge
}
