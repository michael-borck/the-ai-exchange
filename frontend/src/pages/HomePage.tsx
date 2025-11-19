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
} from "@chakra-ui/react";
import { SearchIcon, ArrowForwardIcon } from "@chakra-ui/icons";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";

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

// Mock recent contributions for MVP (will be fetched from API)
const recentContributions: ResourcePreview[] = [
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
  },
];

const trendingThisWeek: ResourcePreview[] = [
  {
    id: "4",
    title: "Video Assessment Grading",
    author: "Dr. Lee",
    discipline: "HR",
    tools: ["ChatGPT", "Canvas LMS"],
    quickSummary: "AI-assisted feedback generation for recorded presentations...",
    timeSaved: 2.5,
    views: 412,
    tried: 45,
  },
  {
    id: "5",
    title: "Student Peer Review Templates",
    author: "Dr. Kumar",
    discipline: "Finance",
    tools: ["Claude"],
    quickSummary: "Structured templates for peer assessment with AI guidance...",
    timeSaved: 1.5,
    views: 325,
    tried: 38,
  },
  {
    id: "6",
    title: "Discussion Prompt Generator",
    author: "Prof. Chen",
    discipline: "Management",
    tools: ["GPT-4"],
    quickSummary: "Generate thought-provoking questions for class discussions...",
    timeSaved: 1,
    views: 289,
    tried: 31,
  },
];

function ResourceCard({ resource, isLoggedIn }: { resource: ResourcePreview; isLoggedIn: boolean }) {
  const displayAuthor = isLoggedIn ? resource.author : "Faculty Member";

  return (
    <Box
      bg="white"
      border="1px"
      borderColor="gray.200"
      borderRadius="md"
      p={4}
      _hover={{ boxShadow: "md", transform: "translateY(-2px)" }}
      transition="all 0.2s"
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
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            {recentContributions.map((r) => (
              <ResourceCard key={r.id} resource={r} isLoggedIn={isLoggedIn} />
            ))}
          </SimpleGrid>
        </VStack>

        {/* Trending This Week */}
        <VStack align="stretch" spacing={4} pb={8}>
          <HStack justify="space-between">
            <Heading size="lg">Trending This Week</Heading>
            <Button variant="link" colorScheme="blue" onClick={() => navigate("/resources?sort=popular")}>
              View All →
            </Button>
          </HStack>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            {trendingThisWeek.map((r) => (
              <ResourceCard key={r.id} resource={r} isLoggedIn={isLoggedIn} />
            ))}
          </SimpleGrid>
        </VStack>
      </VStack>
    </Layout>
  );
}
