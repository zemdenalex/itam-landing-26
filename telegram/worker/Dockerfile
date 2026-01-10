# Python Telegram Stats Worker
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies (for cryptography/telethon)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY src/ ./src/

# Create non-root user
RUN useradd --create-home --shell /bin/bash appuser
USER appuser

# Health check - verify Redis connectivity
HEALTHCHECK --interval=60s --timeout=10s --start-period=30s --retries=3 \
    CMD python -c "import redis; r=redis.from_url('${REDIS_URL}'); r.ping()" || exit 1

# Run the worker
CMD ["python", "-m", "src.main"]
