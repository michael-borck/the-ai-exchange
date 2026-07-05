/**
 * Edit Resource Page
 */

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import {
  VStack,
  HStack,
  Heading,
  Input,
  Textarea,
  Button,
  Box,
  useToast,
  FormControl,
  FormLabel,
  FormHelperText,
  Checkbox,
  Spinner,
  Center,
  Text,
  Badge,
  Divider,
} from "@chakra-ui/react";
import { useAuth } from "@/hooks/useAuth";
import { useResource, useUpdateResource } from "@/hooks/useResources";
import { RESOURCE_TYPES, ToolCategoryChips, SectionHeading } from "@/components/ResourceFormFields";

export default function EditResourcePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const { data: resource, isLoading, isError } = useResource(id || "");
  const updateMutation = useUpdateResource();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [collaborators, setCollaborators] = useState("");
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [timeSavedValue, setTimeSavedValue] = useState("");
  const [userTags, setUserTags] = useState("");

  // Initialize form with resource data
  useEffect(() => {
    if (resource) {
      setTitle(resource.title);
      setContent(resource.content_text);

      const meta = resource.content_meta;
      if (meta) {
        if (Array.isArray(meta.tools_used)) {
          setSelectedTools(meta.tools_used as string[]);
        }
        if (meta.time_saved_value != null) {
          setTimeSavedValue(String(meta.time_saved_value));
        }
        if (Array.isArray(meta.collaborators)) {
          setCollaborators((meta.collaborators as string[]).join(", "));
        }
      }

      if (resource.user_tags && resource.user_tags.length > 0) {
        setUserTags(resource.user_tags.join(", "));
      }
    }
  }, [resource]);

  const handleToolToggle = (tool: string) => {
    setSelectedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  };

  const resourceTypeLabel =
    RESOURCE_TYPES.find((rt) => rt.key === resource?.type)?.label || resource?.type;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast({
        title: "Please fill in all required fields",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const contentMeta: Record<string, unknown> = {};

      if (timeSavedValue) contentMeta.time_saved_value = parseInt(timeSavedValue);
      if (selectedTools.length > 0) contentMeta.tools_used = selectedTools;
      if (userTags) contentMeta.user_tags = userTags.split(",").map((t) => t.trim());

      let collaboratorsList: string[] = [];
      if (collaborators.trim()) {
        collaboratorsList = collaborators
          .split(/[,\n]/)
          .map((email) => email.trim())
          .filter((email) => email.length > 0 && email.includes("@"));
      }
      if (collaboratorsList.length > 0) contentMeta.collaborators = collaboratorsList;

      await updateMutation.mutateAsync({
        id: id || "",
        data: {
          title,
          content_text: content,
          content_meta: Object.keys(contentMeta).length > 0 ? contentMeta : undefined,
        },
      });

      toast({
        title: "Resource updated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      navigate(`/resources/${id}`);
    } catch {
      toast({
        title: "Failed to update resource",
        status: "error",
        duration: 5000,
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

  // Check ownership
  if (user?.id !== resource.user_id) {
    return (
      <Layout>
        <Box textAlign="center" py={12}>
          <Text color="red.300">You don't have permission to edit this resource</Text>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box maxW="3xl" mx="auto">
        <Heading size="lg" mb={8}>
          Edit Resource
        </Heading>

        <Box as="form" onSubmit={handleSubmit} layerStyle="card" p={{ base: 5, md: 8 }}>
          <VStack spacing={7} align="stretch">
            <SectionHeading title="The basics" />

            {/* Resource Type (read-only) */}
            <FormControl>
              <FormLabel>Resource Type</FormLabel>
              <Badge bg="brand.900" color="brand.200" fontSize="sm" px={3} py={1}>
                {resourceTypeLabel}
              </Badge>
              <FormHelperText color="whiteAlpha.500">
                Resource type cannot be changed after creation
              </FormHelperText>
            </FormControl>

            {/* Title */}
            <FormControl isRequired>
              <FormLabel requiredIndicator={<></>}>Title</FormLabel>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your resource a clear, descriptive title"
              />
            </FormControl>

            {/* Description */}
            <FormControl isRequired>
              <FormLabel requiredIndicator={<></>}>Description</FormLabel>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Describe your resource, how to use it, and why it's valuable..."
                minHeight="200px"
              />
            </FormControl>

            <Divider />
            <SectionHeading title="Add context" />

            {/* Tools Used */}
            <FormControl>
              <FormLabel>AI Tools & Technologies Used</FormLabel>
              <ToolCategoryChips selected={selectedTools} onToggle={handleToolToggle} />
              <FormHelperText color="whiteAlpha.500">Select all that apply</FormHelperText>
            </FormControl>

            {/* Time Saved */}
            <FormControl>
              <FormLabel>Time Saved Per Week (hours)</FormLabel>
              <Input
                type="number"
                value={timeSavedValue}
                onChange={(e) => setTimeSavedValue(e.target.value)}
                placeholder="e.g. 2"
                min="0"
                step="0.5"
                maxW="200px"
              />
              <FormHelperText color="whiteAlpha.500">
                Helps others understand the value of your resource
              </FormHelperText>
            </FormControl>

            {/* User Tags */}
            <FormControl>
              <FormLabel>Tags</FormLabel>
              <Input
                value={userTags}
                onChange={(e) => setUserTags(e.target.value)}
                placeholder="Add tags separated by commas (e.g., ChatGPT, Assessment, Writing)"
              />
              <FormHelperText color="whiteAlpha.500">
                Help others discover your resource with relevant keywords
              </FormHelperText>
            </FormControl>

            <Divider />
            <SectionHeading title="Attribution" />

            {/* Collaborators */}
            <FormControl>
              <FormLabel>Collaborators (Optional)</FormLabel>
              <Textarea
                value={collaborators}
                onChange={(e) => setCollaborators(e.target.value)}
                placeholder="Add email addresses of collaborators involved in this idea (one per line, or separated by commas)"
                minHeight="80px"
              />
              <FormHelperText color="whiteAlpha.500">
                Enter email addresses of people collaborating on this resource. First email is the
                primary contact.
              </FormHelperText>
            </FormControl>

            {/* Anonymous (read-only) */}
            <FormControl>
              <Checkbox isChecked={resource.is_anonymous} isDisabled>
                <Text ml={2}>Posted anonymously</Text>
              </Checkbox>
              <FormHelperText color="whiteAlpha.500">
                Anonymous setting cannot be changed after creation
              </FormHelperText>
            </FormControl>

            {/* Buttons */}
            <HStack spacing={3} width="full">
              <Button
                colorScheme="brand"
                type="submit"
                isLoading={updateMutation.isPending}
                flex={1}
                size="lg"
              >
                Save Changes
              </Button>
              <Button
                variant="outline"
                colorScheme="brand"
                onClick={() => navigate(`/resources/${id}`)}
                flex={1}
                size="lg"
              >
                Cancel
              </Button>
            </HStack>
          </VStack>
        </Box>
      </Box>
    </Layout>
  );
}
