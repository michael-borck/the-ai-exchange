/**
 * Utility functions for handling tools data
 */

/**
 * Flatten categorised tools structure to a simple array
 * @param toolsUsed - Categorised tools object, e.g., { "LLM": ["Claude"], "CUSTOM_APP": ["Talk-Buddy"] }
 * @returns Flattened array of tool names
 */
export function flattenTools(toolsUsed?: Record<string, string[]> | string[]): string[] {
  if (!toolsUsed) {
    return [];
  }

  // If it's already an array (for backward compatibility), return as-is
  if (Array.isArray(toolsUsed)) {
    return toolsUsed;
  }

  // Otherwise, flatten the categorised structure
  const flattened: string[] = [];
  Object.values(toolsUsed).forEach((tools) => {
    if (Array.isArray(tools)) {
      flattened.push(...tools);
    }
  });

  return flattened;
}

/**
 * Get tools by category
 * @param toolsUsed - Categorised tools object
 * @param category - The category to filter by (e.g., "LLM")
 * @returns Array of tools in the category, or empty array if category doesn't exist
 */
export function getToolsByCategory(
  toolsUsed: Record<string, string[]> | undefined,
  category: string
): string[] {
  if (!toolsUsed || typeof toolsUsed !== "object" || Array.isArray(toolsUsed)) {
    return [];
  }

  return toolsUsed[category] || [];
}

/**
 * Get all categories that have tools
 * @param toolsUsed - Categorised tools object
 * @returns Array of category names
 */
export function getToolCategories(toolsUsed: Record<string, string[]> | undefined): string[] {
  if (!toolsUsed || typeof toolsUsed !== "object" || Array.isArray(toolsUsed)) {
    return [];
  }

  return Object.keys(toolsUsed).filter((category) => toolsUsed[category].length > 0);
}
