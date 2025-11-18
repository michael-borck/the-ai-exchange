/**
 * Resources Listing Page
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import {
  VStack,
  HStack,
  Heading,
  Button,
  Input,
  Select,
  Box,
  Grid,
  Text,
  Spinner,
  Center,
} from "@chakra-ui/react";
import { useResources } from "@/hooks/useResources";
import { ResourceType, ResourceStatus } from "@/types/index";

export default function ResourcesPage() {
  const navigate = useNavigate();
  const [type, setType] = useState<ResourceType | "">("");
  const [status, setStatus] = useState<ResourceStatus | "">("");
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState("");

  const { data: resources = [], isLoading } = useResources({
    type: type || undefined,
    status: status || undefined,
    search: search || undefined,
    tag: tag || undefined,
    limit: 100,
  });

  return (
    <Layout>
      <VStack align="stretch" spacing={6}>
        <HStack justify="space-between">
          <Heading size="lg">Resources</Heading>
          <Button
            colorScheme="blue"
            onClick={() => navigate("/resources/new")}
          >
            New Request
          </Button>
        </HStack>

        {/* Filters */}
        <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
          <Grid
            templateColumns={{
              base: "1fr",
              md: "repeat(2, 1fr)",
              lg: "repeat(4, 1fr)",
            }}
            gap={4}
          >
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select
              value={type}
              onChange={(e) => setType(e.target.value as ResourceType | "")}
            >
              <option value="">All Types</option>
              <option value="REQUEST">Requests</option>
              <option value="USE_CASE">Use Cases</option>
              <option value="PROMPT">Prompts</option>
              <option value="TOOL">Tools</option>
              <option value="POLICY">Policies</option>
              <option value="PAPER">Papers</option>
              <option value="PROJECT">Projects</option>
              <option value="CONFERENCE">Conferences</option>
              <option value="DATASET">Datasets</option>
            </Select>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as ResourceStatus | "")}
            >
              <option value="">All Status</option>
              <option value="OPEN">Open</option>
              <option value="SOLVED">Solved</option>
              <option value="ARCHIVED">Archived</option>
            </Select>
            <Input
              placeholder="Filter by tag..."
              value={tag}
              onChange={(e) => setTag(e.target.value)}
            />
          </Grid>
        </Box>

        {/* Results */}
        {isLoading ? (
          <Center py={12}>
            <Spinner />
          </Center>
        ) : resources.length === 0 ? (
          <Box bg="white" p={12} borderRadius="lg" textAlign="center">
            <Text color="gray.600">No resources found. Try adjusting your filters.</Text>
          </Box>
        ) : (
          <VStack spacing={3} align="stretch">
            {resources.map((resource) => (
              <Box
                key={resource.id}
                bg="white"
                p={4}
                borderRadius="md"
                borderLeft="4px"
                borderColor={
                  resource.type === "REQUEST"
                    ? "blue.500"
                    : resource.type === "USE_CASE"
                    ? "green.500"
                    : "purple.500"
                }
                cursor="pointer"
                onClick={() => navigate(`/resources/${resource.id}`)}
                _hover={{ boxShadow: "md" }}
                transition="all 0.2s"
              >
                <VStack align="flex-start" spacing={2}>
                  <HStack justify="space-between" width="full">
                    <Heading size="sm">{resource.title}</Heading>
                    <HStack spacing={2}>
                      <Box
                        bg="gray.100"
                        px={2}
                        py={1}
                        borderRadius="md"
                        fontSize="xs"
                        fontWeight="medium"
                      >
                        {resource.type}
                      </Box>
                      {resource.status && (
                        <Box
                          bg={
                            resource.status === "SOLVED"
                              ? "green.100"
                              : "yellow.100"
                          }
                          color={
                            resource.status === "SOLVED"
                              ? "green.800"
                              : "yellow.800"
                          }
                          px={2}
                          py={1}
                          borderRadius="md"
                          fontSize="xs"
                        >
                          {resource.status}
                        </Box>
                      )}
                    </HStack>
                  </HStack>
                  <Text color="gray.600" fontSize="sm">
                    {resource.content_text.substring(0, 100)}...
                  </Text>
                  {resource.system_tags.length > 0 && (
                    <HStack spacing={1} flexWrap="wrap">
                      {resource.system_tags.slice(0, 3).map((t) => (
                        <Box
                          key={t}
                          bg="blue.50"
                          color="blue.700"
                          px={2}
                          py={1}
                          borderRadius="sm"
                          fontSize="xs"
                        >
                          {t}
                        </Box>
                      ))}
                    </HStack>
                  )}
                </VStack>
              </Box>
            ))}
          </VStack>
        )}
      </VStack>
    </Layout>
  );
}
