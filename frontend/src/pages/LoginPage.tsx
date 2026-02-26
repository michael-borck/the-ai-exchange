/**
 * Login Page
 */

import React, { useState } from "react";
import { useNavigate, useLocation, Link as RouterLink } from "react-router-dom";
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
  useDisclosure,
} from "@chakra-ui/react";
import { useLogin } from "@/hooks/useAuth";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/lib/api";
import PasswordResetFlow from "@/components/PasswordResetFlow";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { isAuthenticated } = useAuth();
  const sessionExpired = location.state?.sessionExpired === true;
  const loginMutation = useLogin();
  const {
    isOpen: isPasswordResetOpen,
    onOpen: onPasswordResetOpen,
    onClose: onPasswordResetClose,
  } = useDisclosure();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Redirect if already logged in
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await loginMutation.mutateAsync({
        email,
        password,
      });

      toast({
        title: "Login successful",
        description: `Welcome back, ${response.full_name}!`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      navigate("/");
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);

      // Check if error is due to unverified account
      if (
        error instanceof Object &&
        "response" in error &&
        (error.response as any)?.status === 403 &&
        (error.response as any)?.data?.detail?.includes("not verified")
      ) {
        toast({
          title: "Account not verified",
          description: "Please verify your email first.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
        navigate("/verify-email", { state: { email } });
      } else {
        toast({
          title: "Login failed",
          description: errorMessage,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  return (
    <Container maxW="md" py={{ base: "12", md: "24" }}>
      <VStack spacing={8}>
        <VStack spacing={3} textAlign="center">
          <Heading size="lg">Welcome to The AI Exchange</Heading>
          <Text color="gray.600">
            Sign in to access requests, share solutions, and grow your AI expertise
          </Text>
        </VStack>

        {sessionExpired && (
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <Text fontSize="sm">
              For your security, you've been logged out after a period of
              inactivity. Please log in again.
            </Text>
          </Alert>
        )}

        <Box width="full" as="form" onSubmit={handleSubmit}>
          <VStack spacing={4}>
            <Box width="full">
              <Text fontSize="sm" fontWeight="medium" mb={2}>
                Email
              </Text>
              <Input
                type="email"
                placeholder="you@curtin.edu.au"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Box>

            <Box width="full">
              <Text fontSize="sm" fontWeight="medium" mb={2}>
                Password
              </Text>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Box>

            {loginMutation.isError && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <Text fontSize="sm">
                  Invalid email or password. Please try again.
                </Text>
              </Alert>
            )}

            <Button
              width="full"
              colorScheme="blue"
              type="submit"
              isLoading={loginMutation.isPending}
            >
              Sign In
            </Button>
          </VStack>
        </Box>

        <VStack spacing={2} width="full">
          <Button
            width="full"
            variant="ghost"
            size="sm"
            colorScheme="blue"
            onClick={onPasswordResetOpen}
          >
            Forgot password?
          </Button>
        </VStack>

        <HStack spacing={1} justify="center">
          <Text fontSize="sm" color="gray.600">
            Don't have an account?
          </Text>
          <RouterLink to="/register">
            <Button variant="link" colorScheme="blue" fontSize="sm">
              Create account
            </Button>
          </RouterLink>
        </HStack>
      </VStack>

      <PasswordResetFlow
        isOpen={isPasswordResetOpen}
        onClose={onPasswordResetClose}
        onSuccess={() => {
          toast({
            title: "Password reset successful",
            description: "Please log in with your new password",
            status: "success",
            duration: 3000,
            isClosable: true,
          });
        }}
      />
    </Container>
  );
}
