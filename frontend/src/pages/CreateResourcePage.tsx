/**
 * Create Resource Page
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
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
  Text,
  HStack,
  Divider,
} from "@chakra-ui/react";
import { useCreateResource } from "@/hooks/useResources";
import { ResourceType } from "@/types/index";
import {
  RESOURCE_TYPES,
  ResourceTypePicker,
  ToolCategoryChips,
  SectionHeading,
} from "@/components/ResourceFormFields";

const TITLE_GUIDE_LENGTH = 120;

export default function CreateResourcePage() {
  const navigate = useNavigate();
  const toast = useToast();
  useAuth();
  const createMutation = useCreateResource();

  const [type, setType] = useState<ResourceType>("REQUEST");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [collaborators, setCollaborators] = useState("");
  const [timeSavedValue, setTimeSavedValue] = useState("");
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [userTags, setUserTags] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  const selectedType = RESOURCE_TYPES.find((rt) => rt.key === type);

  const handleToolToggle = (tool: string) => {
    setSelectedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  };

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

      // Parse collaborators from comma/newline separated emails
      let collaboratorsList: string[] = [];
      if (collaborators.trim()) {
        collaboratorsList = collaborators
          .split(/[,\n]/)
          .map((email) => email.trim())
          .filter((email) => email.length > 0 && email.includes("@"));
      }
      if (collaboratorsList.length > 0) contentMeta.collaborators = collaboratorsList;

      await createMutation.mutateAsync({
        type,
        title,
        content_text: content,
        is_anonymous: isAnonymous,
        content_meta: Object.keys(contentMeta).length > 0 ? contentMeta : undefined,
      });

      toast({
        title: "Resource created successfully!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      navigate("/resources");
    } catch (error) {
      toast({
        title: "Failed to create resource",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Layout>
      <Box maxW="3xl" mx="auto">
        <VStack align="flex-start" spacing={1} mb={8}>
          <Heading size="lg">Share Your Resource</Heading>
          <Text color="whiteAlpha.600" fontSize="sm">
            Only the type, title, and description are required — everything else helps colleagues
            find and evaluate your idea.
          </Text>
        </VStack>

        <Box as="form" onSubmit={handleSubmit} layerStyle="card" p={{ base: 5, md: 8 }}>
          <VStack spacing={7} align="stretch">
            <SectionHeading title="The basics" />

            {/* Type */}
            <FormControl isRequired>
              <FormLabel requiredIndicator={<></>}>What are you sharing?</FormLabel>
              <ResourceTypePicker value={type} onChange={setType} />
              {selectedType && (
                <FormHelperText color="whiteAlpha.600">
                  {selectedType.label}: {selectedType.description}
                </FormHelperText>
              )}
            </FormControl>

            {/* Title */}
            <FormControl isRequired>
              <HStack justify="space-between" align="center" mb={2}>
                <FormLabel mb={0} requiredIndicator={<></>}>
                  Title
                </FormLabel>
                <Text
                  fontSize="xs"
                  color={title.length > TITLE_GUIDE_LENGTH ? "orange.300" : "whiteAlpha.400"}
                >
                  {title.length}/{TITLE_GUIDE_LENGTH}
                </Text>
              </HStack>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your resource a clear, descriptive title"
              />
              {title.length > TITLE_GUIDE_LENGTH && (
                <FormHelperText color="orange.300">
                  Long titles get clipped on cards — consider trimming, but it will still save.
                </FormHelperText>
              )}
            </FormControl>

            {/* Content */}
            <FormControl isRequired>
              <FormLabel requiredIndicator={<></>}>Description</FormLabel>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Describe your resource, how to use it, and why it's valuable..."
                minHeight="200px"
              />
              <FormHelperText color="whiteAlpha.500">
                Include the prompt or steps if you have them — the more concrete, the more useful.
              </FormHelperText>
            </FormControl>

            <Divider />
            <SectionHeading
              title="Add context"
              hint="Optional, but this is what makes ideas discoverable."
            />

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
                A rough estimate helps others understand the value of your resource
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

            {/* Anonymous */}
            <Box layerStyle="card" bg="dark.subtle" p={4}>
              <Checkbox isChecked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)}>
                <VStack align="flex-start" spacing={0} ml={2}>
                  <Text fontSize="sm" fontWeight="600">
                    Post anonymously
                  </Text>
                  <Text fontSize="xs" color="whiteAlpha.500">
                    Your name won't be shown — the post appears as "Faculty Member"
                  </Text>
                </VStack>
              </Checkbox>
            </Box>

            {/* Submit */}
            <Button
              colorScheme="brand"
              type="submit"
              isLoading={createMutation.isPending}
              width="full"
              size="lg"
            >
              Share Resource
            </Button>
          </VStack>
        </Box>
      </Box>
    </Layout>
  );
}
