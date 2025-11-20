"""Collaboration endpoints for connecting users working on similar ideas."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlmodel import Session, select

from app.api.auth import get_current_user
from app.models import (
    CollaborationOptionsResponse,
    CollaborationRequestResponse,
    CollaborationStatus,
    Resource,
    SimilarResourceResponse,
    User,
)
from app.services.database import get_session

router = APIRouter(prefix="/api/v1/resources", tags=["collaboration"])


class CollaborationRequest:
    """Represents a collaboration request."""

    def __init__(
        self,
        resource_id: UUID,
        from_user_id: UUID,
        to_user_id: UUID,
        message: str | None = None,
    ) -> None:
        """Initialize collaboration request.

        Args:
            resource_id: Resource being collaborated on
            from_user_id: User initiating collaboration
            to_user_id: User being asked to collaborate
            message: Optional message with the request
        """
        self.resource_id = resource_id
        self.from_user_id = from_user_id
        self.to_user_id = to_user_id
        self.message = message


@router.post("/{resource_id}/collaborate", response_model=CollaborationRequestResponse, status_code=status.HTTP_201_CREATED)
def create_collaboration_request(
    resource_id: UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
    message: str | None = None,
) -> CollaborationRequestResponse:
    """Create a collaboration request - "I'm working on something similar".

    This endpoint allows users to indicate they're working on something similar
    and want to connect with the resource author.

    Args:
        resource_id: Resource ID to collaborate on
        current_user: Current authenticated user
        session: Database session
        message: Optional message to send with request

    Returns:
        Collaboration request confirmation

    Raises:
        HTTPException: If resource not found or user is author
    """
    # Get the resource
    resource = session.exec(select(Resource).where(Resource.id == resource_id)).first()
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found",
        )

    # Can't collaborate with yourself
    if resource.user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot collaborate with yourself",
        )

    # In a full implementation, we'd store this in a Collaboration table
    # For MVP, we just return success and log it
    return CollaborationRequestResponse(
        status="collaboration_request_sent",
        resource_id=resource_id,
        to_user_id=resource.user_id,
        from_user_id=current_user.id,
        message=message or "I'm working on something similar",
    )


@router.get("/{resource_id}/collaboration-options", response_model=CollaborationOptionsResponse)
def get_collaboration_options(
    resource_id: UUID,
    session: Session = Depends(get_session),
) -> CollaborationOptionsResponse:
    """Get collaboration options for a resource.

    Returns what types of collaboration the author is open to.

    Args:
        resource_id: Resource ID
        session: Database session

    Returns:
        Collaboration options

    Raises:
        HTTPException: If resource not found
    """
    resource = session.exec(select(Resource).where(Resource.id == resource_id)).first()
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found",
        )

    return CollaborationOptionsResponse(
        resource_id=resource_id,
        author_id=resource.user_id,
        collaboration_status=resource.collaboration_status.value if resource.collaboration_status else None,
        open_to=resource.open_to_collaborate,
        contact_options={
            "email": True,  # Would get from author preferences
            "teams_chat": True,
            "internal_messaging": True,
        },
    )


@router.get("/similar", response_model=list[SimilarResourceResponse])
def find_similar_resources(
    current_user: User = Depends(get_current_user),
    discipline: str | None = None,
    tools: str | None = None,
    limit: int = 5,
    session: Session = Depends(get_session),
) -> list[SimilarResourceResponse]:
    """Find other users working on similar ideas for collaboration.

    Args:
        current_user: Current authenticated user
        discipline: Filter by discipline
        tools: Filter by tools (comma-separated)
        limit: Maximum results to return
        session: Database session

    Returns:
        List of resources from other users working on similar things
    """
    query = select(Resource).where(
        (Resource.is_hidden == False)  # noqa: E712
        & (Resource.user_id != current_user.id)
        & (Resource.collaboration_status == CollaborationStatus.SEEKING)
    )

    if discipline:
        query = query.where(Resource.discipline == discipline)

    if tools:
        tool_list = [t.strip() for t in tools.split(",")]
        for tool in tool_list:
            query = query.where(func.json_extract(Resource.tools_used, f'$."{tool}"').isnot(None))

    resources = session.exec(query.limit(limit)).all()

    return [
        SimilarResourceResponse(
            id=r.id,
            title=r.title,
            author_id=r.user_id,
            discipline=r.discipline,
            tools_used=r.tools_used,
            collaboration_status=r.collaboration_status.value if r.collaboration_status else None,
            open_to_collaborate=r.open_to_collaborate,
        )
        for r in resources
    ]
