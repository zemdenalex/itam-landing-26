"""Redis writer for storing Telegram data."""

import json
import logging
from datetime import datetime, timezone
from typing import Optional

import redis.asyncio as redis

from .collectors.stats import ChannelStats
from .collectors.posts import ChannelPost

logger = logging.getLogger(__name__)

# Redis keys (must match Go API expectations)
KEY_CHANNEL_STATS = "tg:channel:stats"
KEY_CHANNEL_POSTS = "tg:channel:posts"
KEY_LAST_UPDATE = "tg:last_update"


class RedisWriter:
    """Writes Telegram data to Redis."""
    
    def __init__(self, redis_url: str):
        self.redis_url = redis_url
        self.client: Optional[redis.Redis] = None
    
    async def connect(self) -> None:
        """Connect to Redis."""
        logger.info(f"Connecting to Redis...")
        
        self.client = redis.from_url(
            self.redis_url,
            encoding="utf-8",
            decode_responses=True,
        )
        
        # Test connection
        await self.client.ping()
        logger.info("Connected to Redis")
    
    async def disconnect(self) -> None:
        """Disconnect from Redis."""
        if self.client:
            await self.client.close()
            logger.info("Disconnected from Redis")
    
    async def health_check(self) -> bool:
        """Check Redis connection health."""
        if not self.client:
            return False
        try:
            await self.client.ping()
            return True
        except Exception:
            return False
    
    async def write_stats(self, stats: ChannelStats) -> None:
        """Write channel statistics to Redis."""
        if not self.client:
            raise RuntimeError("Redis client not connected")
        
        data = json.dumps(stats.to_dict(), ensure_ascii=False)
        await self.client.set(KEY_CHANNEL_STATS, data)
        logger.debug(f"Written stats to {KEY_CHANNEL_STATS}")
    
    async def write_posts(self, posts: list[ChannelPost]) -> None:
        """Write channel posts to Redis."""
        if not self.client:
            raise RuntimeError("Redis client not connected")
        
        data = json.dumps(
            [post.to_dict() for post in posts],
            ensure_ascii=False,
        )
        await self.client.set(KEY_CHANNEL_POSTS, data)
        logger.debug(f"Written {len(posts)} posts to {KEY_CHANNEL_POSTS}")
    
    async def update_timestamp(self) -> None:
        """Update last update timestamp."""
        if not self.client:
            raise RuntimeError("Redis client not connected")
        
        timestamp = datetime.now(timezone.utc).isoformat()
        await self.client.set(KEY_LAST_UPDATE, timestamp)
        logger.debug(f"Updated timestamp: {timestamp}")
    
    async def write_all(
        self,
        stats: ChannelStats,
        posts: list[ChannelPost],
    ) -> None:
        """Write all data atomically using pipeline."""
        if not self.client:
            raise RuntimeError("Redis client not connected")
        
        timestamp = datetime.now(timezone.utc).isoformat()
        
        async with self.client.pipeline(transaction=True) as pipe:
            pipe.set(KEY_CHANNEL_STATS, json.dumps(stats.to_dict(), ensure_ascii=False))
            pipe.set(KEY_CHANNEL_POSTS, json.dumps([p.to_dict() for p in posts], ensure_ascii=False))
            pipe.set(KEY_LAST_UPDATE, timestamp)
            await pipe.execute()
        
        logger.info(
            f"Written to Redis: stats + {len(posts)} posts "
            f"(timestamp: {timestamp})"
        )
