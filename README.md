# The AI Exchange

<!-- BADGES:START -->
[![website](https://img.shields.io/badge/-website-2196f3?style=flat-square)](https://github.com/topics/website) [![artificial-intelligence](https://img.shields.io/badge/-artificial--intelligence-blue?style=flat-square)](https://github.com/topics/artificial-intelligence) [![edtech](https://img.shields.io/badge/-edtech-4caf50?style=flat-square)](https://github.com/topics/edtech) [![full-stack](https://img.shields.io/badge/-full--stack-blue?style=flat-square)](https://github.com/topics/full-stack) [![internal-platform](https://img.shields.io/badge/-internal--platform-blue?style=flat-square)](https://github.com/topics/internal-platform) [![knowledge-sharing](https://img.shields.io/badge/-knowledge--sharing-blue?style=flat-square)](https://github.com/topics/knowledge-sharing) [![machine-learning](https://img.shields.io/badge/-machine--learning-ff6f00?style=flat-square)](https://github.com/topics/machine-learning) [![nlp](https://img.shields.io/badge/-nlp-blue?style=flat-square)](https://github.com/topics/nlp) [![python](https://img.shields.io/badge/-python-3776ab?style=flat-square)](https://github.com/topics/python) [![typescript](https://img.shields.io/badge/-typescript-3178c6?style=flat-square)](https://github.com/topics/typescript)
<!-- BADGES:END -->

**The AI Exchange** is an internal platform designed for the **School of Marketing and Management (SoMM)** to facilitate the discovery, sharing, and discussion of Artificial Intelligence use cases and applications.

The goal is to connect SoMM staff who are experimenting with AI ("The Spark") with those looking for guidance, while offering a safe ("Verified Anonymity") space to share failures, successes, and best practices in marketing and management contexts.

## 🚀 Project Overview

This is a **complete full-stack web application** built with modern technologies and production-ready code quality. It features a unified feed where faculty, researchers, and professional staff can post nine distinct types of resources:

1. **Requests:** Questions and problems that need community solutions
2. **Use Cases:** Full stories/case studies of AI in teaching, research, or operations
3. **Prompts:** Quick copy-paste blocks of text/code for specific tools
4. **Tools:** AI software, applications, extensions, and configurations
5. **Policies:** Official or classroom-level governance documents
6. **Papers:** Published research papers and literature
7. **Projects:** Active research projects seeking collaboration or feedback
8. **Conferences:** Conference proceedings, keynotes, and workshops
9. **Datasets:** Data files, benchmarks, and curated data collections for research or teaching

### Key Features
* **Unified Feed:** Filters content by type, topic/tags, or search with advanced discovery
* **Verified Anonymity:** SoMM staff can post anonymously to reduce anxiety. Admins see the real identity, but the public frontend hides it
* **Smart Connections:** Non-anonymous posts display the author's profile and deep links (Email/Teams) to encourage offline collaboration
* **Auto-Tagging (NLP):** Uses `YAKE` (lightweight NLP) to automatically extract keywords from descriptions, keeping the server load low
* **Domain Locking:** Authentication is restricted strictly to `@curtin.edu.au` email addresses
* **Subscription System:** Users can subscribe to tags and receive notifications when matching resources are posted
* **Request-Solution Workflow:** Link solutions to requests and track resolution status
* **Email Verification:** Two-step registration with 6-digit verification codes (first user auto-verified as admin)
* **Flexible Email Providers:** Support for multiple email providers (dev/console, Gmail, SendGrid, custom SMTP, Curtin SMTP)
* **Email Notifications:** Automatic notifications for subscribed tags and posted solutions
* **Password Reset:** Secure 6-digit code-based password reset with email delivery
* **Rate Limiting:** IP-based request throttling on auth endpoints to prevent brute force attacks and abuse
* **Role-Based Access:** Admin and Staff roles with different capabilities
* **Notification Preferences:** Users can customise when they receive notifications

## ✅ Implementation Status

### Backend (Complete - Phase 5)
- ✅ **29 API Endpoints** - Full CRUD operations for all resources
  - Authentication (register, login, password reset, profile management)
  - Resources (create, read, update, delete, list with filtering)
  - Admin (user management, resource moderation)
  - Subscriptions (subscribe, unsubscribe, list)
- ✅ **63/63 Tests Passing** - Comprehensive test coverage
- ✅ **0 Type Errors** - Strict mypy type checking
- ✅ **0 Linting Errors** - Code quality standards maintained
- ✅ **Production Ready** - Database, authentication, password reset, rate limiting, error handling

### Frontend (In Progress - Phase 3)
- ✅ **Collaborative Discovery Redesign** - New UX for sharing & discovery
  - Login & Registration with validation
  - **NEW:** Homepage with discipline grid and trending ideas
  - **NEW:** Browse page with advanced filter sidebar
  - **NEW:** Resource detail page with collaboration workflow
  - Create/edit resources
  - User profile management
  - Admin dashboard (placeholder)
- ✅ **Advanced Filtering** - Filter by discipline, tools, collaboration status, quick wins
- ✅ **Collaboration Features** - "Working on Similar" modal workflow
- ✅ **Engagement Tracking UI** - Views, saves, "tried it" counts
- ✅ **Responsive Design** - Works on desktop and mobile
- ✅ **Production Build** - Optimised bundle
- ✅ **Full TypeScript** - Type-safe frontend

### Code Quality
- Backend: Python with type hints, comprehensive tests, clean architecture
- Frontend: React + TypeScript, ESLint, Prettier formatting
- Both: Industry best practices, security hardening, error handling

## 🛠 Tech Stack

### Backend
* **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python 3.11+)
* **Database:** SQLite (MVP) / PostgreSQL (Production)
* **ORM:** SQLModel (Pydantic + SQLAlchemy)
* **NLP:** YAKE (Yet Another Keyword Extractor - CPU-only, zero external API calls)
* **Authentication:** Email/Password (bcrypt hashing) with Domain Whitelisting
* **Environment Management:** uv (Python package manager)
* **Code Quality:** ruff (linting/formatting), mypy (type checking), pytest (testing)

### Frontend
* **Framework:** React 18+ (via Vite)
* **Language:** TypeScript (strict mode)
* **UI Library:** Chakra UI
* **State Management:** React Query (TanStack Query)
* **Testing:** Vitest
* **Code Quality:** ESLint, Prettier

---

## ⚡️ Quick Start (Local Development)

### 1. Backend Setup
Navigate to the backend directory and set up the Python environment using `uv`.

```bash
cd backend

# Create virtual environment with uv
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies from pyproject.toml
uv pip install -e ".[dev]"

# Run the server with hot-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`.
API Docs (Swagger) are at `http://localhost:8000/docs`.

### 2. Frontend Setup

Navigate to the frontend directory.

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The UI will be available at `http://localhost:5173`.

### 3. Running Tests

**Backend Tests**
```bash
cd backend
source .venv/bin/activate
python -m pytest tests/ -v          # Run all tests
python -m pytest tests/ --coverage  # Generate coverage report
```

**Frontend Tests**
```bash
cd frontend
npm run test           # Run tests
npm run test:ui        # Run with UI
npm run test:coverage  # Generate coverage report
```

### 4. Code Quality Checks

**Backend**
```bash
cd backend
source .venv/bin/activate
mypy app/ tests/      # Type checking
ruff check app/ tests/ # Linting
```

**Frontend**
```bash
cd frontend
npm run lint           # Check ESLint
npm run format:check   # Check Prettier
```

### 5. Building for Production

**Backend**
```bash
cd backend
source .venv/bin/activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

**Frontend**
```bash
cd frontend
npm run build          # Build production bundle
npm run preview        # Preview the build
```

The production frontend build is optimised and ready for deployment.

-----

## 🔐 Configuration (.env)

Create a `.env` file in the `backend/` directory. Start with the minimal template:

```bash
# Quick start - minimal setup
cp backend/.env.minimal backend/.env

# Or use the full template with all options
cp backend/.env.example backend/.env
```

**Quick reference:**
- **New to this project?** Start with `backend/.env.minimal` - it shows only what you need to configure
- **All options?** Use `backend/.env.example` - it has every available setting with documentation
- **Sensible defaults?** Yes! Most settings have safe defaults - only `SECRET_KEY` is truly critical

Key configuration variables:

```ini
# General
PROJECT_NAME="The AI Exchange - SoMM"
API_V1_STR="/api/v1"
SECRET_KEY="generate-a-secure-random-string-minimum-32-chars"

# Database
DATABASE_URL="sqlite:///./ai_exchange.db"  # For MVP/development

# Authentication
ALLOWED_DOMAINS="curtin.edu.au"

# Email (Mocked for MVP)
MAIL_FROM="noreply@curtin.edu.au"

# CORS
ALLOWED_ORIGINS="http://localhost:5173,http://localhost:3000"
```

See `backend/.env.example` for production settings including PostgreSQL and email configuration.

## 📁 Project Structure

```
the-ai-exchange/
├── backend/                          # FastAPI backend
│   ├── app/
│   │   ├── api/                     # API route handlers
│   │   │   ├── admin.py             # Admin endpoints
│   │   │   ├── auth.py              # Authentication endpoints
│   │   │   ├── resources.py         # Resource CRUD endpoints
│   │   │   └── subscriptions.py     # Subscription endpoints
│   │   ├── core/
│   │   │   ├── config.py            # Configuration management
│   │   │   └── security.py          # Security utilities
│   │   ├── models.py                # Database and API models
│   │   ├── services/
│   │   │   ├── auto_tagger.py       # YAKE keyword extraction
│   │   │   ├── database.py          # Database session management
│   │   │   └── email_service.py     # Email notification service
│   │   └── main.py                  # FastAPI app initialization
│   ├── tests/                       # Comprehensive test suite
│   │   ├── test_auth.py
│   │   ├── test_resources.py
│   │   ├── test_admin_subscriptions.py
│   │   ├── test_notifications.py
│   │   └── ... (59 tests total)
│   ├── pyproject.toml               # Project dependencies & configuration
│   └── .env.example                 # Environment variables template
│
├── frontend/                        # React + TypeScript frontend
│   ├── src/
│   │   ├── components/              # Reusable React components
│   │   │   ├── Layout.tsx           # Main layout wrapper
│   │   │   ├── ProtectedRoute.tsx   # Route protection
│   │   │   ├── FilterSidebar.tsx    # (NEW) Advanced filter controls
│   │   │   └── CollaborationModal.tsx # (NEW) Collaboration request modal
│   │   ├── context/
│   │   │   └── AuthContext.tsx      # Auth state management
│   │   ├── hooks/                   # Custom React hooks
│   │   │   ├── useAuth.ts           # Auth mutations
│   │   │   ├── useResources.ts      # Resource queries
│   │   │   └── useSubscriptions.ts  # Subscription queries
│   │   ├── lib/
│   │   │   └── api.ts               # API client
│   │   ├── pages/                   # Page components
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── HomePage.tsx         # (NEW) Collaborative discovery homepage
│   │   │   ├── ResourcesPage.tsx    # (REDESIGNED) Browse with filter sidebar
│   │   │   ├── CreateResourcePage.tsx
│   │   │   ├── ResourceDetailPage.tsx # (REDESIGNED) Collaboration + tabs
│   │   │   ├── ProfilePage.tsx
│   │   │   └── AdminDashboardPage.tsx
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript type definitions
│   │   ├── App.tsx                  # Main app component (updated routing)
│   │   └── main.tsx                 # Entry point
│   ├── index.html
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                            # Documentation
│   ├── IMPLEMENTATION_PLAN.md
│   └── srs.md
├── README.md                        # This file
├── CLAUDE.md                        # Development guidelines
└── LICENSE                          # MIT License
```

## 🏗 Architecture Decisions

### The "Resource" Model

To keep the database simple for the MVP, we use **Single Table Inheritance**. All nine resource types are stored in a single `resources` table, distinguished by a `type` enum:

```python
class ResourceType(str, Enum):
    REQUEST = "REQUEST"        # Questions needing solutions
    USE_CASE = "USE_CASE"      # Implementation stories
    PROMPT = "PROMPT"          # AI prompts and templates
    TOOL = "TOOL"              # Software and applications
    POLICY = "POLICY"          # Institutional guidelines
    PAPER = "PAPER"            # Published research papers
    PROJECT = "PROJECT"        # Active research projects
    CONFERENCE = "CONFERENCE"  # Conference proceedings
    DATASET = "DATASET"        # Data files and benchmarks
```

This approach provides:
- **Flexibility:** Easy to add new resource types
- **Simplicity:** Single query for all resources
- **Performance:** Efficient filtering and search
- **Consistency:** All resources share common metadata (tags, author, timestamps)

### Verified Anonymity Logic

The database *always* records the `user_id`. The API response serializer handles the privacy logic:

  * If `is_anonymous=True` → Return "Faculty Member" & `null` avatar.
  * If `is_anonymous=False` → Return `user.full_name` & `user.avatar`.

## 📚 API Documentation

Once the backend is running, access the interactive API documentation:

- **Swagger UI (OpenAPI):** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

### Core Endpoints

**Authentication**
- `POST /api/v1/auth/register` - Create new account
- `POST /api/v1/auth/login` - Login with email/password
- `GET /api/v1/auth/me` - Get current user
- `PATCH /api/v1/auth/me` - Update profile and preferences

**Resources**
- `GET /api/v1/resources` - List all resources (with filtering)
- `POST /api/v1/resources` - Create new resource
- `GET /api/v1/resources/{id}` - Get resource details
- `PATCH /api/v1/resources/{id}` - Update resource
- `DELETE /api/v1/resources/{id}` - Delete resource
- `GET /api/v1/resources/{id}/solutions` - Get solutions for a request

**Subscriptions**
- `GET /api/v1/subscriptions` - List user subscriptions
- `POST /api/v1/subscriptions/subscribe` - Subscribe to a tag
- `POST /api/v1/subscriptions/unsubscribe` - Unsubscribe from a tag

**Admin**
- `GET /api/v1/admin/users` - List all users
- `GET /api/v1/admin/users/{id}` - Get user details
- `PATCH /api/v1/admin/users/{id}` - Update user
- `POST /api/v1/admin/users/{id}/approve` - Approve user
- `POST /api/v1/admin/users/{id}/deactivate` - Deactivate user
- `DELETE /api/v1/admin/users/{id}` - Delete user
- `PATCH /api/v1/admin/resources/{id}` - Verify/moderate resource
- `DELETE /api/v1/admin/resources/{id}` - Hide resource

## 🎨 Phase 3 Frontend Redesign (In Progress)

### New Features Added

**Homepage (Collaborative Discovery)**
- Hero section with search and CTA buttons
- Discipline activity grid showing idea counts by field (Marketing, Management, HR, etc.)
- Recent contributions section (3-column grid)
- Trending this week section (3-column grid)

**Browse Page (Advanced Filtering)**
- Sticky sidebar filter panel with 5 filter categories:
  - Disciplines (8 options)
  - AI Tools (Claude, ChatGPT, GPT-4, Copilot, Midjourney, Canvas LMS)
  - Collaboration Status (SEEKING, PROVEN, HAS_MATERIALS)
  - Time Saved Quick Wins (0-4 hours/week slider)
  - Sort Options (newest, popular, most tried)
- Real-time filter application
- Search bar with full-text search
- Responsive 2-column grid on desktop, 1-column on mobile

**Idea Detail Page (Collaboration Workflow)**
- Three-tab interface: Overview, Details, Community
- Engagement buttons: "Working on Similar?", Save, Mark as Tried
- Live engagement stats: views, saves, tried count
- Similar ideas recommendations
- Author contact card
- Sticky sidebar with quick stats and author info (desktop)

**Collaboration Modal**
- Message textarea with guidance
- Contact method selection
- Author info preview
- Privacy notice

### What's Next (Week 2+)

- API Integration (connect mock data to real endpoints)
- Prompt Library and Collections interface
- User Profile pages with contribution history
- Admin analytics dashboards
- Pagination and infinite scroll
- Search debouncing
- Mobile responsiveness optimisation

## 📚 Development Documentation

- **[CLAUDE.md](CLAUDE.md)** - Development guidelines, tooling setup, code standards
- **[docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md)** - 10-phase implementation roadmap
- **[docs/srs.md](docs/srs.md)** - Complete software requirements specification
- **[docs/ui-ux-ideas.md](docs/ui-ux-ideas.md)** - Design system and UX concepts

## 🚢 Deployment (VPS)

This project includes a `docker-compose.yml` for easy deployment on a Linux VPS (DigitalOcean/Linode/Internal/AWS).

```bash
# Build and run containers
docker-compose up -d --build

# View logs
docker-compose logs -f
```

See [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) Phase 10 for complete deployment instructions.

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

Copyright © 2025 Michael Borck

