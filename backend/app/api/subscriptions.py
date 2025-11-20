"""Subscription and notification preference endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select

from app.api.auth import get_current_user
from app.core.config import settings
from app.models import NotificationPreferences, Subscription, SubscriptionResponse, User
from app.services.database import get_session

router = APIRouter(
    prefix=f"{settings.api_v1_str}/subscriptions",
    tags=["subscriptions"],
)


class SubscribeRequest(BaseModel):
    """Subscribe to tag request."""

    tag: str


class NotificationPrefs(BaseModel):
    """Notification preferences."""

    notify_requests: bool
    notify_solutions: bool


@router.post("/subscribe", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
def subscribe(
    subscribe_req: SubscribeRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> SubscriptionResponse:
    """Subscribe to tag notifications.

    Args:
        subscribe_req: Subscription request with tag
        current_user: Current authenticated user
        session: Database session

    Returns:
        Subscription details

    Raises:
        HTTPException: If already subscribed
    """
    # Check if already subscribed
    existing = session.exec(
        select(Subscription).where(
            (Subscription.user_id == current_user.id)
            & (Subscription.tag == subscribe_req.tag)
        )
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already subscribed to this tag",
        )

    # Create subscription
    subscription = Subscription(
        user_id=current_user.id,
        tag=subscribe_req.tag,
    )

    session.add(subscription)
    session.commit()
    session.refresh(subscription)

    return subscription


@router.delete("/unsubscribe/{tag}", status_code=status.HTTP_204_NO_CONTENT)
def unsubscribe(
    tag: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> None:
    """Unsubscribe from tag notifications.

    Args:
        tag: Tag to unsubscribe from
        current_user: Current authenticated user
        session: Database session

    Raises:
        HTTPException: If not subscribed
    """
    subscription = session.exec(
        select(Subscription).where(
            (Subscription.user_id == current_user.id)
            & (Subscription.tag == tag)
        )
    ).first()

    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not subscribed to this tag",
        )

    session.delete(subscription)
    session.commit()


@router.get("", response_model=list[SubscriptionResponse])
def get_subscriptions(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> list[SubscriptionResponse]:
    """Get current user's subscriptions.

    Args:
        current_user: Current authenticated user
        session: Database session

    Returns:
        List of subscriptions
    """
    subscriptions = session.exec(
        select(Subscription).where(Subscription.user_id == current_user.id)
    ).all()

    return subscriptions


@router.patch("/notify-prefs", response_model=NotificationPreferences)
def update_notification_prefs(
    prefs: NotificationPrefs,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> NotificationPreferences:
    """Update notification preferences.

    Args:
        prefs: New notification preferences
        current_user: Current authenticated user
        session: Database session

    Returns:
        Updated notification preferences
    """
    current_user.notification_prefs = {
        "notify_requests": prefs.notify_requests,
        "notify_solutions": prefs.notify_solutions,
    }

    session.add(current_user)
    session.commit()
    session.refresh(current_user)

    return NotificationPreferences(
        notify_requests=prefs.notify_requests,
        notify_solutions=prefs.notify_solutions,
    )
