/**
 * Login Page
 */

import React, { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
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
import { useLogin } from "@/hooks/useAuth";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/lib/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { isAuthenticated } = useAuth();
  const loginMutation = useLogin();

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
      toast({
        title: "Login failed",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
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
    </Container>
  );
}
