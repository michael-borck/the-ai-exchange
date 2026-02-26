/**
 * Email Verification Page - Verify email with 6-digit code
 */

import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Container,
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Input,
  Button,
  Alert,
  AlertIcon,
  useToast,
} from "@chakra-ui/react";
import { useVerifyEmail } from "@/hooks/useAuth";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/lib/api";

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { isAuthenticated } = useAuth();
  const verifyEmailMutation = useVerifyEmail();

  // Get email and email failure flag from location state (passed from register page)
  const email = (location.state?.email as string) || "";
  const emailFailed = location.state?.emailFailed === true;

  const [code, setCode] = useState("");
  const [apiError, setApiError] = useState("");

  // Redirect if already logged in
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  // Redirect if no email provided
  React.useEffect(() => {
    if (!email) {
      navigate("/register");
    }
  }, [email, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");

    if (!code || code.length !== 6) {
      setApiError("Please enter a valid 6-digit code");
      return;
    }

    try {
      await verifyEmailMutation.mutateAsync({
        email,
        code,
      });

      toast({
        title: "Email verified",
        description: "Your account has been verified. You can now log in.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      navigate("/login");
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      setApiError(errorMessage);
      toast({
        title: "Verification failed",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleResendCode = async () => {
    // Optional: Implement resend code functionality
    toast({
      title: "Feature coming soon",
      description: "Resend code functionality will be available soon.",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Container maxW="md" py={{ base: "12", md: "24" }}>
      <VStack spacing={8}>
        <VStack spacing={3} textAlign="center">
          <Heading size="lg">Verify Your Email</Heading>
          <Text color="gray.600">
            {emailFailed
              ? "Your account was created but we couldn't send the verification email."
              : "We've sent a 6-digit verification code to"}
            <br />
            <strong>{email || "your email"}</strong>
          </Text>
        </VStack>

        {emailFailed && (
          <Alert status="warning" borderRadius="md">
            <AlertIcon />
            <Text fontSize="sm">
              The verification email could not be sent. Please contact an
              administrator to verify your account, or try the "Resend Code"
              button below.
            </Text>
          </Alert>
        )}

        <Box width="full" as="form" onSubmit={handleSubmit}>
          <VStack spacing={4}>
            <Box width="full">
              <Text fontSize="sm" fontWeight="medium" mb={2}>
                Verification Code
              </Text>
              <Input
                type="text"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                textAlign="center"
                fontSize="2xl"
                letterSpacing="0.5em"
                fontWeight="bold"
                required
              />
              <Text fontSize="xs" color="gray.600" mt={1}>
                Enter the 6-digit code from your email
              </Text>
            </Box>

            {apiError && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <Text fontSize="sm">{apiError}</Text>
              </Alert>
            )}

            <Button
              width="full"
              colorScheme="blue"
              type="submit"
              isLoading={verifyEmailMutation.isPending}
            >
              Verify Email
            </Button>
          </VStack>
        </Box>

        <VStack spacing={2} width="full">
          <Text fontSize="sm" color="gray.600">
            Didn't receive the code?
          </Text>
          <Button
            width="full"
            variant="ghost"
            size="sm"
            colorScheme="blue"
            onClick={handleResendCode}
          >
            Resend Code
          </Button>
        </VStack>

        <HStack spacing={1} justify="center" width="full">
          <Text fontSize="sm" color="gray.600">
            Back to
          </Text>
          <Button
            variant="link"
            colorScheme="blue"
            fontSize="sm"
            onClick={() => navigate("/register")}
          >
            Registration
          </Button>
        </HStack>
      </VStack>
    </Container>
  );
}
