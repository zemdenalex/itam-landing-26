"""Configuration loader from environment variables."""

import os
from dataclasses import dataclass
from typing import Optional


@dataclass
class Config:
    """Application configuration."""
    
    # Telegram API credentials
    api_id: int
    api_hash: str
    session_string: str
    channel_username: str
    
    # Redis connection
    redis_url: str
    
    # Update settings
    update_interval: int  # seconds
    posts_count: int  # number of recent posts to fetch
    
    # Logging
    log_level: str


def load_config() -> Config:
    """Load configuration from environment variables."""
    
    api_id_str = os.getenv("TG_API_ID")
    if not api_id_str:
        raise ValueError("TG_API_ID environment variable is required")
    
    api_hash = os.getenv("TG_API_HASH")
    if not api_hash:
        raise ValueError("TG_API_HASH environment variable is required")
    
    session_string = os.getenv("TG_SESSION_STRING")
    if not session_string:
        raise ValueError("TG_SESSION_STRING environment variable is required")
    
    channel_username = os.getenv("TG_CHANNEL_USERNAME", "itatmisis")
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    update_interval = int(os.getenv("TG_UPDATE_INTERVAL", "900"))  # 15 minutes default
    posts_count = int(os.getenv("TG_POSTS_COUNT", "5"))
    log_level = os.getenv("LOG_LEVEL", "INFO")
    
    return Config(
        api_id=int(api_id_str),
        api_hash=api_hash,
        session_string=session_string,
        channel_username=channel_username,
        redis_url=redis_url,
        update_interval=update_interval,
        posts_count=posts_count,
        log_level=log_level,
    )
