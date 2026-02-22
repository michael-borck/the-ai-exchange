/**
 * Password Reset Flow Component
 * Multi-step password reset modal with email verification and password update
 */

import React, { useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  Input,
  VStack,
  Text,
  Alert,
  AlertIcon,
  Box,
  Heading,
  Divider,
  UnorderedList,
  ListItem,
} from "@chakra-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import { getErrorMessage, api } from "@/lib/api";

interface PasswordResetFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type Step = "request" | "verify" | "reset" | "complete";

export default function PasswordResetFlow({
  isOpen,
  onClose,
  onSuccess,
}: PasswordResetFlowProps) {
  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await api.post("/auth/forgot-password", {
        email,
      });
      setCurrentStep("verify");
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Verify the code by attempting to reset the password (we just verify the code is valid)
      // The actual verification happens when they submit the new password
      if (code.length !== 6) {
        setError("Reset code must be 6 digits");
        setIsLoading(false);
        return;
      }
      setCurrentStep("reset");
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Client-side validation
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!/(?=.*[A-Z])/.test(newPassword)) {
      setError("Password must contain at least one uppercase letter");
      return;
    }

    if (!/(?=.*[a-z])/.test(newPassword)) {
      setError("Password must contain at least one lowercase letter");
      return;
    }

    if (!/(?=.*\d)/.test(newPassword)) {
      setError("Password must contain at least one number");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      await api.post("/auth/reset-password", {
        email,
        code,
        new_password: newPassword,
      });

      setCurrentStep("complete");

      // Clear auth state and refresh
      queryClient.clear();

      // Redirect after delay
      setTimeout(() => {
        onSuccess?.();
        handleClose();
      }, 2000);
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentStep("request");
    setEmail("");
    setCode("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    onClose();
  };

  const renderStep = () => {
    switch (currentStep) {
      case "request":
        return (
          <VStack spacing={4} width="full">
            <VStack spacing={2} textAlign="center" width="full">
              <Heading size="md">Reset Password</Heading>
              <Text fontSize="sm" color="gray.600">
                Enter your email address and we'll send you a code to reset your password.
              </Text>
            </VStack>

            {error && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <Text fontSize="sm">{error}</Text>
              </Alert>
            )}

            <form onSubmit={handleRequestReset} style={{ width: "100%" }}>
              <VStack spacing={3} width="full">
                <Box width="full">
                  <Text fontSize="sm" fontWeight="medium" mb={1}>
                    Email Address
                  </Text>
                  <Input
                    type="email"
                    placeholder="you@curtin.edu.au"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </Box>

                <Button
                  width="full"
                  colorScheme="blue"
                  type="submit"
                  isLoading={isLoading}
                >
                  Send Reset Code
                </Button>
              </VStack>
            </form>
          </VStack>
        );

      case "verify":
        return (
          <VStack spacing={4} width="full">
            <Button
              alignSelf="flex-start"
              variant="ghost"
              size="sm"
              onClick={() => setCurrentStep("request")}
              disabled={isLoading}
            >
              ← Back
            </Button>

            <VStack spacing={2} textAlign="center" width="full">
              <Heading size="md">Enter Reset Code</Heading>
              <Text fontSize="sm" color="gray.600">
                We've sent a 6-digit code to <strong>{email}</strong>
              </Text>
            </VStack>

            {error && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <Text fontSize="sm">{error}</Text>
              </Alert>
            )}

            <form onSubmit={handleVerifyCode} style={{ width: "100%" }}>
              <VStack spacing={3} width="full">
                <Box width="full">
                  <Text fontSize="sm" fontWeight="medium" mb={1}>
                    Verification Code
                  </Text>
                  <Input
                    type="text"
                    placeholder="000000"
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    textAlign="center"
                    fontSize="lg"
                    letterSpacing="widest"
                    maxLength={6}
                    disabled={isLoading}
                    required
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    {code.length}/6 digits
                  </Text>
                </Box>

                <Button
                  width="full"
                  colorScheme="blue"
                  type="submit"
                  isDisabled={code.length !== 6 || isLoading}
                  isLoading={isLoading}
                >
                  Verify Code
                </Button>
              </VStack>
            </form>
          </VStack>
        );

      case "reset":
        return (
          <VStack spacing={4} width="full">
            <VStack spacing={2} textAlign="center" width="full">
              <Heading size="md">Set New Password</Heading>
              <Text fontSize="sm" color="gray.600">
                Choose a strong password for your account
              </Text>
            </VStack>

            {error && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <Text fontSize="sm">{error}</Text>
              </Alert>
            )}

            <form onSubmit={handleResetPassword} style={{ width: "100%" }}>
              <VStack spacing={4} width="full">
                <Box width="full">
                  <Text fontSize="sm" fontWeight="medium" mb={1}>
                    New Password
                  </Text>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    At least 8 characters with uppercase, lowercase, and number
                  </Text>
                </Box>

                <Box width="full">
                  <Text fontSize="sm" fontWeight="medium" mb={1}>
                    Confirm Password
                  </Text>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </Box>

                <Box width="full" borderWidth={1} borderRadius="md" p={3} bg="blue.50">
                  <Text fontSize="xs" fontWeight="medium" color="blue.900" mb={2}>
                    Password requirements:
                  </Text>
                  <UnorderedList fontSize="xs" color="blue.800" spacing={1}>
                    <ListItem>At least 8 characters</ListItem>
                    <ListItem>One uppercase letter (A-Z)</ListItem>
                    <ListItem>One lowercase letter (a-z)</ListItem>
                    <ListItem>One number (0-9)</ListItem>
                  </UnorderedList>
                </Box>

                <Button
                  width="full"
                  colorScheme="blue"
                  type="submit"
                  isLoading={isLoading}
                >
                  Reset Password
                </Button>
              </VStack>
            </form>
          </VStack>
        );

      case "complete":
        return (
          <VStack spacing={4} textAlign="center" py={6}>
            <Box
              width={16}
              height={16}
              borderRadius="full"
              bg="green.100"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Text fontSize="2xl">✓</Text>
            </Box>
            <VStack spacing={2}>
              <Heading size="md">Password Reset Complete!</Heading>
              <Text fontSize="sm" color="gray.600">
                Your password has been successfully reset.
              </Text>
              <Text fontSize="sm" color="gray.600">
                Redirecting to login...
              </Text>
            </VStack>
          </VStack>
        );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered size="sm">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Password Reset</ModalHeader>
        <ModalCloseButton isDisabled={isLoading || currentStep === "complete"} />
        <Divider />
        <ModalBody pt={6}>{renderStep()}</ModalBody>
      </ModalContent>
    </Modal>
  );
}
