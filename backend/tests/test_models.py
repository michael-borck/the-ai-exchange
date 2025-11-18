"""Tests for database models."""


from sqlmodel import Session

from app.core.security import hash_password
from app.models import Resource, ResourceStatus, ResourceType, User, UserRole


def test_create_user(session: Session) -> None:
    """Test creating a user.

    Args:
        session: Database session
    """
    user = User(
        email="test@curtin.edu.au",
        full_name="Test User",
        hashed_password=hash_password("testpass123"),  # Max 72 bytes for bcrypt
        role=UserRole.STAFF,
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    assert user.id is not None
    assert user.email == "test@curtin.edu.au"
    assert user.full_name == "Test User"
    assert user.role == UserRole.STAFF
    assert user.is_active is True
    assert user.is_approved is True


def test_create_admin_user(session: Session) -> None:
    """Test creating an admin user.

    Args:
        session: Database session
    """
    admin = User(
        email="admin@curtin.edu.au",
        full_name="Admin User",
        hashed_password=hash_password("admin123"),  # Max 72 bytes for bcrypt
        role=UserRole.ADMIN,
    )
    session.add(admin)
    session.commit()
    session.refresh(admin)

    assert admin.role == UserRole.ADMIN
    assert admin.is_active is True


def test_create_resource(session: Session) -> None:
    """Test creating a resource.

    Args:
        session: Database session
    """
    user = User(
        email="author@curtin.edu.au",
        full_name="Author",
        hashed_password=hash_password("pass123"),  # Max 72 bytes for bcrypt
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    resource = Resource(
        user_id=user.id,
        type=ResourceType.REQUEST,
        title="How to use ChatGPT for marketing?",
        content_text="I want to learn how to use ChatGPT effectively...",
        is_anonymous=False,
    )
    session.add(resource)
    session.commit()
    session.refresh(resource)

    assert resource.id is not None
    assert resource.user_id == user.id
    assert resource.type == ResourceType.REQUEST
    assert resource.status == ResourceStatus.OPEN
    assert resource.is_anonymous is False


def test_resource_with_tags(session: Session) -> None:
    """Test creating a resource with tags.

    Args:
        session: Database session
    """
    user = User(
        email="author@curtin.edu.au",
        full_name="Author",
        hashed_password=hash_password("pass123"),  # Max 72 bytes for bcrypt
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    resource = Resource(
        user_id=user.id,
        type=ResourceType.PROMPT,
        title="Marketing Analytics Prompt",
        content_text="Use this prompt for analyzing customer data...",
        system_tags=["ChatGPT", "Marketing", "Analytics"],
        user_tags=["Segmentation"],
    )
    session.add(resource)
    session.commit()
    session.refresh(resource)

    assert resource.system_tags == ["ChatGPT", "Marketing", "Analytics"]
    assert resource.user_tags == ["Segmentation"]
    assert len(resource.all_tags) == 4


def test_solution_to_request(session: Session) -> None:
    """Test creating a solution to a request.

    Args:
        session: Database session
    """
    user1 = User(
        email="user1@curtin.edu.au",
        full_name="User 1",
        hashed_password=hash_password("pass123"),  # Max 72 bytes for bcrypt
    )
    user2 = User(
        email="user2@curtin.edu.au",
        full_name="User 2",
        hashed_password=hash_password("pass123"),  # Max 72 bytes for bcrypt
    )
    session.add(user1)
    session.add(user2)
    session.commit()

    # Create request
    request = Resource(
        user_id=user1.id,
        type=ResourceType.REQUEST,
        title="Need help with customer segmentation",
        content_text="Looking for AI tools for customer segmentation...",
    )
    session.add(request)
    session.commit()
    session.refresh(request)

    # Create solution
    solution = Resource(
        user_id=user2.id,
        parent_id=request.id,
        type=ResourceType.USE_CASE,
        title="Used ChatGPT for segmentation",
        content_text="Here's how I used ChatGPT to segment customers...",
    )
    session.add(solution)
    session.commit()
    session.refresh(solution)

    assert solution.parent_id == request.id
    assert solution.type == ResourceType.USE_CASE
