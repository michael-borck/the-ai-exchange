/**
 * Areas of Focus at Curtin University
 * Includes academic schools/departments and research institutes
 */

export const AREAS = [
  // Academic Schools/Departments
  "Business Information Systems",
  "Innovation, Entrepreneurship, Strategy and International Business",
  "People, Culture and Organisations",
  "Marketing",
  "Tourism, Hospitality and Events",

  // Research Institutes
  "Future of Work Institute",
  "John Curtin Institute of Public Policy",
  "Luxury Branding Research Centre",
  "Tourism Research Cluster",
  "Australian Centre for Student Equity and Success",

  // Professional Services (examples - can be expanded)
  "Human Resources",
  "Information Technology",
  "Finance and Administration",
  "Library and Learning Services",
  "Student Services",
  "Facilities and Operations",
  "Property Development",
  "Supply Chain and Logistics",
];

/**
 * Get all available areas sorted alphabetically
 */
export function getAreas(): string[] {
  return [...AREAS].sort();
}

/**
 * Check if an area exists in the list
 */
export function isValidArea(area: string): boolean {
  return AREAS.includes(area);
}

/**
 * Normalize area name for comparison
 */
export function normalizeArea(area: string): string {
  return area.trim();
}
