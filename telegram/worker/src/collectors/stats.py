"""Collector for Telegram channel statistics."""

import logging
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from typing import Optional

from telethon import TelegramClient
from telethon.tl.functions.channels import GetFullChannelRequest
from telethon.tl.types import Channel

logger = logging.getLogger(__name__)


@dataclass
class ChannelStats:
    """Channel statistics data."""
    
    channel_id: int
    username: str
    title: str
    subscribers_count: int
    posts_count: int
    last_post_date: Optional[str]  # ISO format
    collected_at: str  # ISO format
    
    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization."""
        return asdict(self)


class StatsCollector:
    """Collects channel statistics using Telethon."""
    
    def __init__(self, client: TelegramClient, channel_username: str):
        self.client = client
        self.channel_username = channel_username
    
    async def collect(self) -> ChannelStats:
        """Collect channel statistics."""
        logger.info(f"Collecting stats for @{self.channel_username}")
        
        try:
            # Get channel entity
            channel = await self.client.get_entity(self.channel_username)
            
            if not isinstance(channel, Channel):
                raise ValueError(f"@{self.channel_username} is not a channel")
            
            # Get full channel info (includes subscriber count)
            full_channel = await self.client(GetFullChannelRequest(channel))
            
            # Get last message date
            last_post_date = None
            async for message in self.client.iter_messages(channel, limit=1):
                if message.date:
                    last_post_date = message.date.isoformat()
            
            # Count total posts (approximate - iterating all is slow)
            # Use the message ID of the last message as approximate count
            posts_count = 0
            async for message in self.client.iter_messages(channel, limit=1):
                posts_count = message.id
            
            stats = ChannelStats(
                channel_id=channel.id,
                username=self.channel_username,
                title=channel.title,
                subscribers_count=full_channel.full_chat.participants_count or 0,
                posts_count=posts_count,
                last_post_date=last_post_date,
                collected_at=datetime.now(timezone.utc).isoformat(),
            )
            
            logger.info(
                f"Stats collected: {stats.subscribers_count} subscribers, "
                f"~{stats.posts_count} posts"
            )
            
            return stats
            
        except Exception as e:
            logger.error(f"Failed to collect channel stats: {e}")
            raise
