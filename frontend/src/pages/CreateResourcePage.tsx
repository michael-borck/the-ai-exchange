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
  Tooltip,
  Radio,
  RadioGroup,
  SimpleGrid,
} from "@chakra-ui/react";
import { useCreateResource } from "@/hooks/useResources";
import { ResourceType } from "@/types/index";
const RESOURCE_TYPES = [
  { key: "REQUEST", label: "Request", tooltip: "Ask for help, advice, or ideas from colleagues" },
  { key: "USE_CASE", label: "Use Case", tooltip: "A real-world example of AI applied in your work" },
  { key: "PROMPT", label: "Prompt Template", tooltip: "A reusable prompt you've found effective" },
  { key: "TOOL", label: "Tool", tooltip: "An AI tool, software, or integration you use" },
  { key: "POLICY", label: "Policy", tooltip: "Guidelines, governance, or ethical frameworks" },
  { key: "PAPER", label: "Paper", tooltip: "A research paper or article you've written or contributed to" },
  { key: "PROJECT", label: "Project", tooltip: "Something you've built, are building, or plan to build" },
  { key: "CONFERENCE", label: "Conference", tooltip: "A talk or presentation you gave or attended" },
  { key: "DATASET", label: "Dataset", tooltip: "A dataset you've created or curated for research" },
  { key: "BOOK", label: "Book", tooltip: "A book or textbook you've authored or recommend" },
  { key: "OTHER", label: "Other", tooltip: "Anything that doesn't fit the categories above" },
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
        <Heading size="lg" mb={6}>
          Share Your Resource
        </Heading>

        <Box as="form" onSubmit={handleSubmit} bg="white" p={6} borderRadius="lg" boxShadow="sm">
          <VStack spacing={6}>
            {/* Type */}
            <FormControl isRequired>
              <FormLabel fontWeight="bold">Resource Type</FormLabel>
              <RadioGroup value={type} onChange={(val) => setType(val as ResourceType)}>
                <SimpleGrid columns={{ base: 2, md: 3 }} spacing={2}>
                  {RESOURCE_TYPES.map((rt) => (
                    <Tooltip key={rt.key} label={rt.tooltip} placement="top" hasArrow>
                      <Box
                        borderWidth="1px"
                        borderColor={type === rt.key ? "blue.400" : "gray.200"}
                        bg={type === rt.key ? "blue.50" : "white"}
                        borderRadius="md"
                        px={3}
                        py={2}
                        cursor="pointer"
                        onClick={() => setType(rt.key as ResourceType)}
                        _hover={{ borderColor: "blue.300" }}
                      >
                        <Radio value={rt.key} size="sm">
                          <Text fontSize="sm">{rt.label}</Text>
                        </Radio>
                      </Box>
                    </Tooltip>
                  ))}
                </SimpleGrid>
              </RadioGroup>
              <FormHelperText>Hover over each option for a description</FormHelperText>
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

            {/* Content */}
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

            {/* Anonymous */}
            <FormControl display="flex" alignItems="center">
              <Checkbox
                isChecked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              >
                <Text ml={2}>Post anonymously (your name won't be shown)</Text>
              </Checkbox>
            </FormControl>

            {/* Submit */}
            <Button
              colorScheme="blue"
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
