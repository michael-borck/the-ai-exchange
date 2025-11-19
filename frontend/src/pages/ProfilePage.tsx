/**
 * User Profile Page - Show contributions, collaboration interests, and settings
 */

import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import {
  VStack,
  HStack,
  Heading,
  Box,
  Input,
  Button,
  useToast,
  Checkbox,
  Text,
  Divider,
  SimpleGrid,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Avatar,
  FormControl,
  FormLabel,
  Spinner,
  Center,
} from "@chakra-ui/react";
import { useAuth } from "@/hooks/useAuth";
import { useUpdateProfile } from "@/hooks/useAuth";
import { useResources } from "@/hooks/useResources";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const updateMutation = useUpdateProfile();

  // Profile edit state
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [isEditing, setIsEditing] = useState(false);

  // Notification preferences
  const [notifyRequests, setNotifyRequests] = useState(
    user?.notification_prefs?.notify_requests ?? true
  );
  const [notifySolutions, setNotifySolutions] = useState(
    user?.notification_prefs?.notify_solutions ?? true
  );

  // Fetch user's contributions from API
  const { data: allResources = [], isLoading: isLoadingResources } = useResources({
    limit: 100,
  });

  // Filter contributions to only those created by current user
  const userContributions = useMemo(() => {
    if (!user?.id) return [];
    return allResources.filter(resource => resource.user_id === user.id);
  }, [allResources, user?.id]);

  const handleSaveProfile = async (e: React.FormEvent) => {
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
      setIsEditing(false);
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
      <VStack align="stretch" spacing={8}>
        {/* Header Section */}
        <Box>
          <HStack spacing={4} mb={4}>
            <Avatar
              size="xl"
              name={user?.full_name || "User"}
              src=""
            />
            <VStack align="flex-start" spacing={0}>
              <HStack spacing={2}>
                <Heading size="lg">{user?.full_name}</Heading>
                {user?.role === "ADMIN" && (
                  <Badge colorScheme="purple" variant="solid">
                    Admin
                  </Badge>
                )}
                <Badge colorScheme="blue" variant="solid">
                  You
                </Badge>
              </HStack>
              <Text color="gray.600" fontSize="sm">
                Lecturer | AI Facilitator
              </Text>
              <Text color="gray.600" fontSize="sm">
                School of Marketing & Management
              </Text>
            </VStack>
          </HStack>

          {/* Teaching/Focus Areas */}
          <Box mt={4}>
            <Text fontSize="sm" fontWeight="bold" color="gray.700" mb={2}>
              Teaching & Research
            </Text>
            <VStack align="flex-start" spacing={1}>
              <HStack>
                <Text fontSize="sm">• ISYS2001: Business Programming</Text>
              </HStack>
              <HStack>
                <Text fontSize="sm">• ISYS6014: Knowledge Management & AI</Text>
              </HStack>
              <HStack>
                <Text fontSize="sm">• ISYS6018: Information Security</Text>
              </HStack>
            </VStack>
          </Box>
        </Box>

        <Divider />

        {/* Main Content Tabs */}
        <Tabs variant="soft-rounded" colorScheme="blue">
          <TabList>
            <Tab>Contributions ({userContributions.length})</Tab>
            <Tab>Collaboration</Tab>
            <Tab>Settings</Tab>
          </TabList>

          <TabPanels>
            {/* Contributions Tab */}
            <TabPanel>
              <VStack align="stretch" spacing={6}>
                <Box>
                  <Text fontSize="sm" color="gray.600" mb={4}>
                    Ideas you've shared that are helping the community
                  </Text>
                  {isLoadingResources ? (
                    <Center py={12}>
                      <Spinner />
                    </Center>
                  ) : userContributions.length === 0 ? (
                    <Box bg="gray.50" p={8} borderRadius="md" textAlign="center">
                      <Text color="gray.600">
                        You haven't shared any ideas yet.{" "}
                        <Button
                          variant="link"
                          colorScheme="blue"
                          onClick={() => navigate("/resources/new")}
                        >
                          Share your first idea →
                        </Button>
                      </Text>
                    </Box>
                  ) : (
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                      {userContributions.map((contribution) => (
                        <Box
                          key={contribution.id}
                          bg="white"
                          border="1px"
                          borderColor="gray.200"
                          borderRadius="md"
                          p={4}
                          cursor="pointer"
                          _hover={{ boxShadow: "md" }}
                          transition="all 0.2s"
                          onClick={() => navigate(`/resources/${contribution.id}`)}
                        >
                          <VStack align="flex-start" spacing={3}>
                            <HStack>
                              <Badge colorScheme="blue" variant="subtle">
                                {contribution.discipline || "General"}
                              </Badge>
                            </HStack>
                            <Heading size="sm">{contribution.title}</Heading>
                            <Divider />
                            <HStack spacing={4} width="full" fontSize="xs">
                              <HStack spacing={1}>
                                <Text color="gray.600">👁️</Text>
                                <Text fontWeight="bold">{contribution.analytics?.view_count || 0}</Text>
                              </HStack>
                              <HStack spacing={1}>
                                <Text color="gray.600">💾</Text>
                                <Text fontWeight="bold">{contribution.analytics?.save_count || 0}</Text>
                              </HStack>
                              <HStack spacing={1}>
                                <Text color="gray.600">✓</Text>
                                <Text fontWeight="bold">{contribution.analytics?.tried_count || 0}</Text>
                              </HStack>
                            </HStack>
                          </VStack>
                        </Box>
                      ))}
                    </SimpleGrid>
                  )}
                </Box>

                {/* Saved Ideas */}
                <Box>
                  <Heading size="md" mb={4}>
                    Saved Ideas
                  </Heading>
                  <Box bg="blue.50" p={4} borderRadius="md" border="1px" borderColor="blue.200">
                    <Text fontSize="sm" color="blue.900">
                      You've saved <strong>{userContributions.length} idea{userContributions.length !== 1 ? "s" : ""}</strong> to your library.{" "}
                      {userContributions.length > 0 && (
                        <Button variant="link" colorScheme="blue" size="sm">
                          View your library →
                        </Button>
                      )}
                    </Text>
                  </Box>
                </Box>
              </VStack>
            </TabPanel>

            {/* Collaboration Tab */}
            <TabPanel>
              <Box bg="blue.50" p={6} borderRadius="lg" border="1px" borderColor="blue.200">
                <VStack align="flex-start" spacing={3}>
                  <Heading size="md" color="blue.900">
                    Collaboration Features Coming Soon
                  </Heading>
                  <Text fontSize="sm" color="blue.800">
                    We're building enhanced collaboration features to help you find and connect with colleagues on shared research interests and projects. This section will include:
                  </Text>
                  <VStack align="flex-start" spacing={2} ml={4} fontSize="sm" color="blue.800">
                    <Text>• Share what you're currently working on</Text>
                    <Text>• Highlight topics you're open to collaborating on</Text>
                    <Text>• Direct messaging with interested colleagues</Text>
                    <Text>• Shared calendar for coordination</Text>
                  </VStack>
                </VStack>
              </Box>
            </TabPanel>

            {/* Settings Tab */}
            <TabPanel>
              <VStack align="stretch" spacing={6} maxW="2xl">
                <Box>
                  <Heading size="md" mb={4}>
                    Profile Information
                  </Heading>
                  <Box as="form" onSubmit={handleSaveProfile} bg="white" p={6} borderRadius="lg" boxShadow="sm">
                    <VStack spacing={6} align="stretch">
                      {/* Email */}
                      <FormControl>
                        <FormLabel fontSize="sm" fontWeight="semibold">
                          Email
                        </FormLabel>
                        <Input value={user?.email} disabled bg="gray.50" />
                        <Text fontSize="xs" color="gray.600" mt={1}>
                          Contact your administrator to change email
                        </Text>
                      </FormControl>

                      {/* Full Name */}
                      <FormControl>
                        <FormLabel fontSize="sm" fontWeight="semibold">
                          Full Name
                        </FormLabel>
                        <Input
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          isDisabled={!isEditing}
                          bg={isEditing ? "white" : "gray.50"}
                        />
                      </FormControl>

                      <Divider />

                      <Heading size="md">Notification Preferences</Heading>

                      {/* Notifications */}
                      <VStack align="flex-start" spacing={4}>
                        <Checkbox
                          isChecked={notifyRequests}
                          onChange={(e) => setNotifyRequests(e.target.checked)}
                          isDisabled={!isEditing}
                        >
                          <VStack align="flex-start" spacing={0} ml={2}>
                            <Text fontSize="sm">Notify me when new ideas match my interests</Text>
                            <Text fontSize="xs" color="gray.600">
                              Get daily digest of new ideas in disciplines you follow
                            </Text>
                          </VStack>
                        </Checkbox>

                        <Checkbox
                          isChecked={notifySolutions}
                          onChange={(e) => setNotifySolutions(e.target.checked)}
                          isDisabled={!isEditing}
                        >
                          <VStack align="flex-start" spacing={0} ml={2}>
                            <Text fontSize="sm">Notify me when people collaborate on my ideas</Text>
                            <Text fontSize="xs" color="gray.600">
                              Get notified when someone wants to work together
                            </Text>
                          </VStack>
                        </Checkbox>
                      </VStack>

                      {/* Action Buttons */}
                      <HStack spacing={3} pt={4}>
                        {!isEditing ? (
                          <Button
                            colorScheme="blue"
                            onClick={() => setIsEditing(true)}
                          >
                            Edit Profile
                          </Button>
                        ) : (
                          <>
                            <Button
                              colorScheme="blue"
                              type="submit"
                              isLoading={updateMutation.isPending}
                            >
                              Save Changes
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => {
                                setIsEditing(false);
                                setFullName(user?.full_name || "");
                              }}
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                      </HStack>
                    </VStack>
                  </Box>
                </Box>

                <Divider />

                {/* Danger Zone */}
                <Box>
                  <Heading size="md" mb={4} color="red.600">
                    Danger Zone
                  </Heading>
                  <Box bg="red.50" p={4} borderRadius="lg" border="1px" borderColor="red.200">
                    <VStack align="flex-start" spacing={3}>
                      <Text fontSize="sm" color="gray.700">
                        Download your data or delete your account permanently
                      </Text>
                      <HStack spacing={3}>
                        <Button colorScheme="red" variant="outline" size="sm">
                          Export Data
                        </Button>
                        <Button colorScheme="red" variant="outline" size="sm">
                          Delete Account
                        </Button>
                      </HStack>
                    </VStack>
                  </Box>
                </Box>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Layout>
  );
}
