/**
 * Filter Sidebar Component for Browse Page
 * Provides advanced filtering by specialty, tools, and quick wins
 */

import {
  VStack,
  HStack,
  Heading,
  Button,
  Checkbox,
  Box,
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  Text,
  Divider,
  Badge,
  Stack,
  Spinner,
} from "@chakra-ui/react";
import { useState, useMemo } from "react";
import { useResources } from "@/hooks/useResources";
import { Resource, ProfessionalRole, PROFESSIONAL_ROLES } from "@/types/index";

interface FilterSidebarProps {
  onFiltersChange: (filters: FilterState) => void;
  initialFilters?: FilterState;
  resources?: Resource[]; // Optional: if provided, extracts filters from these resources instead of fetching
}

export interface FilterState {
  specialties: string[];
  tools: string[];
  professionalRoles: ProfessionalRole[];
  minTimeSaved: number;
  sortBy: "newest" | "popular" | "most_tried";
}

/**
 * Extract unique specialties from resources
 */
function extractSpecialties(resources: Resource[]): string[] {
  const specialties = new Set<string>();
  resources.forEach((resource) => {
    if (resource.specialty) {
      specialties.add(resource.specialty);
    }
  });
  return Array.from(specialties).sort();
}

/**
 * Extract tool categories from resources
 * Returns the top-level category keys (LLM, CUSTOM_APP, VISION, etc.)
 */
function extractToolCategories(resources: Resource[]): string[] {
  const categories = new Set<string>();
  resources.forEach((resource) => {
    if (resource.tools_used && typeof resource.tools_used === "object") {
      Object.keys(resource.tools_used).forEach((category) => {
        categories.add(category);
      });
    }
  });
  return Array.from(categories).sort();
}

/**
 * Format tool category name for display
 */
function formatCategoryName(category: string): string {
  return category
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function FilterSidebar({
  onFiltersChange,
  initialFilters,
  resources: propResources,
}: FilterSidebarProps) {
  // If resources are passed as prop, use those (no separate network request)
  // Otherwise, fetch them (for backward compatibility)
  const { data: fetchedResources = [], isLoading: isFetching } = useResources(
    propResources ? undefined : { limit: 100 }
  );

  const resources = propResources || fetchedResources;
  const isLoading = propResources ? false : isFetching;

  // Extract unique specialties and tool categories from resources
  const specialties = useMemo(() => extractSpecialties(resources), [resources]);
  const toolCategories = useMemo(() => extractToolCategories(resources), [resources]);

  const [filters, setFilters] = useState<FilterState>(
    initialFilters || {
      specialties: [],
      tools: [],
      professionalRoles: [],
      minTimeSaved: 0,
      sortBy: "newest",
    }
  );

  const handleSpecialtyChange = (specialty: string) => {
    const updated = filters.specialties.includes(specialty)
      ? filters.specialties.filter((s) => s !== specialty)
      : [...filters.specialties, specialty];

    const newFilters = { ...filters, specialties: updated };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleToolChange = (tool: string) => {
    const updated = filters.tools.includes(tool)
      ? filters.tools.filter((t) => t !== tool)
      : [...filters.tools, tool];

    const newFilters = { ...filters, tools: updated };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleProfessionalRoleChange = (role: ProfessionalRole) => {
    const updated = filters.professionalRoles.includes(role)
      ? filters.professionalRoles.filter((r) => r !== role)
      : [...filters.professionalRoles, role];

    const newFilters = { ...filters, professionalRoles: updated };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleTimeSavedChange = (values: number[]) => {
    const newFilters = { ...filters, minTimeSaved: values[0] };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleSortChange = (sortBy: "newest" | "popular" | "most_tried") => {
    const newFilters = { ...filters, sortBy };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters: FilterState = {
      specialties: [],
      tools: [],
      professionalRoles: [],
      minTimeSaved: 0,
      sortBy: "newest",
    };
    setFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const activeFilterCount =
    filters.specialties.length +
    filters.tools.length +
    filters.professionalRoles.length +
    (filters.minTimeSaved > 0 ? 1 : 0);

  return (
    <Box
      bg="dark.card"
      borderRadius="lg"
      p={6}
      boxShadow="sm"
      border="1px"
      borderColor="dark.border"
      height="fit-content"
      position="sticky"
      top={6}
    >
      <VStack align="stretch" spacing={6}>
        {/* Header */}
        <HStack justify="space-between" align="center">
          <HStack spacing={2}>
            <Heading size="md">Filters</Heading>
            {activeFilterCount > 0 && (
              <Badge colorScheme="brand" variant="solid">
                {activeFilterCount}
              </Badge>
            )}
          </HStack>
          {activeFilterCount > 0 && (
            <Button size="xs" variant="ghost" onClick={handleReset}>
              Reset
            </Button>
          )}
        </HStack>

        <Divider />

        {/* Sort */}
        <VStack align="stretch" spacing={3}>
          <Text fontSize="sm" fontWeight="semibold" color="whiteAlpha.700">
            Sort By
          </Text>
          <Stack direction="column" spacing={2}>
            {(["newest", "popular", "most_tried"] as const).map((option) => (
              <Button
                key={option}
                size="sm"
                variant={filters.sortBy === option ? "solid" : "ghost"}
                colorScheme={filters.sortBy === option ? "blue" : "gray"}
                justifyContent="flex-start"
                onClick={() => handleSortChange(option)}
              >
                {option === "newest"
                  ? "Newest"
                  : option === "popular"
                    ? "Most Helpful"
                    : "Most Tried"}
              </Button>
            ))}
          </Stack>
        </VStack>

        <Divider />

        {/* Specialty */}
        <VStack align="stretch" spacing={3}>
          <Text fontSize="sm" fontWeight="semibold" color="whiteAlpha.700">
            Specialty
          </Text>
          {isLoading ? (
            <Spinner size="sm" />
          ) : specialties.length === 0 ? (
            <Text fontSize="sm" color="whiteAlpha.500">
              No specialties available
            </Text>
          ) : (
            <VStack align="stretch" spacing={2}>
              {specialties.map((specialty) => (
                <Checkbox
                  key={specialty}
                  isChecked={filters.specialties.includes(specialty)}
                  onChange={() => handleSpecialtyChange(specialty)}
                >
                  {specialty}
                </Checkbox>
              ))}
            </VStack>
          )}
        </VStack>

        <Divider />

        {/* Professional Role */}
        <VStack align="stretch" spacing={3}>
          <Text fontSize="sm" fontWeight="semibold" color="whiteAlpha.700">
            Creator Role
          </Text>
          <VStack align="stretch" spacing={2}>
            {(Object.keys(PROFESSIONAL_ROLES) as ProfessionalRole[]).map((role) => (
              <Checkbox
                key={role}
                isChecked={filters.professionalRoles.includes(role)}
                onChange={() => handleProfessionalRoleChange(role)}
              >
                {role}
              </Checkbox>
            ))}
          </VStack>
        </VStack>

        <Divider />

        {/* Tools */}
        <VStack align="stretch" spacing={3}>
          <Text fontSize="sm" fontWeight="semibold" color="whiteAlpha.700">
            AI Tool Categories
          </Text>
          {isLoading ? (
            <Spinner size="sm" />
          ) : toolCategories.length === 0 ? (
            <Text fontSize="sm" color="whiteAlpha.500">
              No tools available
            </Text>
          ) : (
            <VStack align="stretch" spacing={2}>
              {toolCategories.map((category) => (
                <Checkbox
                  key={category}
                  isChecked={filters.tools.includes(category)}
                  onChange={() => handleToolChange(category)}
                >
                  {formatCategoryName(category)}
                </Checkbox>
              ))}
            </VStack>
          )}
        </VStack>

        <Divider />

        {/* Quick Wins Filter */}
        <VStack align="stretch" spacing={3}>
          <VStack align="stretch" spacing={1}>
            <Text fontSize="sm" fontWeight="semibold" color="whiteAlpha.700">
              Minimum Time Saved
            </Text>
            <Text fontSize="xs" color="whiteAlpha.600">
              {filters.minTimeSaved === 0
                ? "Any"
                : filters.minTimeSaved === 0.5
                  ? "≥ 30 min/week"
                  : filters.minTimeSaved === 1
                    ? "≥ 1 hour/week"
                    : filters.minTimeSaved === 2
                      ? "≥ 2 hours/week"
                      : "≥ 4 hours/week"}
            </Text>
          </VStack>
          <RangeSlider
            aria-label={["min time saved"]}
            defaultValue={[filters.minTimeSaved]}
            min={0}
            max={4}
            step={0.5}
            onChange={handleTimeSavedChange}
          >
            <RangeSliderTrack>
              <RangeSliderFilledTrack bg="brand.400" />
            </RangeSliderTrack>
            <RangeSliderThumb index={0} />
          </RangeSlider>
        </VStack>
      </VStack>
    </Box>
  );
}
