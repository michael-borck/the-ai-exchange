# Multi-stage Dockerfile for The AI Exchange
# Builds frontend, serves both frontend and backend API from single container
FROM python:3.11-slim

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

# Expose backend port (serves both API and built frontend)
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health || exit 1

# Run FastAPI server
# The backend is configured to serve the built frontend from /app/frontend/dist
CMD [".venv/bin/uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
