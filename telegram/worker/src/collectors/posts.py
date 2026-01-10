"""Collector for recent Telegram channel posts."""

import logging
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from typing import Optional

from telethon import TelegramClient
from telethon.tl.types import (
    Channel,
    Message,
    MessageMediaPhoto,
    MessageMediaDocument,
    MessageMediaWebPage,
    ReactionEmoji,
    ReactionCustomEmoji,
)

logger = logging.getLogger(__name__)


@dataclass
class PostReactions:
    """Reactions on a post."""
    
    emoji_counts: dict[str, int]  # emoji -> count
    total: int


@dataclass  
class ChannelPost:
    """Single channel post data."""
    
    id: int
    text: str  # First 200 chars or media description
    date: str  # ISO format
    views: int
    forwards: int
    reactions: dict[str, int]  # emoji -> count
    reactions_total: int
    comments_count: int
    link: str
    has_media: bool
    media_type: Optional[str]  # photo, video, document, etc.
    
    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization."""
        return asdict(self)


class PostsCollector:
    """Collects recent posts from Telegram channel."""
    
    def __init__(self, client: TelegramClient, channel_username: str):
        self.client = client
        self.channel_username = channel_username
    
    async def collect(self, count: int = 5) -> list[ChannelPost]:
        """Collect recent posts from channel."""
        logger.info(f"Collecting {count} recent posts from @{self.channel_username}")
        
        try:
            channel = await self.client.get_entity(self.channel_username)
            
            if not isinstance(channel, Channel):
                raise ValueError(f"@{self.channel_username} is not a channel")
            
            posts = []
            
            async for message in self.client.iter_messages(channel, limit=count):
                if not isinstance(message, Message):
                    continue
                
                post = await self._parse_message(message)
                if post:
                    posts.append(post)
            
            logger.info(f"Collected {len(posts)} posts")
            return posts
            
        except Exception as e:
            logger.error(f"Failed to collect posts: {e}")
            raise
    
    async def _parse_message(self, message: Message) -> Optional[ChannelPost]:
        """Parse a Telegram message into ChannelPost."""
        try:
            # Get text content
            text = self._get_message_text(message)
            
            # Get media type
            has_media, media_type = self._get_media_info(message)
            
            # Get reactions
            reactions, reactions_total = self._get_reactions(message)
            
            # Get comments count (replies)
            comments_count = 0
            if message.replies:
                comments_count = message.replies.replies or 0
            
            # Build post link
            link = f"https://t.me/{self.channel_username}/{message.id}"
            
            return ChannelPost(
                id=message.id,
                text=text[:200] if text else "",
                date=message.date.isoformat() if message.date else datetime.now(timezone.utc).isoformat(),
                views=message.views or 0,
                forwards=message.forwards or 0,
                reactions=reactions,
                reactions_total=reactions_total,
                comments_count=comments_count,
                link=link,
                has_media=has_media,
                media_type=media_type,
            )
            
        except Exception as e:
            logger.warning(f"Failed to parse message {message.id}: {e}")
            return None
    
    def _get_message_text(self, message: Message) -> str:
        """Extract text from message, handling media posts."""
        # Primary text content
        if message.text:
            return message.text
        
        # Caption for media
        if message.message:
            return message.message
        
        # Fallback for media-only posts
        if message.media:
            media_type = self._get_media_type(message.media)
            return f"[{media_type}] Post #{message.id}"
        
        return f"Post #{message.id}"
    
    def _get_media_info(self, message: Message) -> tuple[bool, Optional[str]]:
        """Get media presence and type."""
        if not message.media:
            return False, None
        
        media_type = self._get_media_type(message.media)
        return True, media_type
    
    def _get_media_type(self, media) -> str:
        """Determine media type string."""
        if isinstance(media, MessageMediaPhoto):
            return "photo"
        elif isinstance(media, MessageMediaDocument):
            if media.document:
                mime = getattr(media.document, 'mime_type', '')
                if 'video' in mime:
                    return "video"
                elif 'audio' in mime:
                    return "audio"
                elif 'gif' in mime or media.document.attributes:
                    # Check for GIF
                    for attr in media.document.attributes:
                        if hasattr(attr, 'round_message') and attr.round_message:
                            return "video_note"
                    return "document"
            return "document"
        elif isinstance(media, MessageMediaWebPage):
            return "link"
        else:
            return "other"
    
    def _get_reactions(self, message: Message) -> tuple[dict[str, int], int]:
        """Extract reactions from message."""
        reactions: dict[str, int] = {}
        total = 0
        
        if not message.reactions or not message.reactions.results:
            return reactions, total
        
        for reaction_count in message.reactions.results:
            count = reaction_count.count or 0
            total += count
            
            # Get emoji string
            reaction = reaction_count.reaction
            if isinstance(reaction, ReactionEmoji):
                emoji = reaction.emoticon
                reactions[emoji] = count
            elif isinstance(reaction, ReactionCustomEmoji):
                # Custom emoji - use ID as fallback
                reactions[f"custom:{reaction.document_id}"] = count
        
        return reactions, total
