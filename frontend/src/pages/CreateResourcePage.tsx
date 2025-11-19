/**
 * Create Resource Page
 */

import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import {
  VStack,
  HStack,
  Heading,
  Input,
  Textarea,
  Select,
  Button,
  Box,
  useToast,
  FormControl,
  FormLabel,
  FormHelperText,
  Checkbox,
  Text,
} from "@chakra-ui/react";
import { useCreateResource } from "@/hooks/useResources";
import { ResourceType } from "@/types/index";

const DISCIPLINES = ["MARKETING", "BUSINESS", "SUPPLY_CHAIN", "HR", "TOURISM", "ACCOUNTING", "LAW"];
const COLLABORATION_STATUSES = ["SEEKING", "PROVEN", "HAS_MATERIALS"];
const TOOL_CATEGORIES = ["LLM", "CUSTOM_APP", "VISION", "SPEECH", "WORKFLOW", "DEVELOPMENT", "OTHER"];

export default function CreateResourcePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const createMutation = useCreateResource();

  const [type, setType] = useState<ResourceType>("REQUEST");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [collaborationStatus, setCollaborationStatus] = useState("");
  const [timeSavedValue, setTimeSavedValue] = useState("");
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [userTags, setUserTags] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Pre-populate discipline from user's disciplines if available
  const defaultDiscipline = useMemo(() => {
    if (discipline) return discipline;
    if (user?.disciplines && user.disciplines.length > 0) {
      return user.disciplines[0];
    }
    return "";
  }, [user?.disciplines, discipline]);

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

      if (discipline) contentMeta.discipline = discipline;
      if (collaborationStatus) contentMeta.collaboration_status = collaborationStatus;
      if (timeSavedValue) contentMeta.time_saved_value = parseInt(timeSavedValue);
      if (selectedTools.length > 0) contentMeta.tools_used = selectedTools;
      if (userTags) contentMeta.user_tags = userTags.split(",").map((t) => t.trim());

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
      <Box maxW="3xl">
        <Heading size="lg" mb={6}>
          Share Your Resource
        </Heading>

        <Box as="form" onSubmit={handleSubmit} bg="white" p={6} borderRadius="lg" boxShadow="sm">
          <VStack spacing={6}>
            {/* Type */}
            <FormControl isRequired>
              <FormLabel fontWeight="bold">Resource Type</FormLabel>
              <Select value={type} onChange={(e) => setType(e.target.value as ResourceType)}>
                <option value="REQUEST">Request / Question</option>
                <option value="USE_CASE">Use Case</option>
                <option value="PROMPT">Prompt Template</option>
                <option value="TOOL">AI Tool / Integration</option>
                <option value="POLICY">Policy / Guidelines</option>
                <option value="PAPER">Research Paper</option>
                <option value="PROJECT">Project / Example</option>
                <option value="CONFERENCE">Conference Talk / Presentation</option>
                <option value="DATASET">Dataset / Data</option>
              </Select>
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

            {/* Discipline */}
            <FormControl>
              <FormLabel fontWeight="bold">Your Discipline</FormLabel>
              <Select
                value={defaultDiscipline}
                onChange={(e) => setDiscipline(e.target.value)}
                placeholder="Select your primary discipline"
              >
                {DISCIPLINES.map((d) => (
                  <option key={d} value={d}>
                    {d.replace(/_/g, " ")}
                  </option>
                ))}
              </Select>
              <FormHelperText>This helps categorize your contribution</FormHelperText>
            </FormControl>

            {/* Collaboration Status */}
            <FormControl>
              <FormLabel fontWeight="bold">Are You Seeking Collaborators?</FormLabel>
              <Select
                value={collaborationStatus}
                onChange={(e) => setCollaborationStatus(e.target.value)}
                placeholder="Select collaboration status"
              >
                <option value="SEEKING">Yes, actively seeking collaborators</option>
                <option value="PROVEN">Already tested and proven</option>
                <option value="HAS_MATERIALS">Have materials to share</option>
              </Select>
              <FormHelperText>Let others know how they can engage with your work</FormHelperText>
            </FormControl>

            {/* Tools Used */}
            <FormControl>
              <FormLabel fontWeight="bold">AI Tools & Technologies Used</FormLabel>
              <Box borderWidth="1px" borderColor="gray.200" borderRadius="md" p={4} bg="gray.50">
                {TOOL_CATEGORIES.map((tool) => (
                  <Checkbox
                    key={tool}
                    mb={2}
                    isChecked={selectedTools.includes(tool)}
                    onChange={() => handleToolToggle(tool)}
                  >
                    {tool.replace("_", " ")}
                  </Checkbox>
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
