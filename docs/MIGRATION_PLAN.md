# Backend Migration Plan: MVP → Collaborative AI Exchange Platform

## Overview
Migrate from generic "Resources" CRUD system to specialized "AI Ideas Exchange" platform with collaboration features, prompt library, and discussion system.

**Timeline**: ~5 weeks (2 weeks backend, 3-4 weeks frontend)
**No breaking changes**: All existing endpoints remain functional
**Data migration**: Seamless - adding new optional fields

---

## Phase 1: Backend Models & Schema (Week 1)

### 1.1 Enhanced Resource Model
**File**: `app/models.py`

Add new fields to `Resource`:
```python
# Profile/Attribution fields
discipline: str | None  # e.g., "Marketing", "Management", "HR"
department: str | None  # e.g., "School of Marketing & Management"
author_title: str | None  # e.g., "Senior Lecturer"

# Collaboration fields
tools_used: list[str]  # e.g., ["ChatGPT", "Claude", "Copilot"]
collaboration_status: CollaborationStatus  # SEEKING, PROVEN, HAS_MATERIALS
open_to_collaborate: list[str]  # e.g., ["questions", "improvements", "workshop"]

# Impact metrics
time_saved_value: float | None  # e.g., 3.0
time_saved_frequency: str | None  # "per_week", "per_month", "per_semester"
evidence_of_success: list[str]  # e.g., ["feedback", "quantifiable", "peer_reviewed"]

# Prompt forking support
is_fork: bool = False
forked_from_id: UUID | None  # Reference to original
version_number: int = 1

# Content enhancements
quick_summary: str | None  # One-liner description
workflow_steps: list[str] | None  # Step-by-step process
example_prompt: str | None  # Example prompt text
ethics_limitations: str | None  # Risks and considerations
```

### 1.2 New Models

#### Comment Model
```python
class Comment(SQLModel, table=True):
    id: UUID
    resource_id: UUID (FK: resource.id)
    parent_comment_id: UUID | None (FK: comment.id)  # For threading
    user_id: UUID (FK: user.id)
    content: str (Text)
    created_at: datetime
    updated_at: datetime
    is_helpful_count: int = 0
```

#### Prompt Model
```python
class Prompt(SQLModel, table=True):
    id: UUID
    user_id: UUID
    title: str
    prompt_text: str (Text)
    description: str | None
    variables: list[str]  # e.g., ["{{course}}", "{{tone}}"]
    sharing_level: SharingLevel  # PRIVATE, DEPARTMENT, SCHOOL, PUBLIC
    is_fork: bool = False
    forked_from_id: UUID | None
    version_number: int = 1
    usage_count: int = 0
    fork_count: int = 0
    created_at: datetime
    updated_at: datetime
```

#### Collection Model
```python
class Collection(SQLModel, table=True):
    id: UUID
    name: str
    description: str | None
    owner_id: UUID  # User or "SYSTEM" for official collections
    resource_ids: list[UUID]  # JSON array
    prompt_ids: list[UUID]  # JSON array
    subscriber_count: int = 0
    created_at: datetime
```

#### Analytics Model
```python
class ResourceAnalytics(SQLModel, table=True):
    id: int
    resource_id: UUID (FK + unique)
    view_count: int = 0
    unique_viewers: int = 0
    save_count: int = 0
    tried_count: int = 0
    fork_count: int = 0
    comment_count: int = 0
    helpful_count: int = 0
    last_viewed: datetime | None
```

### 1.3 Enums
```python
class CollaborationStatus(str, Enum):
    SEEKING = "SEEKING"  # Open to collaborators
    PROVEN = "PROVEN"  # Tested in practice
    HAS_MATERIALS = "HAS_MATERIALS"  # Has supporting files

class SharingLevel(str, Enum):
    PRIVATE = "PRIVATE"
    DEPARTMENT = "DEPARTMENT"
    SCHOOL = "SCHOOL"
    PUBLIC = "PUBLIC"
```

---

## Phase 2: API Endpoints (Week 1-2)

### 2.1 Comments Endpoints
```
POST   /api/v1/resources/{id}/comments       # Add comment
GET    /api/v1/resources/{id}/comments       # Get comment thread
PATCH  /api/v1/comments/{id}                 # Edit comment (author only)
DELETE /api/v1/comments/{id}                 # Delete comment
POST   /api/v1/comments/{id}/helpful         # Mark as helpful
```

### 2.2 Prompt Library Endpoints
```
GET    /api/v1/prompts                       # List/search prompts
POST   /api/v1/prompts                       # Create prompt
GET    /api/v1/prompts/{id}                  # Get prompt
PATCH  /api/v1/prompts/{id}                  # Update prompt
DELETE /api/v1/prompts/{id}                  # Delete prompt
POST   /api/v1/prompts/{id}/fork             # Fork a prompt
GET    /api/v1/prompts/{id}/usage            # Analytics
```

### 2.3 Collaboration Endpoints
```
POST   /api/v1/resources/{id}/collaborate    # "I'm working on similar"
GET    /api/v1/collaborations                # My collaboration requests
POST   /api/v1/collaborations/{id}/accept    # Accept request
POST   /api/v1/collaborations/{id}/decline   # Decline request
```

### 2.4 Collections Endpoints
```
GET    /api/v1/collections                   # List collections
POST   /api/v1/collections                   # Create collection
GET    /api/v1/collections/{id}              # Get collection
POST   /api/v1/collections/{id}/subscribe    # Subscribe to collection
GET    /api/v1/collections/{id}/prompts      # Get prompts in collection
```

### 2.5 Analytics Endpoints
```
GET    /api/v1/resources/{id}/analytics      # Individual idea stats
GET    /api/v1/admin/analytics               # Platform stats (admin only)
POST   /api/v1/resources/{id}/view           # Track view
POST   /api/v1/resources/{id}/tried          # Mark as tried
POST   /api/v1/resources/{id}/save           # Save/bookmark
```

### 2.6 Enhanced Resource Endpoints
```
PATCH  /api/v1/resources/{id}                # Now accepts new fields
GET    /api/v1/resources                     # Enhanced filtering
```

---

## Phase 3: Tests & Verification (Week 2)

### 3.1 Test Updates
- All 59 existing tests remain passing
- Add ~40 new tests for new models
- Add ~30 new tests for new endpoints
- Total: ~130 tests

### 3.2 Backward Compatibility
- All existing endpoints work with old data
- New fields are optional
- Database migration adds columns with defaults
- No data loss

---

## Phase 4: Frontend Rewrite (Weeks 3-5)

### Complete redesign based on ui-ux-ideas.md
- New homepage with hero section
- Enhanced idea cards with collaboration features
- Advanced filtering sidebar
- Prompt library interface
- Comment threads with nesting
- User profile enhancements
- Analytics dashboards

---

## Implementation Order

### Week 1 (Backend Phase 1)
1. Add enums to models.py
2. Extend Resource model
3. Add Comment, Prompt, Collection, Analytics models
4. Create database migration
5. Update response schemas

### Week 1-2 (Backend Phase 2)
1. Implement comments endpoints
2. Implement prompt library endpoints
3. Implement collaboration endpoints
4. Implement collections endpoints
5. Implement analytics tracking
6. Update existing endpoints for new fields

### Week 2 (Backend Phase 3)
1. Write comprehensive tests
2. Test backward compatibility
3. Test data migrations
4. Performance testing
5. Type checking (mypy)

### Weeks 3-5 (Frontend)
1. Redesign homepage
2. Implement idea cards
3. Advanced filtering
4. Prompt library UI
5. Comments system
6. Profile enhancements
7. Analytics dashboards
8. Mobile responsiveness

---

## Data Migration Strategy

**Approach**: Zero-downtime, backward-compatible

1. **Week 1**: Add new columns to Resource table (all optional, with defaults)
2. **Runtime**: New fields are optional - submissions without them work fine
3. **Frontend**: Existing data displays correctly without new fields
4. **Gradual adoption**: Users add new fields when editing

**No data loss**: Existing resources, comments, and subscriptions all preserved

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Breaking existing API | All new fields optional, existing endpoints unchanged |
| Test failures | Phase 3 dedicated to comprehensive testing |
| Database corruption | Migrations tested locally first |
| Frontend complexity | Keep new features modular, implement phase-by-phase |
| Performance issues | Add indexes on key columns during migration |

---

## Success Criteria

✅ All 59 existing tests pass
✅ 40+ new tests for models pass
✅ 30+ new endpoint tests pass
✅ Database migration succeeds
✅ Frontend implements 80% of ui-ux-ideas.md
✅ Platform feels collaborative ("AirTable + Notion" feel)
✅ Mobile responsive
✅ Zero tech debt introduced

---

## Timeline Summary

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Phase 1 | Week 1 | Models, schemas, DB migration |
| Phase 2 | Week 1-2 | All new endpoints, tests |
| Phase 3 | Week 2 | Comprehensive testing, fixes |
| Phase 4 | Weeks 3-5 | Frontend redesign, deployment |
| **Total** | **~5 weeks** | **Full collaborative platform** |

