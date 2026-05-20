# Multi-stage Dockerfile for The AI Exchange
# Builds frontend, serves both frontend and backend API from single container
FROM python:3.11-slim

LABEL org.opencontainers.image.source="https://github.com/michael-borck/the-ai-exchange"
LABEL org.opencontainers.image.description="The AI Exchange - AI use case sharing platform for SoMM"
LABEL org.opencontainers.image.licenses="MIT"

# Install Node.js, build tools, and other dependencies
RUN apt-get update && apt-get install -y \
    curl \
    gcc \
    g++ \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install uv for faster Python package management
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:$PATH"

# Set working directory
WORKDIR /app

# Copy everything
COPY . .

# ============================================
# Build Backend Python Environment
# ============================================
WORKDIR /app/backend

# Create and activate virtual environment, install dependencies
RUN uv venv .venv && \
    . .venv/bin/activate && \
    uv pip install .

# Create necessary directories for data persistence
RUN mkdir -p /app/data/db /app/data/uploads /app/data/logs && \
    chmod 755 /app/data

# ============================================
# Build Frontend
# ============================================
WORKDIR /app/frontend

# Install Node dependencies and build React app
RUN npm install && \
    npx vite build

# ============================================
# Final Setup
# ============================================
WORKDIR /app/backend

# Create non-root user and set ownership.
# UID/GID pinned to 999 so the host-side chown on the data volume stays stable
# across rebuilds. (Without -u/-g, useradd -r picks any free system UID, which
# can shift between base-image updates and break mounted volumes.)
RUN groupadd -r -g 999 appuser \
    && useradd -r -u 999 -g appuser -d /app -s /sbin/nologin appuser \
    && chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose backend port (serves both API and built frontend)
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health || exit 1

# Run FastAPI server
# The backend is configured to serve the built frontend from /app/frontend/dist
CMD [".venv/bin/uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
