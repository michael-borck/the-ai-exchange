"""Resource CRUD endpoints for requests, use cases, prompts, and policies."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from app.api.auth import get_current_user
from app.core.config import settings
from app.models import (
    Resource,
    ResourceCreate,
    ResourceResponse,
    ResourceStatus,
    ResourceType,
    ResourceUpdate,
    User,
)
from app.services.auto_tagger import extract_keywords
from app.services.database import get_session

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


@router.get("", response_model=list[ResourceResponse])
def list_resources(
    type_filter: Optional[ResourceType] = Query(None, alias="type"),
    tag: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    status_filter: Optional[ResourceStatus] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    session: Session = Depends(get_session),
) -> list[ResourceResponse]:
    """Get list of resources with optional filtering.

    Args:
        type_filter: Filter by resource type
        tag: Filter by tag
        search: Search in title and content
        status_filter: Filter by status (for requests)
        skip: Number of resources to skip
        limit: Maximum resources to return
        session: Database session

    Returns:
        List of resources
    """
    query = select(Resource).where(Resource.is_hidden.is_(False))

    if type_filter:
        query = query.where(Resource.type == type_filter)

    if status_filter:
        query = query.where(Resource.status == status_filter)

    if tag:
        # Simple tag filter (contains)
        # In production, this would be more sophisticated
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
        )

    # Order by creation date (newest first)
    query = query.order_by(Resource.created_at.desc())

    resources = session.exec(query.offset(skip).limit(limit)).all()
    return resources


@router.get("/{resource_id}", response_model=ResourceResponse)
def get_resource(
    resource_id: UUID,
    session: Session = Depends(get_session),
) -> ResourceResponse:
    """Get a specific resource.

    Args:
        resource_id: Resource ID
        session: Database session

    Returns:
        Resource details

    Raises:
        HTTPException: If resource not found
    """
    resource = session.get(Resource, resource_id)

    if not resource or resource.is_hidden:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found",
        )

    return resource


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
    new_resource = Resource(
        user_id=current_user.id,
        type=resource_data.type,
        title=resource_data.title,
        content_text=resource_data.content_text,
        is_anonymous=resource_data.is_anonymous,
        parent_id=resource_data.parent_id,
        content_meta=resource_data.content_meta,
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

    # If this is a solution, update parent request status
    if new_resource.parent_id:
        parent = session.get(Resource, new_resource.parent_id)
        if parent and parent.type == ResourceType.REQUEST:
            parent.status = ResourceStatus.SOLVED
            session.add(parent)
            session.commit()

    return new_resource


@router.patch("/{resource_id}", response_model=ResourceResponse)
def update_resource(
    resource_id: UUID,
    resource_update: ResourceUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> ResourceResponse:
    """Update a resource (owner only).

    Args:
        resource_id: Resource ID
        resource_update: Update data
        current_user: Current authenticated user
        session: Database session

    Returns:
        Updated resource

    Raises:
        HTTPException: If not owner or resource not found
    """
    resource = session.get(Resource, resource_id)

    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found",
        )

    if resource.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only resource owner can update",
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
    """Delete a resource (owner only).

    Args:
        resource_id: Resource ID
        current_user: Current authenticated user
        session: Database session

    Raises:
        HTTPException: If not owner or resource not found
    """
    resource = session.get(Resource, resource_id)

    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found",
        )

    if resource.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only resource owner can delete",
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
