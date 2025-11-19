/**
 * Collaboration Modal Component
 * Allows users to express interest in collaborating on an idea
 */

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Textarea,
  Box,
  Checkbox,
  FormControl,
  FormLabel,
  useToast,
} from "@chakra-ui/react";
import { useState } from "react";

interface CollaborationModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceTitle: string;
  authorName: string;
  authorEmail: string;
  collaborationStatus: string;
}

export function CollaborationModal({
  isOpen,
  onClose,
  resourceTitle,
  authorName,
  authorEmail,
  collaborationStatus,
}: CollaborationModalProps) {
  const toast = useToast();
  const [message, setMessage] = useState(
    "I'm working on something similar and would love to collaborate!"
  );
  const [contactMethod, setContactMethod] = useState<string>("email");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast({
        title: "Message required",
        description: "Please enter a message",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call - will be replaced with actual endpoint
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: "Collaboration request sent!",
        description: `Your message has been sent to ${authorName}`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Reset form
      setMessage("I'm working on something similar and would love to collaborate!");
      setContactMethod("email");
      onClose();
    } catch (error) {
      toast({
        title: "Failed to send request",
        description: "Please try again",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const collaborationStatusLabel = {
    SEEKING: "Open to collaborators",
    PROVEN: "Proven & tested",
    HAS_MATERIALS: "Has shareable materials",
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Collaborate on This Idea</ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <VStack align="stretch" spacing={6}>
            {/* Resource info */}
            <Box bg="blue.50" p={4} borderRadius="md" border="1px" borderColor="blue.200">
              <VStack align="flex-start" spacing={2}>
                <Text fontSize="sm" fontWeight="semibold" color="blue.900">
                  {resourceTitle}
                </Text>
                <Text fontSize="xs" color="blue.800">
                  by {authorName}
                </Text>
                <Text fontSize="xs" color="blue.700">
                  Status: {collaborationStatusLabel[collaborationStatus as keyof typeof collaborationStatusLabel] || "Unknown"}
                </Text>
              </VStack>
            </Box>

            {/* Message */}
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="semibold">
                Your Message
              </FormLabel>
              <Textarea
                placeholder="Tell them what you're working on and why you want to collaborate..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                minH="120px"
                resize="vertical"
              />
              <Text fontSize="xs" color="gray.600" mt={2}>
                Be specific about what you're working on and how you think you could collaborate.
              </Text>
            </FormControl>

            {/* Contact method */}
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="semibold" mb={3}>
                How should they contact you?
              </FormLabel>
              <VStack align="flex-start" spacing={2}>
                <Checkbox
                  isChecked={contactMethod === "email"}
                  onChange={() => setContactMethod("email")}
                >
                  <VStack align="flex-start" spacing={0} ml={2}>
                    <Text fontSize="sm">Email</Text>
                    <Text fontSize="xs" color="gray.600">
                      {authorEmail}
                    </Text>
                  </VStack>
                </Checkbox>
                <Checkbox
                  isChecked={contactMethod === "internal_message"}
                  onChange={() => setContactMethod("internal_message")}
                >
                  <VStack align="flex-start" spacing={0} ml={2}>
                    <Text fontSize="sm">Internal Messaging</Text>
                    <Text fontSize="xs" color="gray.600">
                      Through this platform
                    </Text>
                  </VStack>
                </Checkbox>
              </VStack>
            </FormControl>

            {/* Info */}
            <Box bg="gray.50" p={3} borderRadius="md" borderLeft="4px" borderColor="gray.300">
              <Text fontSize="xs" color="gray.700">
                <strong>Note:</strong> Your name and contact information will be shared with the author
                only if they choose to respond.
              </Text>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSubmit}
              isLoading={isSubmitting}
            >
              Send Request
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
