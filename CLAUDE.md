# Development Guidelines for The AI Exchange

This document provides instructions for Claude Code to understand the project structure, tooling, and development practices.

---

## Project Overview

**The AI Exchange** is a full-stack web application built for the **School of Marketing and Management (SoMM)** to facilitate the discovery, sharing, and discussion of Artificial Intelligence use cases and applications in marketing and management contexts.

- **Organisation:** School of Marketing and Management (SoMM) at Curtin University
- **Domain:** @curtin.edu.au
- **Tech Stack:** FastAPI (Python 3.11+) + React 18+ (TypeScript)
- **Database:** SQLite (MVP) / PostgreSQL (Production)
- **Tooling:** uv, ruff, mypy, pytest, Chakra UI, Vitest
- **Documentation:**
  - `docs/srs.md` - Software Requirements Specification
  - `docs/IMPLEMENTATION_PLAN.md` - 10-phase implementation roadmap
  - `CLAUDE.md` - This file (development guidelines)

---

## Development Tools & Configuration

### Backend (Python)

**Environment Management:** `uv`
```bash
# Install uv (if not already installed)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Create virtual environment
uv venv

# Activate
source .venv/bin/activate  # macOS/Linux
# or
.venv\Scripts\activate  # Windows

# Install dependencies
uv pip install -r backend/requirements.txt

# Sync exact versions
uv sync
```

**Code Formatting & Linting:** `ruff`
```bash
# Format code
ruff format backend/

# Lint code
ruff check backend/ --fix
```

**Type Checking:** `mypy`
```bash
# Run type checker
mypy backend/app --strict
```

**Testing:** `pytest`
```bash
# Run all tests
pytest backend/tests -v

# Run with coverage
pytest backend/tests --cov=backend/app

# Run specific test file
pytest backend/tests/test_api.py
```

### Frontend (React/TypeScript)

**Package Management:** `npm` or `pnpm`
```bash
cd frontend
npm install
npm run dev      # Start dev server
npm run build    # Build for production
npm run lint     # Run ESLint
npm run format   # Format with Prettier
npm run test     # Run Vitest
```

**Code Formatting:** `Prettier`
- Automatically formats on save (via VS Code extension)
- Configuration in `frontend/.prettierrc.json`

**Linting:** `ESLint` with TypeScript support
- Ensures code quality and catches errors
- Configuration in `frontend/.eslintrc.cjs`

**Testing:** `Vitest`
```bash
npm run test           # Run tests
npm run test:ui       # Run with UI
npm run test:coverage # Run with coverage report
```

---

## Project Structure

```
the-ai-exchange/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── models.py            # SQLModel database models
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py          # Auth endpoints
│   │   │   ├── resources.py     # Resource CRUD endpoints
│   │   │   ├── subscriptions.py # Subscription endpoints
│   │   │   └── users.py         # User endpoints
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py        # Configuration & secrets
│   │   │   ├── security.py      # Auth, hashing, JWT
│   │   │   └── email.py         # Email service (mocked)
│   │   └── services/
│   │       ├── __init__.py
│   │       ├── auto_tagger.py   # YAKE keyword extraction
│   │       ├── database.py      # DB connection & utilities
│   │       └── notifications.py # Email notification logic
│   ├── tests/
│   │   ├── test_api.py          # API endpoint tests
│   │   ├── test_auth.py         # Auth tests
│   │   ├── test_models.py       # Model tests
│   │   └── conftest.py          # Pytest fixtures
│   ├── requirements.txt         # Python dependencies
│   ├── pyproject.toml          # Python project config (uv, ruff, mypy, pytest)
│   └── .env.example            # Environment template
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ResourceCard.tsx        # Resource list item
│   │   │   ├── ResourceDetail.tsx      # Full resource view
│   │   │   ├── FilterSidebar.tsx       # Filter panel
│   │   │   ├── SearchBar.tsx           # Search input
│   │   │   ├── SolutionForm.tsx        # Solution submission form
│   │   │   ├── Header.tsx              # Navigation header
│   │   │   └── index.ts                # Component exports
│   │   ├── hooks/
│   │   │   ├── useAuth.ts              # Auth context & hook
│   │   │   ├── useResources.ts         # Resource queries
│   │   │   ├── useNotifications.ts     # Notification prefs
│   │   │   └── index.ts                # Hook exports
│   │   ├── pages/
│   │   │   ├── Home.tsx                # Main catalogue view
│   │   │   ├── Login.tsx               # Auth page
│   │   │   ├── Register.tsx            # Registration page
│   │   │   ├── SubmitResource.tsx      # Post new resource
│   │   │   ├── Profile.tsx             # User profile & prefs
│   │   │   └── NotFound.tsx            # 404 page
│   │   ├── App.tsx                     # Root component
│   │   ├── main.tsx                    # Vite entry point
│   │   └── index.css                   # Global styles
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── .eslintrc.cjs
│   ├── .prettierrc.json
│   ├── vitest.config.ts
│   └── .env.example
│
├── docs/
│   ├── srs.md                   # Software Requirements Specification
│   └── IMPLEMENTATION_PLAN.md   # Detailed implementation phases
│
├── docker-compose.yml           # Docker Compose for VPS deployment
├── LICENSE                      # MIT License
├── README.md                    # Project overview
├── CLAUDE.md                    # This file
└── .gitignore                   # Git ignore rules
```

---

## Code Style & Standards

### Python

- **Imports:** Follow PEP 8 order (stdlib, third-party, local)
- **Naming:** snake_case for functions/variables, PascalCase for classes
- **Type Hints:** Always use type hints (required for mypy strict mode)
- **Docstrings:** Use triple-quoted strings for functions and classes
- **Line Length:** Max 100 characters (configured in ruff)
- **Format:** Run `ruff format` before committing

Example:
```python
from typing import Optional
from fastapi import APIRouter, Depends

router = APIRouter(prefix="/api/v1")

def get_current_user(token: str) -> dict:
    """Extract and validate current user from JWT token."""
    # Implementation
    pass

@router.post("/resources")
async def create_resource(
    title: str,
    content: str,
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Create a new resource."""
    # Implementation
    pass
```

### React/TypeScript

- **Imports:** Group by: React, third-party, components, hooks, types
- **Naming:** PascalCase for components, camelCase for functions/variables
- **Props:** Define interfaces for all component props
- **Hooks:** Prefix custom hooks with `use` (e.g., `useAuth`)
- **Files:** One component per file, colocate tests
- **Format:** Run `npx prettier --write` before committing

Example:
```typescript
import React, { useState } from "react";
import { Box, Button } from "@chakra-ui/react";
import { useResources } from "../hooks";

interface ResourceCardProps {
  id: string;
  title: string;
  author: string;
  isAnonymous: boolean;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  id,
  title,
  author,
  isAnonymous,
}) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    // Implementation
    setLoading(false);
  };

  return (
    <Box p={4} borderWidth={1} borderRadius="md">
      <h3>{title}</h3>
      <p>{isAnonymous ? "Faculty Member" : author}</p>
      <Button onClick={handleClick} isLoading={loading}>
        View
      </Button>
    </Box>
  );
};
```

---

## Testing Standards

### Backend (pytest)

- **Location:** `backend/tests/` directory
- **Naming:** `test_*.py` files with `test_*` functions
- **Fixtures:** Use `conftest.py` for shared fixtures
- **Coverage:** Aim for 80%+ code coverage

Example:
```python
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@pytest.fixture
def test_user():
    return {"email": "test@school.edu", "id": "123"}

def test_create_resource(test_user):
    response = client.post(
        "/api/v1/resources",
        json={"title": "Test", "content": "Content"},
        headers={"Authorization": f"Bearer {test_user['id']}"}
    )
    assert response.status_code == 201
```

### Frontend (Vitest)

- **Location:** Colocated with components (e.g., `ResourceCard.test.tsx`)
- **Naming:** `*.test.tsx` or `*.spec.tsx` files
- **Mocking:** Use `vi` for mocking API calls
- **Coverage:** Aim for 70%+ code coverage

Example:
```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResourceCard } from "./ResourceCard";

describe("ResourceCard", () => {
  it("displays resource title", () => {
    render(
      <ResourceCard
        id="1"
        title="Test Resource"
        author="John Doe"
        isAnonymous={false}
      />
    );
    expect(screen.getByText("Test Resource")).toBeInTheDocument();
  });
});
```

---

## Database & Models

### SQLModel

All models inherit from SQLModel and use SQLAlchemy table args:

```python
from sqlmodel import SQLModel, Field
from typing import Optional
from uuid import UUID, uuid4

class User(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    email: str = Field(unique=True, index=True)
    full_name: str
    hashed_password: str
    role: str = Field(default="STAFF")  # STAFF or ADMIN
    notification_prefs: dict = Field(default={"notify_requests": True})
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

---

## API Response Pattern

Always return consistent JSON responses:

```python
# Success
{
  "success": True,
  "data": { /* resource data */ },
  "message": "Resource created successfully"
}

# Error
{
  "success": False,
  "error": "resource_not_found",
  "message": "The requested resource was not found",
  "status_code": 404
}
```

---

## Git Workflow

### Commit Messages

Follow conventional commits format:
```
type(scope): subject

body (optional)

footer (optional)
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:
```
feat(auth): add email/password authentication

- Implement JWT token generation
- Add password hashing with bcrypt
- Add auth middleware to protected routes

Closes #5
```

```
fix(api): correct resource filter logic
```

### Before Committing

1. Run linting/formatting: `ruff format && ruff check --fix`
2. Run type checking: `mypy backend/app --strict`
3. Run tests: `pytest backend/tests -v`
4. Review changes: `git diff`

---

## Environment Configuration

### Backend `.env`
```ini
# General
PROJECT_NAME="The AI Exchange"
API_V1_STR="/api/v1"
SECRET_KEY="your-super-secret-key-min-32-chars"
DEBUG=true

# Database
DATABASE_URL="sqlite:///./ai_exchange.db"

# Email (Mocked for MVP)
SMTP_SERVER="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@school.edu"
SMTP_PASSWORD="your-app-password"

# Domain Whitelist
ALLOWED_DOMAINS=["school.edu"]

# CORS
ALLOWED_ORIGINS=["http://localhost:5173", "http://localhost:3000"]
```

### Frontend `.env`
```
VITE_API_URL=http://localhost:8000
VITE_API_VERSION=v1
```

---

## Running the Application

### Local Development

**Terminal 1 - Backend:**
```bash
cd backend

# Create and activate virtual environment (first time only)
uv venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows

# Install dependencies
uv pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env
# ALLOWED_DOMAINS is already set to curtin.edu.au

# Run development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend

# Copy and configure environment
cp .env.example .env
# Edit .env if needed for your environment

# Install dependencies and start dev server
npm install
npm run dev
```

**Access Points:**
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs
- **API Redoc:** http://localhost:8000/redoc

---

## Useful Commands Reference

### Backend
```bash
# Linting
ruff check backend/

# Formatting
ruff format backend/

# Type checking
mypy backend/app --strict

# Testing
pytest backend/tests -v --cov

# Run server
uvicorn app.main:app --reload
```

### Frontend
```bash
# Install
npm install

# Dev server
npm run dev

# Build
npm run build

# Lint
npm run lint

# Format
npm run format

# Test
npm run test
```

---

## Documentation References

- **SRS:** `docs/srs.md` - Complete requirements specification
- **Implementation Plan:** `docs/IMPLEMENTATION_PLAN.md` - Phase-by-phase breakdown
- **FastAPI Docs:** https://fastapi.tiangolo.com
- **SQLModel Docs:** https://sqlmodel.tiangolo.com
- **React Docs:** https://react.dev
- **Chakra UI:** https://chakra-ui.com

---

## When Asking for Help or Feedback

If you need to ask questions or provide feedback:
- Reference specific file paths with line numbers (e.g., `backend/app/main.py:45`)
- Include relevant error messages and stack traces
- Provide context about the issue you're facing
- Be specific about what you're trying to achieve

---

**Last Updated:** November 18, 2025
**Maintained By:** Claude Code & Michael Borck
