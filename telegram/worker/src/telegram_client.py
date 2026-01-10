"""Telethon client wrapper for Telegram API access."""

import logging
from telethon import TelegramClient
from telethon.sessions import StringSession

from .config import Config

logger = logging.getLogger(__name__)


class TelegramClientWrapper:
    """Wrapper for Telethon client with session string support."""
    
    def __init__(self, config: Config):
        self.config = config
        self.client: TelegramClient | None = None
    
    async def connect(self) -> TelegramClient:
        """Connect to Telegram API using session string."""
        logger.info("Connecting to Telegram API...")
        
        self.client = TelegramClient(
            StringSession(self.config.session_string),
            self.config.api_id,
            self.config.api_hash,
        )
        
        await self.client.connect()
        
        if not await self.client.is_user_authorized():
            raise RuntimeError(
                "Session is not authorized. Please regenerate session string "
                "using scripts/generate_session.py"
            )
        
        me = await self.client.get_me()
        logger.info(f"Connected as: {me.first_name} (@{me.username})")
        
        return self.client
    
    async def disconnect(self):
        """Disconnect from Telegram API."""
        if self.client:
            await self.client.disconnect()
            logger.info("Disconnected from Telegram API")
    
    def get_client(self) -> TelegramClient:
        """Get the connected client instance."""
        if not self.client:
            raise RuntimeError("Client is not connected. Call connect() first.")
        return self.client
