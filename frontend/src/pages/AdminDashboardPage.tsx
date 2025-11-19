/**
 * Admin Dashboard Page
 */
import { Layout } from "@/components/Layout";
import { UserManagement } from "@/components/admin/UserManagement";
import { ResourceModeration } from "@/components/admin/ResourceModeration";
import {
  VStack,
  Heading,
  Box,
  Grid,
  Stat,
  StatLabel,
  StatNumber,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Spinner,
  Center,
  SimpleGrid,
  Text,
  HStack,
  Badge,
} from "@chakra-ui/react";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { useResources } from "@/hooks/useResources";
import { usePlatformAnalytics, useAnalyticsByDiscipline } from "@/hooks/useAdminAnalytics";

export default function AdminDashboardPage() {
  const { data: users = [], isLoading: usersLoading } = useAdminUsers({ limit: 100 });
  const { data: resources = [], isLoading: resourcesLoading } = useResources({ limit: 100 });
  const { data: analyticsData, isLoading: analyticsLoading } = usePlatformAnalytics();
  const { data: disciplineData, isLoading: disciplineLoading } = useAnalyticsByDiscipline();

  const totalUsers = users.length;
  const activeUsers = users.filter((u: { is_active: boolean }) => u.is_active).length;
  const approvedUsers = users.filter((u: { is_approved: boolean }) => u.is_approved).length;
  const admins = users.filter((u: { role: string }) => u.role === "ADMIN").length;

  const totalResources = resources.length;
  const verifiedResources = resources.filter((r) => r.is_verified).length;
  const hiddenResources = resources.filter((r) => r.is_hidden).length;

  const isLoading = usersLoading || resourcesLoading;

  return (
    <Layout>
      <VStack align="stretch" spacing={6}>
        <Box>
          <Heading size="lg" mb={2}>Admin Dashboard</Heading>
          <Text fontSize="sm" color="gray.600">Platform oversight, user management, and engagement metrics</Text>
        </Box>

        {/* Statistics Cards */}
        {isLoading ? (
          <Center py={12}>
            <Spinner />
          </Center>
        ) : (
          <Grid
            templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }}
            gap={4}
          >
            <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
              <Stat>
                <StatLabel>Total Users</StatLabel>
                <StatNumber>{totalUsers}</StatNumber>
              </Stat>
            </Box>

            <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
              <Stat>
                <StatLabel>Active Users</StatLabel>
                <StatNumber>{activeUsers}</StatNumber>
              </Stat>
            </Box>

            <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
              <Stat>
                <StatLabel>Approved Users</StatLabel>
                <StatNumber>{approvedUsers}</StatNumber>
              </Stat>
            </Box>

            <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
              <Stat>
                <StatLabel>Admins</StatLabel>
                <StatNumber>{admins}</StatNumber>
              </Stat>
            </Box>

            <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
              <Stat>
                <StatLabel>Total Resources</StatLabel>
                <StatNumber>{totalResources}</StatNumber>
              </Stat>
            </Box>

            <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
              <Stat>
                <StatLabel>Verified Resources</StatLabel>
                <StatNumber>{verifiedResources}</StatNumber>
              </Stat>
            </Box>

            <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
              <Stat>
                <StatLabel>Hidden Resources</StatLabel>
                <StatNumber>{hiddenResources}</StatNumber>
              </Stat>
            </Box>

            <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
              <Stat>
                <StatLabel>Visible Resources</StatLabel>
                <StatNumber>{totalResources - hiddenResources}</StatNumber>
              </Stat>
            </Box>
          </Grid>
        )}

        {/* Management Tabs */}
        <Tabs variant="enclosed">
          <TabList>
            <Tab>Users</Tab>
            <Tab>Resources</Tab>
            <Tab>Analytics</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <UserManagement />
            </TabPanel>

            <TabPanel>
              <ResourceModeration />
            </TabPanel>

            {/* Analytics Tab */}
            <TabPanel>
              <VStack align="stretch" spacing={6}>
                {/* Engagement Metrics */}
                <Box>
                  <Heading size="md" mb={4}>Engagement Metrics</Heading>
                  {analyticsLoading ? (
                    <Center py={8}>
                      <Spinner />
                    </Center>
                  ) : analyticsData ? (
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={4}>
                      <Box bg="white" p={6} borderRadius="lg" boxShadow="sm" borderLeft="4px" borderLeftColor="blue.500">
                        <Stat>
                          <StatLabel>Total Views</StatLabel>
                          <StatNumber>{analyticsData.platform_stats.total_views}</StatNumber>
                        </Stat>
                      </Box>
                      <Box bg="white" p={6} borderRadius="lg" boxShadow="sm" borderLeft="4px" borderLeftColor="green.500">
                        <Stat>
                          <StatLabel>Total Saves</StatLabel>
                          <StatNumber>{analyticsData.platform_stats.total_saves}</StatNumber>
                        </Stat>
                      </Box>
                      <Box bg="white" p={6} borderRadius="lg" boxShadow="sm" borderLeft="4px" borderLeftColor="purple.500">
                        <Stat>
                          <StatLabel>Tried Count</StatLabel>
                          <StatNumber>{analyticsData.platform_stats.total_tried}</StatNumber>
                        </Stat>
                      </Box>
                      <Box bg="white" p={6} borderRadius="lg" boxShadow="sm" borderLeft="4px" borderLeftColor="orange.500">
                        <Stat>
                          <StatLabel>Avg Views/Resource</StatLabel>
                          <StatNumber>{analyticsData.platform_stats.avg_views_per_resource.toFixed(1)}</StatNumber>
                        </Stat>
                      </Box>
                    </SimpleGrid>
                  ) : null}
                </Box>

                {/* Top Resources */}
                <Box>
                  <Heading size="md" mb={4}>Top Resources by Views</Heading>
                  {analyticsLoading ? (
                    <Center py={8}>
                      <Spinner />
                    </Center>
                  ) : analyticsData?.top_resources && analyticsData.top_resources.length > 0 ? (
                    <VStack align="stretch" spacing={3}>
                      {analyticsData.top_resources.map((resource: any, idx: number) => (
                        <Box key={resource.resource_id} bg="white" p={4} borderRadius="lg" boxShadow="sm">
                          <HStack justify="space-between" mb={2}>
                            <HStack>
                              <Badge colorScheme="blue" fontSize="lg">#{idx + 1}</Badge>
                              <Text fontWeight="semibold">Resource {resource.resource_id.slice(0, 8)}</Text>
                            </HStack>
                          </HStack>
                          <SimpleGrid columns={{ base: 3 }} gap={4}>
                            <Box>
                              <Text fontSize="xs" color="gray.600">Views</Text>
                              <Text fontWeight="bold">{resource.view_count}</Text>
                            </Box>
                            <Box>
                              <Text fontSize="xs" color="gray.600">Saves</Text>
                              <Text fontWeight="bold">{resource.save_count}</Text>
                            </Box>
                            <Box>
                              <Text fontSize="xs" color="gray.600">Tried</Text>
                              <Text fontWeight="bold">{resource.tried_count}</Text>
                            </Box>
                          </SimpleGrid>
                        </Box>
                      ))}
                    </VStack>
                  ) : null}
                </Box>

                {/* By Discipline */}
                <Box>
                  <Heading size="md" mb={4}>Resources by Discipline</Heading>
                  {disciplineLoading ? (
                    <Center py={8}>
                      <Spinner />
                    </Center>
                  ) : disciplineData?.by_discipline ? (
                    <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                      {Object.entries(disciplineData.by_discipline).map(([discipline, stats]: [string, any]) => (
                        <Box key={discipline} bg="white" p={4} borderRadius="lg" boxShadow="sm">
                          <Text fontWeight="semibold" mb={3}>{discipline}</Text>
                          <SimpleGrid columns={{ base: 3 }} gap={3}>
                            <Box>
                              <Text fontSize="xs" color="gray.600">Resources</Text>
                              <Text fontWeight="bold" fontSize="lg">{stats.count}</Text>
                            </Box>
                            <Box>
                              <Text fontSize="xs" color="gray.600">Views</Text>
                              <Text fontWeight="bold" fontSize="lg">{stats.total_views}</Text>
                            </Box>
                            <Box>
                              <Text fontSize="xs" color="gray.600">Saves</Text>
                              <Text fontWeight="bold" fontSize="lg">{stats.total_saves}</Text>
                            </Box>
                          </SimpleGrid>
                        </Box>
                      ))}
                    </SimpleGrid>
                  ) : null}
                </Box>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Layout>
  );
}
