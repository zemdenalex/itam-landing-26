package telegram

import "time"

// ChannelStats represents Telegram channel statistics from Redis
type ChannelStats struct {
	ChannelID        int64   `json:"channel_id"`
	Username         string  `json:"username"`
	Title            string  `json:"title"`
	SubscribersCount int     `json:"subscribers_count"`
	PostsCount       int     `json:"posts_count"`
	LastPostDate     *string `json:"last_post_date,omitempty"`
	CollectedAt      string  `json:"collected_at"`
}

// ChannelPost represents a single Telegram post from Redis
type ChannelPost struct {
	ID             int            `json:"id"`
	Text           string         `json:"text"`
	Date           string         `json:"date"`
	Views          int            `json:"views"`
	Forwards       int            `json:"forwards"`
	Reactions      map[string]int `json:"reactions"`
	ReactionsTotal int            `json:"reactions_total"`
	CommentsCount  int            `json:"comments_count"`
	Link           string         `json:"link"`
	HasMedia       bool           `json:"has_media"`
	MediaType      *string        `json:"media_type,omitempty"`
}

// TelegramData combines stats and posts for API response
type TelegramData struct {
	Stats      *ChannelStats `json:"stats"`
	Posts      []ChannelPost `json:"posts"`
	LastUpdate *time.Time    `json:"last_update,omitempty"`
}

// Redis keys (must match Python worker)
const (
	KeyChannelStats = "tg:channel:stats"
	KeyChannelPosts = "tg:channel:posts"
	KeyLastUpdate   = "tg:last_update"
)
