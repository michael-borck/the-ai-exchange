/**
 * Edit Resource Page
 */

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import {
  VStack,
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
  Tooltip,
} from "@chakra-ui/react";
import { useAuth } from "@/hooks/useAuth";
import { useResource, useUpdateResource } from "@/hooks/useResources";

const RESOURCE_TYPES = [
  { key: "REQUEST", label: "Request" },
  { key: "USE_CASE", label: "Use Case" },
  { key: "PROMPT", label: "Prompt Template" },
  { key: "TOOL", label: "Tool" },
  { key: "POLICY", label: "Policy" },
  { key: "PAPER", label: "Paper" },
  { key: "PROJECT", label: "Project" },
  { key: "CONFERENCE", label: "Conference" },
  { key: "DATASET", label: "Dataset" },
  { key: "BOOK", label: "Book" },
  { key: "OTHER", label: "Other" },
];

const TOOL_CATEGORIES = [
  { key: "LLM", label: "LLM", tooltip: "Large language models like ChatGPT, Claude, Gemini" },
  { key: "CUSTOM_APP", label: "Custom App", tooltip: "Purpose-built applications using AI APIs" },
  { key: "VISION", label: "Vision", tooltip: "Image recognition, generation, or analysis tools" },
  { key: "SPEECH", label: "Speech", tooltip: "Speech-to-text, text-to-speech, or voice tools" },
  { key: "WORKFLOW", label: "Workflow", tooltip: "Automation tools like Zapier, Make, or Power Automate" },
  { key: "DEVELOPMENT", label: "Development", tooltip: "AI coding assistants and development tools" },
  { key: "OTHER", label: "Other", tooltip: "Any other AI tool or technology" },
];

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
          <Text color="red.600">You don't have permission to edit this resource</Text>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box maxW="3xl" mx="auto">
        <Heading size="lg" mb={6}>
          Edit Resource
        </Heading>

        <Box as="form" onSubmit={handleSubmit} bg="white" p={6} borderRadius="lg" boxShadow="sm">
          <VStack spacing={6}>
            {/* Resource Type (read-only) */}
            <FormControl>
              <FormLabel fontWeight="bold">Resource Type</FormLabel>
              <Badge colorScheme="blue" fontSize="sm" px={3} py={1} borderRadius="md">
                {resourceTypeLabel}
              </Badge>
              <FormHelperText>Resource type cannot be changed after creation</FormHelperText>
            </FormControl>

            {/* Title */}
            <FormControl isRequired>
              <FormLabel fontWeight="bold">Title</FormLabel>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your resource a clear, descriptive title"
              />
            </FormControl>

            {/* Description */}
            <FormControl isRequired>
              <FormLabel fontWeight="bold">Description</FormLabel>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Describe your resource, how to use it, and why it's valuable..."
                minHeight="200px"
              />
            </FormControl>

            {/* Collaborators */}
            <FormControl>
              <FormLabel fontWeight="bold">Collaborators (Optional)</FormLabel>
              <Textarea
                value={collaborators}
                onChange={(e) => setCollaborators(e.target.value)}
                placeholder="Add email addresses of collaborators involved in this idea (one per line, or separated by commas)"
                minHeight="80px"
              />
              <FormHelperText>Enter email addresses of people collaborating on this resource. First email is the primary contact.</FormHelperText>
            </FormControl>

            {/* Tools Used */}
            <FormControl>
              <FormLabel fontWeight="bold">AI Tools & Technologies Used</FormLabel>
              <Box borderWidth="1px" borderColor="gray.200" borderRadius="md" p={4} bg="gray.50">
                {TOOL_CATEGORIES.map((tool) => (
                  <Tooltip key={tool.key} label={tool.tooltip} placement="right" hasArrow openDelay={300} closeOnClick>
                    <Box display="inline-block">
                      <Checkbox
                        mb={2}
                        isChecked={selectedTools.includes(tool.key)}
                        onChange={() => handleToolToggle(tool.key)}
                      >
                        {tool.label}
                      </Checkbox>
                    </Box>
                  </Tooltip>
                ))}
              </Box>
              <FormHelperText>Select all that apply to your resource</FormHelperText>
            </FormControl>

            {/* Time Saved */}
            <FormControl>
              <FormLabel fontWeight="bold">Time Saved Per Week (hours)</FormLabel>
              <Input
                type="number"
                value={timeSavedValue}
                onChange={(e) => setTimeSavedValue(e.target.value)}
                placeholder="How much time does this save per week?"
                min="0"
                step="0.5"
              />
              <FormHelperText>Helps others understand the value of your resource</FormHelperText>
            </FormControl>

            {/* User Tags */}
            <FormControl>
              <FormLabel fontWeight="bold">Tags</FormLabel>
              <Input
                value={userTags}
                onChange={(e) => setUserTags(e.target.value)}
                placeholder="Add tags separated by commas (e.g., ChatGPT, Assessment, Writing)"
              />
              <FormHelperText>Help others discover your resource with relevant keywords</FormHelperText>
            </FormControl>

            {/* Anonymous (read-only) */}
            <FormControl>
              <Checkbox isChecked={resource.is_anonymous} isDisabled>
                <Text ml={2}>
                  Posted anonymously
                </Text>
              </Checkbox>
              <FormHelperText>Anonymous setting cannot be changed after creation</FormHelperText>
            </FormControl>

            {/* Buttons */}
            <div style={{ display: "flex", gap: "12px", width: "100%" }}>
              <Button
                colorScheme="blue"
                type="submit"
                isLoading={updateMutation.isPending}
                flex={1}
              >
                Save Changes
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/resources/${id}`)}
                flex={1}
              >
                Cancel
              </Button>
            </div>
          </VStack>
        </Box>
      </Box>
    </Layout>
  );
}
