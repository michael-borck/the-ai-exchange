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
  SimpleGrid,
  Divider,
} from "@chakra-ui/react";
import { useCreateResource } from "@/hooks/useResources";
import { ResourceType } from "@/types/index";

const RESOURCE_TYPES = [
  {
    key: "REQUEST",
    label: "Request",
    description: "Ask for help, advice, or ideas from colleagues",
  },
  {
    key: "USE_CASE",
    label: "Use Case",
    description: "A real-world example of AI applied in your work",
  },
  {
    key: "PROMPT",
    label: "Prompt Template",
    description: "A reusable prompt you've found effective",
  },
  { key: "TOOL", label: "Tool", description: "An AI tool, software, or integration you use" },
  { key: "POLICY", label: "Policy", description: "Guidelines, governance, or ethical frameworks" },
  {
    key: "PAPER",
    label: "Paper",
    description: "A research paper or article you've written or contributed to",
  },
  {
    key: "PROJECT",
    label: "Project",
    description: "Something you've built, are building, or plan to build",
  },
  {
    key: "CONFERENCE",
    label: "Conference",
    description: "A talk or presentation you gave or attended",
  },
  {
    key: "DATASET",
    label: "Dataset",
    description: "A dataset you've created or curated for research",
  },
  { key: "BOOK", label: "Book", description: "A book or textbook you've authored or recommend" },
  { key: "OTHER", label: "Other", description: "Anything that doesn't fit the categories above" },
];

const TOOL_CATEGORIES = [
  { key: "LLM", label: "LLM", description: "Large language models like ChatGPT, Claude, Gemini" },
  {
    key: "CUSTOM_APP",
    label: "Custom App",
    description: "Purpose-built applications using AI APIs",
  },
  { key: "VISION", label: "Vision", description: "Image recognition, generation, or analysis" },
  { key: "SPEECH", label: "Speech", description: "Speech-to-text, text-to-speech, or voice" },
  {
    key: "WORKFLOW",
    label: "Workflow",
    description: "Automation tools like Zapier, Make, or Power Automate",
  },
  {
    key: "DEVELOPMENT",
    label: "Development",
    description: "AI coding assistants and development tools",
  },
  { key: "OTHER", label: "Other", description: "Any other AI tool or technology" },
];

/** Small uppercase section heading inside the form. */
function SectionHeading({ title, hint }: { title: string; hint?: string }) {
  return (
    <VStack align="flex-start" spacing={1} width="full">
      <Text textStyle="eyebrow" color="brand.300">
        {title}
      </Text>
      {hint && (
        <Text fontSize="sm" color="whiteAlpha.600">
          {hint}
        </Text>
      )}
    </VStack>
  );
}

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
              <SimpleGrid columns={{ base: 2, sm: 3, md: 4 }} spacing={2} role="radiogroup">
                {RESOURCE_TYPES.map((rt) => {
                  const isSelected = type === rt.key;
                  return (
                    <Box
                      key={rt.key}
                      as="button"
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      borderWidth="1px"
                      borderColor={isSelected ? "brand.400" : "dark.border"}
                      bg={isSelected ? "brand.900" : "dark.subtle"}
                      color={isSelected ? "brand.100" : "whiteAlpha.700"}
                      borderRadius="lg"
                      px={3}
                      py={2}
                      fontSize="sm"
                      fontWeight={isSelected ? "600" : "500"}
                      textAlign="center"
                      transition="all 0.15s ease"
                      _hover={{ borderColor: "brand.300" }}
                      onClick={() => setType(rt.key as ResourceType)}
                    >
                      {rt.label}
                    </Box>
                  );
                })}
              </SimpleGrid>
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
                <Text fontSize="xs" color={title.length > 100 ? "orange.300" : "whiteAlpha.400"}>
                  {title.length}/120
                </Text>
              </HStack>
              <Input
                value={title}
                maxLength={120}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your resource a clear, descriptive title"
              />
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
              <HStack spacing={2} flexWrap="wrap" rowGap={2}>
                {TOOL_CATEGORIES.map((tool) => {
                  const isSelected = selectedTools.includes(tool.key);
                  return (
                    <Box
                      key={tool.key}
                      as="button"
                      type="button"
                      title={tool.description}
                      aria-pressed={isSelected}
                      px={4}
                      py={1.5}
                      borderRadius="full"
                      border="1px solid"
                      borderColor={isSelected ? "brand.400" : "dark.border"}
                      bg={isSelected ? "brand.900" : "dark.subtle"}
                      color={isSelected ? "brand.200" : "whiteAlpha.700"}
                      fontSize="sm"
                      fontWeight={isSelected ? "600" : "500"}
                      transition="all 0.15s ease"
                      _hover={{ borderColor: "brand.300" }}
                      onClick={() => handleToolToggle(tool.key)}
                    >
                      {isSelected ? "✓ " : ""}
                      {tool.label}
                    </Box>
                  );
                })}
              </HStack>
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
