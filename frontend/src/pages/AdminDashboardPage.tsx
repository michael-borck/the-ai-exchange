/**
 * Admin Dashboard Page
 */
import { Layout } from "@/components/Layout";
import { VStack, Heading, Text, Box } from "@chakra-ui/react";

export default function AdminDashboardPage() {
  return (
    <Layout>
      <VStack align="stretch" spacing={6}>
        <Heading size="lg">Admin Dashboard</Heading>
        <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
          <Text>Admin features coming soon...</Text>
        </Box>
      </VStack>
    </Layout>
  );
}
