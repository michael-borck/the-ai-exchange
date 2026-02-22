# Implementation Plan: The AI Exchange MVP

**For:** School of Marketing and Management (SoMM), Curtin University
**Version:** 1.0
**Last Updated:** November 18, 2025
**Status:** In Development
**Domain:** @curtin.edu.au

---

## 1. Overview

This document outlines the phased implementation of **The AI Exchange** MVP for the School of Marketing and Management (SoMM) at Curtin University. The project will be built using:
- **Backend:** FastAPI with Python 3.11+, SQLite (MVP), PostgreSQL (Production), SQLModel ORM
- **Frontend:** React 18+ with TypeScript, Vite, Chakra UI
- **Tooling:** uv (environment), ruff (linting/formatting), mypy (type checking), pytest (testing)
- **Target Users:** SoMM staff and faculty (@curtin.edu.au domain)

---

## 2. Phase 1: Project Setup & Infrastructure

### 2.1 Backend Setup
- [x] Initialize project structure
- [ ] Set up `pyproject.toml` with uv and project metadata
- [ ] Create Python virtual environment with uv
- [ ] Install core dependencies (FastAPI, SQLModel, YAKE, python-multipart)
- [ ] Configure ruff for linting and formatting
- [ ] Configure mypy for type checking
- [ ] Configure pytest for unit tests
- [ ] Create `.env.example` template
- [ ] Set up logging configuration

### 2.2 Frontend Setup
- [x] Initialize project structure
- [ ] Create `package.json` with Vite, React 18, TypeScript
- [ ] Install UI library (Chakra UI) and dependencies
- [ ] Set up ESLint and Prettier
- [ ] Set up Vitest for unit tests
- [ ] Configure Vite build and dev server
- [ ] Create `.env.example` for frontend

### 2.3 Development Documentation
- [ ] Create CLAUDE.md with development guidelines
- [ ] Create this implementation plan
- [ ] Document API design standards
- [ ] Document component architecture patterns

---

## 3. Phase 2: Core Backend Architecture

### 3.1 Database Models (SQLModel)
- [ ] Create `models.py` with:
  - `User` model (id, email, full_name, role, notification_prefs, created_at)
  - `Resource` model (id, user_id, parent_id, type, status, title, content_text, content_meta, is_anonymous, is_verified, tags, created_at, updated_at)
  - `Subscription` model (user_id, tag)
- [ ] Set up database migrations/initialization script
- [ ] Configure SQLite database file location

### 3.2 Authentication & Security
- [ ] Create `core/security.py`:
  - Password hashing (bcrypt/argon2)
  - JWT token generation and validation
  - Email validation
- [ ] Create `core/config.py`:
  - Environment configuration
  - Database URL handling
  - Secret key management
- [ ] Create authentication middleware
- [ ] Set up email validation logic
- [ ] Implement domain-based authentication (@school.edu)

### 3.3 Core API Structure
- [ ] Create `main.py` FastAPI application setup
- [ ] Set up CORS configuration
- [ ] Set up request/response logging
- [ ] Create error handling middleware
- [ ] Set up API versioning (/api/v1)

---

## 4. Phase 3: User Management & Auth Endpoints

### 4.1 User Endpoints
- [ ] `POST /api/v1/auth/register` - User registration (email/password)
- [ ] `POST /api/v1/auth/login` - User login (email/password, returns JWT)
- [ ] `GET /api/v1/auth/me` - Get current authenticated user
- [ ] `PATCH /api/v1/users/me` - Update user profile
- [ ] `PATCH /api/v1/users/me/prefs` - Update notification preferences

### 4.2 Authentication Middleware
- [ ] Create dependency for extracting current user from JWT
- [ ] Validate JWT on protected routes
- [ ] Handle token expiration and refresh

---

## 5. Phase 4: Resource Management (Core Feature)

### 5.1 Resource Endpoints
- [ ] `GET /api/v1/resources` - Fetch all resources with filters
  - Query params: `type`, `tag`, `search`, `status`
  - Pagination support
- [ ] `GET /api/v1/resources/{id}` - Get single resource with solutions
- [ ] `POST /api/v1/resources` - Create new resource
  - Body: `title`, `type`, `content_text`, `is_anonymous`, `parent_id`, `content_meta`
  - Auto-trigger tagging service
- [ ] `PATCH /api/v1/resources/{id}` - Update resource (owner only)
- [ ] `DELETE /api/v1/resources/{id}` - Delete resource (owner/admin only)

### 5.2 Request-Solution Workflow
- [ ] `GET /api/v1/resources/requests` - List all requests with solution counts
- [ ] `GET /api/v1/resources/requests/{id}` - Get request + child solutions
- [ ] `POST /api/v1/resources/requests/{id}/solutions` - Post solution to request

### 5.3 Admin Endpoints
- [ ] `PATCH /api/v1/resources/{id}/verify` - Admin: Mark as verified

---

## 6. Phase 5: Auto-Tagging Service (NLP)

### 6.1 YAKE Integration
- [ ] Create `services/auto_tagger.py`:
  - YAKE keyword extraction
  - Background task for async tagging
  - Store top 5 keywords in `tags` column
- [ ] Integrate with resource creation flow
- [ ] Configure keyword extraction parameters (top N, language)

---

## 7. Phase 6: Email Notifications (Mocked for MVP)

### 6.1 Email Service Setup
- [ ] Create `services/email_service.py`:
  - Mock email sender (log to console/file)
  - Template support for notification emails
- [ ] Notification triggers:
  - New Request → notify subscribers of matching tags
  - New Solution → notify requester
- [ ] Subscription management in endpoints

### 6.2 Background Tasks
- [ ] Set up Celery/APScheduler or FastAPI background tasks
- [ ] Queue email notifications asynchronously

---

## 8. Phase 7: Frontend - Core UI Components

### 8.1 Layout & Navigation
- [ ] Create main `App.tsx` layout
- [ ] Header with logo, search, navigation, user menu
- [ ] Sidebar with filters
- [ ] Footer

### 8.2 Authentication Pages
- [ ] Login page (email/password form)
- [ ] Register page
- [ ] Profile/settings page
- [ ] Notification preferences UI

### 8.3 Core Components
- [ ] `ResourceCard` - Display individual resource
- [ ] `ResourceList` - List of resources with pagination
- [ ] `FilterSidebar` - Filter by type, tags, status
- [ ] `SearchBar` - Full-text search
- [ ] `ResourceDetail` - Single resource view with solutions
- [ ] `SolutionForm` - Form to submit solution to request

### 8.4 Pages
- [ ] `Home` - Unified catalogue with filters
- [ ] `RequestDetail` - View request + all solutions
- [ ] `SubmitResource` - Form to post new use case/prompt/policy/request
- [ ] `MyProfile` - User profile and preferences

---

## 9. Phase 8: Frontend - Advanced Features

### 9.1 State Management
- [ ] Set up React Query (TanStack Query) for data fetching
- [ ] API client hooks (useResources, useAuth, etc.)
- [ ] Caching strategies

### 9.2 Anonymous Masking Logic
- [ ] Conditional rendering of author info based on `is_anonymous`
- [ ] Display "Faculty Member" for anonymous posts
- [ ] Show contact button only for non-anonymous posts

### 9.3 Request Status Indicators
- [ ] "🔴 Open Request" badge
- [ ] "🟢 Solved Request" badge with solution count
- [ ] Dynamic status updates

---

## 10. Phase 9: Testing & Quality

### 10.1 Backend Testing
- [ ] Unit tests for models
- [ ] API endpoint tests (FastAPI TestClient)
- [ ] Authentication tests
- [ ] Auto-tagger tests
- [ ] Database tests
- [ ] Aim for 80%+ code coverage

### 10.2 Frontend Testing
- [ ] Component unit tests (Vitest)
- [ ] Integration tests for key user flows
- [ ] API mock tests
- [ ] Aim for 70%+ code coverage

### 10.3 Code Quality
- [ ] Run ruff linting and formatting
- [ ] Run mypy type checking
- [ ] Run ESLint on frontend
- [ ] Code review checklist

---

## 11. Phase 10: Documentation & Deployment

### 11.1 Documentation
- [ ] API documentation (Swagger/OpenAPI via FastAPI)
- [ ] Database schema documentation
- [ ] Component storybook (optional)
- [ ] Deployment guide

### 11.2 Deployment Preparation
- [ ] Create Dockerfile for backend
- [ ] Create Dockerfile for frontend
- [ ] Create docker-compose.yml
- [ ] Environment configuration guide
- [ ] Database backup strategy

### 11.3 MVP Launch Checklist
- [ ] All core features functional
- [ ] Tests passing
- [ ] Code quality checks passing
- [ ] Documentation complete
- [ ] Security review (CORS, auth, input validation)
- [ ] Performance optimisation (database indexes)
- [ ] Error handling and logging

---

## 12. Implementation Order (Recommended)

1. **Week 1:** Phases 1-2 (Setup)
2. **Week 2:** Phase 3-4 (Auth + Resources)
3. **Week 3:** Phase 5-6 (Tagging + Email)
4. **Week 4:** Phases 7-8 (Frontend)
5. **Week 5:** Phase 9 (Testing)
6. **Week 6:** Phase 10 (Docs + Deployment)

---

## 13. Key Technical Decisions

### Database
- **SQLite** for MVP (file-based, zero-config)
- **Easy migration** to PostgreSQL for production
- **Single Table Inheritance** for Resources

### Authentication
- **Email/Password** for MVP (simple auth, bcrypt hashing)
- **Future:** OAuth2 with Google/Microsoft

### Frontend State
- **React Query** for server state
- **React Context** for auth state
- **localStorage** for JWT tokens

### Email
- **Mocked** for MVP (log to file/console)
- **Future:** Integration with university SMTP

---

## 14. Success Criteria

- [ ] All core API endpoints implemented
- [ ] Frontend fully functional
- [ ] Auto-tagging working
- [ ] Request-Solution workflow complete
- [ ] Tests written and passing
- [ ] Code follows style guidelines
- [ ] Documentation complete
- [ ] Deployable to VPS via Docker Compose

---

## 15. Known Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| YAKE keyword extraction too generic | Fine-tune YAKE parameters, add custom dictionaries |
| Database query performance | Add indexes, use pagination, cache frequently accessed data |
| Email notification delays | Use async tasks, monitor queue depth |
| Frontend bundle size | Code splitting, lazy loading, tree shaking |
| Authentication security | Use strong secret key, validate all inputs, HTTPS only |

---

## 16. Future Enhancements (Post-MVP)

- Advanced search (Elasticsearch)
- Analytics dashboard for admins
- Reputation system (upvotes, badges)
- Mobile app
- Integration with university systems (Blackboard, Canvas)
- OAuth2 integration
- PostgreSQL migration
- Advanced moderation tools

---

**Next Steps:** Begin Phase 1 implementation with backend setup.
