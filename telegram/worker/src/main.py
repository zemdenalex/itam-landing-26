"""
ITAM Telegram Stats Collector

Collects statistics and recent posts from @itatmisis Telegram channel
and stores them in Redis for the Go API to serve.
"""

import asyncio
import logging
import signal
import sys
from datetime import datetime, timezone

from telethon.errors import FloodWaitError

from .config import load_config, Config
from .telegram_client import TelegramClientWrapper
from .collectors import StatsCollector, PostsCollector
from .redis_writer import RedisWriter

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


class TelegramStatsWorker:
    """Main worker that collects and stores Telegram stats."""
    
    def __init__(self, config: Config):
        self.config = config
        self.telegram_wrapper = TelegramClientWrapper(config)
        self.redis_writer = RedisWriter(config.redis_url)
        self.running = False
        self.consecutive_failures = 0
        self.max_failures = 5
    
    async def start(self) -> None:
        """Start the worker."""
        logger.info("Starting Telegram Stats Worker...")
        logger.info(f"Channel: @{self.config.channel_username}")
        logger.info(f"Update interval: {self.config.update_interval} seconds")
        
        # Connect to services
        await self._connect_with_retry()
        
        self.running = True
        
        # Run initial collection
        await self._collect_and_store()
        
        # Start scheduler loop
        await self._scheduler_loop()
    
    async def stop(self) -> None:
        """Stop the worker gracefully."""
        logger.info("Stopping worker...")
        self.running = False
        
        await self.telegram_wrapper.disconnect()
        await self.redis_writer.disconnect()
        
        logger.info("Worker stopped")
    
    async def _connect_with_retry(self, max_retries: int = 5) -> None:
        """Connect to Telegram and Redis with retry logic."""
        
        # Connect to Redis first (required)
        for attempt in range(max_retries):
            try:
                await self.redis_writer.connect()
                break
            except Exception as e:
                logger.error(f"Redis connection failed (attempt {attempt + 1}/{max_retries}): {e}")
                if attempt == max_retries - 1:
                    logger.critical("Cannot connect to Redis after max retries. Exiting.")
                    sys.exit(1)
                await asyncio.sleep(5 * (attempt + 1))
        
        # Connect to Telegram
        for attempt in range(max_retries):
            try:
                await self.telegram_wrapper.connect()
                break
            except Exception as e:
                logger.error(f"Telegram connection failed (attempt {attempt + 1}/{max_retries}): {e}")
                if attempt == max_retries - 1:
                    logger.critical("Cannot connect to Telegram after max retries. Exiting.")
                    sys.exit(1)
                await asyncio.sleep(5 * (attempt + 1))
    
    async def _scheduler_loop(self) -> None:
        """Main scheduler loop."""
        while self.running:
            try:
                # Wait for next update interval
                logger.info(f"Next update in {self.config.update_interval} seconds")
                await asyncio.sleep(self.config.update_interval)
                
                if not self.running:
                    break
                
                # Collect and store
                await self._collect_and_store()
                
            except asyncio.CancelledError:
                logger.info("Scheduler cancelled")
                break
            except Exception as e:
                logger.error(f"Scheduler error: {e}")
                await asyncio.sleep(60)  # Wait a bit before retrying
    
    async def _collect_and_store(self) -> None:
        """Collect data from Telegram and store in Redis."""
        logger.info(f"Starting collection at {datetime.now(timezone.utc).isoformat()}")
        
        try:
            client = self.telegram_wrapper.get_client()
            
            # Collect stats
            stats_collector = StatsCollector(client, self.config.channel_username)
            stats = await stats_collector.collect()
            
            # Collect posts
            posts_collector = PostsCollector(client, self.config.channel_username)
            posts = await posts_collector.collect(count=self.config.posts_count)
            
            # Write to Redis
            await self.redis_writer.write_all(stats, posts)
            
            # Reset failure counter on success
            self.consecutive_failures = 0
            
            logger.info("Collection completed successfully")
            
        except FloodWaitError as e:
            # Telegram rate limit - wait as requested
            wait_seconds = e.seconds
            logger.warning(f"Telegram FloodWait: waiting {wait_seconds} seconds")
            await asyncio.sleep(wait_seconds)
            
        except Exception as e:
            self.consecutive_failures += 1
            logger.error(f"Collection failed ({self.consecutive_failures}/{self.max_failures}): {e}")
            
            if self.consecutive_failures >= self.max_failures:
                logger.critical(
                    f"Too many consecutive failures ({self.max_failures}). "
                    "Check Telegram/Redis connectivity. Exiting for container restart."
                )
                sys.exit(1)


async def main() -> None:
    """Main entry point."""
    
    # Load configuration
    try:
        config = load_config()
    except ValueError as e:
        logger.critical(f"Configuration error: {e}")
        sys.exit(1)
    
    # Set log level from config
    logging.getLogger().setLevel(config.log_level)
    
    # Create worker
    worker = TelegramStatsWorker(config)
    
    # Setup signal handlers for graceful shutdown
    loop = asyncio.get_event_loop()
    
    def signal_handler():
        logger.info("Received shutdown signal")
        asyncio.create_task(worker.stop())
    
    for sig in (signal.SIGTERM, signal.SIGINT):
        loop.add_signal_handler(sig, signal_handler)
    
    # Run worker
    try:
        await worker.start()
    except Exception as e:
        logger.critical(f"Worker crashed: {e}")
        await worker.stop()
        sys.exit(1)


def run():
    """Entry point for running as module."""
    asyncio.run(main())


if __name__ == "__main__":
    run()
