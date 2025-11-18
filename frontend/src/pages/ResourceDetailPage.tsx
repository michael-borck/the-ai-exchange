/**
 * Resource Detail Page
 */
import { useParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Box, Heading, Text, Spinner, Center, VStack } from "@chakra-ui/react";
import { useResource } from "@/hooks/useResources";

export default function ResourceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: resource, isLoading, isError } = useResource(id || "");

  if (isLoading) {
    return (
      <Layout>
        <Center py={12}>
          <Spinner />
        </Center>
      </Layout>
    );
  }

  if (isError || !resource) {
    return (
      <Layout>
        <Box textAlign="center" py={12}>
          <Text>Resource not found</Text>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <VStack align="stretch" spacing={6}>
        <Heading size="lg">{resource.title}</Heading>
        <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
          <Text whiteSpace="pre-wrap">{resource.content_text}</Text>
        </Box>
      </VStack>
    </Layout>
  );
}
