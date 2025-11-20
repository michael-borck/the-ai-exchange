"""Analytics endpoints for tracking engagement and platform metrics."""

from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.api.auth import get_current_user
from app.models import (
    Resource,
    ResourceAnalytics,
    ResourceAnalyticsResponse,
    User,
    UserRole,
    UserSavedResource,
    UserTriedResource,
)
from app.services.database import get_session

router = APIRouter(prefix="/api/v1", tags=["analytics"])


def get_or_create_analytics(
    resource_id: UUID,
    session: Session,
) -> ResourceAnalytics:
    """Get or create analytics record for a resource.

    Args:
        resource_id: Resource ID
        session: Database session

    Returns:
        Analytics record
    """
    analytics = session.exec(
        select(ResourceAnalytics).where(ResourceAnalytics.resource_id == resource_id)
    ).first()

    if not analytics:
        analytics = ResourceAnalytics(resource_id=resource_id)
        session.add(analytics)
        session.commit()
        session.refresh(analytics)

    return analytics


# Resource Analytics Endpoints


@router.post("/resources/{resource_id}/view", response_model=dict[str, Any], status_code=status.HTTP_200_OK)
def track_resource_view(
    resource_id: UUID,
    session: Session = Depends(get_session),
) -> dict[str, Any]:
    """Track a view of a resource.

    Args:
        resource_id: Resource ID being viewed
        session: Database session

    Returns:
        Updated view count

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

    # Get or create analytics
    analytics = get_or_create_analytics(resource_id, session)

    # Increment view count
    analytics.view_count += 1
    from datetime import UTC, datetime
    analytics.last_viewed = datetime.now(UTC)

    session.add(analytics)
    session.commit()
    session.refresh(analytics)

    return {
        "resource_id": str(resource_id),
        "view_count": analytics.view_count,
        "status": "tracked",
    }


@router.post("/resources/{resource_id}/tried", response_model=dict[str, Any])
def track_resource_tried(
    resource_id: UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> dict[str, Any]:
    """Mark that a user tried implementing a resource.

    Args:
        resource_id: Resource ID being tried
        current_user: Current authenticated user
        session: Database session

    Returns:
        Updated tried count

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

    # Get or create analytics
    analytics = get_or_create_analytics(resource_id, session)

    # Check if user already tried this resource
    existing_try = session.exec(
        select(UserTriedResource).where(
            (UserTriedResource.user_id == current_user.id) &
            (UserTriedResource.resource_id == resource_id)
        )
    ).first()

    # Only increment and track if this is the first time
    if not existing_try:
        # Create tracking record
        tried = UserTriedResource(
            user_id=current_user.id,
            resource_id=resource_id,
        )
        session.add(tried)
        # Increment tried count
        analytics.tried_count += 1

    session.add(analytics)
    session.commit()
    session.refresh(analytics)

    return {
        "resource_id": str(resource_id),
        "tried_count": analytics.tried_count,
        "status": "tracked",
    }


@router.post("/resources/{resource_id}/save", response_model=dict[str, Any])
def toggle_resource_save(
    resource_id: UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> dict[str, Any]:
    """Toggle save status for a resource (save/unsave).

    Args:
        resource_id: Resource ID being saved
        current_user: Current authenticated user
        session: Database session

    Returns:
        Updated save count and status

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

    # Check if already saved
    existing = session.exec(
        select(UserSavedResource).where(
            (UserSavedResource.user_id == current_user.id)
            & (UserSavedResource.resource_id == resource_id)
        )
    ).first()

    # Get or create analytics
    analytics = get_or_create_analytics(resource_id, session)

    if existing:
        # Remove save
        session.delete(existing)
        analytics.save_count = max(0, analytics.save_count - 1)
        is_saved = False
    else:
        # Add save
        saved = UserSavedResource(
            user_id=current_user.id,
            resource_id=resource_id,
        )
        session.add(saved)
        analytics.save_count += 1
        is_saved = True

    session.add(analytics)
    session.commit()
    session.refresh(analytics)

    return {
        "resource_id": str(resource_id),
        "is_saved": is_saved,
        "save_count": analytics.save_count,
        "status": "saved" if is_saved else "unsaved",
    }


@router.get("/resources/{resource_id}/analytics", response_model=ResourceAnalyticsResponse)
def get_resource_analytics(
    resource_id: UUID,
    session: Session = Depends(get_session),
) -> ResourceAnalyticsResponse:
    """Get analytics for a resource (author can see all details).

    Args:
        resource_id: Resource ID
        session: Database session

    Returns:
        Analytics data

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

    # Get or create analytics
    analytics = get_or_create_analytics(resource_id, session)

    return ResourceAnalyticsResponse.model_validate(analytics)


@router.get("/resources/{resource_id}/is-saved", response_model=dict[str, Any])
def check_resource_saved(
    resource_id: UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> dict[str, Any]:
    """Check if current user has saved a resource.

    Args:
        resource_id: Resource ID to check
        current_user: Current authenticated user
        session: Database session

    Returns:
        Dictionary with is_saved boolean

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

    # Check if saved
    is_saved = session.exec(
        select(UserSavedResource).where(
            (UserSavedResource.user_id == current_user.id)
            & (UserSavedResource.resource_id == resource_id)
        )
    ).first() is not None

    return {
        "resource_id": str(resource_id),
        "is_saved": is_saved,
    }


@router.get("/users/me/saved-resources", response_model=list[dict[str, Any]])
def get_user_saved_resources(
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session),
) -> list[dict[str, Any]]:
    """Get all resources saved by the current user.

    Args:
        current_user: Current authenticated user
        skip: Number of results to skip
        limit: Maximum number of results
        session: Database session

    Returns:
        List of saved resources with user info
    """
    # Get saved resource IDs
    saved = session.exec(
        select(UserSavedResource)
        .where(UserSavedResource.user_id == current_user.id)
        .order_by(UserSavedResource.saved_at.desc())  # type: ignore[attr-defined]
        .offset(skip)
        .limit(limit)
    ).all()

    # Fetch the actual resources
    from app.models import ResourceResponse

    result = []
    for saved_record in saved:
        resource = session.get(Resource, saved_record.resource_id)
        if resource and not resource.is_hidden:
            # Get user info
            user = session.get(User, resource.user_id)
            resource_dict = {
                **ResourceResponse.model_validate(resource).model_dump(),
                "user": {
                    "id": str(user.id),
                    "full_name": user.full_name,
                    "email": user.email,
                } if user else None,
                "saved_at": saved_record.saved_at.isoformat(),
            }
            result.append(resource_dict)

    return result


# Platform Analytics Endpoints


@router.get("/admin/analytics", response_model=dict[str, Any])
def get_platform_analytics(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> dict[str, Any]:
    """Get platform-wide analytics (admin only).

    Args:
        current_user: Current authenticated user (must be admin)
        session: Database session

    Returns:
        Platform analytics

    Raises:
        HTTPException: If not authorized
    """
    # Check admin access
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can view platform analytics",
        )

    # Get all analytics
    all_analytics = session.exec(select(ResourceAnalytics)).all()
    resources = session.exec(select(Resource)).all()

    # Calculate metrics
    total_views = sum(a.view_count for a in all_analytics)
    total_saves = sum(a.save_count for a in all_analytics)
    total_tried = sum(a.tried_count for a in all_analytics)
    total_forks = sum(a.fork_count for a in all_analytics)
    total_comments = sum(a.comment_count for a in all_analytics)

    # Find top resources
    top_viewed = sorted(all_analytics, key=lambda a: a.view_count, reverse=True)[:5]

    return {
        "platform_stats": {
            "total_resources": len(resources),
            "total_views": total_views,
            "total_saves": total_saves,
            "total_tried": total_tried,
            "total_forks": total_forks,
            "total_comments": total_comments,
            "avg_views_per_resource": total_views / len(resources) if resources else 0,
            "avg_saves_per_resource": total_saves / len(resources) if resources else 0,
        },
        "top_resources": [
            {
                "resource_id": str(a.resource_id),
                "view_count": a.view_count,
                "save_count": a.save_count,
                "tried_count": a.tried_count,
            }
            for a in top_viewed
        ],
    }


@router.get("/admin/analytics/by-discipline", response_model=dict[str, Any])
def get_analytics_by_discipline(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> dict[str, Any]:
    """Get analytics broken down by discipline (admin only).

    Args:
        current_user: Current authenticated user (must be admin)
        session: Database session

    Returns:
        Analytics by discipline

    Raises:
        HTTPException: If not authorized
    """
    # Check admin access
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can view analytics",
        )

    # Get all resources grouped by discipline
    resources = session.exec(select(Resource)).all()

    discipline_stats: dict[str, Any] = {}
    for resource in resources:
        if resource.discipline:
            if resource.discipline not in discipline_stats:
                discipline_stats[resource.discipline] = {
                    "count": 0,
                    "total_views": 0,
                    "total_saves": 0,
                }

            discipline_stats[resource.discipline]["count"] += 1

            # Get analytics
            analytics = session.exec(
                select(ResourceAnalytics).where(ResourceAnalytics.resource_id == resource.id)
            ).first()
            if analytics:
                discipline_stats[resource.discipline]["total_views"] += analytics.view_count
                discipline_stats[resource.discipline]["total_saves"] += analytics.save_count

    return {"by_discipline": discipline_stats}


@router.get("/resources/{resource_id}/users-tried-it", response_model=list[dict[str, Any]])
def get_users_who_tried_resource(
    resource_id: UUID,
    session: Session = Depends(get_session),
) -> list[dict[str, Any]]:
    """Get list of users who marked a resource as tried.

    This enables peer discovery - users can connect with others who have
    actually tried the implementation rather than just the creator.

    Args:
        resource_id: Resource ID
        session: Database session

    Returns:
        List of users who tried the resource with basic info

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

    # Get users who tried this resource
    tried_records = session.exec(
        select(UserTriedResource)
        .where(UserTriedResource.resource_id == resource_id)
        .order_by(UserTriedResource.tried_at.desc())  # type: ignore[attr-defined]
    ).all()

    # Get user details
    result = []
    for tried_record in tried_records:
        user = session.get(User, tried_record.user_id)
        if user:
            result.append({
                "id": str(user.id),
                "full_name": user.full_name,
                "email": user.email,
                "tried_at": tried_record.tried_at.isoformat(),
            })

    return result
