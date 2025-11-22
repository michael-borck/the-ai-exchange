"""
Areas of Focus at Curtin University
Includes academic schools/departments and research institutes
"""

AREAS = [
    # Academic Schools/Departments
    "Business Information Systems",
    "Innovation, Entrepreneurship, Strategy and International Business",
    "People, Culture and Organisations",
    "Marketing",
    "Tourism, Hospitality and Events",
    # Research Institutes
    "Future of Work Institute",
    "John Curtin Institute of Public Policy",
    "Luxury Branding Research Centre",
    "Tourism Research Cluster",
    "Australian Centre for Student Equity and Success",
    # Professional Services (examples - can be expanded)
    "Human Resources",
    "Information Technology",
    "Finance and Administration",
    "Library and Learning Services",
    "Student Services",
    "Facilities and Operations",
    "Property Development",
    "Supply Chain and Logistics",
]


def get_areas() -> list[str]:
    """Get all available areas sorted alphabetically."""
    return sorted(AREAS)


def is_valid_area(area: str) -> bool:
    """Check if an area exists in the list."""
    return area in AREAS


def normalize_area(area: str) -> str:
    """Normalize area name for comparison."""
    return area.strip()
