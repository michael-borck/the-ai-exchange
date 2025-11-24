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
  SimpleGrid,
} from "@chakra-ui/react";
import { SearchIcon, DownloadIcon } from "@chakra-ui/icons";
import { useResources } from "@/hooks/useResources";
import { ResourceCard } from "@/components/ResourceCard";
import { FilterSidebar, FilterState } from "@/components/FilterSidebar";
import { flattenTools } from "@/lib/tools";
import { downloadCSV, getExportFilename } from "@/lib/csvExport";
import { ProfessionalRole } from "@/types/index";

interface ResourceCardData {
  id: string;
  title: string;
  author: string;
  area?: string;
  tools: string[];
  quickSummary: string;
  timeSaved?: number;
  views: number;
  tried: number;
  saves?: number;
  created_at: string;
  user_id: string;
}

export default function ResourcesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isLoggedIn = !!user;
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [filters, setFilters] = useState<FilterState>({
    disciplines: searchParams.get("discipline")
      ? [searchParams.get("discipline")!]
      : [],
    tools: [],
    professionalRoles: [],
    minTimeSaved: 0,
    sortBy: "newest",
  });

  // Update URL params when search changes
  const handleSearchChange = (value: string) => {
    setSearch(value);
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set("search", value);
    } else {
      newParams.delete("search");
    }
    setSearchParams(newParams);
  };

  // Fetch ALL resources once - this will be shared with FilterSidebar
  // No filters applied here - we filter client-side
  const { data: allResources = [], isLoading } = useResources({ limit: 100 });

  // Apply filters and search client-side for instant UI updates
  // Only the filter sidebar & search box filtering is instant
  const filteredResources = useMemo(() => {
    return allResources.filter(resource => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch =
          resource.title.toLowerCase().includes(searchLower) ||
          resource.content_text?.toLowerCase().includes(searchLower) ||
          resource.discipline?.toLowerCase().includes(searchLower) ||
          // Only allow logged-in users to search by author name (privacy consideration)
          (isLoggedIn && resource.author_name?.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      // Discipline filter
      if (filters.disciplines.length > 0 && resource.discipline && !filters.disciplines.includes(resource.discipline)) {
        return false;
      }

      // Tool filter
      if (filters.tools.length > 0) {
        const hasMatchingTool = filters.tools.some(tool =>
          resource.tools_used && Object.keys(resource.tools_used).includes(tool)
        );
        if (!hasMatchingTool) return false;
      }

      // Professional role filter
      if (filters.professionalRoles && filters.professionalRoles.length > 0) {
        if (!resource.user?.professional_role || !filters.professionalRoles.includes(resource.user.professional_role)) {
          return false;
        }
      }

      // Time saved filter
      if (filters.minTimeSaved > 0 && (resource.time_saved_value ?? 0) < filters.minTimeSaved) {
        return false;
      }

      return true;
    });
  }, [allResources, search, filters]);

  // Sort resources
  const sortedResources = useMemo(() => {
    const sorted = [...filteredResources];
    if (filters.sortBy === "popular") {
      sorted.sort((a, b) => (b.analytics?.helpful_count ?? 0) - (a.analytics?.helpful_count ?? 0));
    } else if (filters.sortBy === "most_tried") {
      sorted.sort((a, b) => (b.analytics?.tried_count ?? 0) - (a.analytics?.tried_count ?? 0));
    } else {
      // newest (default)
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return sorted;
  }, [filteredResources, filters.sortBy]);

  // Transform API resources to card format
  const mappedResources: ResourceCardData[] = useMemo(() => {
    return sortedResources.map(resource => ({
      id: resource.id,
      title: resource.title,
      author: resource.author_name || "Faculty Member",
      area: resource.discipline,
      tools: flattenTools(resource.tools_used),
      quickSummary: resource.quick_summary || resource.content_text?.substring(0, 100),
      timeSaved: resource.time_saved_value,
      views: resource.analytics?.view_count || 0,
      tried: resource.analytics?.tried_count || 0,
      saves: resource.analytics?.save_count || 0,
      created_at: resource.created_at,
      user_id: resource.user_id,
    }));
  }, [sortedResources]);

  // Handle export of filtered results
  const handleExportFiltered = () => {
    downloadCSV(sortedResources, getExportFilename());
  };

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
          <HStack spacing={3}>
            {isLoggedIn && (
              <Button
                leftIcon={<DownloadIcon />}
                variant="outline"
                colorScheme="blue"
                onClick={handleExportFiltered}
                isDisabled={mappedResources.length === 0}
              >
                Export
              </Button>
            )}
            <Button
              colorScheme="blue"
              onClick={() => navigate("/resources/new")}
            >
              Share Your Idea
            </Button>
          </HStack>
        </HStack>

        {/* Search Bar */}
        <InputGroup size="lg">
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Search ideas, tools, area, or faculty"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            borderRadius="md"
          />
        </InputGroup>

        {/* Main Content Grid */}
        <Grid
          templateColumns={{ base: "1fr", lg: "250px 1fr" }}
          gap={6}
          alignItems="start"
        >
          {/* Sidebar */}
          <GridItem>
            <FilterSidebar
              onFiltersChange={setFilters}
              initialFilters={filters}
              resources={allResources}
            />
          </GridItem>

          {/* Results */}
          <GridItem>
            {isLoading ? (
              <Center py={12}>
                <Spinner />
              </Center>
            ) : mappedResources.length === 0 ? (
              <Box bg="white" p={12} borderRadius="lg" textAlign="center">
                <Text color="gray.600">
                  No ideas found. Try adjusting your filters.
                </Text>
              </Box>
            ) : (
              <VStack align="stretch" spacing={4}>
                <Text color="gray.600" fontSize="sm">
                  Showing {mappedResources.length} idea
                  {mappedResources.length !== 1 ? "s" : ""}
                </Text>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  {mappedResources.map((resource) => (
                    <ResourceCard
                      key={resource.id}
                      id={resource.id}
                      title={resource.title}
                      author={resource.author}
                      area={resource.area}
                      tools={resource.tools}
                      quickSummary={resource.quickSummary}
                      timeSaved={resource.timeSaved}
                      views={resource.views}
                      tried={resource.tried}
                      saves={resource.saves}
                      created_at={resource.created_at}
                      variant="browse"
                      user_id={resource.user_id}
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
