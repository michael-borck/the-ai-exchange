/**
 * Dashboard Page
 */

import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import {
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Box,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
} from "@chakra-ui/react";
import { useAuth } from "@/hooks/useAuth";
import { useResources } from "@/hooks/useResources";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: resources = [], isLoading } = useResources({
    limit: 5,
  });

  const requestCount = resources.filter((r) => r.type === "REQUEST").length;
  const useCaseCount = resources.filter((r) => r.type === "USE_CASE").length;

  return (
    <Layout>
      <VStack align="stretch" spacing={8}>
        {/* Welcome Section */}
        <Box>
          <Heading size="lg" mb={2}>
            Welcome, {user?.full_name}!
          </Heading>
          <Text color="gray.600">
            Discover AI use cases, share your expertise, and grow together
          </Text>
        </Box>

        {/* Quick Stats */}
        <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={6}>
          <GridItem>
            <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
              <Stat>
                <StatLabel>Active Requests</StatLabel>
                <StatNumber>{requestCount}</StatNumber>
              </Stat>
            </Box>
          </GridItem>
          <GridItem>
            <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
              <Stat>
                <StatLabel>Use Cases Shared</StatLabel>
                <StatNumber>{useCaseCount}</StatNumber>
              </Stat>
            </Box>
          </GridItem>
          <GridItem>
            <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
              <Stat>
                <StatLabel>Member Since</StatLabel>
                <StatNumber fontSize="md">
                  {new Date(user?.created_at || "").toLocaleDateString()}
                </StatNumber>
              </Stat>
            </Box>
          </GridItem>
        </Grid>

        {/* Call to Action */}
        <Box bg="white" p={8} borderRadius="lg" boxShadow="sm">
          <VStack align="flex-start" spacing={4}>
            <Heading size="md">Get Started</Heading>
            <HStack spacing={4} flexWrap="wrap">
              <Button
                colorScheme="blue"
                onClick={() => navigate("/resources/new")}
              >
                Post a Request
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/resources")}
              >
                Browse Resources
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/profile")}
              >
                Manage Subscriptions
              </Button>
            </HStack>
          </VStack>
        </Box>

        {/* Recent Resources */}
        <Box>
          <Heading size="md" mb={4}>
            Recent Resources
          </Heading>
          {isLoading ? (
            <Text>Loading...</Text>
          ) : resources.length === 0 ? (
            <Text color="gray.600">No resources yet. Start by posting a request!</Text>
          ) : (
            <VStack spacing={3} align="stretch">
              {resources.slice(0, 5).map((resource) => (
                <Box
                  key={resource.id}
                  bg="white"
                  p={4}
                  borderRadius="md"
                  borderLeft="4px"
                  borderColor={
                    resource.type === "REQUEST" ? "blue.500" : "green.500"
                  }
                  cursor="pointer"
                  onClick={() => navigate(`/resources/${resource.id}`)}
                  _hover={{ boxShadow: "md" }}
                  transition="all 0.2s"
                >
                  <HStack justify="space-between">
                    <VStack align="flex-start" spacing={1} flex={1}>
                      <Heading size="sm">{resource.title}</Heading>
                      <Text fontSize="sm" color="gray.600">
                        {resource.type} • {new Date(resource.created_at).toLocaleDateString()}
                      </Text>
                    </VStack>
                    {resource.system_tags.length > 0 && (
                      <HStack spacing={1} flexWrap="wrap">
                        {resource.system_tags.slice(0, 2).map((tag) => (
                          <Box
                            key={tag}
                            bg="blue.100"
                            color="blue.800"
                            px={2}
                            py={1}
                            borderRadius="md"
                            fontSize="xs"
                          >
                            {tag}
                          </Box>
                        ))}
                      </HStack>
                    )}
                  </HStack>
                </Box>
              ))}
            </VStack>
          )}
        </Box>
      </VStack>
    </Layout>
  );
}
