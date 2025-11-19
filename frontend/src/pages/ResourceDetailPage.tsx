/**
 * Resource Detail Page - Show full idea with collaboration
 */
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import {
  Box,
  Heading,
  Text,
  Spinner,
  Center,
  VStack,
  HStack,
  Button,
  Badge,
  Divider,
  useToast,
  Grid,
  GridItem,
  SimpleGrid,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useDisclosure,
} from "@chakra-ui/react";
import { useAuth } from "@/hooks/useAuth";
import { useResource, useDeleteResource } from "@/hooks/useResources";
import { CollaborationModal } from "@/components/CollaborationModal";
import { useState } from "react";

// Mock engagement data - will be replaced with API data
interface EngagementStats {
  views: number;
  saves: number;
  tried: number;
}

export default function ResourceDetailPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const { data: resource, isLoading, isError } = useResource(id || "");
  const deleteResourceMutation = useDeleteResource();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [hasTriedIt, setHasTriedIt] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [stats, setStats] = useState<EngagementStats>({
    views: 234,
    saves: 45,
    tried: 18,
  });

  const isOwner = user && resource && user.id === resource.user_id;

  const handleEdit = () => {
    navigate(`/resources/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this resource? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteResourceMutation.mutateAsync(id || "");
      toast({
        title: "Resource deleted",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      navigate("/resources");
    } catch {
      toast({
        title: "Failed to delete resource",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleTried = () => {
    setHasTriedIt(!hasTriedIt);
    setStats((prev) => ({
      ...prev,
      tried: hasTriedIt ? prev.tried - 1 : prev.tried + 1,
    }));
    toast({
      title: hasTriedIt ? "Removed from tried" : "Marked as tried!",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  };

  const handleSave = () => {
    setHasSaved(!hasSaved);
    setStats((prev) => ({
      ...prev,
      saves: hasSaved ? prev.saves - 1 : prev.saves + 1,
    }));
    toast({
      title: hasSaved ? "Removed from saved" : "Saved!",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  };

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
      <Grid templateColumns={{ base: "1fr", lg: "1fr 300px" }} gap={6} align="start">
        {/* Main content */}
        <GridItem>
          <VStack align="stretch" spacing={6}>
            {/* Header */}
            <VStack align="flex-start" spacing={4}>
              <VStack align="flex-start" spacing={3} width="full">
                <Heading size="lg">{resource.title}</Heading>
                <HStack spacing={2}>
                  <Badge colorScheme="blue">{resource.type}</Badge>
                  {resource.status && (
                    <Badge
                      colorScheme={
                        resource.status === "SOLVED"
                          ? "green"
                          : resource.status === "ARCHIVED"
                          ? "gray"
                          : "yellow"
                      }
                    >
                      {resource.status}
                    </Badge>
                  )}
                  {resource.is_verified && (
                    <Badge colorScheme="green">Verified</Badge>
                  )}
                </HStack>
              </VStack>

              {/* Author info - only for logged-in users */}
              {user && (
                <HStack spacing={3} width="full" justify="space-between">
                  <VStack align="flex-start" spacing={1}>
                    <Text fontSize="sm" fontWeight="semibold">
                      Shared by {resource.user?.full_name || "Faculty Member"}
                    </Text>
                    <Text fontSize="xs" color="gray.600">
                      {new Date(resource.created_at).toLocaleDateString()}
                    </Text>
                  </VStack>

                  {isOwner && (
                    <HStack spacing={2}>
                      <Button
                        size="sm"
                        colorScheme="blue"
                        onClick={handleEdit}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        colorScheme="red"
                        onClick={handleDelete}
                        isLoading={deleteResourceMutation.isPending}
                      >
                        Delete
                      </Button>
                    </HStack>
                  )}
                </HStack>
              )}

              {/* For guests - only show date, hide author info */}
              {!user && (
                <Text fontSize="xs" color="gray.600">
                  Shared on {new Date(resource.created_at).toLocaleDateString()}
                </Text>
              )}
            </VStack>

            {/* Engagement Actions */}
            {user && !isOwner && (
              <HStack spacing={2} width="full">
                <Button
                  size="sm"
                  colorScheme="blue"
                  onClick={onOpen}
                >
                  Working on Similar?
                </Button>
                <Button
                  size="sm"
                  variant={hasSaved ? "solid" : "outline"}
                  colorScheme="blue"
                  onClick={handleSave}
                >
                  {hasSaved ? "✓ Saved" : "Save"}
                </Button>
                <Button
                  size="sm"
                  variant={hasTriedIt ? "solid" : "outline"}
                  colorScheme="green"
                  onClick={handleTried}
                >
                  {hasTriedIt ? "✓ Tried It" : "Mark as Tried"}
                </Button>
              </HStack>
            )}

            {/* Login prompt for guests */}
            {!user && (
              <Box bg="blue.50" p={4} borderRadius="md" border="1px" borderColor="blue.200">
                <Text fontSize="sm" color="blue.900">
                  <strong>Want to collaborate?</strong> Log in to see the creator's details and start working together.
                </Text>
                <Button
                  size="sm"
                  colorScheme="blue"
                  mt={3}
                  onClick={() => navigate("/login")}
                >
                  Log In
                </Button>
              </Box>
            )}

            <Divider />

            {/* Tabs for content sections */}
            <Tabs variant="soft-rounded" colorScheme="blue">
              <TabList>
                <Tab>Overview</Tab>
                <Tab>Details</Tab>
                <Tab>Community</Tab>
              </TabList>

              <TabPanels>
                {/* Overview Tab */}
                <TabPanel>
                  <VStack align="stretch" spacing={4}>
                    <Box>
                      <Text whiteSpace="pre-wrap" color="gray.800">
                        {resource.content_text}
                      </Text>
                    </Box>
                  </VStack>
                </TabPanel>

                {/* Details Tab */}
                <TabPanel>
                  <VStack align="stretch" spacing={4}>
                    {resource.system_tags.length > 0 && (
                      <Box>
                        <Text fontSize="sm" fontWeight="bold" color="gray.600" mb={2}>
                          Topics
                        </Text>
                        <HStack spacing={2} flexWrap="wrap">
                          {resource.system_tags.map((tag) => (
                            <Badge key={tag} colorScheme="blue" variant="outline">
                              {tag}
                            </Badge>
                          ))}
                        </HStack>
                      </Box>
                    )}
                    <Box>
                      <Text fontSize="sm" fontWeight="bold" color="gray.600" mb={2}>
                        Resource Information
                      </Text>
                      <VStack align="flex-start" spacing={2} fontSize="sm">
                        <Text>
                          <strong>Type:</strong> {resource.type}
                        </Text>
                        <Text>
                          <strong>Status:</strong> {resource.status || "Open"}
                        </Text>
                        <Text>
                          <strong>Created:</strong>{" "}
                          {new Date(resource.created_at).toLocaleDateString()}
                        </Text>
                      </VStack>
                    </Box>
                  </VStack>
                </TabPanel>

                {/* Community Tab */}
                <TabPanel>
                  <VStack align="stretch" spacing={4}>
                    <Box bg="blue.50" p={4} borderRadius="md">
                      <Text fontSize="sm" color="blue.900" fontWeight="semibold" mb={3}>
                        Engagement
                      </Text>
                      <SimpleGrid columns={3} gap={4}>
                        <VStack spacing={1}>
                          <Text fontSize="xl" fontWeight="bold" color="blue.600">
                            {stats.views}
                          </Text>
                          <Text fontSize="xs" color="gray.600">
                            Views
                          </Text>
                        </VStack>
                        <VStack spacing={1}>
                          <Text fontSize="xl" fontWeight="bold" color="green.600">
                            {stats.tried}
                          </Text>
                          <Text fontSize="xs" color="gray.600">
                            Tried It
                          </Text>
                        </VStack>
                        <VStack spacing={1}>
                          <Text fontSize="xl" fontWeight="bold" color="purple.600">
                            {stats.saves}
                          </Text>
                          <Text fontSize="xs" color="gray.600">
                            Saved
                          </Text>
                        </VStack>
                      </SimpleGrid>
                    </Box>

                    <Box>
                      <Text fontSize="sm" fontWeight="bold" color="gray.600" mb={3}>
                        Similar Ideas
                      </Text>
                      <VStack align="stretch" spacing={2}>
                        <Box
                          p={3}
                          border="1px"
                          borderColor="gray.200"
                          borderRadius="md"
                          cursor="pointer"
                          _hover={{ bg: "gray.50" }}
                        >
                          <Text fontSize="sm" fontWeight="semibold">
                            Student Peer Review Templates
                          </Text>
                          <Text fontSize="xs" color="gray.600" mt={1}>
                            by Dr. Kumar • Finance
                          </Text>
                        </Box>
                        <Box
                          p={3}
                          border="1px"
                          borderColor="gray.200"
                          borderRadius="md"
                          cursor="pointer"
                          _hover={{ bg: "gray.50" }}
                        >
                          <Text fontSize="sm" fontWeight="semibold">
                            Discussion Prompt Generator
                          </Text>
                          <Text fontSize="xs" color="gray.600" mt={1}>
                            by Prof. Chen • Management
                          </Text>
                        </Box>
                      </VStack>
                    </Box>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </VStack>
        </GridItem>

        {/* Sidebar */}
        <GridItem display={{ base: "none", lg: "block" }}>
          <VStack align="stretch" spacing={4} position="sticky" top={6}>
            {/* Quick stats */}
            <Box bg="white" p={4} borderRadius="lg" boxShadow="sm">
              <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={3}>
                ENGAGEMENT
              </Text>
              <VStack align="stretch" spacing={3}>
                <HStack justify="space-between">
                  <Text fontSize="sm">Views</Text>
                  <Text fontSize="sm" fontWeight="bold">
                    {stats.views}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm">Tried It</Text>
                  <Text fontSize="sm" fontWeight="bold">
                    {stats.tried}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm">Saved</Text>
                  <Text fontSize="sm" fontWeight="bold">
                    {stats.saves}
                  </Text>
                </HStack>
              </VStack>
            </Box>

            {/* Author card */}
            <Box bg="white" p={4} borderRadius="lg" boxShadow="sm">
              <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={3}>
                AUTHOR
              </Text>
              <VStack align="stretch" spacing={2}>
                <Text fontSize="sm" fontWeight="semibold">
                  Dr. Sarah Chen
                </Text>
                <Text fontSize="xs" color="gray.600">
                  Marketing Department
                </Text>
                <Button
                  size="xs"
                  variant="outline"
                  colorScheme="blue"
                  width="full"
                  onClick={onOpen}
                >
                  Contact
                </Button>
              </VStack>
            </Box>
          </VStack>
        </GridItem>
      </Grid>

      {/* Collaboration Modal */}
      <CollaborationModal
        isOpen={isOpen}
        onClose={onClose}
        resourceTitle={resource.title}
        authorName="Dr. Sarah Chen"
        authorEmail="sarah.chen@school.edu"
        collaborationStatus="SEEKING"
      />
    </Layout>
  );
}
