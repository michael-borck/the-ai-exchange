"""Resource CRUD endpoints for requests, use cases, prompts, and policies."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from app.api.auth import get_current_user
from app.core.config import settings
from app.models import (
    Resource,
    ResourceAnalytics,
    ResourceAnalyticsResponse,
    ResourceCreate,
    ResourceResponse,
    ResourceStatus,
    ResourceType,
    ResourceUpdate,
    ResourceWithAuthor,
    User,
)
from app.services.auto_tagger import extract_keywords
from app.services.database import get_session
from app.services.email_service import notify_new_request, notify_new_solution

router = APIRouter(prefix=f"{settings.api_v1_str}/resources", tags=["resources"])


class TagSuggestion:
    """Tag suggestions response."""

    def __init__(
        self,
        system_tags: list[str],
        user_tags: list[str] | None = None,
    ) -> None:
        """Initialize tag suggestion.

        Args:
            system_tags: System-generated tags
            user_tags: User-added tags
        """
        self.system_tags = system_tags
        self.user_tags = user_tags or []


@router.get("", response_model=list[ResourceWithAuthor])
def list_resources(
    type_filter: ResourceType | None = Query(None, alias="type"),
    tag: str | None = Query(None),
    search: str | None = Query(None),
    status_filter: ResourceStatus | None = Query(None, alias="status"),
    # Metadata filters
    specialty: str | None = Query(None, description="e.g., Marketing, Management"),
    tools: str | None = Query(None, description="Comma-separated list of tools"),
    professional_roles: str | None = Query(None, description="Comma-separated professional roles: Educator,Researcher,Professional"),
    min_time_saved: float | None = Query(None, description="Minimum hours saved"),
    sort_by: str = Query("newest", pattern="^(newest|popular|most_tried)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=1000),
    session: Session = Depends(get_session),
) -> list[ResourceWithAuthor]:
    """Get list of resources with advanced filtering and author information.

    Args:
        type_filter: Filter by resource type
        tag: Filter by tag
        search: Search in title and content
        status_filter: Filter by status (for requests)
        discipline: Filter by discipline (e.g., Marketing, Management)
        tools: Filter by tools (comma-separated: ChatGPT,Claude)
        professional_roles: Filter by creator professional role (comma-separated: Educator,Researcher,Professional)
        min_time_saved: Filter for quick wins (minimum hours saved)
        sort_by: Sort order (newest, popular, most_tried)
        skip: Number of resources to skip
        limit: Maximum resources to return
        session: Database session

    Returns:
        List of resources with author info matching filters
    """
    query = select(Resource).where(Resource.is_hidden.is_(False))

    # Basic filters
    if type_filter:
        query = query.where(Resource.type == type_filter)

    if status_filter:
        query = query.where(Resource.status == status_filter)

    if tag:
        # Filter by tag (contains)
        query = query.where(
            (Resource.system_tags.contains([tag]))
            | (Resource.user_tags.contains([tag]))
            | (Resource.shadow_tags.contains([tag]))
        )

    if search:
        search_term = f"%{search}%"
        query = query.where(
            (Resource.title.ilike(search_term))
            | (Resource.content_text.ilike(search_term))
            | (Resource.quick_summary.ilike(search_term))  # type: ignore[union-attr]
        )

    # Metadata filters
    if specialty:
        query = query.where(Resource.specialty == specialty)

    if tools:
        # Parse comma-separated tool categories (e.g., "LLM,CUSTOM_APP")
        # tools_used is a JSON dict: {"LLM": ["Claude"], "CUSTOM_APP": ["Talk-Buddy"]}
        # Filter resources that have any of the specified categories
        from sqlalchemy import func, or_
        tool_categories = [t.strip() for t in tools.split(",")]
        # Build OR condition: check if any of the specified categories exist as keys
        # Using json_extract to check if the key exists in the JSON object
        conditions = []
        for category in tool_categories:
            # Check if the category key exists in tools_used dict using json_extract
            # json_extract returns NULL if the key doesn't exist, not NULL if it does
            conditions.append(func.json_extract(Resource.tools_used, f'$.{category}').isnot(None))
        if conditions:
            query = query.where(or_(*conditions))

    if professional_roles:
        # Parse comma-separated professional roles (e.g., "Educator,Researcher")
        # Filter resources by the creator's professional roles (JSON list field)
        from sqlalchemy import or_
        roles = [r.strip() for r in professional_roles.split(",")]
        # Join with User table and check if any role matches the JSON array
        role_conditions = [User.professional_roles.contains(role) for role in roles]  # type: ignore[union-attr]
        query = query.join(User, Resource.user_id == User.id).where(or_(*role_conditions))

    if min_time_saved is not None:
        query = query.where(Resource.time_saved_value >= min_time_saved)  # type: ignore[operator]

    # Sorting
    if sort_by == "newest":
        query = query.order_by(Resource.created_at.desc())
    elif sort_by == "popular":
        # Sort by helpful votes (would join with analytics in production)
        query = query.order_by(Resource.created_at.desc())
    elif sort_by == "most_tried":
        # Sort by most tried (would join with analytics in production)
        query = query.order_by(Resource.created_at.desc())

    resources = session.exec(query.offset(skip).limit(limit)).all()

    # Include user information and analytics for each resource
    result = []
    for resource in resources:
        # Get only the fields we need for author info with a targeted query
        user_data = session.exec(
            select(User.id, User.full_name, User.email).where(User.id == resource.user_id)
        ).first()

        # Get analytics for the resource
        analytics = session.exec(
            select(ResourceAnalytics).where(ResourceAnalytics.resource_id == resource.id)
        ).first()

        if user_data:
            # Build response data with analytics
            response_data = ResourceResponse.model_validate(resource).model_dump()
            response_data["analytics"] = (
                ResourceAnalyticsResponse.model_validate(analytics).model_dump()
                if analytics
                else None
            )

            # Respect anonymity: show author name only if not anonymous
            user_id, full_name, email = user_data
            author_name = "Faculty Member" if resource.is_anonymous else full_name
            author_email = None if resource.is_anonymous else email

            resource_with_author = ResourceWithAuthor(
                **response_data,
                author_name=author_name,
                author_email=author_email,
                author_id=user_id,
            )
            result.append(resource_with_author)

    return result


@router.get("/{resource_id}", response_model=ResourceWithAuthor)
def get_resource(
    resource_id: UUID,
    session: Session = Depends(get_session),
) -> ResourceWithAuthor:
    """Get a specific resource with author information.

    Args:
        resource_id: Resource ID
        session: Database session

    Returns:
        Resource details with user information

    Raises:
        HTTPException: If resource not found
    """
    resource = session.get(Resource, resource_id)

    if not resource or resource.is_hidden:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found",
        )

    # Get only the fields we need for author info with a targeted query
    user_data = session.exec(
        select(User.id, User.full_name, User.email).where(User.id == resource.user_id)
    ).first()

    # Get analytics for the resource
    analytics = session.exec(
        select(ResourceAnalytics).where(ResourceAnalytics.resource_id == resource_id)
    ).first()

    # Build response data
    response_data = ResourceResponse.model_validate(resource).model_dump()
    response_data["analytics"] = (
        ResourceAnalyticsResponse.model_validate(analytics).model_dump()
        if analytics
        else None
    )

    # Build response with user information
    if user_data:
        # Respect anonymity: show author name only if not anonymous
        user_id, full_name, email = user_data
        author_name = "Faculty Member" if resource.is_anonymous else full_name
        author_email = None if resource.is_anonymous else email

        return ResourceWithAuthor(
            **response_data,
            author_name=author_name,
            author_email=author_email,
            author_id=user_id,
        )

    # Fallback if no user found (shouldn't happen)
    return ResourceWithAuthor(
        **response_data,
        author_name="Unknown",
        author_email=None,
        author_id=resource.user_id,
    )


@router.get("/{resource_id}/solutions", response_model=list[ResourceResponse])
def get_resource_solutions(
    resource_id: UUID,
    session: Session = Depends(get_session),
) -> list[ResourceResponse]:
    """Get all solutions for a request.

    Args:
        resource_id: Parent request ID
        session: Database session

    Returns:
        List of solutions

    Raises:
        HTTPException: If resource not found or not a request
    """
    resource = session.get(Resource, resource_id)

    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found",
        )

    if resource.type != ResourceType.REQUEST:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only requests can have solutions",
        )

    solutions = session.exec(
        select(Resource)
        .where(Resource.parent_id == resource_id)
        .where(Resource.is_hidden.is_(False))
        .order_by(Resource.created_at.desc())
    ).all()

    return solutions


@router.post("", response_model=ResourceResponse, status_code=status.HTTP_201_CREATED)
def create_resource(
    resource_data: ResourceCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> ResourceResponse:
    """Create a new resource.

    Args:
        resource_data: Resource creation data
        current_user: Current authenticated user
        session: Database session

    Returns:
        Created resource

    Raises:
        HTTPException: If invalid parent_id or parent not a request
    """
    # Validate parent_id if provided
    if resource_data.parent_id:
        parent = session.get(Resource, resource_data.parent_id)

        if not parent:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Parent resource not found",
            )

        if parent.type != ResourceType.REQUEST:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solutions can only be added to requests",
            )

    # Create resource
    # Auto-populate user_area from current user's area
    new_resource = Resource(
        user_id=current_user.id,
        type=resource_data.type,
        title=resource_data.title,
        content_text=resource_data.content_text,
        is_anonymous=resource_data.is_anonymous,
        parent_id=resource_data.parent_id,
        content_meta=resource_data.content_meta,
        user_area="General",  # Default area (User model has no area field yet)
    )

    session.add(new_resource)
    session.commit()
    session.refresh(new_resource)

    # Extract keywords asynchronously (for now, do it synchronously)
    # TODO: Move to background task
    tags = extract_keywords(f"{new_resource.title} {new_resource.content_text}")
    new_resource.system_tags = tags

    session.add(new_resource)
    session.commit()
    session.refresh(new_resource)

    # If this is a solution, update parent request status and notify requester
    if new_resource.parent_id:
        parent = session.get(Resource, new_resource.parent_id)
        if parent and parent.type == ResourceType.REQUEST:
            parent.status = ResourceStatus.SOLVED
            session.add(parent)
            session.commit()

            # Notify the original requester (background task would be ideal)
            requester = session.get(User, parent.user_id)
            if requester:
                notify_new_solution(new_resource, requester)

    # If this is a new request, notify subscribers to related tags
    if new_resource.type == ResourceType.REQUEST and new_resource.system_tags:
        from app.models import Subscription

        # Find all subscriptions matching any of the tags
        subscriptions: list[Subscription] = []
        for tag in new_resource.system_tags:
            tag_subscriptions = session.exec(
                select(Subscription).where(Subscription.tag == tag)
            ).all()
            subscriptions.extend(tag_subscriptions)

        if subscriptions:
            # Get unique users and notify them (background task would be ideal)
            subscriber_ids = {sub.user_id for sub in subscriptions}
            subscribers: list[User] = [
                u for uid in subscriber_ids if (u := session.get(User, uid)) is not None
            ]
            notify_new_request(new_resource, subscribers)

    return new_resource


@router.patch("/{resource_id}", response_model=ResourceResponse)
def update_resource(
    resource_id: UUID,
    resource_update: ResourceUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> ResourceResponse:
    """Update a resource (owner or admin).

    Args:
        resource_id: Resource ID
        resource_update: Update data
        current_user: Current authenticated user
        session: Database session

    Returns:
        Updated resource

    Raises:
        HTTPException: If not owner/admin or resource not found
    """
    from app.models import UserRole

    resource = session.get(Resource, resource_id)

    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found",
        )

    # Check if user is owner or admin
    is_owner = resource.user_id == current_user.id
    is_admin = current_user.role == UserRole.ADMIN

    if not (is_owner or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only resource owner or admin can update",
        )

    # Update fields
    if resource_update.title is not None:
        resource.title = resource_update.title

    if resource_update.content_text is not None:
        resource.content_text = resource_update.content_text

    if resource_update.content_meta is not None:
        resource.content_meta = resource_update.content_meta

    session.add(resource)
    session.commit()
    session.refresh(resource)

    return resource


@router.delete("/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resource(
    resource_id: UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> None:
    """Delete a resource (owner or admin).

    Args:
        resource_id: Resource ID
        current_user: Current authenticated user
        session: Database session

    Raises:
        HTTPException: If not owner/admin or resource not found
    """
    from app.models import UserRole

    resource = session.get(Resource, resource_id)

    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found",
        )

    # Check if user is owner or admin
    is_owner = resource.user_id == current_user.id
    is_admin = current_user.role == UserRole.ADMIN

    if not (is_owner or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only resource owner or admin can delete",
        )

    # If this is a solution, check if there are other solutions
    if resource.parent_id:
        other_solutions = session.exec(
            select(Resource).where(
                (Resource.parent_id == resource.parent_id)
                & (Resource.id != resource_id)
                & (Resource.is_hidden.is_(False))
            )
        ).all()

        # If no other solutions, revert parent status to OPEN
        if not other_solutions:
            parent = session.get(Resource, resource.parent_id)
            if parent:
                parent.status = ResourceStatus.OPEN
                session.add(parent)

    session.delete(resource)
    session.commit()
