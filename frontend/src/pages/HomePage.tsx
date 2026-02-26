/**
 * Homepage - Landing page with discovery features
 */

import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Heading,
  HStack,
  Input,
  SimpleGrid,
  Text,
  VStack,
  InputGroup,
  InputLeftElement,
  Spinner,
  Center,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useResources } from "@/hooks/useResources";
import { ResourceCard } from "@/components/ResourceCard";
import { flattenTools } from "@/lib/tools";
import { useMemo } from "react";

interface DisciplineCard {
  name: string;
  count: number;
  icon?: string;
}

function DisciplineGridItem({ specialty }: { specialty: DisciplineCard }) {
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
      onClick={() => navigate(`/resources?specialty=${specialty.name}`)}
    >
      <Heading size="md">{specialty.name}</Heading>
      <Text color="gray.600" fontSize="sm">
        {specialty.count} ideas
      </Text>
    </Box>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  useAuth();

  // Fetch all resources
  const { data: allResources = [], isLoading } = useResources({});

  // Calculate disciplines dynamically from resources
  const disciplines = useMemo(() => {
    const disciplineMap = new Map<string, number>();

    allResources.forEach(resource => {
      if (resource.specialty) {
        disciplineMap.set(
          resource.specialty,
          (disciplineMap.get(resource.specialty) || 0) + 1
        );
      }
    });

    // Convert to array and sort by count (descending), limit to top 8
    return Array.from(disciplineMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [allResources]);

  // Get recent contributions (newest first)
  const recentResources = useMemo(() => {
    return [...allResources]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3)
      .map(resource => ({
        id: resource.id,
        title: resource.title,
        author: resource.author_name || "Faculty Member",
        specialty: resource.specialty,
        tools: flattenTools(resource.tools_used),
        quickSummary: resource.quick_summary || resource.content_text?.substring(0, 100),
        timeSaved: resource.time_saved_value,
        views: resource.analytics?.view_count || 0,
        tried: resource.analytics?.tried_count || 0,
        saves: resource.analytics?.save_count || 0,
        created_at: resource.created_at,
        user_id: resource.user_id,
      }));
  }, [allResources]);

  // Get most popular resources (most viewed)
  const mostPopularResources = useMemo(() => {
    return [...allResources]
      .sort((a, b) => (b.analytics?.view_count || 0) - (a.analytics?.view_count || 0))
      .slice(0, 3)
      .map(resource => ({
        id: resource.id,
        title: resource.title,
        author: resource.author_name || "Faculty Member",
        specialty: resource.specialty,
        tools: flattenTools(resource.tools_used),
        quickSummary: resource.quick_summary || resource.content_text?.substring(0, 100),
        timeSaved: resource.time_saved_value,
        views: resource.analytics?.view_count || 0,
        tried: resource.analytics?.tried_count || 0,
        saves: resource.analytics?.save_count || 0,
        created_at: resource.created_at,
        user_id: resource.user_id,
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
              Share use cases, research insights, and practical applications • Find collaborators • Build together
            </Text>
          </VStack>

          <InputGroup maxW="md">
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search ideas, tools, area, or faculty"
              size="lg"
              borderRadius="md"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const query = e.currentTarget.value;
                  navigate(`/resources?search=${encodeURIComponent(query)}`);
                  e.currentTarget.value = "";
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

          </HStack>
        </VStack>

        {/* Area Grid */}
        <VStack align="stretch" spacing={4}>
          <Heading size="lg">Explore by Area</Heading>
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
            {disciplines.map((d) => (
              <DisciplineGridItem key={d.name} specialty={d} />
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
                <ResourceCard
                  key={r.id}
                  id={r.id}
                  title={r.title}
                  author={r.author}
                  area={r.specialty}
                  tools={r.tools}
                  quickSummary={r.quickSummary}
                  timeSaved={r.timeSaved}
                  views={r.views}
                  tried={r.tried}
                  saves={r.saves}
                  created_at={r.created_at}
                  user_id={r.user_id}
                />
              ))}
            </SimpleGrid>
          )}
        </VStack>

        {/* Most Popular */}
        <VStack align="stretch" spacing={4} pb={8}>
          <HStack justify="space-between">
            <Heading size="lg">Most Popular</Heading>
            <Button variant="link" colorScheme="blue" onClick={() => navigate("/resources?sort=popular")}>
              View All →
            </Button>
          </HStack>
          {isLoading ? (
            <Center py={12}>
              <Spinner />
            </Center>
          ) : mostPopularResources.length === 0 ? (
            <Box bg="gray.50" p={8} borderRadius="md" textAlign="center">
              <Text color="gray.600">No resources available yet.</Text>
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              {mostPopularResources.map((r) => (
                <ResourceCard
                  key={r.id}
                  id={r.id}
                  title={r.title}
                  author={r.author}
                  area={r.specialty}
                  tools={r.tools}
                  quickSummary={r.quickSummary}
                  timeSaved={r.timeSaved}
                  views={r.views}
                  tried={r.tried}
                  saves={r.saves}
                  created_at={r.created_at}
                  user_id={r.user_id}
                />
              ))}
            </SimpleGrid>
          )}
        </VStack>
      </VStack>
    </Layout>
  );
}
