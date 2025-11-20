"""Collections endpoints for curated groups of prompts and resources."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.api.auth import get_current_user
from app.models import (
    Collection,
    CollectionCreate,
    CollectionResponse,
    CollectionUpdate,
    User,
)
from app.services.database import get_session

router = APIRouter(prefix="/api/v1/collections", tags=["collections"])


@router.get("", response_model=list[CollectionResponse])
def list_collections(
    skip: int = 0,
    limit: int = 50,
    session: Session = Depends(get_session),
) -> list[CollectionResponse]:
    """List available collections.

    Args:
        skip: Number of items to skip
        limit: Maximum items to return
        session: Database session

    Returns:
        List of collections
    """
    collections = session.exec(
        select(Collection).offset(skip).limit(limit).order_by(Collection.created_at.desc())  # type: ignore[attr-defined]
    ).all()

    return [CollectionResponse.model_validate(c) for c in collections]


@router.get("/{collection_id}", response_model=CollectionResponse)
def get_collection(
    collection_id: UUID,
    session: Session = Depends(get_session),
) -> CollectionResponse:
    """Get a specific collection by ID.

    Args:
        collection_id: Collection ID to retrieve
        session: Database session

    Returns:
        Collection details

    Raises:
        HTTPException: If collection not found
    """
    collection = session.exec(
        select(Collection).where(Collection.id == collection_id)
    ).first()
    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collection not found",
        )

    return CollectionResponse.model_validate(collection)


@router.post("", response_model=CollectionResponse, status_code=status.HTTP_201_CREATED)
def create_collection(
    collection_data: CollectionCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> CollectionResponse:
    """Create a new collection.

    Args:
        collection_data: Collection creation data
        current_user: Current authenticated user
        session: Database session

    Returns:
        Created collection
    """
    collection = Collection(
        name=collection_data.name,
        description=collection_data.description,
        owner_id=str(current_user.id),
        resource_ids=collection_data.resource_ids,
        prompt_ids=collection_data.prompt_ids,
    )

    session.add(collection)
    session.commit()
    session.refresh(collection)

    return CollectionResponse.model_validate(collection)


@router.patch("/{collection_id}", response_model=CollectionResponse)
def update_collection(
    collection_id: UUID,
    collection_data: CollectionUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> CollectionResponse:
    """Update a collection (owner only).

    Args:
        collection_id: Collection ID to update
        collection_data: Updated collection data
        current_user: Current authenticated user
        session: Database session

    Returns:
        Updated collection

    Raises:
        HTTPException: If collection not found or not authorized
    """
    collection = session.exec(
        select(Collection).where(Collection.id == collection_id)
    ).first()
    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collection not found",
        )

    # Check authorization
    if collection.owner_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this collection",
        )

    # Update fields
    if collection_data.name is not None:
        collection.name = collection_data.name
    if collection_data.description is not None:
        collection.description = collection_data.description
    if collection_data.resource_ids is not None:
        collection.resource_ids = collection_data.resource_ids
    if collection_data.prompt_ids is not None:
        collection.prompt_ids = collection_data.prompt_ids

    session.add(collection)
    session.commit()
    session.refresh(collection)

    return CollectionResponse.model_validate(collection)


@router.delete("/{collection_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_collection(
    collection_id: UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> None:
    """Delete a collection (owner only).

    Args:
        collection_id: Collection ID to delete
        current_user: Current authenticated user
        session: Database session

    Raises:
        HTTPException: If collection not found or not authorized
    """
    collection = session.exec(
        select(Collection).where(Collection.id == collection_id)
    ).first()
    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collection not found",
        )

    # Check authorization
    if collection.owner_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this collection",
        )

    session.delete(collection)
    session.commit()


@router.post("/{collection_id}/subscribe", response_model=CollectionResponse)
def subscribe_to_collection(
    collection_id: UUID,
    session: Session = Depends(get_session),
) -> CollectionResponse:
    """Subscribe to a collection (increment subscriber count).

    Args:
        collection_id: Collection ID to subscribe to
        session: Database session

    Returns:
        Updated collection

    Raises:
        HTTPException: If collection not found
    """
    collection = session.exec(
        select(Collection).where(Collection.id == collection_id)
    ).first()
    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collection not found",
        )

    collection.subscriber_count += 1
    session.add(collection)
    session.commit()
    session.refresh(collection)

    return CollectionResponse.model_validate(collection)


@router.get("/{collection_id}/prompts", response_model=list[UUID])
def get_collection_prompts(
    collection_id: UUID,
    session: Session = Depends(get_session),
) -> list[UUID]:
    """Get prompt IDs in a collection.

    Args:
        collection_id: Collection ID
        session: Database session

    Returns:
        List of prompt IDs

    Raises:
        HTTPException: If collection not found
    """
    collection = session.exec(
        select(Collection).where(Collection.id == collection_id)
    ).first()
    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collection not found",
        )

    return collection.prompt_ids


@router.get("/{collection_id}/resources", response_model=list[UUID])
def get_collection_resources(
    collection_id: UUID,
    session: Session = Depends(get_session),
) -> list[UUID]:
    """Get resource IDs in a collection.

    Args:
        collection_id: Collection ID
        session: Database session

    Returns:
        List of resource IDs

    Raises:
        HTTPException: If collection not found
    """
    collection = session.exec(
        select(Collection).where(Collection.id == collection_id)
    ).first()
    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collection not found",
        )

    return collection.resource_ids
