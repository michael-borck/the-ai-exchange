# Docker Deployment Guide for The AI Exchange

This guide explains how to deploy The AI Exchange using Docker on a VPS or any server with Docker installed.

## Quick Start

```bash
# 1. Clone/pull the repository
git clone <repo-url>
cd the-ai-exchange

# 2. Create environment file
cp .env.docker.example backend/.env
# Edit backend/.env with your settings

# 3. Create Caddy network (if not already created)
docker network create caddy_default

# 4. Build and start
docker compose up -d

# 5. View logs
docker compose logs -f
```

The application will be available on `http://localhost:8000` and ready to be reverse proxied.

## Architecture

```
┌─────────────────────────────────┐
│   VPS (Caddy/Nginx)             │
│   Reverse Proxy on Port 443     │
│   yourdomain.com → localhost:8000
└──────────────┬──────────────────┘
               │ Forward to
               ▼
┌─────────────────────────────────┐
│   Docker Container              │
│   The AI Exchange               │
│   - Python 3.11 Backend         │
│   - Built React Frontend        │
│   - Port 8000 (internal)        │
└─────────────────────────────────┘
    │
    ├─ SQLite Database
    ├─ Uploads Storage
    └─ Logs
```

### How It Works

1. **Docker Container**: Builds and serves both the React frontend and FastAPI backend
2. **Frontend**: Built at Docker build time, served as static files by FastAPI
3. **Backend**: Runs on port 8000, serves API and static frontend
4. **Reverse Proxy**: Caddy or Nginx on the host handles HTTPS and domain routing
5. **Frontend API Calls**: The built React app uses `http://localhost:8000/api/v1` internally (Docker network)

## Configuration

### 1. Environment Variables

Edit `backend/.env` based on `.env.docker.example`:

```bash
cp .env.docker.example backend/.env
nano backend/.env
```

**Critical settings to change:**

- `SECRET_KEY`: Generate with `python3 -c "import secrets; print(secrets.token_urlsafe(32))"`
- `ALLOWED_DOMAINS`: Your institution's email domain (e.g., `curtin.edu.au`)
- `ALLOWED_ORIGINS`: Your VPS domain (e.g., `https://ai-exchange.yourdomain.com`)
- `DATABASE_URL`: Can stay as-is (SQLite with persistent volume)

**Optional settings:**

- `SMTP_*`: Configure if you want email verification
- `EMAIL_WHITELIST`: Specific emails allowed (overrides domain)
- `LOG_LEVEL`: Set to `DEBUG` for troubleshooting

### 2. Create Caddy Network

Docker Compose expects the Caddy network to exist:

```bash
docker network create caddy_default
```

Or if you're using a different reverse proxy, modify `docker-compose.yml`:

```yaml
networks:
  my_network:
    external: true
```

Then start with: `docker network create my_network`

### 3. Create Data Directories

The container expects these directories for persistent data:

```bash
mkdir -p ./data/db ./data/uploads ./data/logs
```

These are automatically mounted in the Docker container and survive restarts.

## Deployment

### Local Development (Testing)

```bash
# Build and start
docker compose up --build

# View logs in real-time
docker compose logs -f app

# Stop
docker compose down

# Stop and remove volumes (careful!)
docker compose down -v
```

### VPS Deployment

#### 1. On Your VPS

```bash
# SSH into VPS
ssh user@your-vps

# Clone repository
git clone <repo-url>
cd the-ai-exchange

# Create environment file
cp .env.docker.example backend/.env
nano backend/.env  # Edit with production settings

# Create Caddy network
docker network create caddy_default

# Start with docker compose
docker compose up -d

# Verify it's running
docker compose ps
docker compose logs
```

#### 2. Configure Caddy (Reverse Proxy)

Create `Caddyfile` on your VPS:

```caddyfile
ai-exchange.yourdomain.com {
    reverse_proxy localhost:8000 {
        # Headers to pass through
        header_up X-Forwarded-For {http.request.header.X-Forwarded-For}
        header_up X-Forwarded-Proto {http.request.scheme}
    }
}
```

Then run Caddy:

```bash
caddy start
```

Or use Caddy in Docker:

```bash
docker run -d \
  --name caddy \
  -p 80:80 -p 443:443 \
  -v /path/to/Caddyfile:/etc/caddy/Caddyfile \
  -v caddy_data:/data \
  -v caddy_config:/config \
  --network caddy_default \
  caddy:latest
```

#### 3. Configure Nginx (Alternative)

If using Nginx instead:

```nginx
upstream ai_exchange {
    server localhost:8000;
}

server {
    listen 80;
    server_name ai-exchange.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ai-exchange.yourdomain.com;

    ssl_certificate /path/to/cert.crt;
    ssl_certificate_key /path/to/key.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://ai_exchange;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support (if needed)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Maintenance

### View Logs

```bash
# Real-time logs
docker compose logs -f app

# Last 100 lines
docker compose logs --tail=100 app

# Filter by service
docker compose logs api
```

### Access Database

The SQLite database is stored in `./data/db/ai_exchange.db`:

```bash
sqlite3 ./data/db/ai_exchange.db

# Or from inside container
docker compose exec app sqlite3 /app/data/db/ai_exchange.db
```

### Update Application

```bash
# Pull latest code
git pull

# Rebuild and restart
docker compose up -d --build

# Or with no cache
docker compose build --no-cache
docker compose up -d
```

### Backup Data

```bash
# Backup database and uploads
tar -czf ai-exchange-backup-$(date +%Y%m%d).tar.gz ./data/

# Restore
tar -xzf ai-exchange-backup-20240101.tar.gz
```

### Restart Services

```bash
# Restart all
docker compose restart

# Restart specific service
docker compose restart app

# Full restart (stop + start)
docker compose down
docker compose up -d
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker compose logs app

# Common issues:
# - PORT_ALREADY_IN_USE: Change port in docker-compose.yml
# - PERMISSION_DENIED: Check file permissions in ./data/
# - NETWORK_NOT_FOUND: Create caddy network: docker network create caddy_default
```

### Frontend not loading (blank page)

```bash
# Check if frontend dist directory was built
docker compose exec app ls -la /app/frontend/dist/

# Verify mounting in logs
docker compose logs | grep -i "mounting\|static\|frontend"

# Rebuild frontend
docker compose build --no-cache
docker compose up -d
```

### Database errors

```bash
# Check database file
ls -lh ./data/db/ai_exchange.db

# Check permissions
chmod 755 ./data/db

# Clear and restart (careful - removes all data)
rm ./data/db/ai_exchange.db
docker compose restart
```

### Connection issues

```bash
# Test container network
docker compose exec app curl http://localhost:8000/health

# Test API endpoint
docker compose exec app curl http://localhost:8000/api/v1/

# Check network connectivity
docker network inspect caddy_default
```

## Performance Tips

### 1. Database Optimization

SQLite is good for small to medium deployments. For high traffic, consider PostgreSQL:

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: ...
      POSTGRES_DB: ai_exchange
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
```

Update `DATABASE_URL` in `.env`:
```
DATABASE_URL=postgresql://user:password@postgres:5432/ai_exchange
```

### 2. Caching

Frontend files are served statically and can be cached aggressively. Caddy handles this automatically.

### 3. Resource Limits

Add resource limits to Docker container:

```yaml
# docker-compose.yml
services:
  app:
    # ... other config
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 256M
```

## Security Checklist

- [ ] Change `SECRET_KEY` in `.env`
- [ ] Set `DEBUG=false` in production
- [ ] Configure `ALLOWED_ORIGINS` with your domain only
- [ ] Configure `ALLOWED_DOMAINS` for your institution
- [ ] Use HTTPS (Caddy/Nginx handles this)
- [ ] Never commit `.env` file to git
- [ ] Set strong database passwords if using PostgreSQL
- [ ] Configure SMTP for secure email if enabled
- [ ] Regularly update Docker images: `docker pull python:3.11-slim`, `docker pull node:20`
- [ ] Monitor logs for security issues

## Support

For issues or questions:

1. Check logs: `docker compose logs -f app`
2. Check DOCKER_DEPLOYMENT.md (this file)
3. Visit `/support` page in application for help links
4. Email: michael.borck@curtin.edu.au
