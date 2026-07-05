/**
 * Homepage - Anonymous visitors see a marketing landing page (no Curtin IP exposed).
 * Authenticated users see the discovery dashboard with recent and popular ideas.
 */

import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
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
import { ProfileNudge } from "@/components/ProfileNudge";
import { BRAND_GRADIENT } from "@/theme";
import { flattenTools } from "@/lib/tools";
import { Resource } from "@/types/index";
import { useMemo } from "react";

// Pure transform — kept at module scope so it's a stable reference and
// doesn't need to be a useMemo dependency (avoids react-hooks/exhaustive-deps).
const mapResource = (resource: Resource) => ({
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
});

/** Heading fragment rendered with the brand gradient. */
function GradientText({ children }: { children: React.ReactNode }) {
  return (
    <Text as="span" bgGradient={BRAND_GRADIENT} bgClip="text">
      {children}
    </Text>
  );
}

interface DisciplineCard {
  name: string;
  count: number;
}

function DisciplineGridItem({ specialty }: { specialty: DisciplineCard }) {
  const navigate = useNavigate();

  return (
    <Box
      layerStyle="cardHover"
      p={5}
      textAlign="center"
      cursor="pointer"
      onClick={() => navigate(`/resources?specialty=${specialty.name}`)}
    >
      <Heading size="sm" mb={1}>
        {specialty.name}
      </Heading>
      <Text color="whiteAlpha.500" fontSize="sm">
        {specialty.count} {specialty.count === 1 ? "idea" : "ideas"}
      </Text>
    </Box>
  );
}

function AnonLanding() {
  const navigate = useNavigate();

  const features = [
    {
      glyph: "◆",
      title: "Real use cases from colleagues",
      body: "See how Marketing and Management staff are actually using AI in teaching, research, and admin work.",
    },
    {
      glyph: "❋",
      title: "Prompts you can adapt",
      body: "Tested prompts, expected time saved, and what to watch out for — shared by people you work with.",
    },
    {
      glyph: "✦",
      title: "Find collaborators",
      body: "Discover who's tried what, ask follow-up questions, and build on each other's ideas.",
    },
  ];

  return (
    <Layout>
      <VStack spacing={20} align="stretch" pb={12}>
        {/* Hero */}
        <VStack spacing={8} align="center" textAlign="center" pt={{ base: 10, md: 20 }}>
          <VStack spacing={5} maxW="3xl">
            <Text textStyle="eyebrow" color="brand.300">
              School of Marketing and Management
            </Text>
            <Heading size="2xl" fontWeight="700" lineHeight="1.1">
              How your colleagues are <GradientText>actually using AI</GradientText>
            </Heading>
            <Text color="whiteAlpha.700" fontSize="xl" lineHeight="1.6" maxW="2xl">
              A private space for the School of Marketing and Management to share real AI use cases,
              prompts, and lessons learned. Curtin staff and approved collaborators only.
            </Text>
          </VStack>

          <HStack spacing={4} pt={2}>
            <Button size="lg" colorScheme="brand" onClick={() => navigate("/register")}>
              Register with your Curtin email
            </Button>
            <Button
              size="lg"
              variant="outline"
              colorScheme="brand"
              onClick={() => navigate("/login")}
            >
              Sign in
            </Button>
          </HStack>

          <Text fontSize="sm" color="whiteAlpha.500">
            Browsing ideas requires a Curtin (or whitelisted) account.
          </Text>
        </VStack>

        {/* What's inside */}
        <VStack align="stretch" spacing={8}>
          <Heading size="lg" textAlign="center">
            What you'll find inside
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5}>
            {features.map((f) => (
              <Box key={f.title} layerStyle="cardHover" p={6}>
                <VStack align="flex-start" spacing={4}>
                  <Flex
                    w={10}
                    h={10}
                    align="center"
                    justify="center"
                    borderRadius="lg"
                    bg="whiteAlpha.100"
                    color="brand.300"
                    fontSize="lg"
                  >
                    {f.glyph}
                  </Flex>
                  <Heading size="sm">{f.title}</Heading>
                  <Text fontSize="sm" color="whiteAlpha.700" lineHeight="1.6">
                    {f.body}
                  </Text>
                </VStack>
              </Box>
            ))}
          </SimpleGrid>
        </VStack>

        {/* How it works */}
        <VStack align="stretch" spacing={8}>
          <Heading size="lg" textAlign="center">
            How it works
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            {[
              {
                step: "1",
                title: "Register",
                body: "Use your @curtin.edu.au email — access is automatic.",
              },
              {
                step: "2",
                title: "Browse",
                body: "See real use cases, prompts, and time-saved estimates.",
              },
              { step: "3", title: "Share", body: "Post your own — anonymously if you'd rather." },
            ].map((s) => (
              <VStack key={s.step} spacing={4} p={4}>
                <Flex
                  w={12}
                  h={12}
                  align="center"
                  justify="center"
                  borderRadius="full"
                  bgGradient={BRAND_GRADIENT}
                  fontFamily="heading"
                  fontWeight="700"
                  fontSize="xl"
                  color="white"
                >
                  {s.step}
                </Flex>
                <Heading size="sm">{s.title}</Heading>
                <Text fontSize="sm" color="whiteAlpha.700" textAlign="center">
                  {s.body}
                </Text>
              </VStack>
            ))}
          </SimpleGrid>
        </VStack>

        {/* Final CTA */}
        <Box layerStyle="card" p={{ base: 8, md: 12 }} textAlign="center">
          <VStack spacing={4}>
            <Heading size="md">Ready to see what your colleagues are building?</Heading>
            <Button size="lg" colorScheme="brand" onClick={() => navigate("/register")}>
              Get started
            </Button>
            <Text fontSize="sm" color="whiteAlpha.500">
              Already have an account?{" "}
              <Button variant="link" colorScheme="brand" onClick={() => navigate("/login")}>
                Sign in
              </Button>
            </Text>
          </VStack>
        </Box>
      </VStack>
    </Layout>
  );
}

function AuthedHome() {
  const navigate = useNavigate();
  const { data: allResources = [], isLoading } = useResources({});

  const disciplines = useMemo(() => {
    const disciplineMap = new Map<string, number>();
    allResources.forEach((resource) => {
      if (resource.specialty) {
        disciplineMap.set(resource.specialty, (disciplineMap.get(resource.specialty) || 0) + 1);
      }
    });
    return Array.from(disciplineMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [allResources]);

  const recentResources = useMemo(
    () =>
      [...allResources]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3)
        .map(mapResource),
    [allResources]
  );

  const mostPopularResources = useMemo(
    () =>
      [...allResources]
        .sort((a, b) => (b.analytics?.view_count || 0) - (a.analytics?.view_count || 0))
        .slice(0, 3)
        .map(mapResource),
    [allResources]
  );

  return (
    <Layout>
      <VStack spacing={14} align="stretch">
        <ProfileNudge />

        {/* Hero Section */}
        <VStack spacing={7} align="center" textAlign="center" pt={8}>
          <VStack spacing={4}>
            <Heading size="2xl" fontWeight="700" lineHeight="1.15" maxW="2xl">
              Discover how colleagues use <GradientText>AI across our school</GradientText>
            </Heading>
            <Text color="whiteAlpha.600" fontSize="lg" maxW="xl">
              Share use cases, research insights, and practical applications. Find collaborators.
              Build together.
            </Text>
          </VStack>

          <InputGroup maxW="lg">
            <InputLeftElement pointerEvents="none" h="full">
              <Icon as={SearchIcon} color="whiteAlpha.400" />
            </InputLeftElement>
            <Input
              placeholder="Search ideas, tools, area, or faculty"
              size="lg"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const query = e.currentTarget.value;
                  navigate(`/resources?search=${encodeURIComponent(query)}`);
                  e.currentTarget.value = "";
                }
              }}
            />
          </InputGroup>

          <HStack spacing={4}>
            <Button size="lg" colorScheme="brand" onClick={() => navigate("/resources/new")}>
              Share Your Idea
            </Button>
            <Button
              size="lg"
              variant="outline"
              colorScheme="brand"
              onClick={() => navigate("/resources")}
            >
              Browse All
            </Button>
          </HStack>
        </VStack>

        {/* Area Grid */}
        <VStack align="stretch" spacing={5}>
          <Heading size="lg">Explore by Area</Heading>
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
            {disciplines.map((d) => (
              <DisciplineGridItem key={d.name} specialty={d} />
            ))}
          </SimpleGrid>
        </VStack>

        {/* Recent Contributions */}
        <VStack align="stretch" spacing={5}>
          <HStack justify="space-between">
            <Heading size="lg">Recent Contributions</Heading>
            <Button variant="link" colorScheme="brand" onClick={() => navigate("/resources")}>
              View All →
            </Button>
          </HStack>
          {isLoading ? (
            <Center py={12}>
              <Spinner />
            </Center>
          ) : recentResources.length === 0 ? (
            <Box layerStyle="card" p={8} textAlign="center">
              <Text color="whiteAlpha.600">
                No resources shared yet. Be the first to share an idea!
              </Text>
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
        <VStack align="stretch" spacing={5} pb={8}>
          <HStack justify="space-between">
            <Heading size="lg">Most Popular</Heading>
            <Button
              variant="link"
              colorScheme="brand"
              onClick={() => navigate("/resources?sort=popular")}
            >
              View All →
            </Button>
          </HStack>
          {isLoading ? (
            <Center py={12}>
              <Spinner />
            </Center>
          ) : mostPopularResources.length === 0 ? (
            <Box layerStyle="card" p={8} textAlign="center">
              <Text color="whiteAlpha.600">No resources available yet.</Text>
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

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Layout>
        <Center py={20}>
          <Spinner size="lg" />
        </Center>
      </Layout>
    );
  }

  return isAuthenticated ? <AuthedHome /> : <AnonLanding />;
}
