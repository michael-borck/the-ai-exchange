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
} from "@chakra-ui/react";
import { useState } from "react";

interface FilterSidebarProps {
  onFiltersChange: (filters: FilterState) => void;
  initialFilters?: FilterState;
}

export interface FilterState {
  disciplines: string[];
  tools: string[];
  collaborationStatus: string[];
  minTimeSaved: number;
  sortBy: "newest" | "popular" | "most_tried";
}

const DISCIPLINES = [
  "Marketing",
  "Management",
  "HR",
  "Analytics",
  "Finance",
  "Economics",
  "Tourism",
  "Entrepreneurship",
];

const TOOLS = [
  "Claude",
  "ChatGPT",
  "GPT-4",
  "Copilot",
  "Midjourney",
  "Canvas LMS",
];

const COLLABORATION_STATUS = ["SEEKING", "PROVEN", "HAS_MATERIALS"];

export function FilterSidebar({
  onFiltersChange,
  initialFilters,
}: FilterSidebarProps) {
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

        {/* Discipline */}
        <VStack align="stretch" spacing={3}>
          <Text fontSize="sm" fontWeight="semibold" color="gray.700">
            Discipline
          </Text>
          <VStack align="stretch" spacing={2}>
            {DISCIPLINES.map((discipline) => (
              <Checkbox
                key={discipline}
                isChecked={filters.disciplines.includes(discipline)}
                onChange={() => handleDisciplineChange(discipline)}
              >
                {discipline}
              </Checkbox>
            ))}
          </VStack>
        </VStack>

        <Divider />

        {/* Tools */}
        <VStack align="stretch" spacing={3}>
          <Text fontSize="sm" fontWeight="semibold" color="gray.700">
            AI Tools Used
          </Text>
          <VStack align="stretch" spacing={2}>
            {TOOLS.map((tool) => (
              <Checkbox
                key={tool}
                isChecked={filters.tools.includes(tool)}
                onChange={() => handleToolChange(tool)}
              >
                {tool}
              </Checkbox>
            ))}
          </VStack>
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
