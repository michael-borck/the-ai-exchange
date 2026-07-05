/**
 * Reusable Resource Card Component
 * Used across HomePage, ResourcesPage, and other listing views
 */

import { useNavigate } from "react-router-dom";
import {
  Badge,
  Box,
  Button,
  Heading,
  HStack,
  Icon,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { ViewIcon, RepeatIcon, StarIcon, TimeIcon } from "@chakra-ui/icons";
import { useSaveResource, useIsResourceSaved, useTriedResource } from "@/hooks/useEngagement";
import { useDeleteResource } from "@/hooks/useResources";
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
  user_id?: string; // Resource owner ID, needed for admin delete capability
}

function StatItem({ icon, value, label }: { icon: typeof ViewIcon; value: number; label: string }) {
  return (
    <HStack spacing={1} title={label} color="whiteAlpha.500">
      <Icon as={icon} boxSize={3} />
      <Text>{value}</Text>
    </HStack>
  );
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
  saves = 0,
  created_at,
  user_id,
}) => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const isLoggedIn = !!user;

  const saveResourceMutation = useSaveResource();
  const triedResourceMutation = useTriedResource();
  const deleteResourceMutation = useDeleteResource();
  const { data: isSavedData } = useIsResourceSaved(id, isLoggedIn);
  const hasSaved = isSavedData ?? false;

  const isOwner = user && user_id && user.id === user_id;
  const isAdmin = user && user.role === "ADMIN";
  const canDelete = isOwner || isAdmin;

  const handleLoginClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate("/login");
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await saveResourceMutation.mutateAsync(id);
    } catch {
      toast({
        title: "Failed to save resource",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleTried = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await triedResourceMutation.mutateAsync(id);
    } catch {
      toast({
        title: "Failed to mark as tried",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      !window.confirm(
        "Are you sure you want to delete this resource? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await deleteResourceMutation.mutateAsync(id);
      toast({
        title: "Resource deleted",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      // Optionally redirect or refresh the page
      window.location.reload();
    } catch {
      toast({
        title: "Failed to delete resource",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box
      layerStyle="cardHover"
      p={5}
      cursor="pointer"
      display="flex"
      flexDirection="column"
      onClick={() => navigate(`/resources/${id}`)}
    >
      <VStack align="flex-start" spacing={3} flex={1} width="full">
        {/* Area badge + time saved */}
        <HStack spacing={2} width="full" justify="space-between">
          {area ? (
            <Badge bg="brand.900" color="brand.200" fontSize="xs">
              {area}
            </Badge>
          ) : (
            <Box />
          )}
          {isLoggedIn && timeSaved !== undefined && timeSaved > 0 && (
            <HStack spacing={1} color="green.300" fontSize="xs" flexShrink={0}>
              <Icon as={TimeIcon} boxSize={3} />
              <Text fontWeight="600">{timeSaved} hrs/wk saved</Text>
            </HStack>
          )}
        </HStack>

        {/* Title */}
        <Heading size="sm" lineHeight="1.35" noOfLines={2}>
          {title}
        </Heading>

        {/* Author info - only for logged-in users */}
        {isLoggedIn && (
          <Text fontSize="xs" color="whiteAlpha.600">
            {author}
          </Text>
        )}

        {/* Summary */}
        <Text fontSize="sm" color="whiteAlpha.700" lineHeight="1.5" noOfLines={3}>
          {quickSummary}
        </Text>

        {/* Tools */}
        {tools.length > 0 && (
          <HStack spacing={2} fontSize="xs" flexWrap="wrap">
            {tools.map((tool: string) => (
              <Text
                key={tool}
                bg="whiteAlpha.100"
                color="whiteAlpha.700"
                px={2}
                py={0.5}
                borderRadius="full"
              >
                {tool}
              </Text>
            ))}
          </HStack>
        )}
      </VStack>

      {/* Created date and engagement stats */}
      <HStack
        spacing={3}
        fontSize="xs"
        color="whiteAlpha.500"
        width="full"
        justify="space-between"
        pt={3}
      >
        <Text>
          {new Date(created_at || new Date()).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </Text>
        <HStack spacing={3}>
          <StatItem icon={ViewIcon} value={views} label="Views" />
          <StatItem icon={RepeatIcon} value={tried} label="People who tried it" />
          <StatItem icon={StarIcon} value={saves} label="People who saved it" />
        </HStack>
      </HStack>

      {/* Action buttons */}
      <HStack
        spacing={2}
        fontSize="sm"
        width="full"
        justify="flex-end"
        pt={3}
        mt={3}
        borderTop="1px solid"
        borderColor="dark.divider"
      >
        {isLoggedIn ? (
          <>
            {canDelete && (
              <Button
                size="xs"
                variant="ghost"
                colorScheme="red"
                onClick={handleDelete}
                isLoading={deleteResourceMutation.isPending}
              >
                Delete
              </Button>
            )}
            <Button
              size="xs"
              variant="ghost"
              colorScheme="green"
              leftIcon={<RepeatIcon />}
              onClick={handleTried}
              isLoading={triedResourceMutation.isPending}
            >
              Tried
            </Button>
            <Button
              size="xs"
              variant={hasSaved ? "solid" : "ghost"}
              colorScheme="brand"
              leftIcon={<StarIcon />}
              onClick={handleSave}
              isLoading={saveResourceMutation.isPending}
            >
              {hasSaved ? "Saved" : "Save"}
            </Button>
          </>
        ) : (
          <Button size="xs" variant="ghost" colorScheme="brand" onClick={handleLoginClick}>
            Login to collaborate
          </Button>
        )}
      </HStack>
    </Box>
  );
};
