"""Admin endpoints for user and resource management."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlmodel import Session, select

from app.api.auth import get_current_user
from app.core.config import settings
from app.models import Resource, ResourceResponse, User, UserResponse, UserRole
from app.services.database import get_session

router = APIRouter(prefix=f"{settings.api_v1_str}/admin", tags=["admin"])


def check_admin(current_user: User) -> User:
    """Check if current user is admin.

    Args:
        current_user: Current user

    Returns:
        Current user if admin

    Raises:
        HTTPException: If not admin
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access this endpoint",
        )
    return current_user


@router.get("/users", response_model=list[UserResponse])
def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> list[UserResponse]:
    """List all users (admin only).

    Args:
        skip: Number of users to skip
        limit: Maximum users to return
        current_user: Current authenticated user
        session: Database session

    Returns:
        List of users

    Raises:
        HTTPException: If not admin
    """
    check_admin(current_user)

    users = session.exec(select(User).offset(skip).limit(limit)).all()
    return users


@router.get("/users/{user_id}", response_model=UserResponse)
def get_user(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> UserResponse:
    """Get a specific user (admin only).

    Args:
        user_id: User ID
        current_user: Current authenticated user
        session: Database session

    Returns:
        User details

    Raises:
        HTTPException: If not admin or user not found
    """
    check_admin(current_user)

    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return user


class RoleUpdate(BaseModel):
    """Role update request."""

    role: str


class StatusUpdate(BaseModel):
    """Status update request."""

    is_active: bool


@router.patch("/users/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: UUID,
    role_update: RoleUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> UserResponse:
    """Change user role (admin only).

    Args:
        user_id: User ID
        role_update: New role (STAFF or ADMIN)
        current_user: Current authenticated user
        session: Database session

    Returns:
        Updated user

    Raises:
        HTTPException: If not admin or user not found
    """
    check_admin(current_user)

    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    user.role = UserRole(role_update.role)
    session.add(user)
    session.commit()
    session.refresh(user)

    return user


@router.patch("/users/{user_id}/status", response_model=UserResponse)
def update_user_status(
    user_id: UUID,
    status_update: StatusUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> UserResponse:
    """Activate/deactivate user (admin only).

    Args:
        user_id: User ID
        status_update: Whether user should be active
        current_user: Current authenticated user
        session: Database session

    Returns:
        Updated user

    Raises:
        HTTPException: If not admin or user not found
    """
    check_admin(current_user)

    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    user.is_active = status_update.is_active
    session.add(user)
    session.commit()
    session.refresh(user)

    return user


@router.patch("/users/{user_id}/approve", response_model=UserResponse)
def approve_user(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> UserResponse:
    """Approve user for external domain (admin only).

    Args:
        user_id: User ID
        current_user: Current authenticated user
        session: Database session

    Returns:
        Updated user

    Raises:
        HTTPException: If not admin or user not found
    """
    check_admin(current_user)

    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    user.is_approved = True
    session.add(user)
    session.commit()
    session.refresh(user)

    return user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> None:
    """Delete user and their resources (admin only).

    Args:
        user_id: User ID
        current_user: Current authenticated user
        session: Database session

    Raises:
        HTTPException: If not admin or user not found
    """
    check_admin(current_user)

    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Delete all resources by this user
    resources = session.exec(select(Resource).where(Resource.user_id == user_id)).all()
    for resource in resources:
        session.delete(resource)

    # Delete user
    session.delete(user)
    session.commit()


@router.patch("/resources/{resource_id}/verify", response_model=ResourceResponse)
def verify_resource(
    resource_id: UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> ResourceResponse:
    """Mark resource as verified (admin only).

    Args:
        resource_id: Resource ID
        current_user: Current authenticated user
        session: Database session

    Returns:
        Updated resource

    Raises:
        HTTPException: If not admin or resource not found
    """
    check_admin(current_user)

    resource = session.get(Resource, resource_id)
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found",
        )

    resource.is_verified = True
    session.add(resource)
    session.commit()
    session.refresh(resource)

    return resource


@router.patch("/resources/{resource_id}/hide", response_model=ResourceResponse)
def hide_resource(
    resource_id: UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> ResourceResponse:
    """Hide resource from public view (admin only).

    Args:
        resource_id: Resource ID
        current_user: Current authenticated user
        session: Database session

    Returns:
        Updated resource

    Raises:
        HTTPException: If not admin or resource not found
    """
    check_admin(current_user)

    resource = session.get(Resource, resource_id)
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found",
        )

    resource.is_hidden = True
    session.add(resource)
    session.commit()
    session.refresh(resource)

    return resource


@router.patch("/resources/{resource_id}/unhide", response_model=ResourceResponse)
def unhide_resource(
    resource_id: UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> ResourceResponse:
    """Unhide resource to make visible again (admin only).

    Args:
        resource_id: Resource ID
        current_user: Current authenticated user
        session: Database session

    Returns:
        Updated resource

    Raises:
        HTTPException: If not admin or resource not found
    """
    check_admin(current_user)

    resource = session.get(Resource, resource_id)
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found",
        )

    resource.is_hidden = False
    session.add(resource)
    session.commit()
    session.refresh(resource)

    return resource
