/**
 * Filter Sidebar Component for Browse Page
 * Provides advanced filtering by discipline, tools, collaboration status, and quick wins
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
import { Resource } from "@/types/index";

interface FilterSidebarProps {
  onFiltersChange: (filters: FilterState) => void;
  initialFilters?: FilterState;
  resources?: Resource[]; // Optional: if provided, extracts filters from these resources instead of fetching
}

export interface FilterState {
  disciplines: string[];
  tools: string[];
  collaborationStatus: string[];
  minTimeSaved: number;
  sortBy: "newest" | "popular" | "most_tried";
}

const COLLABORATION_STATUS = ["SEEKING", "PROVEN", "HAS_MATERIALS"];

/**
 * Extract unique disciplines from resources
 */
function extractDisciplines(resources: Resource[]): string[] {
  const disciplines = new Set<string>();
  resources.forEach((resource) => {
    if (resource.discipline) {
      disciplines.add(resource.discipline);
    }
  });
  return Array.from(disciplines).sort();
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

  // Extract unique disciplines and tool categories from resources
  const disciplines = useMemo(() => extractDisciplines(resources), [resources]);
  const toolCategories = useMemo(
    () => extractToolCategories(resources),
    [resources]
  );

  const [filters, setFilters] = useState<FilterState>(
    initialFilters || {
      disciplines: [],
      tools: [],
      collaborationStatus: [],
      minTimeSaved: 0,
      sortBy: "newest",
    }
  );

  const handleDisciplineChange = (discipline: string) => {
    const updated = filters.disciplines.includes(discipline)
      ? filters.disciplines.filter((d) => d !== discipline)
      : [...filters.disciplines, discipline];

    const newFilters = { ...filters, disciplines: updated };
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

  const handleCollaborationChange = (status: string) => {
    const updated = filters.collaborationStatus.includes(status)
      ? filters.collaborationStatus.filter((s) => s !== status)
      : [...filters.collaborationStatus, status];

    const newFilters = { ...filters, collaborationStatus: updated };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleTimeSavedChange = (values: number[]) => {
    const newFilters = { ...filters, minTimeSaved: values[0] };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleSortChange = (
    sortBy: "newest" | "popular" | "most_tried"
  ) => {
    const newFilters = { ...filters, sortBy };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters: FilterState = {
      disciplines: [],
      tools: [],
      collaborationStatus: [],
      minTimeSaved: 0,
      sortBy: "newest",
    };
    setFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const activeFilterCount =
    filters.disciplines.length +
    filters.tools.length +
    filters.collaborationStatus.length +
    (filters.minTimeSaved > 0 ? 1 : 0);

  return (
    <Box
      bg="white"
      borderRadius="lg"
      p={6}
      boxShadow="sm"
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
              <Badge colorScheme="blue" variant="solid">
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
          <Text fontSize="sm" fontWeight="semibold" color="gray.700">
            Sort By
          </Text>
          <Stack direction="column" spacing={2}>
            {(
              ["newest", "popular", "most_tried"] as const
            ).map((option) => (
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

        {/* Area */}
        <VStack align="stretch" spacing={3}>
          <Text fontSize="sm" fontWeight="semibold" color="gray.700">
            Area
          </Text>
          {isLoading ? (
            <Spinner size="sm" />
          ) : disciplines.length === 0 ? (
            <Text fontSize="sm" color="gray.500">
              No areas available
            </Text>
          ) : (
            <VStack align="stretch" spacing={2}>
              {disciplines.map((discipline) => (
                <Checkbox
                  key={discipline}
                  isChecked={filters.disciplines.includes(discipline)}
                  onChange={() => handleDisciplineChange(discipline)}
                >
                  {discipline}
                </Checkbox>
              ))}
            </VStack>
          )}
        </VStack>

        <Divider />

        {/* Tools */}
        <VStack align="stretch" spacing={3}>
          <Text fontSize="sm" fontWeight="semibold" color="gray.700">
            AI Tool Categories
          </Text>
          {isLoading ? (
            <Spinner size="sm" />
          ) : toolCategories.length === 0 ? (
            <Text fontSize="sm" color="gray.500">
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

        {/* Collaboration Status */}
        <VStack align="stretch" spacing={3}>
          <Text fontSize="sm" fontWeight="semibold" color="gray.700">
            Collaboration Status
          </Text>
          <VStack align="stretch" spacing={2}>
            {COLLABORATION_STATUS.map((status) => (
              <Checkbox
                key={status}
                isChecked={filters.collaborationStatus.includes(status)}
                onChange={() => handleCollaborationChange(status)}
              >
                {status === "SEEKING"
                  ? "Seeking Collaborators"
                  : status === "PROVEN"
                  ? "Proven & Tested"
                  : "Has Materials"}
              </Checkbox>
            ))}
          </VStack>
        </VStack>

        <Divider />

        {/* Quick Wins Filter */}
        <VStack align="stretch" spacing={3}>
          <VStack align="stretch" spacing={1}>
            <Text fontSize="sm" fontWeight="semibold" color="gray.700">
              Minimum Time Saved
            </Text>
            <Text fontSize="xs" color="gray.600">
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
              <RangeSliderFilledTrack bg="blue.400" />
            </RangeSliderTrack>
            <RangeSliderThumb index={0} />
          </RangeSlider>
        </VStack>
      </VStack>
    </Box>
  );
}
