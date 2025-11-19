"""Comments endpoints for discussions on resources."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.api.auth import get_current_user
from app.models import Comment, CommentCreate, CommentResponse, CommentUpdate, Resource, User
from app.services.database import get_session

router = APIRouter(prefix="/api/v1/resources", tags=["comments"])


@router.get("/{resource_id}/comments", response_model=list[CommentResponse])
def get_resource_comments(
    resource_id: UUID,
    session: Session = Depends(get_session),
) -> list[CommentResponse]:
    """Get all comments for a resource (with threading support).

    Args:
        resource_id: Resource ID to get comments for
        session: Database session

    Returns:
        List of comments (threaded)

    Raises:
        HTTPException: If resource not found
    """
    # Verify resource exists
    resource = session.exec(select(Resource).where(Resource.id == resource_id)).first()
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found",
        )

    # Get all comments for this resource
    comments = session.exec(
        select(Comment).where(Comment.resource_id == resource_id).order_by(Comment.created_at)
    ).all()

    return comments


@router.post("/{resource_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment(
    resource_id: UUID,
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> CommentResponse:
    """Create a new comment on a resource.

    Args:
        resource_id: Resource ID to comment on
        comment_data: Comment creation data
        current_user: Current authenticated user
        session: Database session

    Returns:
        Created comment

    Raises:
        HTTPException: If resource not found or parent comment not found
    """
    # Verify resource exists
    resource = session.exec(select(Resource).where(Resource.id == resource_id)).first()
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found",
        )

    # If replying to a comment, verify parent exists
    if comment_data.parent_comment_id:
        parent = session.exec(
            select(Comment).where(Comment.id == comment_data.parent_comment_id)
        ).first()
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent comment not found",
            )

    # Create comment
    comment = Comment(
        resource_id=resource_id,
        user_id=current_user.id,
        content=comment_data.content,
        parent_comment_id=comment_data.parent_comment_id,
    )

    session.add(comment)
    session.commit()
    session.refresh(comment)

    return comment


@router.patch("/comments/{comment_id}", response_model=CommentResponse)
def update_comment(
    comment_id: UUID,
    comment_data: CommentUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> CommentResponse:
    """Update a comment (author only).

    Args:
        comment_id: Comment ID to update
        comment_data: Updated comment data
        current_user: Current authenticated user
        session: Database session

    Returns:
        Updated comment

    Raises:
        HTTPException: If comment not found or not authorized
    """
    comment = session.exec(select(Comment).where(Comment.id == comment_id)).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found",
        )

    # Check authorization
    if comment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this comment",
        )

    # Update comment
    comment.content = comment_data.content
    session.add(comment)
    session.commit()
    session.refresh(comment)

    return comment


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> None:
    """Delete a comment (author or admin only).

    Args:
        comment_id: Comment ID to delete
        current_user: Current authenticated user
        session: Database session

    Raises:
        HTTPException: If comment not found or not authorized
    """
    comment = session.exec(select(Comment).where(Comment.id == comment_id)).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found",
        )

    # Check authorization (author or admin)
    if comment.user_id != current_user.id and current_user.role.value != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this comment",
        )

    session.delete(comment)
    session.commit()


@router.post("/comments/{comment_id}/helpful", response_model=CommentResponse)
def mark_comment_helpful(
    comment_id: UUID,
    session: Session = Depends(get_session),
) -> CommentResponse:
    """Mark a comment as helpful (increment count).

    Args:
        comment_id: Comment ID to mark helpful
        session: Database session

    Returns:
        Updated comment

    Raises:
        HTTPException: If comment not found
    """
    comment = session.exec(select(Comment).where(Comment.id == comment_id)).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found",
        )

    comment.helpful_count += 1
    session.add(comment)
    session.commit()
    session.refresh(comment)

    return comment
