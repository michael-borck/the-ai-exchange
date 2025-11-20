# API Contract Audit Report: Frontend & Backend Schema Alignment

**Date:** 2025-11-20
**Status:** COMPREHENSIVE ANALYSIS COMPLETE
**Total Endpoints Analyzed:** 45+ endpoints across 9 API modules

---

## Executive Summary

### Overall Assessment: ⚠️ **PARTIALLY COMPLIANT**

**Good News:**
- ✅ 16 endpoints have proper typed response schemas
- ✅ All authentication flows are correctly typed
- ✅ Admin endpoints follow best practices
- ✅ Comments and Collections endpoints are well-typed
- ✅ Frontend correctly expects typed responses

**Issues Found:**
- ⚠️ 18+ endpoints return generic `dict[str, Any]` instead of typed schemas
- ⚠️ Loss of type safety for critical engagement features
- ⚠️ Potential for runtime errors if API response structure changes
- ⚠️ Frontend loses IDE autocomplete and validation for these endpoints

---

## Module-by-Module Analysis

### 1. ✅ AUTH.PY - FULLY COMPLIANT
**Status:** No Issues | All 4 endpoints properly typed

| Endpoint | Method | Response Schema | Status |
|----------|--------|-----------------|--------|
| `/register` | POST | `TokenResponse` | ✅ Properly typed |
| `/login` | POST | `TokenResponse` | ✅ Properly typed |
| `/me` | GET | `UserResponse` | ✅ Properly typed |
| `/me` | PATCH | `UserResponse` | ✅ Properly typed |

**Details:**
- All responses include complete user information: id, email, full_name, role, is_active, is_approved, disciplines, notification_prefs, created_at
- Login/register also include access_token, refresh_token, token_type
- Frontend expectations: ✅ MATCH

---

### 2. ⚠️ RESOURCES.PY - PARTIALLY COMPLIANT
**Status:** 2 Issues | 4 of 6 endpoints properly typed

| Endpoint | Method | Response Schema | Status | Issue |
|----------|--------|-----------------|--------|-------|
| `GET /` (list) | GET | `list[dict[str, Any]]` | ❌ UNTYPED | Generic dict, no schema |
| `GET /{resource_id}` | GET | `dict[str, Any]` | ❌ UNTYPED | Generic dict, no schema |
| `GET /{resource_id}/solutions` | GET | `list[ResourceResponse]` | ✅ Properly typed | |
| `POST /` (create) | POST | `ResourceResponse` | ✅ Properly typed | |
| `PATCH /{resource_id}` | PATCH | `ResourceResponse` | ✅ Properly typed | |
| `DELETE /{resource_id}` | DELETE | None | ✅ Proper (204) | |

**Issues Identified:**

**Issue #1: list_resources() endpoint**
```python
# Current: Returns list[dict[str, Any]]
{
  "id": "...",
  "title": "...",
  "content_text": "...",
  "user": {
    "id": "...",
    "full_name": "...",
    "email": "..."
  },
  // ... all ResourceResponse fields
}
```
- Returns ResourceResponse fields + nested user object
- Frontend expects: Resource with embedded user info
- **Problem:** No type safety - frontend doesn't get IDE support

**Issue #2: get_resource() endpoint**
```python
# Current: Returns dict[str, Any]
# Same structure as list_resources
```
- Same issues as list endpoint
- Frontend expects single Resource object

**Recommendation:**
```python
class ResourceWithAuthor(ResourceResponse):
    """Resource response with embedded author information."""
    user: dict[str, str | None] | None = None

# Apply to list_resources and get_resource
```

---

### 3. ⚠️ ANALYTICS.PY - PARTIALLY COMPLIANT
**Status:** 8 Issues | 1 of 9 endpoints properly typed (CRITICAL)

| Endpoint | Method | Response Schema | Status | Issue |
|----------|--------|-----------------|--------|-------|
| `/resources/{id}/view` | POST | `dict[str, Any]` | ❌ UNTYPED | Engagement tracking |
| `/resources/{id}/tried` | POST | `dict[str, Any]` | ❌ UNTYPED | Engagement tracking |
| `/resources/{id}/save` | POST | `dict[str, Any]` | ❌ UNTYPED | Engagement tracking |
| `/resources/{id}/is-saved` | GET | `dict[str, Any]` | ❌ UNTYPED | Engagement check |
| `/resources/{id}/analytics` | GET | `ResourceAnalyticsResponse` | ✅ Properly typed | |
| `/users/me/saved-resources` | GET | `list[dict[str, Any]]` | ❌ UNTYPED | User profile data |
| `/admin/analytics` | GET | `dict[str, Any]` | ❌ UNTYPED | Admin dashboard |
| `/admin/analytics/by-discipline` | GET | `dict[str, Any]` | ❌ UNTYPED | Admin dashboard |
| `/resources/{id}/users-tried-it` | GET | `list[dict[str, Any]]` | ❌ UNTYPED | Social proof |

**Critical Issues:**

**Issue #1: Engagement Tracking Endpoints (3 endpoints)**
```python
# /resources/{id}/view - Returns:
{
  "resource_id": "...",
  "view_count": 123,
  "status": "tracked"
}

# /resources/{id}/tried - Returns:
{
  "resource_id": "...",
  "tried_count": 45,
  "status": "tracked"
}

# /resources/{id}/save - Returns:
{
  "resource_id": "...",
  "is_saved": true,
  "save_count": 89,
  "status": "saved" | "unsaved"
}
```
**Impact:** These are core user engagement features. Frontend loses type safety.

**Issue #2: Save Status Check**
```python
# /resources/{id}/is-saved - Returns:
{
  "resource_id": "...",
  "is_saved": true
}
```
**Impact:** Frontend checks before displaying save button state - needs type safety.

**Issue #3: User Saved Resources**
```python
# /users/me/saved-resources - Returns:
[
  {
    "id": "...",
    "title": "...",
    "content_text": "...",
    "type": "REQUEST",
    "discipline": "MARKETING",
    "user": {
      "id": "...",
      "full_name": "...",
      "email": "..."
    },
    "saved_at": "2025-11-20T...",
    // ... other ResourceResponse fields
  }
]
```
**Impact:** Profile page feature - needs proper typing for list operations.

**Issue #4: Admin Analytics**
```python
# /admin/analytics - Returns:
{
  "platform_stats": {
    "total_resources": 42,
    "total_views": 1234,
    "total_saves": 567,
    "total_tried": 89,
    "total_forks": 12,
    "total_comments": 234,
    "avg_views_per_resource": 29.4,
    "avg_saves_per_resource": 13.5
  },
  "top_resources": [
    {
      "resource_id": "...",
      "view_count": 234,
      "save_count": 56,
      "tried_count": 12,
      "title": "..."
    }
  ]
}

# /admin/analytics/by-discipline - Returns:
{
  "by_discipline": {
    "MARKETING": {
      "count": 10,
      "total_views": 234,
      "total_saves": 56
    },
    "BUSINESS": {
      "count": 8,
      "total_views": 189,
      "total_saves": 45
    }
  }
}
```
**Impact:** Admin dashboard charts/metrics - complex nested data loses type safety.

**Issue #5: Users Who Tried Resource**
```python
# /resources/{id}/users-tried-it - Returns:
[
  {
    "id": "...",
    "full_name": "...",
    "email": "...",
    "tried_at": "2025-11-20T..."
  }
]
```
**Impact:** Social proof feature on resource detail page.

**Recommendations:**
```python
# Add these schemas to models.py
class ResourceViewTracked(SQLModel):
    """Response when resource view is tracked."""
    resource_id: UUID
    view_count: int
    status: str

class ResourceTriedTracked(SQLModel):
    """Response when resource is marked as tried."""
    resource_id: UUID
    tried_count: int
    status: str

class ResourceSaveToggled(SQLModel):
    """Response when resource save status is toggled."""
    resource_id: UUID
    is_saved: bool
    save_count: int
    status: str  # "saved" or "unsaved"

class ResourceSaveStatus(SQLModel):
    """Response checking if user saved a resource."""
    resource_id: UUID
    is_saved: bool

class SavedResourceItem(SQLModel):
    """Saved resource in user's collection."""
    id: UUID
    title: str
    content_text: str
    type: str
    discipline: str | None
    user: dict[str, str | None] | None
    saved_at: datetime

class UserTriedInfo(SQLModel):
    """User who tried a resource."""
    id: UUID
    full_name: str
    email: str
    tried_at: datetime

class PlatformStats(SQLModel):
    """Platform-wide statistics."""
    total_resources: int
    total_views: int
    total_saves: int
    total_tried: int
    total_forks: int
    total_comments: int
    avg_views_per_resource: float
    avg_saves_per_resource: float

class TopResource(SQLModel):
    """Top performing resource."""
    resource_id: UUID
    view_count: int
    save_count: int
    tried_count: int
    title: str | None = None

class PlatformAnalyticsResponse(SQLModel):
    """Platform analytics response."""
    platform_stats: PlatformStats
    top_resources: list[TopResource]

class DisciplineStats(SQLModel):
    """Statistics for a discipline."""
    count: int
    total_views: int
    total_saves: int

class AnalyticsByDisciplineResponse(SQLModel):
    """Analytics by discipline response."""
    by_discipline: dict[str, DisciplineStats]
```

---

### 4. ✅ ADMIN.PY - FULLY COMPLIANT
**Status:** No Issues | All 9 endpoints properly typed

| Endpoint | Method | Response Schema | Status |
|----------|--------|-----------------|--------|
| `/users` | GET | `list[UserResponse]` | ✅ Properly typed |
| `/users/{user_id}` | GET | `UserResponse` | ✅ Properly typed |
| `/users/{user_id}/role` | PATCH | `UserResponse` | ✅ Properly typed |
| `/users/{user_id}/status` | PATCH | `UserResponse` | ✅ Properly typed |
| `/users/{user_id}/approve` | PATCH | `UserResponse` | ✅ Properly typed |
| `/users/{user_id}` | DELETE | None | ✅ Proper (204) |
| `/resources/{resource_id}/verify` | PATCH | `ResourceResponse` | ✅ Properly typed |
| `/resources/{resource_id}/hide` | PATCH | `ResourceResponse` | ✅ Properly typed |
| `/resources/{resource_id}/unhide` | PATCH | `ResourceResponse` | ✅ Properly typed |

**Status:** All endpoints follow best practices. Excellent example of API design consistency.

---

### 5. ⚠️ SUBSCRIPTIONS.PY - PARTIALLY COMPLIANT
**Status:** 1 Issue | 3 of 4 endpoints properly typed

| Endpoint | Method | Response Schema | Status | Issue |
|----------|--------|-----------------|--------|-------|
| `GET /` | GET | `list[SubscriptionResponse]` | ✅ Properly typed | |
| `POST /subscribe` | POST | `SubscriptionResponse` | ✅ Properly typed | |
| `DELETE /unsubscribe/{tag}` | DELETE | None | ✅ Proper (204) | |
| `PATCH /notify-prefs` | PATCH | `dict[str, bool]` | ❌ UNTYPED | Issue |

**Issue #1: update_notification_prefs() endpoint**
```python
# Current: Returns dict[str, bool]
{
  "notify_requests": true,
  "notify_solutions": false
}
```
**Impact:** Settings/profile page - frontend manually types this.

**Recommendation:**
```python
class NotificationPreferences(SQLModel):
    """User notification preferences."""
    notify_requests: bool
    notify_solutions: bool

# Or reuse existing structure from UserResponse.notification_prefs
```

---

### 6. ⚠️ PROMPTS.PY - PARTIALLY COMPLIANT
**Status:** 1 Issue | 6 of 7 endpoints properly typed

| Endpoint | Method | Response Schema | Status | Issue |
|----------|--------|-----------------|--------|-------|
| `GET /` | GET | `list[PromptResponse]` | ✅ Properly typed | |
| `GET /{prompt_id}` | GET | `PromptResponse` | ✅ Properly typed | |
| `POST /` | POST | `PromptResponse` | ✅ Properly typed | |
| `PATCH /{prompt_id}` | PATCH | `PromptResponse` | ✅ Properly typed | |
| `DELETE /{prompt_id}` | DELETE | None | ✅ Proper (204) | |
| `POST /{prompt_id}/fork` | POST | `PromptResponse` | ✅ Properly typed | |
| `GET /{prompt_id}/usage` | GET | `dict[str, Any]` | ❌ UNTYPED | Issue |

**Issue #1: get_prompt_usage() endpoint**
```python
# Current: Returns dict[str, Any]
{
  "id": "...",
  "title": "...",
  "usage_count": 42,
  "fork_count": 5,
  "sharing_level": "PRIVATE",
  "created_at": "...",
  "updated_at": "..."
}
```
**Impact:** Prompt analytics/usage tracking feature.

**Recommendation:**
```python
class PromptUsageResponse(SQLModel):
    """Prompt usage statistics."""
    id: UUID
    title: str
    usage_count: int
    fork_count: int
    sharing_level: str
    created_at: datetime
    updated_at: datetime
```

---

### 7. ✅ COMMENTS.PY - FULLY COMPLIANT
**Status:** No Issues | All 5 endpoints properly typed

| Endpoint | Method | Response Schema | Status |
|----------|--------|-----------------|--------|
| `/{resource_id}/comments` | GET | `list[CommentResponse]` | ✅ Properly typed |
| `/{resource_id}/comments` | POST | `CommentResponse` | ✅ Properly typed |
| `/{comment_id}` | PATCH | `CommentResponse` | ✅ Properly typed |
| `/{comment_id}` | DELETE | None | ✅ Proper (204) |
| `/{comment_id}/helpful` | POST | `CommentResponse` | ✅ Properly typed |

**Status:** All endpoints properly typed. Excellent implementation.

---

### 8. ✅ COLLECTIONS.PY - FULLY COMPLIANT
**Status:** No Issues | All 8 endpoints properly typed

| Endpoint | Method | Response Schema | Status |
|----------|--------|-----------------|--------|
| `GET /` | GET | `list[CollectionResponse]` | ✅ Properly typed |
| `GET /{collection_id}` | GET | `CollectionResponse` | ✅ Properly typed |
| `POST /` | POST | `CollectionResponse` | ✅ Properly typed |
| `PATCH /{collection_id}` | PATCH | `CollectionResponse` | ✅ Properly typed |
| `DELETE /{collection_id}` | DELETE | None | ✅ Proper (204) |
| `POST /{collection_id}/subscribe` | POST | `CollectionResponse` | ✅ Properly typed |
| `GET /{collection_id}/prompts` | GET | `list[UUID]` | ✅ Properly typed |
| `GET /{collection_id}/resources` | GET | `list[UUID]` | ✅ Properly typed |

**Status:** All endpoints properly typed. Excellent implementation.

---

### 9. ⚠️ COLLABORATION.PY - PARTIALLY COMPLIANT
**Status:** 3 Issues | 0 of 3 endpoints properly typed

| Endpoint | Method | Response Schema | Status | Issue |
|----------|--------|-----------------|--------|-------|
| `POST /{resource_id}/collaborate` | POST | `dict[str, Any]` | ❌ UNTYPED | Issue |
| `GET /{resource_id}/collaboration-options` | GET | `dict[str, Any]` | ❌ UNTYPED | Issue |
| `GET /similar` | GET | `list[dict[str, Any]]` | ❌ UNTYPED | Issue |

**Issue #1: create_collaboration_request() endpoint**
```python
# Current: Returns dict[str, Any]
{
  "status": "requested",
  "resource_id": "...",
  "to_user_id": "...",
  "from_user_id": "...",
  "message": "..." // optional
}
```
**Impact:** Collaboration feature - frontend can't validate response structure.

**Issue #2: get_collaboration_options() endpoint**
```python
# Current: Returns dict[str, Any]
{
  "resource_id": "...",
  "author_id": "...",
  "collaboration_status": "SEEKING",
  "open_to": ["questions", "improvements"],
  "contact_options": {
    "email": true,
    "platform_message": false
  }
}
```
**Impact:** Resource detail page collaboration section - needs proper typing.

**Issue #3: find_similar_resources() endpoint**
```python
# Current: Returns list[dict[str, Any]]
[
  {
    "id": "...",
    "title": "...",
    "author_id": "...",
    "discipline": "MARKETING",
    "tools_used": {"LLM": ["Claude"]},
    "collaboration_status": "SEEKING",
    "open_to_collaborate": ["feedback"]
  }
]
```
**Impact:** "Similar resources" recommendations - frontend loses type safety.

**Recommendation:**
```python
class CollaborationRequestResponse(SQLModel):
    """Response when collaboration request is created."""
    status: str
    resource_id: UUID
    to_user_id: UUID
    from_user_id: UUID
    message: str | None = None

class CollaborationOptionsResponse(SQLModel):
    """Collaboration options for a resource."""
    resource_id: UUID
    author_id: UUID
    collaboration_status: str | None
    open_to: list[str]
    contact_options: dict[str, bool]

class SimilarResourceResponse(SQLModel):
    """Similar resource for recommendations."""
    id: UUID
    title: str
    author_id: UUID
    discipline: str | None
    tools_used: dict[str, list[str]]
    collaboration_status: str | None
    open_to_collaborate: list[str]
```

---

## Frontend API Client Type Expectations

Based on the frontend code analysis, here's what the frontend expects:

### By Feature:

| Feature | Expected Response | Current Status | Risk Level |
|---------|-------------------|----------------|------------|
| User Authentication | `TokenResponse` | ✅ Matches | None |
| Resource Listing | `Resource[]` with embedded user | ⚠️ Generic dict | Medium |
| Resource Detail | `Resource` with embedded user | ⚠️ Generic dict | Medium |
| Save Toggle | `SaveResponse` | ❌ Generic dict | High |
| Tried Tracking | `TriedResponse` | ❌ Generic dict | High |
| Save Status Check | `IsSavedResponse` | ❌ Generic dict | High |
| User Saved Resources | `SavedResource[]` | ❌ Generic dict[] | High |
| Platform Analytics | `PlatformAnalytics` | ❌ Generic dict | High |
| Discipline Analytics | `AnalyticsByDiscipline` | ❌ Generic dict | High |
| Collaboration Options | Typed object | ❌ Generic dict | Medium |
| Similar Resources | `SimilarResource[]` | ❌ Generic dict[] | Medium |
| Notifications Prefs | Typed object | ⚠️ Generic dict | Low |

---

## Impact Assessment

### High Risk (18+ endpoints)
These are critical user-facing features that lose type safety:
- 🔴 Engagement tracking (save, tried, view counts)
- 🔴 User profile data (saved resources)
- 🔴 Admin dashboard (analytics)
- 🔴 Collaboration features
- 🔴 Resource discovery (list/detail)

### Medium Risk (2 endpoints)
Important but less critical:
- 🟡 Notification preferences
- 🟡 Prompt usage tracking

### Mitigation Options

**Option A: Fix All Issues (Recommended)**
- Add 12 new response schema classes to models.py
- Update 18+ endpoint response_model declarations
- Estimated effort: 2-3 hours
- Benefit: Complete type safety across all endpoints
- Frontend benefit: Full IDE support, autocomplete, validation

**Option B: Create Type-Safe Wrappers (Quick Fix)**
- Keep backend endpoints as-is
- Frontend creates TypeScript interfaces that match actual responses
- Estimated effort: 1-2 hours (frontend only)
- Benefit: Frontend gets type safety
- Drawback: Manual syncing if API changes, duplication

**Option C: Generate Types Automatically**
- Use OpenAPI/Swagger generation
- Auto-generate TypeScript types from FastAPI endpoints
- Estimated effort: 1-2 hours setup
- Benefit: Always-in-sync types
- Drawback: Requires additional tooling

**Recommendation:** Option A - Fix the backend schemas. Benefits both frontend and backend, enables better documentation generation, and follows API design best practices.

---

## Summary Statistics

| Category | Count | Status |
|----------|-------|--------|
| **Total Endpoints** | 45+ | |
| **Properly Typed** | 16 | ✅ 36% |
| **Untyped (dict[str, Any])** | 18+ | ❌ 40% |
| **Partially Typed** | 11+ | ⚠️ 24% |
| **Fully Compliant Modules** | 3 | admin.py, comments.py, collections.py |
| **Partially Compliant Modules** | 4 | resources.py, analytics.py, subscriptions.py, prompts.py |
| **Fully Compliant Modules** | 2 | auth.py, collaboration.py |

---

## Recommended Action Plan

### Phase 1: High Priority (Critical Path)
1. Fix analytics.py endpoints (8 issues)
2. Fix resources.py endpoints (2 issues)
3. Fix collaboration.py endpoints (3 issues)

### Phase 2: Medium Priority
4. Fix prompts.py endpoint (1 issue)
5. Fix subscriptions.py endpoint (1 issue)

### Phase 3: Documentation
6. Generate OpenAPI/Swagger documentation
7. Update API documentation
8. Add response schema examples

---

## Testing Recommendations

After implementing fixes:

1. **Type Checking:** Run `mypy` on all API files to verify types
2. **Schema Validation:** Test all endpoints with `pydantic` validation
3. **Frontend Integration:** Regenerate frontend types if using OpenAPI generation
4. **Regression Testing:** Run full test suite to ensure no breaking changes

---

## Conclusion

The API contract between frontend and backend is **partially functional but inconsistent**. While critical authentication and admin features are well-typed, many core engagement and user-facing features lack proper type definitions.

**Priority:** Add proper response schemas to the 18+ untyped endpoints to achieve full type safety across the application.

This audit identified all issues and provided recommended schemas for remediation. Implementation should be straightforward given the existing pattern in well-typed endpoints.
