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
} from "@chakra-ui/react";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { useResources } from "@/hooks/useResources";

export default function AdminDashboardPage() {
  const { data: users = [], isLoading: usersLoading } = useAdminUsers({ limit: 100 });
  const { data: resources = [], isLoading: resourcesLoading } = useResources({ limit: 100 });

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
        <Heading size="lg">Admin Dashboard</Heading>

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
          </TabList>

          <TabPanels>
            <TabPanel>
              <UserManagement />
            </TabPanel>

            <TabPanel>
              <ResourceModeration />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Layout>
  );
}
