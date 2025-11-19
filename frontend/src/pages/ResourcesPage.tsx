/**
 * Resources Listing Page - Browse Ideas
 */

import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
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


function BrowseResourceCard({ resource, isLoggedIn }: { resource: ResourceCard; isLoggedIn: boolean }) {
  const navigate = useNavigate();
  const displayAuthor = isLoggedIn ? resource.author : "Faculty Member";

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
          {displayAuthor} • {resource.timeSaved || 2} hrs/week saved
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
  const { user } = useAuth();
  const isLoggedIn = !!user;
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

  // Transform API resources to card format
  const mappedResources: ResourceCard[] = useMemo(() => {
    return resources.map(resource => ({
      id: resource.id,
      title: resource.title,
      author: resource.user?.full_name || "Faculty Member",
      discipline: resource.discipline,
      tools: resource.tools_used || [],
      quickSummary: resource.quick_summary || resource.content_text?.substring(0, 100),
      timeSaved: resource.time_saved_value,
      views: resource.analytics?.view_count || 0,
      tried: resource.analytics?.tried_count || 0,
      collaborationStatus: resource.collaboration_status,
    }));
  }, [resources]);

  // Filter resources based on current filter state
  const filteredResources = useMemo(() => {
    let result = mappedResources;

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
  }, [search, filters, mappedResources]);

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
                      isLoggedIn={isLoggedIn}
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
