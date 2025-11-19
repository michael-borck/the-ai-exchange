/**
 * Resources Listing Page - Browse Ideas
 */

import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import {
  VStack,
  HStack,
  Heading,
  Button,
  Input,
  Box,
  Grid,
  GridItem,
  Text,
  Spinner,
  Center,
  InputGroup,
  InputLeftElement,
  Icon,
  SimpleGrid,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { useResources } from "@/hooks/useResources";
import { ResourceType, ResourceStatus } from "@/types/index";
import { FilterSidebar, FilterState } from "@/components/FilterSidebar";

interface ResourceCard {
  id: string;
  title: string;
  author: string;
  discipline: string;
  tools: string[];
  quickSummary: string;
  timeSaved?: number;
  views: number;
  tried: number;
  collaborationStatus: string;
}

// Mock data - will be replaced with API data
const mockResources: ResourceCard[] = [
  {
    id: "1",
    title: "Using Claude for MBA Case Studies",
    author: "Dr. Sarah Chen",
    discipline: "Marketing",
    tools: ["Claude", "ChatGPT"],
    quickSummary: "Generates industry-specific cases aligned with learning outcomes...",
    timeSaved: 3,
    views: 234,
    tried: 18,
    collaborationStatus: "SEEKING",
  },
  {
    id: "2",
    title: "Automated Rubric Generation",
    author: "Dr. Mike Torres",
    discipline: "Management",
    tools: ["ChatGPT"],
    quickSummary: "Create consistent assessment criteria in seconds...",
    timeSaved: 2,
    views: 156,
    tried: 12,
    collaborationStatus: "PROVEN",
  },
  {
    id: "3",
    title: "Literature Review Synthesis",
    author: "Prof. Kumar",
    discipline: "Economics",
    tools: ["Claude"],
    quickSummary: "Automatically extract and summarize key findings...",
    timeSaved: 4,
    views: 298,
    tried: 24,
    collaborationStatus: "HAS_MATERIALS",
  },
];

function BrowseResourceCard({ resource }: { resource: ResourceCard }) {
  const navigate = useNavigate();

  const statusColor = {
    SEEKING: "blue",
    PROVEN: "green",
    HAS_MATERIALS: "purple",
  };

  return (
    <Box
      bg="white"
      border="1px"
      borderColor="gray.200"
      borderRadius="md"
      p={4}
      cursor="pointer"
      _hover={{ boxShadow: "md", transform: "translateY(-2px)" }}
      transition="all 0.2s"
      onClick={() => navigate(`/resources/${resource.id}`)}
    >
      <VStack align="flex-start" spacing={3}>
        {/* Header with badges */}
        <HStack spacing={2} width="full" justify="space-between">
          <HStack spacing={2}>
            <Text
              fontSize="xs"
              fontWeight="bold"
              color="blue.600"
              bg="blue.50"
              px={2}
              py={1}
              borderRadius="full"
            >
              {resource.discipline}
            </Text>
            <Text
              fontSize="xs"
              fontWeight="semibold"
              color={`${statusColor[resource.collaborationStatus as keyof typeof statusColor]}.600`}
              bg={`${statusColor[resource.collaborationStatus as keyof typeof statusColor]}.50`}
              px={2}
              py={1}
              borderRadius="full"
            >
              {resource.collaborationStatus === "SEEKING"
                ? "Seeking"
                : resource.collaborationStatus === "PROVEN"
                ? "Proven"
                : "Materials"}
            </Text>
          </HStack>
        </HStack>

        {/* Title */}
        <Heading size="sm" lineHeight="tight">
          {resource.title}
        </Heading>

        {/* Author info */}
        <Text fontSize="xs" color="gray.600">
          {resource.author} • {resource.timeSaved || 2} hrs/week saved
        </Text>

        {/* Summary */}
        <Text fontSize="sm" color="gray.700" lineHeight="1.4">
          {resource.quickSummary}
        </Text>

        {/* Tools */}
        <HStack spacing={2} fontSize="xs" flexWrap="wrap">
          {resource.tools.map((tool) => (
            <Text key={tool} bg="gray.100" px={2} py={1} borderRadius="full">
              {tool}
            </Text>
          ))}
        </HStack>

        {/* Stats */}
        <HStack
          spacing={3}
          fontSize="sm"
          width="full"
          justify="space-between"
          pt={2}
          borderTop="1px"
          borderColor="gray.100"
        >
          <HStack spacing={1}>
            <Text color="gray.600">👍 {resource.views}</Text>
            <Text color="gray.600">✓ {resource.tried}</Text>
          </HStack>
          <HStack spacing={1}>
            <Button size="xs" variant="ghost" onClick={(e) => e.stopPropagation()}>
              Similar
            </Button>
            <Button size="xs" variant="ghost" onClick={(e) => e.stopPropagation()}>
              Save
            </Button>
          </HStack>
        </HStack>
      </VStack>
    </Box>
  );
}

export default function ResourcesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [filters, setFilters] = useState<FilterState>({
    disciplines: searchParams.get("discipline")
      ? [searchParams.get("discipline")!]
      : [],
    tools: [],
    collaborationStatus: searchParams.get("collaboration_status")
      ? [searchParams.get("collaboration_status")!]
      : [],
    minTimeSaved: 0,
    sortBy: "newest",
  });

  const { data: resources = [], isLoading } = useResources({
    limit: 100,
  });

  // Filter resources based on current filter state
  const filteredResources = useMemo(() => {
    let result = mockResources;

    // Apply search
    if (search) {
      const query = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(query) ||
          r.quickSummary.toLowerCase().includes(query) ||
          r.author.toLowerCase().includes(query)
      );
    }

    // Apply discipline filter
    if (filters.disciplines.length > 0) {
      result = result.filter((r) => filters.disciplines.includes(r.discipline));
    }

    // Apply tools filter
    if (filters.tools.length > 0) {
      result = result.filter((r) =>
        r.tools.some((tool) => filters.tools.includes(tool))
      );
    }

    // Apply collaboration status filter
    if (filters.collaborationStatus.length > 0) {
      result = result.filter((r) =>
        filters.collaborationStatus.includes(r.collaborationStatus)
      );
    }

    // Apply quick wins filter
    if (filters.minTimeSaved > 0) {
      result = result.filter((r) => (r.timeSaved || 0) >= filters.minTimeSaved);
    }

    // Apply sorting
    if (filters.sortBy === "popular") {
      result.sort((a, b) => b.views - a.views);
    } else if (filters.sortBy === "most_tried") {
      result.sort((a, b) => b.tried - a.tried);
    }
    // "newest" is default (no additional sorting needed)

    return result;
  }, [search, filters]);

  return (
    <Layout>
      <VStack align="stretch" spacing={6}>
        {/* Header */}
        <HStack justify="space-between" align="center">
          <VStack align="flex-start" spacing={1}>
            <Heading size="lg">Browse Ideas</Heading>
            <Text color="gray.600" fontSize="sm">
              Discover AI use cases from colleagues across the school
            </Text>
          </VStack>
          <Button
            colorScheme="blue"
            onClick={() => navigate("/resources/new")}
          >
            Share Your Idea
          </Button>
        </HStack>

        {/* Search Bar */}
        <InputGroup size="lg">
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Search ideas, tools, or disciplines..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            borderRadius="md"
          />
        </InputGroup>

        {/* Main Content Grid */}
        <Grid
          templateColumns={{ base: "1fr", lg: "250px 1fr" }}
          gap={6}
          align="start"
        >
          {/* Sidebar */}
          <GridItem>
            <FilterSidebar
              onFiltersChange={setFilters}
              initialFilters={filters}
            />
          </GridItem>

          {/* Results */}
          <GridItem>
            {isLoading ? (
              <Center py={12}>
                <Spinner />
              </Center>
            ) : filteredResources.length === 0 ? (
              <Box bg="white" p={12} borderRadius="lg" textAlign="center">
                <Text color="gray.600">
                  No ideas found. Try adjusting your filters.
                </Text>
              </Box>
            ) : (
              <VStack align="stretch" spacing={4}>
                <Text color="gray.600" fontSize="sm">
                  Showing {filteredResources.length} idea
                  {filteredResources.length !== 1 ? "s" : ""}
                </Text>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  {filteredResources.map((resource) => (
                    <BrowseResourceCard
                      key={resource.id}
                      resource={resource}
                    />
                  ))}
                </SimpleGrid>
              </VStack>
            )}
          </GridItem>
        </Grid>
      </VStack>
    </Layout>
  );
}
