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
import { useResource, useDeleteResource, useResources } from "@/hooks/useResources";
import { useSaveResource, useTriedResource, useIsResourceSaved, useResourceUsersTried } from "@/hooks/useEngagement";
import { CollaborationModal } from "@/components/CollaborationModal";
import { useMemo } from "react";

export default function ResourceDetailPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const { data: resource, isLoading, isError } = useResource(id || "");
  const { data: allResources = [] } = useResources({ limit: 100 });
  const deleteResourceMutation = useDeleteResource();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Engagement hooks
  const saveResourceMutation = useSaveResource();
  const triedResourceMutation = useTriedResource();
  const { data: isSavedData } = useIsResourceSaved(id || "");
  const { data: usersTried = [] } = useResourceUsersTried(id || "");
  const hasSaved = isSavedData ?? false;

  // Get engagement stats from resource analytics
  const engagementStats = useMemo(() => {
    if (!resource?.analytics) {
      return { views: 0, saves: 0, tried: 0 };
    }
    return {
      views: resource.analytics.view_count || 0,
      saves: resource.analytics.save_count || 0,
      tried: resource.analytics.tried_count || 0,
    };
  }, [resource?.analytics]);

  // Get similar resources based on discipline
  const similarResources = useMemo(() => {
    if (!resource?.discipline) return [];
    return allResources
      .filter(
        (r) =>
          r.id !== resource.id && // Don't include current resource
          r.discipline === resource.discipline // Same discipline
      )
      .slice(0, 2); // Limit to 2 similar ideas
  }, [resource?.id, resource?.discipline, allResources]);

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

  const handleTried = async () => {
    try {
      await triedResourceMutation.mutateAsync(id || "");
      toast({
        title: "Marked as tried!",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Failed to mark as tried",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSave = async () => {
    try {
      await saveResourceMutation.mutateAsync(id || "");
      toast({
        title: hasSaved ? "Removed from saved" : "Saved!",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Failed to save resource",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
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
      <Grid templateColumns={{ base: "1fr", lg: "1fr 300px" }} gap={6} alignItems="start">
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
                  isLoading={saveResourceMutation.isPending}
                >
                  {hasSaved ? "✓ Saved" : "Save"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  colorScheme="green"
                  onClick={handleTried}
                  isLoading={triedResourceMutation.isPending}
                >
                  Mark as Tried
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
                    {/* Users who tried it */}
                    <Box>
                      <Text fontSize="sm" fontWeight="bold" color="gray.600" mb={3}>
                        Users Who Tried It ({usersTried.length})
                      </Text>
                      {usersTried.length === 0 ? (
                        <Text fontSize="xs" color="gray.500" fontStyle="italic">
                          Be the first to try and share your experience!
                        </Text>
                      ) : (
                        <VStack align="stretch" spacing={2}>
                          {usersTried.map((user) => (
                            <Box
                              key={user.id}
                              p={3}
                              border="1px"
                              borderColor="gray.200"
                              borderRadius="md"
                              bg="gray.50"
                            >
                              <HStack justify="space-between" width="full">
                                <VStack align="flex-start" spacing={0}>
                                  <Text fontSize="sm" fontWeight="semibold">
                                    {user.full_name}
                                  </Text>
                                  <Text fontSize="xs" color="gray.600">
                                    {user.email}
                                  </Text>
                                </VStack>
                                <Button
                                  size="xs"
                                  variant="outline"
                                  colorScheme="blue"
                                  onClick={() => {
                                    window.location.href = `mailto:${user.email}?subject=Re: ${resource?.title || "Resource"}`;
                                  }}
                                >
                                  Contact
                                </Button>
                              </HStack>
                            </Box>
                          ))}
                        </VStack>
                      )}
                    </Box>

                    <Box>
                      <Text fontSize="sm" fontWeight="bold" color="gray.600" mb={3}>
                        Similar Ideas
                      </Text>
                      {similarResources.length === 0 ? (
                        <Text fontSize="xs" color="gray.500" fontStyle="italic">
                          No similar ideas in this discipline
                        </Text>
                      ) : (
                        <VStack align="stretch" spacing={2}>
                          {similarResources.map((similar) => (
                            <Box
                              key={similar.id}
                              p={3}
                              border="1px"
                              borderColor="gray.200"
                              borderRadius="md"
                              cursor="pointer"
                              _hover={{ bg: "gray.50" }}
                              onClick={() => navigate(`/resources/${similar.id}`)}
                            >
                              <Text fontSize="sm" fontWeight="semibold" noOfLines={2}>
                                {similar.title}
                              </Text>
                              <Text fontSize="xs" color="gray.600" mt={1}>
                                by {similar.user?.full_name || "Faculty Member"} • {similar.discipline}
                              </Text>
                            </Box>
                          ))}
                        </VStack>
                      )}
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
                    {engagementStats.views}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm">Tried It</Text>
                  <Text fontSize="sm" fontWeight="bold">
                    {engagementStats.tried}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm">Saved</Text>
                  <Text fontSize="sm" fontWeight="bold">
                    {engagementStats.saves}
                  </Text>
                </HStack>
              </VStack>
            </Box>

            {/* Author card - only show to logged-in users */}
            {user && (
              <Box bg="white" p={4} borderRadius="lg" boxShadow="sm">
                <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={3}>
                  AUTHOR
                </Text>
                <VStack align="stretch" spacing={2}>
                  <Text fontSize="sm" fontWeight="semibold">
                    {resource?.user?.full_name || "Faculty Member"}
                  </Text>
                  {resource?.department && (
                    <Text fontSize="xs" color="gray.600">
                      {resource.department}
                    </Text>
                  )}
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
            )}
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
