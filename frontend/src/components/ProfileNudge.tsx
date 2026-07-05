/**
 * Dismissible banner nudging users to finish their profile.
 *
 * Signup only asks for name/email/password; specialty and roles are optional
 * and power the browse filters, so we prompt for them here instead.
 */

import { useState } from "react";
import { Button, CloseButton, HStack, Text } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const DISMISS_KEY = "profile-nudge-dismissed";

export function ProfileNudge() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === "1");

  const incomplete = user && (!user.specialties?.length || !(user.professional_roles?.length ?? 0));

  if (!incomplete || dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  return (
    <HStack
      layerStyle="card"
      bg="brand.900"
      borderColor="brand.700"
      px={4}
      py={3}
      spacing={4}
      justify="space-between"
    >
      <Text fontSize="sm" color="brand.100">
        Add your specialty and roles so colleagues can find your expertise — it takes 20 seconds.
      </Text>
      <HStack spacing={2} flexShrink={0}>
        <Button size="sm" colorScheme="brand" onClick={() => navigate("/profile")}>
          Complete profile
        </Button>
        <CloseButton size="sm" onClick={handleDismiss} aria-label="Dismiss" />
      </HStack>
    </HStack>
  );
}
