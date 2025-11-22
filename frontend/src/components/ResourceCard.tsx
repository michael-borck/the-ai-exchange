/**
 * Reusable Resource Card Component
 * Used across HomePage, ResourcesPage, and other listing views
 */

import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useSaveResource, useIsResourceSaved, useTriedResource } from "@/hooks/useEngagement";
import { useAuth } from "@/hooks/useAuth";

export interface ResourceCardProps {
  id: string;
  title: string;
  author: string;
  area?: string;
  tools: string[];
  quickSummary: string;
  timeSaved?: number;
  views: number;
  tried: number;
  saves?: number;
  created_at: string;
  variant?: "home" | "browse"; // Layout variant
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  id,
  title,
  author,
  area,
  tools,
  quickSummary,
  timeSaved,
  views,
  tried,
  saves = 0
  created_at,
  variant = "home",
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isLoggedIn = !!user;

  const saveResourceMutation = useSaveResource();
  const triedResourceMutation = useTriedResource();
  const { data: isSavedData } = useIsResourceSaved(id, isLoggedIn);
  const hasSaved = isSavedData ?? false;

  const handleLoginClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate("/login");
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await saveResourceMutation.mutateAsync(id);
    } catch (error) {
      console.error("Failed to save resource:", error);
    }
  };

  const handleTried = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await triedResourceMutation.mutateAsync(id);
    } catch (error) {
      console.error("Failed to mark as tried:", error);
    }
  };

  if (variant === "browse") {
    return (
      <Box
        bg="white"
        border="1px"
        borderColor="gray.200"
        borderRadius="md"
        p={4}
        cursor="pointer"
        _hover={{ boxShadow: "md", transform: "translateY(-2px)" }}
        transition="all 0.2s"
        onClick={() => navigate(`/resources/${id}`)}
      >
        <VStack align="flex-start" spacing={3}>
          {/* Header with badges */}
          <HStack spacing={2} width="full" justify="space-between">
            <HStack spacing={2}>
              {area && (
                <Text
                  fontSize="xs"
                  fontWeight="bold"
                  color="blue.600"
                  bg="blue.50"
                  px={2}
                  py={1}
                  borderRadius="full"
                >
                  {area}
                </Text>
              )}
</HStack>
          </HStack>

          {/* Title */}
          <Heading size="sm" lineHeight="tight">
            {title}
          </Heading>

          {/* Author info - only for logged-in users */}
          {isLoggedIn && (
            <Text fontSize="xs" color="gray.600">
              {author} • {timeSaved || 2} hrs/week saved
            </Text>
          )}

          {/* Summary */}
          <Text fontSize="sm" color="gray.700" lineHeight="1.4">
            {quickSummary}
          </Text>

          {/* Tools */}
          <HStack spacing={2} fontSize="xs" flexWrap="wrap">
            {tools.map((tool: string) => (
              <Text key={tool} bg="gray.100" px={2} py={1} borderRadius="full">
                {tool}
              </Text>
            ))}
          </HStack>

          {/* Created date and engagement stats */}
          <HStack
            spacing={2}
            fontSize="xs"
            color="gray.500"
            width="full"
            justify="space-between"
            pt={1}
            pb={2}
          >
            <Text>
              {new Date(created_at || new Date()).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
            <HStack spacing={2}>
              <Text title="Views">👁️ {views}</Text>
              <Text title="Tried It">🧪 {tried}</Text>
              <Text title="Saves">📌 {saves}</Text>
            </HStack>
          </HStack>

          {/* Action buttons */}
          <HStack
            spacing={2}
            fontSize="sm"
            width="full"
            justify="flex-end"
            pt={2}
            borderTop="1px"
            borderColor="gray.100"
          >
            {isLoggedIn ? (
              <>
                <Button
                  size="xs"
                  variant="ghost"
                  colorScheme="green"
                  onClick={handleTried}
                  isLoading={triedResourceMutation.isPending}
                >
                  🧪 Tried
                </Button>
                <Button
                  size="xs"
                  variant={hasSaved ? "solid" : "ghost"}
                  colorScheme="blue"
                  onClick={handleSave}
                  isLoading={saveResourceMutation.isPending}
                >
                  {hasSaved ? "✓ Saved" : "📌 Save"}
                </Button>
              </>
            ) : (
              <Button size="xs" variant="ghost" colorScheme="blue" onClick={handleLoginClick}>
                Login to collaborate
              </Button>
            )}
          </HStack>
        </VStack>
      </Box>
    );
  }

  // Default "home" variant
  return (
    <Box
      bg="white"
      border="1px"
      borderColor="gray.200"
      borderRadius="md"
      p={4}
      cursor="pointer"
      _hover={{ boxShadow: "md", transform: "translateY(-2px)" }}
      transition="all 0.2s"
      onClick={() => navigate(`/resources/${id}`)}
    >
      <VStack align="flex-start" spacing={2}>
        <HStack spacing={2} width="full" justify="space-between">
          <HStack spacing={1}>
            {area && (
              <Text fontSize="xs" fontWeight="bold" color="blue.600" bg="blue.50" px={2} py={1} borderRadius="full">
                {area}
              </Text>
            )}
          </HStack>
        </HStack>

        <Heading size="sm" lineHeight="tight">
          {title}
        </Heading>

        {/* Only show author and time saved for logged-in users */}
        {isLoggedIn && (
          <Text fontSize="xs" color="gray.600">
            {author} • {timeSaved || 2} hrs/week saved
          </Text>
        )}

        <Text fontSize="sm" color="gray.700" lineHeight="1.4">
          {quickSummary}
        </Text>

        <HStack spacing={2} fontSize="xs">
          {tools.map((tool: string) => (
            <Text key={tool} bg="gray.100" px={2} py={1} borderRadius="full">
              {tool}
            </Text>
          ))}
        </HStack>

        {/* Created date */}
        <Text fontSize="xs" color="gray.500">
          {new Date(created_at || new Date()).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </Text>

        {/* Engagement stats - visible to all users */}
        <HStack spacing={4} fontSize="xs" color="gray.600" width="full" pt={1}>
          <HStack spacing={1}>
            <Text title="Views">👁️ {views}</Text>
          </HStack>
          <HStack spacing={1}>
            <Text title="People who tried it">🧪 {tried}</Text>
          </HStack>
          <HStack spacing={1}>
            <Text title="People who saved it">📌 {saves || 0}</Text>
          </HStack>
        </HStack>

        {/* Action buttons */}
        <HStack spacing={2} fontSize="sm" width="full" justify="flex-end" pt={2} borderTop="1px" borderColor="gray.100">
          {isLoggedIn ? (
            <>
              <Button
                size="xs"
                variant="ghost"
                colorScheme="green"
                onClick={handleTried}
                isLoading={triedResourceMutation.isPending}
              >
                🧪 Tried
              </Button>
              <Button
                size="xs"
                variant={hasSaved ? "solid" : "ghost"}
                colorScheme="blue"
                onClick={handleSave}
                isLoading={saveResourceMutation.isPending}
              >
                {hasSaved ? "✓ Saved" : "📌 Save"}
              </Button>
            </>
          ) : (
            <Button size="xs" variant="ghost" colorScheme="blue" onClick={handleLoginClick}>
              Login to collaborate
            </Button>
          )}
        </HStack>
      </VStack>
    </Box>
  );
};
