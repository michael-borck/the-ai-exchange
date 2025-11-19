#!/usr/bin/env python3
"""
Mock Data Loader/Unloader Script
Loads and unloads test data for beta testing without touching production data.

Usage:
    python load_mock_data.py load    # Load mock data
    python load_mock_data.py unload  # Remove mock data
    python load_mock_data.py reset   # Remove and reload mock data
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlmodel import Session, select
from app.services.database import engine, get_session
from app.models import User, Resource, ResourceAnalytics
from app.core.security import hash_password
from datetime import datetime, timedelta

# Mock data - only STAFF users for beta testing
# ADMIN accounts should be created manually as needed, not hardcoded in mock data
MOCK_USERS = [
    {
        "email": "sarah.chen@curtin.edu.au",
        "full_name": "Dr. Sarah Chen",
        "password": "TestPassword123!",
        "role": "STAFF",
        "is_active": True,
        "disciplines": ["MARKETING"],
    },
    {
        "email": "mike.torres@curtin.edu.au",
        "full_name": "Dr. Mike Torres",
        "password": "TestPassword123!",
        "role": "STAFF",
        "is_active": True,
        "disciplines": ["BUSINESS"],
    },
    {
        "email": "kumar.prof@curtin.edu.au",
        "full_name": "Prof. Kumar",
        "password": "TestPassword123!",
        "role": "STAFF",
        "is_active": True,
        "disciplines": ["ACCOUNTING"],
    },
    {
        "email": "jennifer.lee@curtin.edu.au",
        "full_name": "Dr. Jennifer Lee",
        "password": "TestPassword123!",
        "role": "STAFF",
        "is_active": True,
        "disciplines": ["HR"],
    },
    {
        "email": "alex.patel@curtin.edu.au",
        "full_name": "Dr. Alex Patel",
        "password": "TestPassword123!",
        "role": "STAFF",
        "is_active": True,
        "disciplines": ["SUPPLY_CHAIN"],
    },
]

MOCK_RESOURCES = [
    {
        "title": "Using Claude for MBA Case Studies",
        "content_text": "This resource shows how to use Claude AI to generate industry-specific case studies that are aligned with learning outcomes. The process takes under 5 minutes and produces high-quality, contextually relevant cases.\n\nSteps:\n1. Define learning objectives\n2. Specify industry context\n3. Use Claude to generate case\n4. Review and customize\n5. Deploy to students",
        "type": "USE_CASE",
        "status": "OPEN",
        "user_email": "sarah.chen@curtin.edu.au",
        "discipline": "Marketing",
        "tools_used": {"LLM": ["Claude", "ChatGPT"]},
        "collaboration_status": "SEEKING",
        "quick_summary": "Generates industry-specific cases aligned with learning outcomes...",
        "time_saved_value": 3.0,
        "time_saved_frequency": "per_week",
        "system_tags": ["AI", "Education", "Case Studies", "Marketing"],
    },
    {
        "title": "Automated Rubric Generation",
        "content_text": "Create consistent assessment criteria in seconds using ChatGPT. This reduces grading time and ensures fairness across all students.\n\nWorkflow:\n1. Input assignment description\n2. Specify competencies to assess\n3. Let ChatGPT generate detailed rubric\n4. Customize weight and criteria\n5. Export to gradebook",
        "type": "PROMPT",
        "status": "OPEN",
        "user_email": "mike.torres@curtin.edu.au",
        "discipline": "Management",
        "tools_used": {"LLM": ["ChatGPT"], "CUSTOM_APP": ["Talk-Buddy"]},
        "collaboration_status": "PROVEN",
        "quick_summary": "Create consistent assessment criteria in seconds...",
        "time_saved_value": 2.0,
        "time_saved_frequency": "per_week",
        "system_tags": ["Assessment", "Rubrics", "Automation"],
    },
    {
        "title": "Literature Review Synthesis with NotebookLM",
        "content_text": "Automatically extract and summarize key findings from academic papers using Claude and NotebookLM. This process reduces literature review time from weeks to days.\n\nProcess:\n1. Upload PDF papers to NotebookLM\n2. Generate audio overview\n3. Ask Claude to extract methodology, findings, limitations\n4. Organize by theme\n5. Create synthesis table\n6. Identify research gaps",
        "type": "USE_CASE",
        "status": "OPEN",
        "user_email": "kumar.prof@curtin.edu.au",
        "discipline": "Economics",
        "tools_used": {"LLM": ["Claude", "NotebookLM"]},
        "collaboration_status": "HAS_MATERIALS",
        "quick_summary": "Automatically extract and summarize key findings...",
        "time_saved_value": 4.0,
        "time_saved_frequency": "per_week",
        "system_tags": ["Research", "Literature Review", "Synthesis"],
    },
    {
        "title": "Video Assessment with AI Speech Recognition",
        "content_text": "AI-assisted feedback generation for recorded student presentations using speech-to-text and Claude. Provides instant, detailed feedback to students.\n\nHow it works:\n1. Students record presentation\n2. Upload video to platform\n3. AI generates transcript via speech recognition\n4. Claude creates detailed feedback\n5. Students receive constructive comments",
        "type": "USE_CASE",
        "status": "OPEN",
        "user_email": "jennifer.lee@curtin.edu.au",
        "discipline": "HR",
        "tools_used": {"LLM": ["ChatGPT"], "SPEECH": ["Whisper"], "WORKFLOW": ["Canvas LMS"]},
        "collaboration_status": "SEEKING",
        "quick_summary": "AI-assisted feedback generation for recorded presentations...",
        "time_saved_value": 2.5,
        "time_saved_frequency": "per_week",
        "system_tags": ["Assessment", "Video", "Feedback"],
    },
    {
        "title": "AI Course Design with Study-Buddy",
        "content_text": "Design comprehensive course structures using Study-Buddy custom AI application. Helps create engaging learning pathways with adaptive assessments.\n\nTemplate structure:\n1. Define learning outcomes\n2. Create content modules\n3. Design adaptive quizzes\n4. Build assessment rubrics\n5. Generate study guides",
        "type": "USE_CASE",
        "status": "OPEN",
        "user_email": "alex.patel@curtin.edu.au",
        "discipline": "Finance",
        "tools_used": {"CUSTOM_APP": ["Study-Buddy"], "LLM": ["Claude"]},
        "collaboration_status": "PROVEN",
        "quick_summary": "Design comprehensive course structures with AI guidance...",
        "time_saved_value": 1.5,
        "time_saved_frequency": "per_week",
        "system_tags": ["Course Design", "Assessment", "Custom AI"],
    },
    {
        "title": "AI-Generated Infographics for Lectures",
        "content_text": "Create visually compelling infographics and diagrams for lectures using DALL-E and Midjourney. Enhance student understanding through visual learning.\n\nProcess:\n1. Input course concept\n2. Generate image prompts with Claude\n3. Create images with DALL-E or Midjourney\n4. Customize colors and text\n5. Embed in presentations",
        "type": "USE_CASE",
        "status": "OPEN",
        "user_email": "sarah.chen@curtin.edu.au",
        "discipline": "Management",
        "tools_used": {"LLM": ["Claude"], "VISION": ["DALL-E", "Midjourney"]},
        "collaboration_status": "HAS_MATERIALS",
        "quick_summary": "Create visually compelling infographics for lectures...",
        "time_saved_value": 1.0,
        "time_saved_frequency": "per_week",
        "system_tags": ["Visual Learning", "Graphics", "Teaching"],
    },
    {
        "title": "Automated Exam Question Generation",
        "content_text": "Quickly generate diverse exam questions from course materials using Claude and deploy through Curriculum-Creator. Ensures question variety and alignment with learning outcomes.",
        "type": "PROMPT",
        "status": "OPEN",
        "user_email": "mike.torres@curtin.edu.au",
        "discipline": "Analytics",
        "tools_used": {"LLM": ["Claude", "ChatGPT"], "CUSTOM_APP": ["Curriculum-Creator"]},
        "collaboration_status": "SEEKING",
        "quick_summary": "Quickly generate exam questions from course materials...",
        "time_saved_value": 2.5,
        "time_saved_frequency": "per_week",
        "system_tags": ["Exams", "Questions", "Assessment"],
    },
    {
        "title": "AI-Assisted Research Data Analysis",
        "content_text": "Use Claude and Python automation for statistical analysis and research insights. Streamlines data interpretation and report generation.",
        "type": "USE_CASE",
        "status": "OPEN",
        "user_email": "kumar.prof@curtin.edu.au",
        "discipline": "Economics",
        "tools_used": {"LLM": ["Claude"], "DEVELOPMENT": ["Python"]},
        "collaboration_status": "PROVEN",
        "quick_summary": "Use AI to structure and refine research data analysis...",
        "time_saved_value": 3.5,
        "time_saved_frequency": "per_week",
        "system_tags": ["Research", "Data Analysis", "Automation"],
    },
]

MOCK_ANALYTICS = [
    {"resource_index": 0, "views": 234, "saves": 45, "tries": 18},
    {"resource_index": 1, "views": 156, "saves": 32, "tries": 12},
    {"resource_index": 2, "views": 298, "saves": 67, "tries": 24},
    {"resource_index": 3, "views": 412, "saves": 89, "tries": 45},
    {"resource_index": 4, "views": 325, "saves": 71, "tries": 38},
    {"resource_index": 5, "views": 289, "saves": 58, "tries": 31},
    {"resource_index": 6, "views": 176, "saves": 42, "tries": 19},
    {"resource_index": 7, "views": 267, "saves": 63, "tries": 28},
]


def flatten_tools(tools_used: dict[str, list[str]]) -> list[str]:
    """Flatten categorized tools into a single list."""
    flat = []
    for category, tools in tools_used.items():
        flat.extend(tools)
    return flat


def load_mock_data():
    """Load mock data into database."""
    from sqlmodel import SQLModel

    # Create tables if they don't exist
    print("📋 Creating database tables...")
    SQLModel.metadata.create_all(engine)

    session = Session(engine)

    try:
        # Check if mock data already exists (by checking for one of our mock emails)
        existing = session.exec(
            select(User).where(User.email == "sarah.chen@curtin.edu.au")
        ).first()

        if existing:
            print("❌ Mock data already exists! Use 'unload' first or 'reset' to reload.")
            return False

        print("📥 Loading mock users...")
        mock_users_map = {}
        for user_data in MOCK_USERS:
            user = User(
                email=user_data["email"],
                full_name=user_data["full_name"],
                hashed_password=hash_password(user_data["password"]),
                role=user_data["role"],
                is_active=user_data["is_active"],
                disciplines=user_data.get("disciplines", []),
            )
            session.add(user)
            mock_users_map[user_data["email"]] = user
        session.commit()
        print(f"✅ Loaded {len(MOCK_USERS)} users")

        print("📥 Loading mock resources...")
        mock_resources = []
        for resource_data in MOCK_RESOURCES:
            user = mock_users_map[resource_data.pop("user_email")]
            # Auto-populate tools_used_flat from tools_used
            if "tools_used" in resource_data and isinstance(resource_data["tools_used"], dict):
                resource_data["tools_used_flat"] = flatten_tools(resource_data["tools_used"])
            resource = Resource(
                **resource_data,
                user_id=user.id,
            )
            session.add(resource)
            mock_resources.append(resource)
        session.commit()
        print(f"✅ Loaded {len(mock_resources)} resources")

        print("📥 Loading mock analytics...")
        for analytics_data in MOCK_ANALYTICS:
            resource_idx = analytics_data["resource_index"]
            resource = mock_resources[resource_idx]
            analytics = ResourceAnalytics(
                resource_id=resource.id,
                view_count=analytics_data["views"],
                save_count=analytics_data["saves"],
                tried_count=analytics_data["tries"],
                fork_count=0,
                comment_count=0,
                helpful_count=0,
                last_viewed=datetime.utcnow() - timedelta(hours=2),
            )
            session.add(analytics)
        session.commit()
        print(f"✅ Loaded {len(MOCK_ANALYTICS)} analytics records")

        print("\n✨ Mock data loaded successfully!")
        print("\n📋 Test Accounts (all with password: TestPassword123!):")
        for user_data in MOCK_USERS:
            print(f"   • {user_data['email']}")

        return True

    except Exception as e:
        session.rollback()
        print(f"❌ Error loading mock data: {e}")
        return False
    finally:
        session.close()


def unload_mock_data():
    """Remove mock data from database."""
    session = Session(engine)

    try:
        # Delete mock data by email pattern
        mock_emails = [user["email"] for user in MOCK_USERS]

        # Delete analytics records for mock resources
        print("🗑️ Removing analytics...")
        resources_to_delete = session.exec(
            select(Resource).where(Resource.user_id.in_(
                session.exec(select(User.id).where(User.email.in_(mock_emails)))
            ))
        ).all()

        for resource in resources_to_delete:
            analytics = session.exec(
                select(ResourceAnalytics).where(
                    ResourceAnalytics.resource_id == resource.id
                )
            ).all()
            for a in analytics:
                session.delete(a)

        # Delete resources
        print("🗑️ Removing resources...")
        for resource in resources_to_delete:
            session.delete(resource)

        # Delete users
        print("🗑️ Removing users...")
        users_to_delete = session.exec(
            select(User).where(User.email.in_(mock_emails))
        ).all()

        for user in users_to_delete:
            session.delete(user)

        session.commit()
        print(f"\n✨ Removed {len(users_to_delete)} users, {len(resources_to_delete)} resources, and their analytics")
        print("✅ Mock data unloaded successfully!")

        return True

    except Exception as e:
        session.rollback()
        print(f"❌ Error unloading mock data: {e}")
        return False
    finally:
        session.close()


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    command = sys.argv[1].lower()

    if command == "load":
        success = load_mock_data()
        sys.exit(0 if success else 1)
    elif command == "unload":
        success = unload_mock_data()
        sys.exit(0 if success else 1)
    elif command == "reset":
        print("🔄 Resetting mock data...\n")
        unload_mock_data()
        print()
        load_mock_data()
        sys.exit(0)
    else:
        print(f"❌ Unknown command: {command}")
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
