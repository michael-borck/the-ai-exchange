/**
 * Homepage - Landing page with discovery features
 */

import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Grid,
  GridItem,
  Heading,
  HStack,
  Input,
  SimpleGrid,
  Text,
  VStack,
  InputGroup,
  InputLeftElement,
  Icon,
  Spinner,
  Center,
} from "@chakra-ui/react";
import { SearchIcon, ArrowForwardIcon } from "@chakra-ui/icons";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useResources } from "@/hooks/useResources";
import { useMemo } from "react";

interface DisciplineCard {
  name: string;
  count: number;
  icon?: string;
}

const disciplines: DisciplineCard[] = [
  { name: "Marketing", count: 18 },
  { name: "Management", count: 15 },
  { name: "HR", count: 8 },
  { name: "Analytics", count: 12 },
  { name: "Finance", count: 9 },
  { name: "Economics", count: 7 },
  { name: "Tourism", count: 6 },
  { name: "Entrepreneurship", count: 11 },
];

interface ResourcePreview {
  id: string;
  title: string;
  author: string;
  discipline: string;
  tools: string[];
  quickSummary: string;
  timeSaved?: number;
  views: number;
  tried: number;
}


function ResourceCard({ resource, isLoggedIn }: { resource: ResourcePreview; isLoggedIn: boolean }) {
  const navigate = useNavigate();
  const displayAuthor = isLoggedIn ? resource.author : "Faculty Member";

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
      <VStack align="flex-start" spacing={2}>
        <HStack spacing={2} width="full" justify="space-between">
          <HStack spacing={1}>
            <Text fontSize="xs" fontWeight="bold" color="blue.600" bg="blue.50" px={2} py={1} borderRadius="full">
              {resource.discipline}
            </Text>
          </HStack>
        </HStack>

        <Heading size="sm" lineHeight="tight">
          {resource.title}
        </Heading>

        <Text fontSize="xs" color="gray.600">
          {displayAuthor} • {resource.timeSaved || 2} hrs/week saved
        </Text>

        <Text fontSize="sm" color="gray.700" lineHeight="1.4">
          {resource.quickSummary}
        </Text>

        <HStack spacing={2} fontSize="xs">
          {resource.tools.map((tool) => (
            <Text key={tool} bg="gray.100" px={2} py={1} borderRadius="full">
              {tool}
            </Text>
          ))}
        </HStack>

        <HStack spacing={3} fontSize="sm" width="full" justify="space-between" pt={2} borderTop="1px" borderColor="gray.100">
          <HStack spacing={1}>
            <Text color="gray.600">👍 {resource.views}</Text>
            <Text color="gray.600">✓ {resource.tried}</Text>
          </HStack>
          <HStack spacing={1}>
            <Button size="xs" variant="ghost">
              Similar
            </Button>
            <Button size="xs" variant="ghost">
              Save
            </Button>
          </HStack>
        </HStack>
      </VStack>
    </Box>
  );
}

function DisciplineGridItem({ discipline }: { discipline: DisciplineCard }) {
  const navigate = useNavigate();

  return (
    <Box
      bg="white"
      border="1px"
      borderColor="gray.200"
      borderRadius="md"
      p={4}
      textAlign="center"
      cursor="pointer"
      _hover={{ bg: "gray.50", borderColor: "blue.400" }}
      transition="all 0.2s"
      onClick={() => navigate(`/resources?discipline=${discipline.name}`)}
    >
      <Heading size="md">{discipline.name}</Heading>
      <Text color="gray.600" fontSize="sm">
        {discipline.count} ideas
      </Text>
    </Box>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isLoggedIn = !!user;

  // Fetch all resources
  const { data: allResources = [], isLoading } = useResources({});

  // Get recent contributions (newest first)
  const recentResources = useMemo(() => {
    return [...allResources]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3)
      .map(resource => ({
        id: resource.id,
        title: resource.title,
        author: resource.user?.full_name || "Faculty Member",
        discipline: resource.discipline,
        tools: resource.tools_used || [],
        quickSummary: resource.quick_summary || resource.content_text?.substring(0, 100),
        timeSaved: resource.time_saved_value,
        views: resource.analytics?.view_count || 0,
        tried: resource.analytics?.tried_count || 0,
      }));
  }, [allResources]);

  // Get trending this week (most viewed)
  const trendingResources = useMemo(() => {
    return [...allResources]
      .sort((a, b) => (b.analytics?.view_count || 0) - (a.analytics?.view_count || 0))
      .slice(0, 3)
      .map(resource => ({
        id: resource.id,
        title: resource.title,
        author: resource.user?.full_name || "Faculty Member",
        discipline: resource.discipline,
        tools: resource.tools_used || [],
        quickSummary: resource.quick_summary || resource.content_text?.substring(0, 100),
        timeSaved: resource.time_saved_value,
        views: resource.analytics?.view_count || 0,
        tried: resource.analytics?.tried_count || 0,
      }));
  }, [allResources]);

  return (
    <Layout>
      <VStack spacing={12} align="stretch">
        {/* Hero Section */}
        <VStack spacing={6} align="center" textAlign="center" pt={8}>
          <VStack spacing={3}>
            <Heading size="2xl" fontWeight="bold" lineHeight="tight">
              Discover How Colleagues Use AI Across Our School
            </Heading>
            <Text color="gray.600" fontSize="lg" maxW="lg">
              Share prompts, methods, and workflows • Find collaborators • Save time together
            </Text>
          </VStack>

          <InputGroup maxW="md">
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search ideas, tools, or disciplines..."
              size="lg"
              borderRadius="md"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const query = e.currentTarget.value;
                  navigate(`/resources?search=${encodeURIComponent(query)}`);
                }
              }}
            />
          </InputGroup>

          <HStack spacing={4} pt={2}>
            <Button
              size="lg"
              colorScheme="blue"
              onClick={() => navigate("/resources/new")}
            >
              Share Your Idea
            </Button>
            <Button
              size="lg"
              variant="outline"
              colorScheme="blue"
              onClick={() => navigate("/resources")}
            >
              Browse All
            </Button>
            <Button
              size="lg"
              variant="ghost"
              colorScheme="blue"
              rightIcon={<ArrowForwardIcon />}
              onClick={() => navigate("/resources?collaboration_status=SEEKING")}
            >
              Find Collaborators
            </Button>
          </HStack>
        </VStack>

        {/* Discipline Grid */}
        <VStack align="stretch" spacing={4}>
          <Heading size="lg">Explore by Discipline</Heading>
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
            {disciplines.map((d) => (
              <DisciplineGridItem key={d.name} discipline={d} />
            ))}
          </SimpleGrid>
        </VStack>

        {/* Recent Contributions */}
        <VStack align="stretch" spacing={4}>
          <HStack justify="space-between">
            <Heading size="lg">Recent Contributions</Heading>
            <Button variant="link" colorScheme="blue" onClick={() => navigate("/resources")}>
              View All →
            </Button>
          </HStack>
          {isLoading ? (
            <Center py={12}>
              <Spinner />
            </Center>
          ) : recentResources.length === 0 ? (
            <Box bg="gray.50" p={8} borderRadius="md" textAlign="center">
              <Text color="gray.600">No resources shared yet. Be the first to share an idea!</Text>
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              {recentResources.map((r) => (
                <ResourceCard key={r.id} resource={r} isLoggedIn={isLoggedIn} />
              ))}
            </SimpleGrid>
          )}
        </VStack>

        {/* Trending This Week */}
        <VStack align="stretch" spacing={4} pb={8}>
          <HStack justify="space-between">
            <Heading size="lg">Trending This Week</Heading>
            <Button variant="link" colorScheme="blue" onClick={() => navigate("/resources?sort=popular")}>
              View All →
            </Button>
          </HStack>
          {isLoading ? (
            <Center py={12}>
              <Spinner />
            </Center>
          ) : trendingResources.length === 0 ? (
            <Box bg="gray.50" p={8} borderRadius="md" textAlign="center">
              <Text color="gray.600">No resources available yet.</Text>
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              {trendingResources.map((r) => (
                <ResourceCard key={r.id} resource={r} isLoggedIn={isLoggedIn} />
              ))}
            </SimpleGrid>
          )}
        </VStack>
      </VStack>
    </Layout>
  );
}
