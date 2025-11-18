/**
 * User Profile Page
 */

import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import {
  VStack,
  Heading,
  Box,
  Input,
  Button,
  useToast,
  Checkbox,
  Text,
  Divider,
} from "@chakra-ui/react";
import { useAuth } from "@/hooks/useAuth";
import { useUpdateProfile } from "@/hooks/useAuth";

export default function ProfilePage() {
  const { user } = useAuth();
  const toast = useToast();
  const updateMutation = useUpdateProfile();

  const [fullName, setFullName] = useState(user?.full_name || "");
  const [notifyRequests, setNotifyRequests] = useState(
    user?.notification_prefs?.notify_requests ?? true
  );
  const [notifySolutions, setNotifySolutions] = useState(
    user?.notification_prefs?.notify_solutions ?? true
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateMutation.mutateAsync({
        full_name: fullName,
        notification_prefs: {
          notify_requests: notifyRequests,
          notify_solutions: notifySolutions,
        },
      });

      toast({
        title: "Profile updated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Failed to update profile",
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
          My Profile
        </Heading>

        <Box as="form" onSubmit={handleSubmit} bg="white" p={6} borderRadius="lg" boxShadow="sm">
          <VStack spacing={6} align="stretch">
            {/* Profile Info */}
            <Box>
              <Text fontWeight="medium" mb={2}>Email</Text>
              <Input value={user?.email} disabled />
            </Box>

            <Box>
              <Text fontWeight="medium" mb={2}>Full Name</Text>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </Box>

            <Divider />

            {/* Notification Preferences */}
            <Box>
              <Heading size="md" mb={4}>Notification Preferences</Heading>
              <VStack align="flex-start" spacing={4}>
                <Checkbox
                  isChecked={notifyRequests}
                  onChange={(e) => setNotifyRequests(e.target.checked)}
                >
                  Notify me when new requests are posted
                </Checkbox>
                <Checkbox
                  isChecked={notifySolutions}
                  onChange={(e) => setNotifySolutions(e.target.checked)}
                >
                  Notify me when solutions are posted to my requests
                </Checkbox>
              </VStack>
            </Box>

            <Button
              colorScheme="blue"
              type="submit"
              isLoading={updateMutation.isPending}
            >
              Save Changes
            </Button>
          </VStack>
        </Box>
      </Box>
    </Layout>
  );
}
