"""Configuration API endpoints for managing specialties, roles, and resource types."""

from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.core.config import settings
from app.models import ConfigurableValue, ConfigValueType
from app.services.config import ConfigService
from app.services.database import get_session

router = APIRouter(prefix=f"{settings.api_v1_str}/config", tags=["config"])


class ConfigValueResponse:
    """Response schema for configurable values."""

    def __init__(self, value: ConfigurableValue):
        self.key = value.key
        self.label = value.label
        self.description = value.description
        self.category = value.category

    def dict(self) -> dict:
        return {
            "key": self.key,
            "label": self.label,
            "description": self.description,
            "category": self.category,
        }


@router.get("/specialties")
def get_specialties(session: Session = Depends(get_session)):
    """Get all active specialties."""
    values = ConfigService.get_values_by_type(
        session,
        ConfigValueType.SPECIALTY,
        active_only=True,
    )
    return {
        "items": [ConfigValueResponse(v).dict() for v in values],
        "total": len(values),
    }


@router.get("/professional-roles")
def get_professional_roles(session: Session = Depends(get_session)):
    """Get all active professional roles."""
    values = ConfigService.get_values_by_type(
        session,
        ConfigValueType.PROFESSIONAL_ROLE,
        active_only=True,
    )
    return {
        "items": [ConfigValueResponse(v).dict() for v in values],
        "total": len(values),
    }


@router.get("/resource-types")
def get_resource_types(session: Session = Depends(get_session)):
    """Get all active resource types."""
    values = ConfigService.get_values_by_type(
        session,
        ConfigValueType.RESOURCE_TYPE,
        active_only=True,
    )
    return {
        "items": [ConfigValueResponse(v).dict() for v in values],
        "total": len(values),
    }


@router.get("/all")
def get_all_config(session: Session = Depends(get_session)):
    """Get all active configuration values grouped by type."""
    specialties = ConfigService.get_values_by_type(
        session,
        ConfigValueType.SPECIALTY,
        active_only=True,
    )
    professional_roles = ConfigService.get_values_by_type(
        session,
        ConfigValueType.PROFESSIONAL_ROLE,
        active_only=True,
    )
    resource_types = ConfigService.get_values_by_type(
        session,
        ConfigValueType.RESOURCE_TYPE,
        active_only=True,
    )

    return {
        "specialties": [ConfigValueResponse(v).dict() for v in specialties],
        "professional_roles": [ConfigValueResponse(v).dict() for v in professional_roles],
        "resource_types": [ConfigValueResponse(v).dict() for v in resource_types],
    }
