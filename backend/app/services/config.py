"""Configuration service for managing configurable values."""

import yaml
from pathlib import Path
from uuid import UUID
from sqlmodel import Session, select

from app.models import ConfigurableValue, ConfigValueType


class ConfigService:
    """Service for managing configurable values and seeding from YAML."""

    @staticmethod
    def load_defaults_yaml() -> dict:
        """Load default configuration from YAML file."""
        config_path = Path(__file__).parent.parent.parent / "config" / "defaults.yaml"

        if not config_path.exists():
            raise FileNotFoundError(f"Config file not found: {config_path}")

        with open(config_path, "r") as f:
            return yaml.safe_load(f)

    @staticmethod
    def seed_database(session: Session) -> None:
        """Seed database with default values from YAML if tables are empty."""
        # Check if database already has values
        existing_count = session.query(ConfigurableValue).count()
        if existing_count > 0:
            # Already seeded, skip
            return

        config = ConfigService.load_defaults_yaml()

        # Seed specialties
        for specialty in config.get("specialties", []):
            value = ConfigurableValue(
                type=ConfigValueType.SPECIALTY,
                key=specialty["key"],
                label=specialty["label"],
                description=specialty.get("description"),
                category=specialty.get("category"),
                is_active=True,
            )
            session.add(value)

        # Seed professional roles
        for role in config.get("professional_roles", []):
            value = ConfigurableValue(
                type=ConfigValueType.PROFESSIONAL_ROLE,
                key=role["key"],
                label=role["label"],
                description=role.get("description"),
                category=role.get("category"),
                is_active=True,
            )
            session.add(value)

        # Seed resource types
        for resource_type in config.get("resource_types", []):
            value = ConfigurableValue(
                type=ConfigValueType.RESOURCE_TYPE,
                key=resource_type["key"],
                label=resource_type["label"],
                description=resource_type.get("description"),
                category=resource_type.get("category"),
                is_active=True,
            )
            session.add(value)

        session.commit()

    @staticmethod
    def get_values_by_type(
        session: Session,
        config_type: ConfigValueType,
        active_only: bool = True,
    ) -> list[ConfigurableValue]:
        """Get all values of a specific type."""
        query = select(ConfigurableValue).where(ConfigurableValue.type == config_type)

        if active_only:
            query = query.where(ConfigurableValue.is_active == True)

        return session.exec(query).all()

    @staticmethod
    def get_value_by_key(
        session: Session,
        key: str,
        config_type: ConfigValueType | None = None,
    ) -> ConfigurableValue | None:
        """Get a single value by key."""
        query = select(ConfigurableValue).where(ConfigurableValue.key == key)

        if config_type:
            query = query.where(ConfigurableValue.type == config_type)

        return session.exec(query).first()

    @staticmethod
    def validate_specialty(session: Session, specialty_key: str) -> bool:
        """Validate that a specialty exists and is active."""
        value = ConfigService.get_value_by_key(
            session,
            specialty_key,
            ConfigValueType.SPECIALTY,
        )
        return value is not None and value.is_active

    @staticmethod
    def validate_professional_role(session: Session, role_key: str) -> bool:
        """Validate that a professional role exists and is active."""
        value = ConfigService.get_value_by_key(
            session,
            role_key,
            ConfigValueType.PROFESSIONAL_ROLE,
        )
        return value is not None and value.is_active

    @staticmethod
    def validate_resource_type(session: Session, resource_type_key: str) -> bool:
        """Validate that a resource type exists and is active."""
        value = ConfigService.get_value_by_key(
            session,
            resource_type_key,
            ConfigValueType.RESOURCE_TYPE,
        )
        return value is not None and value.is_active

    @staticmethod
    def validate_specialties(session: Session, specialty_keys: list[str]) -> bool:
        """Validate that all specialties in a list exist and are active."""
        for key in specialty_keys:
            if not ConfigService.validate_specialty(session, key):
                return False
        return True

    @staticmethod
    def create_value(
        session: Session,
        config_type: ConfigValueType,
        key: str,
        label: str,
        description: str | None = None,
        category: str | None = None,
    ) -> ConfigurableValue:
        """Create a new configurable value."""
        value = ConfigurableValue(
            type=config_type,
            key=key,
            label=label,
            description=description,
            category=category,
            is_active=True,
        )
        session.add(value)
        session.commit()
        session.refresh(value)
        return value

    @staticmethod
    def update_value(
        session: Session,
        value_id: UUID,
        label: str | None = None,
        description: str | None = None,
        is_active: bool | None = None,
    ) -> ConfigurableValue | None:
        """Update a configurable value."""
        value = session.get(ConfigurableValue, value_id)
        if not value:
            return None

        if label is not None:
            value.label = label
        if description is not None:
            value.description = description
        if is_active is not None:
            value.is_active = is_active

        session.add(value)
        session.commit()
        session.refresh(value)
        return value

    @staticmethod
    def deactivate_value(session: Session, value_id: UUID) -> ConfigurableValue | None:
        """Deactivate a value (soft delete)."""
        return ConfigService.update_value(session, value_id, is_active=False)
