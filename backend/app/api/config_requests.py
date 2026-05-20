"""API endpoints for user configuration requests (e.g., requesting new specialties)."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session, select

from app.api.auth import get_current_user
from app.core.config import settings
from app.models import ConfigRequestStatus, ConfigValueType, UserConfigRequest
from app.services.database import get_session

router = APIRouter(prefix=f"{settings.api_v1_str}/config/requests", tags=["config-requests"])


class ConfigRequestCreate(BaseModel):
    """Schema for creating a new config request."""

    type: ConfigValueType
    requested_value: str
    context: str | None = None


class ConfigRequestResponse(BaseModel):
    """Schema for config request response."""

    id: str
    type: ConfigValueType
    requested_value: str
    context: str | None
    status: ConfigRequestStatus
    admin_notes: str | None
    created_at: str

    class Config:
        """Pydantic config."""

        from_attributes = True


@router.post("")
def create_config_request(
    request_data: ConfigRequestCreate,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Submit a request for a new configuration value."""
    user_request = UserConfigRequest(
        user_id=current_user["id"],
        type=request_data.type,
        requested_value=request_data.requested_value,
        context=request_data.context,
        status=ConfigRequestStatus.PENDING,
    )
    session.add(user_request)
    session.commit()
    session.refresh(user_request)

    return {
        "id": str(user_request.id),
        "status": user_request.status,
        "message": "Your request has been submitted for review. Thank you!",
    }


@router.get("/my-pending")
def get_my_pending_requests(
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Get current user's pending config requests."""
    query = (
        select(UserConfigRequest)
        .where(UserConfigRequest.user_id == current_user["id"])
        .where(UserConfigRequest.status == ConfigRequestStatus.PENDING)
    )
    requests = session.exec(query).all()

    return {
        "items": [
            {
                "id": str(r.id),
                "type": r.type,
                "requested_value": r.requested_value,
                "context": r.context,
                "status": r.status,
                "created_at": r.created_at.isoformat(),
            }
            for r in requests
        ],
        "total": len(requests),
    }
