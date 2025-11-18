/**
 * Resource Moderation Component
 */

import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  HStack,
  useToast,
  Spinner,
  Center,
  Box,
  Text,
  Badge,
  VStack,
  Select,
} from "@chakra-ui/react";
import { useState } from "react";
import { useResources } from "@/hooks/useResources";
import { useVerifyResource, useHideResource, useUnhideResource } from "@/hooks/useAdminResources";
import { ResourceType } from "@/types/index";

export function ResourceModeration() {
  const toast = useToast();
  const [typeFilter, setTypeFilter] = useState<ResourceType | "">("");
  const [showHiddenOnly, setShowHiddenOnly] = useState(false);

  const { data: resources = [], isLoading } = useResources({ limit: 100 });

  const verifyMutation = useVerifyResource();
  const hideMutation = useHideResource();
  const unhideMutation = useUnhideResource();

  // Filter resources
  const filteredResources = resources.filter((r) => {
    if (typeFilter && r.type !== typeFilter) return false;
    if (showHiddenOnly && !r.is_hidden) return false;
    return true;
  });

  const handleVerify = async (resourceId: string) => {
    try {
      await verifyMutation.mutateAsync(resourceId);
      toast({
        title: "Resource verified",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch {
      toast({
        title: "Failed to verify resource",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleHide = async (resourceId: string) => {
    try {
      await hideMutation.mutateAsync(resourceId);
      toast({
        title: "Resource hidden",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch {
      toast({
        title: "Failed to hide resource",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleUnhide = async (resourceId: string) => {
    try {
      await unhideMutation.mutateAsync(resourceId);
      toast({
        title: "Resource unhidden",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch {
      toast({
        title: "Failed to unhide resource",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (isLoading) {
    return (
      <Center py={12}>
        <Spinner />
      </Center>
    );
  }

  return (
    <VStack align="stretch" spacing={4}>
      {/* Filters */}
      <Box bg="white" p={4} borderRadius="lg" boxShadow="sm">
        <HStack spacing={4}>
          <Select
            placeholder="Filter by type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as ResourceType | "")}
            width="200px"
          >
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

          <Button
            variant={showHiddenOnly ? "solid" : "outline"}
            colorScheme={showHiddenOnly ? "red" : "gray"}
            onClick={() => setShowHiddenOnly(!showHiddenOnly)}
          >
            {showHiddenOnly ? "Showing Hidden Only" : "Show All"}
          </Button>

          <Text fontSize="sm" color="gray.600">
            {filteredResources.length} resource{filteredResources.length !== 1 ? "s" : ""}
          </Text>
        </HStack>
      </Box>

      {/* Table */}
      {filteredResources.length === 0 ? (
        <Box bg="white" p={6} borderRadius="lg" textAlign="center">
          <Text color="gray.600">No resources found</Text>
        </Box>
      ) : (
        <Box bg="white" borderRadius="lg" overflow="hidden" boxShadow="sm">
          <Table variant="simple" size="sm">
            <Thead bg="gray.50">
              <Tr>
                <Th>Title</Th>
                <Th>Type</Th>
                <Th>Status</Th>
                <Th>Visibility</Th>
                <Th>Created</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredResources.map((resource) => (
                <Tr key={resource.id} _hover={{ bg: "gray.50" }}>
                  <Td fontSize="sm">
                    <Text maxWidth="300px" noOfLines={1}>
                      {resource.title}
                    </Text>
                  </Td>
                  <Td fontSize="sm">{resource.type}</Td>
                  <Td>
                    <Badge colorScheme={resource.is_verified ? "green" : "gray"}>
                      {resource.is_verified ? "Verified" : "Unverified"}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge colorScheme={resource.is_hidden ? "red" : "green"}>
                      {resource.is_hidden ? "Hidden" : "Visible"}
                    </Badge>
                  </Td>
                  <Td fontSize="sm">
                    {new Date(resource.created_at).toLocaleDateString()}
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      {!resource.is_verified && (
                        <Button
                          size="xs"
                          colorScheme="green"
                          onClick={() => handleVerify(resource.id)}
                          isLoading={verifyMutation.isPending}
                        >
                          Verify
                        </Button>
                      )}
                      {!resource.is_hidden && (
                        <Button
                          size="xs"
                          colorScheme="orange"
                          onClick={() => handleHide(resource.id)}
                          isLoading={hideMutation.isPending}
                        >
                          Hide
                        </Button>
                      )}
                      {resource.is_hidden && (
                        <Button
                          size="xs"
                          colorScheme="blue"
                          onClick={() => handleUnhide(resource.id)}
                          isLoading={unhideMutation.isPending}
                        >
                          Unhide
                        </Button>
                      )}
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}
    </VStack>
  );
}
