/**
 * Create Resource Page
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import {
  VStack,
  Heading,
  Input,
  Textarea,
  Select,
  Button,
  Box,
  useToast,
  FormControl,
  FormLabel,
} from "@chakra-ui/react";
import { useCreateResource } from "@/hooks/useResources";
import { ResourceType } from "@/types/index";

export default function CreateResourcePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const createMutation = useCreateResource();

  const [type, setType] = useState<ResourceType>("REQUEST");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createMutation.mutateAsync({
        type,
        title,
        content_text: content,
        is_anonymous: isAnonymous,
      });

      toast({
        title: "Resource created",
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
      <Box maxW="2xl">
        <Heading size="lg" mb={6}>
          Create New Resource
        </Heading>

        <Box as="form" onSubmit={handleSubmit} bg="white" p={6} borderRadius="lg" boxShadow="sm">
          <VStack spacing={6}>
            <FormControl>
              <FormLabel>Type</FormLabel>
              <Select value={type} onChange={(e) => setType(e.target.value as ResourceType)}>
                <option value="REQUEST">Request</option>
                <option value="USE_CASE">Use Case</option>
                <option value="PROMPT">Prompt</option>
                <option value="TOOL">Tool</option>
                <option value="POLICY">Policy</option>
                <option value="PAPER">Paper</option>
                <option value="PROJECT">Project</option>
                <option value="CONFERENCE">Conference</option>
                <option value="DATASET">Dataset</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Title</FormLabel>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title"
                required
              />
            </FormControl>

            <FormControl>
              <FormLabel>Content</FormLabel>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter content"
                minHeight="200px"
                required
              />
            </FormControl>

            <FormControl display="flex" alignItems="center">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
              <FormLabel ml={2} mb={0}>
                Post anonymously
              </FormLabel>
            </FormControl>

            <Button
              colorScheme="blue"
              type="submit"
              isLoading={createMutation.isPending}
              width="full"
            >
              Create Resource
            </Button>
          </VStack>
        </Box>
      </Box>
    </Layout>
  );
}
