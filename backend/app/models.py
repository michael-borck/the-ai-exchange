"""Database models for The AI Exchange."""

from datetime import UTC, datetime
from enum import Enum
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import JSON
from sqlmodel import Column, DateTime, Field, SQLModel, Text


class UserRole(str, Enum):
    """User system roles."""

    STAFF = "STAFF"
    ADMIN = "ADMIN"


class ProfessionalRole(str, Enum):
    """User professional roles."""

    EDUCATOR = "Educator"
    RESEARCHER = "Researcher"
    PROFESSIONAL = "Professional"


class ConfigValueType(str, Enum):
    """Types of configurable values."""

    SPECIALTY = "SPECIALTY"
    PROFESSIONAL_ROLE = "PROFESSIONAL_ROLE"
    RESOURCE_TYPE = "RESOURCE_TYPE"


class ConfigRequestStatus(str, Enum):
    """Status of user config requests."""

    PENDING = "PENDING"
    APPROVED_MERGED = "APPROVED_MERGED"
    REJECTED = "REJECTED"


class ConfigurableValue(SQLModel, table=True):
    """Configurable values for specialties, roles, and resource types."""

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    type: ConfigValueType = Field(index=True)
    key: str = Field(index=True, unique=True)
    label: str
    description: str | None = Field(default=None)
    category: str | None = Field(default=None)
    is_active: bool = Field(default=True, index=True)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True)),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True)),
    )

    def __repr__(self) -> str:
        """String representation."""
        return f"ConfigurableValue(type={self.type}, key={self.key}, label={self.label})"


class UserConfigRequest(SQLModel, table=True):
    """User requests for new configurable values."""

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="user.id", index=True)
    type: ConfigValueType = Field(index=True)
    requested_value: str
    context: str | None = Field(default=None, sa_column=Column(Text))
    status: ConfigRequestStatus = Field(default=ConfigRequestStatus.PENDING, index=True)
    admin_response_key: UUID | None = Field(
        default=None,
        foreign_key="configurablevalue.id",
        description="ConfigurableValue ID if approved/merged",
    )
    admin_notes: str | None = Field(default=None, sa_column=Column(Text))
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True)),
    )
    reviewed_at: datetime | None = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True)),
    )
    reviewed_by: UUID | None = Field(
        default=None,
        foreign_key="user.id",
        description="Admin who reviewed this request",
    )

    def __repr__(self) -> str:
        """String representation."""
        return f"UserConfigRequest(user={self.user_id}, type={self.type}, status={self.status})"


class ResourceType(str, Enum):
    """Resource content types."""

    REQUEST = "REQUEST"
    USE_CASE = "USE_CASE"
    PROMPT = "PROMPT"
    TOOL = "TOOL"
    POLICY = "POLICY"
    PAPER = "PAPER"
    PROJECT = "PROJECT"
    CONFERENCE = "CONFERENCE"
    DATASET = "DATASET"
    BOOK = "BOOK"
    OTHER = "OTHER"


class ResourceStatus(str, Enum):
    """Resource status for requests."""

    OPEN = "OPEN"
    SOLVED = "SOLVED"


class SharingLevel(str, Enum):
    """Sharing level for prompts and resources."""

    PRIVATE = "PRIVATE"
    DEPARTMENT = "DEPARTMENT"
    SCHOOL = "SCHOOL"
    PUBLIC = "PUBLIC"


class ToolCategory(str, Enum):
    """Categories for AI and related tools."""

    LLM = "LLM"  # Large Language Models (Claude, ChatGPT, NotebookLM, etc.)
    CUSTOM_APP = "CUSTOM_APP"  # Custom built applications (Talk-Buddy, Study-Buddy, etc.)
    VISION = "VISION"  # Computer vision tools (DALL-E, Midjourney, etc.)
    SPEECH = "SPEECH"  # Speech/audio tools (Whisper, ElevenLabs, etc.)
    WORKFLOW = "WORKFLOW"  # Workflow automation (Canvas LMS, Make, Zapier, etc.)
    DEVELOPMENT = "DEVELOPMENT"  # Development/coding tools (Python, GitHub Copilot, Cursor, etc.)
    OTHER = "OTHER"  # Other AI-related tools


class User(SQLModel, table=True):
    """User model."""

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    full_name: str
    role: UserRole = Field(default=UserRole.STAFF)
    professional_roles: list[str] = Field(
        default=[ProfessionalRole.EDUCATOR],
        description="Professional roles (Educator, Researcher, Professional)",
        sa_column=Column(JSON),
    )
    is_active: bool = Field(default=True)
    is_verified: bool = Field(default=False)
    is_approved: bool = Field(default=True)
    specialties: list[str] = Field(
        default=[],
        description="User's professional specialties (keys from ConfigurableValue)",
        sa_column=Column(JSON),
    )
    notification_prefs: dict[str, Any] = Field(
        default={
            "notify_requests": True,
            "notify_solutions": False,
        },
        sa_column=Column(JSON),
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True)),
    )

    def __repr__(self) -> str:
        """String representation."""
        return f"User(id={self.id}, email={self.email}, role={self.role})"


class PasswordReset(SQLModel, table=True):
    """Password reset model for secure password recovery."""

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="user.id", index=True)
    token: str = Field(max_length=6, index=True)  # 6-digit reset code
    expires_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True)),
        description="Token expiration time",
    )
    used: bool = Field(default=False)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True)),
    )

    def __repr__(self) -> str:
        """String representation."""
        return f"PasswordReset(id={self.id}, user_id={self.user_id}, used={self.used})"

    @property
    def is_expired(self) -> bool:
        """Check if reset token has expired."""
        now = datetime.now(UTC)
        # Ensure both datetimes are aware before comparing
        expires_at = self.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=UTC)
        return now > expires_at

    @property
    def is_valid(self) -> bool:
        """Check if reset token is valid (not used and not expired)."""
        return not self.used and not self.is_expired


class EmailVerification(SQLModel, table=True):
    """Email verification model for registration email confirmation."""

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="user.id", index=True)
    code: str = Field(max_length=6, index=True)  # 6-digit verification code
    expires_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True)),
        description="Code expiration time",
    )
    used: bool = Field(default=False)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True)),
    )

    def __repr__(self) -> str:
        """String representation."""
        return f"EmailVerification(id={self.id}, user_id={self.user_id}, used={self.used})"

    @property
    def is_expired(self) -> bool:
        """Check if verification code has expired."""
        now = datetime.now(UTC)
        # Ensure both datetimes are aware before comparing
        expires_at = self.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=UTC)
        return now > expires_at

    @property
    def is_valid(self) -> bool:
        """Check if verification code is valid (not used and not expired)."""
        return not self.used and not self.is_expired


class Resource(SQLModel, table=True):
    """Resource model for requests, use cases, prompts, and policies."""

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="user.id", index=True)
    parent_id: UUID | None = Field(
        default=None,
        foreign_key="resource.id",
        index=True,
        description="Parent request ID for solutions",
    )
    type: ResourceType = Field(index=True)
    status: ResourceStatus = Field(default=ResourceStatus.OPEN)
    title: str = Field(index=True)
    content_text: str = Field(sa_column=Column(Text))
    shadow_description: str | None = Field(
        default=None,
        sa_column=Column(Text),
        description="Admin-provided improved description",
    )
    content_meta: dict[str, Any] = Field(
        default={},
        description="Flexible metadata (Model Used, Tools, etc.)",
        sa_column=Column(JSON),
    )
    is_anonymous: bool = Field(default=False, index=True)
    is_verified: bool = Field(default=False)
    is_hidden: bool = Field(default=False, index=True)
    system_tags: list[str] = Field(
        default=[],
        description="Auto-generated by YAKE + optional LLM",
        sa_column=Column(JSON),
    )
    user_tags: list[str] = Field(
        default=[],
        description="Manually added by author",
        sa_column=Column(JSON),
    )
    shadow_tags: list[str] = Field(
        default=[],
        description="Admin-provided tags",
        sa_column=Column(JSON),
    )
    # Metadata fields
    specialty: str | None = Field(
        default=None,
        description="Professional specialty (key from ConfigurableValue)",
    )
    user_area: str = Field(
        default="General",
        description="Creator's area/school/department (auto-assigned from user profile)",
    )
    author_title: str | None = Field(
        default=None,
        description="e.g., Senior Lecturer, Associate Professor",
    )
    tools_used: dict[str, list[str]] = Field(
        default={},
        description="AI and related tools by category. e.g., {'LLM': ['Claude', 'ChatGPT'], 'CUSTOM_APP': ['Talk-Buddy']}",
        sa_column=Column(JSON),
    )
    # Collaborators field - list of email addresses of people involved in this project
    collaborators: list[str] = Field(
        default=[],
        description="Email addresses of collaborators involved in this idea (editable). First email is primary contact.",
        sa_column=Column(JSON),
    )
    time_saved_value: float | None = Field(
        default=None,
        description="Hours saved (e.g., 3.0)",
    )
    time_saved_frequency: str | None = Field(
        default=None,
        description="per_week, per_month, or per_semester",
    )
    evidence_of_success: list[str] = Field(
        default=[],
        description="feedback, quantifiable, peer_reviewed, department_approved",
        sa_column=Column(JSON),
    )
    # Prompt forking support
    is_fork: bool = Field(default=False, description="True if this is a fork")
    forked_from_id: UUID | None = Field(
        default=None,
        foreign_key="resource.id",
        description="Original resource if this is a fork",
    )
    version_number: int = Field(default=1, description="Version number for forks")
    # Content enhancements
    quick_summary: str | None = Field(
        default=None,
        sa_column=Column(Text),
        description="One-liner description for browse view",
    )
    workflow_steps: list[str] = Field(
        default=[],
        description="Step-by-step workflow instructions",
        sa_column=Column(JSON),
    )
    example_prompt: str | None = Field(
        default=None,
        sa_column=Column(Text),
        description="Example prompt or template",
    )
    ethics_limitations: str | None = Field(
        default=None,
        sa_column=Column(Text),
        description="Ethics considerations and limitations",
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True), index=True),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True)),
    )

    def __repr__(self) -> str:
        """String representation."""
        return f"Resource(id={self.id}, type={self.type}, title={self.title})"

    @property
    def all_tags(self) -> list[str]:
        """Get all tags combined."""
        return list(set(self.system_tags + self.user_tags + self.shadow_tags))


class Subscription(SQLModel, table=True):
    """Subscription model for tag-based notifications."""

    id: int | None = Field(default=None, primary_key=True)
    user_id: UUID = Field(foreign_key="user.id", index=True)
    tag: str = Field(index=True)

    def __repr__(self) -> str:
        """String representation."""
        return f"Subscription(user_id={self.user_id}, tag={self.tag})"


class Comment(SQLModel, table=True):
    """Comment model for discussions on resources."""

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    resource_id: UUID = Field(foreign_key="resource.id", index=True)
    parent_comment_id: UUID | None = Field(
        default=None,
        foreign_key="comment.id",
        description="Parent comment for threading",
    )
    user_id: UUID = Field(foreign_key="user.id", index=True)
    content: str = Field(sa_column=Column(Text))
    helpful_count: int = Field(default=0, description="Number of helpful votes")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True), index=True),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True)),
    )

    def __repr__(self) -> str:
        """String representation."""
        return f"Comment(id={self.id}, resource_id={self.resource_id})"


class Prompt(SQLModel, table=True):
    """Prompt model for prompt library."""

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="user.id", index=True)
    title: str = Field(index=True)
    prompt_text: str = Field(sa_column=Column(Text))
    description: str | None = Field(default=None, sa_column=Column(Text))
    variables: list[str] = Field(
        default=[],
        description="Template variables like {{course}}, {{tone}}",
        sa_column=Column(JSON),
    )
    sharing_level: SharingLevel = Field(default=SharingLevel.PRIVATE)
    is_fork: bool = Field(default=False, description="True if forked from another prompt")
    forked_from_id: UUID | None = Field(
        default=None,
        foreign_key="prompt.id",
        description="Original prompt if this is a fork",
    )
    version_number: int = Field(default=1, description="Version number")
    usage_count: int = Field(default=0, description="Number of times used")
    fork_count: int = Field(default=0, description="Number of forks created")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True), index=True),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True)),
    )

    def __repr__(self) -> str:
        """String representation."""
        return f"Prompt(id={self.id}, title={self.title})"


class Collection(SQLModel, table=True):
    """Collection model for curated groups of prompts and resources."""

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str = Field(index=True)
    description: str | None = Field(default=None, sa_column=Column(Text))
    owner_id: str = Field(description="User ID or 'SYSTEM' for official collections")
    resource_ids: list[UUID] = Field(
        default=[],
        description="List of resource IDs in collection",
        sa_column=Column(JSON),
    )
    prompt_ids: list[UUID] = Field(
        default=[],
        description="List of prompt IDs in collection",
        sa_column=Column(JSON),
    )
    subscriber_count: int = Field(default=0, description="Number of subscribers")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True), index=True),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True)),
    )

    def __repr__(self) -> str:
        """String representation."""
        return f"Collection(id={self.id}, name={self.name})"


class ResourceAnalytics(SQLModel, table=True):
    """Analytics model for tracking resource engagement."""

    id: int | None = Field(default=None, primary_key=True)
    resource_id: UUID = Field(foreign_key="resource.id", unique=True, index=True)
    view_count: int = Field(default=0, description="Total views")
    unique_viewers: int = Field(default=0, description="Unique user count")
    save_count: int = Field(default=0, description="Number of saves/bookmarks")
    tried_count: int = Field(default=0, description="Users who tried it")
    fork_count: int = Field(default=0, description="Number of forks created")
    comment_count: int = Field(default=0, description="Total comments")
    helpful_count: int = Field(default=0, description="Marked as helpful")
    last_viewed: datetime | None = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True)),
        description="Last viewed timestamp",
    )

    def __repr__(self) -> str:
        """String representation."""
        return f"ResourceAnalytics(resource_id={self.resource_id}, views={self.view_count})"


class UserSavedResource(SQLModel, table=True):
    """Model tracking which users saved which resources."""

    id: int | None = Field(default=None, primary_key=True)
    user_id: UUID = Field(foreign_key="user.id", index=True)
    resource_id: UUID = Field(foreign_key="resource.id", index=True)
    saved_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True), index=True),
        description="When the resource was saved",
    )

    def __repr__(self) -> str:
        """String representation."""
        return f"UserSavedResource(user_id={self.user_id}, resource_id={self.resource_id})"


class UserTriedResource(SQLModel, table=True):
    """Model tracking which users tried which resources."""

    id: int | None = Field(default=None, primary_key=True)
    user_id: UUID = Field(foreign_key="user.id", index=True)
    resource_id: UUID = Field(foreign_key="resource.id", index=True)
    tried_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True), index=True),
        description="When the resource was tried",
    )

    def __repr__(self) -> str:
        """String representation."""
        return f"UserTriedResource(user_id={self.user_id}, resource_id={self.resource_id})"


# Response schemas (for API)
class UserBase(SQLModel):
    """Base user schema."""

    email: str
    full_name: str


class UserCreate(UserBase):
    """User creation schema."""

    password: str
    professional_roles: list[str] | None = None  # Multiple roles
    specialties: list[str] | None = None


class UserUpdate(SQLModel):
    """User update schema."""

    full_name: str | None = None
    specialties: list[str] | None = None
    notification_prefs: dict[str, Any] | None = None


class UserResponse(UserBase):
    """User response schema (without password)."""

    id: UUID
    role: UserRole
    professional_roles: list[str]
    is_active: bool
    is_verified: bool
    is_approved: bool
    specialties: list[str]
    notification_prefs: dict[str, Any]
    created_at: datetime

    class Config:
        """Pydantic config."""

        from_attributes = True


class UserPublic(SQLModel):
    """Public user info (for anonymous masking)."""

    id: UUID
    full_name: str


class ResourceBase(SQLModel):
    """Base resource schema."""

    type: ResourceType
    title: str
    content_text: str
    is_anonymous: bool = False
    parent_id: UUID | None = None
    content_meta: dict[str, Any] = Field(default={})


class ResourceCreate(ResourceBase):
    """Resource creation schema."""

    # Collaborators
    collaborators: list[str] = Field(default=[])
    # Metadata fields
    specialty: str | None = None
    author_title: str | None = None
    tools_used: dict[str, list[str]] | list[str] = Field(default={})
    time_saved_value: float | None = None
    time_saved_frequency: str | None = None
    evidence_of_success: list[str] = Field(default=[])
    quick_summary: str | None = None
    workflow_steps: list[str] = Field(default=[])
    example_prompt: str | None = None
    ethics_limitations: str | None = None


class ResourceUpdate(SQLModel):
    """Resource update schema."""

    title: str | None = None
    content_text: str | None = None
    content_meta: dict[str, Any] | None = None
    # Collaborators
    collaborators: list[str] | None = None
    # Metadata fields
    specialty: str | None = None
    author_title: str | None = None
    tools_used: dict[str, list[str]] | None = None
    time_saved_value: float | None = None
    time_saved_frequency: str | None = None
    evidence_of_success: list[str] | None = None
    quick_summary: str | None = None
    workflow_steps: list[str] | None = None
    example_prompt: str | None = None
    ethics_limitations: str | None = None


class ResourceTagsUpdate(SQLModel):
    """Update tags for a resource (admin only)."""

    system_tags: list[str] | None = None
    user_tags: list[str] | None = None
    shadow_tags: list[str] | None = None
    shadow_description: str | None = None


class TagSuggestion(SQLModel):
    """Tag suggestions for user to choose from."""

    system_tags: list[str] = Field(description="YAKE + LLM suggestions")
    user_tags: list[str] = Field(default=[], description="User can add custom")


class ResourceResponse(ResourceBase):
    """Resource response schema."""

    id: UUID
    user_id: UUID
    status: ResourceStatus
    is_verified: bool
    is_hidden: bool
    system_tags: list[str]
    user_tags: list[str]
    shadow_tags: list[str]
    shadow_description: str | None
    # Collaborators
    collaborators: list[str]
    # Metadata fields
    specialty: str | None
    author_title: str | None
    tools_used: dict[str, list[str]]
    time_saved_value: float | None
    time_saved_frequency: str | None
    evidence_of_success: list[str]
    is_fork: bool
    forked_from_id: UUID | None
    version_number: int
    quick_summary: str | None
    workflow_steps: list[str]
    example_prompt: str | None
    ethics_limitations: str | None
    created_at: datetime
    updated_at: datetime
    # Analytics data for engagement stats
    analytics: "ResourceAnalyticsResponse | None" = None

    class Config:
        """Pydantic config."""

        from_attributes = True


class ResourceWithAuthor(ResourceResponse):
    """Resource with author information."""

    author_name: str
    author_email: str | None = None
    author_id: UUID
    author_professional_roles: list[str] = []


class SubscriptionCreate(SQLModel):
    """Subscription creation schema."""

    tag: str


class SubscriptionResponse(SQLModel):
    """Subscription response schema."""

    user_id: UUID
    tag: str

    class Config:
        """Pydantic config."""

        from_attributes = True


# Comment schemas
class CommentCreate(SQLModel):
    """Comment creation schema."""

    content: str
    parent_comment_id: UUID | None = None


class CommentUpdate(SQLModel):
    """Comment update schema."""

    content: str


class CommentResponse(SQLModel):
    """Comment response schema."""

    id: UUID
    resource_id: UUID
    parent_comment_id: UUID | None
    user_id: UUID
    content: str
    helpful_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic config."""

        from_attributes = True


# Prompt schemas
class PromptCreate(SQLModel):
    """Prompt creation schema."""

    title: str
    prompt_text: str
    description: str | None = None
    variables: list[str] = Field(default=[])
    sharing_level: SharingLevel = SharingLevel.PRIVATE


class PromptUpdate(SQLModel):
    """Prompt update schema."""

    title: str | None = None
    prompt_text: str | None = None
    description: str | None = None
    variables: list[str] | None = None
    sharing_level: SharingLevel | None = None


class PromptResponse(SQLModel):
    """Prompt response schema."""

    id: UUID
    user_id: UUID
    title: str
    prompt_text: str
    description: str | None
    variables: list[str]
    sharing_level: SharingLevel
    is_fork: bool
    forked_from_id: UUID | None
    version_number: int
    usage_count: int
    fork_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic config."""

        from_attributes = True


# Collection schemas
class CollectionCreate(SQLModel):
    """Collection creation schema."""

    name: str
    description: str | None = None
    resource_ids: list[UUID] = Field(default=[])
    prompt_ids: list[UUID] = Field(default=[])


class CollectionUpdate(SQLModel):
    """Collection update schema."""

    name: str | None = None
    description: str | None = None
    resource_ids: list[UUID] | None = None
    prompt_ids: list[UUID] | None = None


class CollectionResponse(SQLModel):
    """Collection response schema."""

    id: UUID
    name: str
    description: str | None
    owner_id: str
    resource_ids: list[UUID]
    prompt_ids: list[UUID]
    subscriber_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic config."""

        from_attributes = True


# Analytics schemas
class ResourceAnalyticsResponse(SQLModel):
    """Resource analytics response schema."""

    resource_id: UUID
    view_count: int
    unique_viewers: int
    save_count: int
    tried_count: int
    fork_count: int
    comment_count: int
    helpful_count: int
    last_viewed: datetime | None

    class Config:
        """Pydantic config."""

        from_attributes = True


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
    status: str


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
    specialty: str | None
    user: dict[str, str | None] | None = None
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


class SpecialtyStats(SQLModel):
    """Statistics for a specialty."""

    count: int
    total_views: int
    total_saves: int


class AnalyticsBySpecialtyResponse(SQLModel):
    """Analytics by specialty response."""

    by_specialty: dict[str, SpecialtyStats]


class NotificationPreferences(SQLModel):
    """User notification preferences."""

    notify_requests: bool
    notify_solutions: bool


class PromptUsageResponse(SQLModel):
    """Prompt usage statistics."""

    id: UUID
    title: str
    usage_count: int
    fork_count: int
    sharing_level: str
    created_at: datetime
    updated_at: datetime


class SimilarResourceResponse(SQLModel):
    """Similar resource for recommendations."""

    id: UUID
    title: str
    author_id: UUID
    specialty: str | None
    tools_used: dict[str, list[str]]


# Password reset schemas
class ForgotPasswordRequest(SQLModel):
    """Request schema for forgot password endpoint."""

    email: str


class ForgotPasswordResponse(SQLModel):
    """Response schema for forgot password endpoint."""

    message: str


class ResetPasswordRequest(SQLModel):
    """Request schema for password reset."""

    email: str
    code: str
    new_password: str


class ResetPasswordResponse(SQLModel):
    """Response schema for password reset."""

    message: str


# Email verification schemas
class EmailVerificationRequest(SQLModel):
    """Request schema for email verification endpoint."""

    email: str
    code: str


class EmailVerificationResponse(SQLModel):
    """Response schema for email verification endpoint."""

    message: str


class UserRegistrationResponse(SQLModel):
    """Response schema for registration (before verification)."""

    email: str
    message: str
