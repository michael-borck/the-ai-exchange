"""Prompt library endpoints."""

from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.api.auth import get_current_user
from app.models import (
    Prompt,
    PromptCreate,
    PromptResponse,
    PromptUpdate,
    SharingLevel,
    User,
)
from app.services.database import get_session

router = APIRouter(prefix="/api/v1/prompts", tags=["prompts"])


@router.get("", response_model=list[PromptResponse])
def list_prompts(
    skip: int = 0,
    limit: int = 50,
    sharing_level: str | None = None,
    session: Session = Depends(get_session),
    current_user: User | None = Depends(get_current_user),
) -> list[PromptResponse]:
    """List available prompts with filtering.

    Args:
        skip: Number of items to skip
        limit: Maximum items to return
        sharing_level: Filter by sharing level (PRIVATE, DEPARTMENT, SCHOOL, PUBLIC)
        session: Database session
        current_user: Current user (optional for public prompts)

    Returns:
        List of available prompts
    """
    query = select(Prompt)

    # Filter by sharing level
    if sharing_level:
        try:
            level = SharingLevel(sharing_level)
            if level == SharingLevel.PRIVATE and current_user:
                # Only show user's own private prompts
                query = query.where(
                    (Prompt.sharing_level == SharingLevel.PRIVATE) & (Prompt.user_id == current_user.id)
                )
            else:
                query = query.where(Prompt.sharing_level == level)
        except ValueError:
            pass

    # Apply pagination
    query = query.offset(skip).limit(limit).order_by(Prompt.created_at.desc())  # type: ignore[attr-defined]

    prompts = session.exec(query).all()
    return [PromptResponse.model_validate(p) for p in prompts]


@router.get("/{prompt_id}", response_model=PromptResponse)
def get_prompt(
    prompt_id: UUID,
    session: Session = Depends(get_session),
    current_user: User | None = Depends(get_current_user),
) -> PromptResponse:
    """Get a specific prompt by ID.

    Args:
        prompt_id: Prompt ID to retrieve
        session: Database session
        current_user: Current user (for access control)

    Returns:
        Prompt details

    Raises:
        HTTPException: If prompt not found or not authorized
    """
    prompt = session.exec(select(Prompt).where(Prompt.id == prompt_id)).first()
    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found",
        )

    # Check access permissions
    if prompt.sharing_level == SharingLevel.PRIVATE and (not current_user or prompt.user_id != current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this prompt",
        )

    return PromptResponse.model_validate(prompt)


@router.post("", response_model=PromptResponse, status_code=status.HTTP_201_CREATED)
def create_prompt(
    prompt_data: PromptCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> PromptResponse:
    """Create a new prompt.

    Args:
        prompt_data: Prompt creation data
        current_user: Current authenticated user
        session: Database session

    Returns:
        Created prompt
    """
    prompt = Prompt(
        user_id=current_user.id,
        title=prompt_data.title,
        prompt_text=prompt_data.prompt_text,
        description=prompt_data.description,
        variables=prompt_data.variables,
        sharing_level=prompt_data.sharing_level,
    )

    session.add(prompt)
    session.commit()
    session.refresh(prompt)

    return PromptResponse.model_validate(prompt)


@router.patch("/{prompt_id}", response_model=PromptResponse)
def update_prompt(
    prompt_id: UUID,
    prompt_data: PromptUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> PromptResponse:
    """Update a prompt (author only).

    Args:
        prompt_id: Prompt ID to update
        prompt_data: Updated prompt data
        current_user: Current authenticated user
        session: Database session

    Returns:
        Updated prompt

    Raises:
        HTTPException: If prompt not found or not authorized
    """
    prompt = session.exec(select(Prompt).where(Prompt.id == prompt_id)).first()
    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found",
        )

    # Check authorization
    if prompt.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this prompt",
        )

    # Update fields
    if prompt_data.title is not None:
        prompt.title = prompt_data.title
    if prompt_data.prompt_text is not None:
        prompt.prompt_text = prompt_data.prompt_text
    if prompt_data.description is not None:
        prompt.description = prompt_data.description
    if prompt_data.variables is not None:
        prompt.variables = prompt_data.variables
    if prompt_data.sharing_level is not None:
        prompt.sharing_level = prompt_data.sharing_level

    session.add(prompt)
    session.commit()
    session.refresh(prompt)

    return PromptResponse.model_validate(prompt)


@router.delete("/{prompt_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_prompt(
    prompt_id: UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> None:
    """Delete a prompt (author only).

    Args:
        prompt_id: Prompt ID to delete
        current_user: Current authenticated user
        session: Database session

    Raises:
        HTTPException: If prompt not found or not authorized
    """
    prompt = session.exec(select(Prompt).where(Prompt.id == prompt_id)).first()
    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found",
        )

    # Check authorization
    if prompt.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this prompt",
        )

    session.delete(prompt)
    session.commit()


@router.post("/{prompt_id}/fork", response_model=PromptResponse, status_code=status.HTTP_201_CREATED)
def fork_prompt(
    prompt_id: UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> PromptResponse:
    """Fork a prompt (create a copy in user's library).

    Args:
        prompt_id: Prompt ID to fork
        current_user: Current authenticated user
        session: Database session

    Returns:
        Forked prompt

    Raises:
        HTTPException: If prompt not found
    """
    original = session.exec(select(Prompt).where(Prompt.id == prompt_id)).first()
    if not original:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found",
        )

    # Create fork
    forked_prompt = Prompt(
        user_id=current_user.id,
        title=f"{original.title} (copy)",
        prompt_text=original.prompt_text,
        description=original.description,
        variables=original.variables,
        sharing_level=SharingLevel.PRIVATE,  # Forks start as private
        is_fork=True,
        forked_from_id=original.id,
        version_number=1,
    )

    # Increment fork count on original
    original.fork_count += 1

    session.add(forked_prompt)
    session.add(original)
    session.commit()
    session.refresh(forked_prompt)

    return PromptResponse.model_validate(forked_prompt)


@router.get("/{prompt_id}/usage", response_model=dict[str, Any])
def get_prompt_usage(
    prompt_id: UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> dict[str, Any]:
    """Get usage analytics for a prompt (author only).

    Args:
        prompt_id: Prompt ID to get analytics for
        current_user: Current authenticated user
        session: Database session

    Returns:
        Usage statistics

    Raises:
        HTTPException: If prompt not found or not authorized
    """
    prompt = session.exec(select(Prompt).where(Prompt.id == prompt_id)).first()
    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found",
        )

    # Check authorization
    if prompt.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view analytics",
        )

    return {
        "id": prompt.id,
        "title": prompt.title,
        "usage_count": prompt.usage_count,
        "fork_count": prompt.fork_count,
        "sharing_level": prompt.sharing_level.value,
        "created_at": prompt.created_at,
        "updated_at": prompt.updated_at,
    }
