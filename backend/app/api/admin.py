"""Admin endpoints for user and resource management."""

from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, ConfigDict
from sqlmodel import Session, select

from app.api.auth import _get_client_ip, get_current_user
from app.core.config import settings
from app.core.rate_limiter import LIMIT_READ, LIMIT_WRITE, limiter
from app.models import (
    ConfigRequestStatus,
    ConfigurableValue,
    ConfigValueType,
    Resource,
    ResourceResponse,
    User,
    UserConfigRequest,
    UserResponse,
    UserRole,
)
from app.services.audit import audit_log
from app.services.config import ConfigService
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
@limiter.limit(LIMIT_READ)
def list_users(
    request: Request,  # noqa: ARG001 - required by slowapi for rate limiting
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
@limiter.limit(LIMIT_READ)
def get_user(
    request: Request,  # noqa: ARG001 - required by slowapi for rate limiting
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
@limiter.limit(LIMIT_WRITE)
def update_user_role(
    request: Request,
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

    audit_log(
        session,
        "admin_user_role_change",
        user_id=current_user.id,
        detail=f"target_user={user.id} new_role={user.role}",
        ip_address=_get_client_ip(request),
    )
    return user


@router.patch("/users/{user_id}/status", response_model=UserResponse)
@limiter.limit(LIMIT_WRITE)
def update_user_status(
    request: Request,
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

    audit_log(
        session,
        "admin_user_status_change",
        user_id=current_user.id,
        detail=f"target_user={user.id} is_active={user.is_active}",
        ip_address=_get_client_ip(request),
    )
    return user


@router.patch("/users/{user_id}/approve", response_model=UserResponse)
@limiter.limit(LIMIT_WRITE)
def approve_user(
    request: Request,
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

    audit_log(
        session,
        "admin_user_approve",
        user_id=current_user.id,
        detail=f"target_user={user.id}",
        ip_address=_get_client_ip(request),
    )
    return user


@router.patch("/users/{user_id}/verify", response_model=UserResponse)
@limiter.limit(LIMIT_WRITE)
def verify_user(
    request: Request,
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> UserResponse:
    """Force-verify a user's email (admin only).

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

    user.is_verified = True
    session.add(user)
    session.commit()
    session.refresh(user)

    audit_log(
        session,
        "admin_user_verify",
        user_id=current_user.id,
        detail=f"target_user={user.id}",
        ip_address=_get_client_ip(request),
    )
    return user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit(LIMIT_WRITE)
def delete_user(
    request: Request,
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
    deleted_email = user.email
    session.delete(user)
    session.commit()

    audit_log(
        session,
        "admin_user_delete",
        user_id=current_user.id,
        detail=f"target_user={user_id} email={deleted_email} resources_deleted={len(resources)}",
        ip_address=_get_client_ip(request),
    )


@router.patch("/resources/{resource_id}/verify", response_model=ResourceResponse)
@limiter.limit(LIMIT_WRITE)
def verify_resource(
    request: Request,
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

    audit_log(
        session,
        "admin_resource_verify",
        user_id=current_user.id,
        detail=f"resource={resource.id}",
        ip_address=_get_client_ip(request),
    )
    return resource


@router.patch("/resources/{resource_id}/hide", response_model=ResourceResponse)
@limiter.limit(LIMIT_WRITE)
def hide_resource(
    request: Request,
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

    audit_log(
        session,
        "admin_resource_hide",
        user_id=current_user.id,
        detail=f"resource={resource.id}",
        ip_address=_get_client_ip(request),
    )
    return resource


@router.patch("/resources/{resource_id}/unhide", response_model=ResourceResponse)
@limiter.limit(LIMIT_WRITE)
def unhide_resource(
    request: Request,
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

    audit_log(
        session,
        "admin_resource_unhide",
        user_id=current_user.id,
        detail=f"resource={resource.id}",
        ip_address=_get_client_ip(request),
    )
    return resource


# Config management endpoints


class ConfigValueUpdateRequest(BaseModel):
    """Schema for updating configurable values."""

    label: str | None = None
    description: str | None = None
    is_active: bool | None = None


class ConfigValueResponseSchema(BaseModel):
    """Schema for config value responses."""

    id: str
    key: str
    label: str
    description: str | None
    category: str | None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


@router.get("/config/values", response_model=list[ConfigValueResponseSchema])
@limiter.limit(LIMIT_READ)
def list_config_values(
    request: Request,  # noqa: ARG001 - required by slowapi for rate limiting
    config_type: ConfigValueType | None = Query(None),
    is_active: bool | None = Query(None),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> list[ConfigValueResponseSchema]:
    """List all configurable values (admin only)."""
    check_admin(current_user)

    query = select(ConfigurableValue)

    if config_type:
        query = query.where(ConfigurableValue.type == config_type)

    if is_active is not None:
        query = query.where(ConfigurableValue.is_active == is_active)

    return session.exec(query).all()


@router.patch("/config/values/{value_id}", response_model=ConfigValueResponseSchema)
@limiter.limit(LIMIT_WRITE)
def update_config_value(
    request: Request,
    value_id: UUID,
    update_data: ConfigValueUpdateRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> ConfigValueResponseSchema:
    """Update a configurable value (admin only)."""
    check_admin(current_user)

    value = session.get(ConfigurableValue, value_id)
    if not value:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Config value not found",
        )

    updated = ConfigService.update_value(
        session,
        value_id,
        label=update_data.label,
        description=update_data.description,
        is_active=update_data.is_active,
    )

    audit_log(
        session,
        "admin_config_value_update",
        user_id=current_user.id,
        detail=f"value_id={value_id} key={value.key}",
        ip_address=_get_client_ip(request),
    )
    return updated


@router.get("/config/requests")
@limiter.limit(LIMIT_READ)
def list_config_requests(
    request: Request,  # noqa: ARG001 - required by slowapi for rate limiting
    status_filter: ConfigRequestStatus | None = Query(None),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> dict[str, Any]:
    """List all user config requests (admin only)."""
    check_admin(current_user)

    query = select(UserConfigRequest)

    if status_filter:
        query = query.where(UserConfigRequest.status == status_filter)

    requests = session.exec(query).all()

    return {
        "items": [
            {
                "id": str(r.id),
                "user_id": str(r.user_id),
                "type": r.type,
                "requested_value": r.requested_value,
                "context": r.context,
                "status": r.status,
                "admin_notes": r.admin_notes,
                "created_at": r.created_at.isoformat(),
                "reviewed_at": r.reviewed_at.isoformat() if r.reviewed_at else None,
            }
            for r in requests
        ],
        "total": len(requests),
    }


class ConfigRequestApprovalRequest(BaseModel):
    """Schema for approving/rejecting config requests."""

    status: ConfigRequestStatus
    admin_response_key: UUID | None = None
    admin_notes: str | None = None


@router.patch("/config/requests/{request_id}")
@limiter.limit(LIMIT_WRITE)
def review_config_request(
    request: Request,
    request_id: UUID,
    review_data: ConfigRequestApprovalRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> dict[str, Any]:
    """Review and approve/reject a config request (admin only)."""
    check_admin(current_user)

    user_request = session.get(UserConfigRequest, request_id)
    if not user_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found",
        )

    from datetime import UTC, datetime

    user_request.status = review_data.status
    user_request.admin_notes = review_data.admin_notes
    user_request.reviewed_by = current_user.id
    user_request.reviewed_at = datetime.now(UTC)

    if review_data.status == ConfigRequestStatus.APPROVED_MERGED:
        if review_data.admin_response_key:
            # Link to existing value
            user_request.admin_response_key = review_data.admin_response_key
        else:
            # Create new value from the request
            new_value = ConfigService.create_value(
                session,
                user_request.type,
                key=user_request.requested_value.lower().replace(" ", "_"),
                label=user_request.requested_value,
                description=user_request.context,
            )
            user_request.admin_response_key = new_value.id

    session.add(user_request)
    session.commit()
    session.refresh(user_request)

    audit_log(
        session,
        "admin_config_request_review",
        user_id=current_user.id,
        detail=f"request_id={request_id} status={user_request.status}",
        ip_address=_get_client_ip(request),
    )
    return {
        "id": str(user_request.id),
        "status": user_request.status,
        "message": "Request reviewed successfully",
    }
