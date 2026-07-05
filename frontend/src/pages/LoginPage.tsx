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
  FormControl,
  FormLabel,
  useToast,
  useDisclosure,
} from "@chakra-ui/react";
import { useLogin } from "@/hooks/useAuth";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
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
        axios.isAxiosError(error) &&
        error.response?.status === 403 &&
        error.response?.data?.detail?.includes("not verified")
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
          <Text color="whiteAlpha.600">
            Sign in to access requests, share solutions, and grow your AI expertise
          </Text>
        </VStack>

        {sessionExpired && (
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <Text fontSize="sm">
              For your security, you've been logged out after a period of inactivity. Please log in
              again.
            </Text>
          </Alert>
        )}

        <Box
          width="full"
          layerStyle="card"
          p={{ base: 6, md: 8 }}
          as="form"
          onSubmit={handleSubmit}
        >
          <VStack spacing={5}>
            <FormControl isRequired>
              <FormLabel requiredIndicator={<></>}>Email</FormLabel>
              <Input
                type="email"
                placeholder="you@curtin.edu.au"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </FormControl>

            <FormControl isRequired>
              <HStack justify="space-between" align="center" mb={2}>
                <FormLabel mb={0} requiredIndicator={<></>}>
                  Password
                </FormLabel>
                <Button
                  variant="link"
                  size="sm"
                  colorScheme="brand"
                  fontWeight="500"
                  onClick={onPasswordResetOpen}
                >
                  Forgot password?
                </Button>
              </HStack>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </FormControl>

            {loginMutation.isError && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <Text fontSize="sm">Invalid email or password. Please try again.</Text>
              </Alert>
            )}

            <Button
              width="full"
              size="lg"
              colorScheme="brand"
              type="submit"
              isLoading={loginMutation.isPending}
            >
              Sign In
            </Button>
          </VStack>
        </Box>

        <HStack spacing={1} justify="center">
          <Text fontSize="sm" color="whiteAlpha.600">
            Don't have an account?
          </Text>
          <RouterLink to="/register">
            <Button variant="link" colorScheme="brand" fontSize="sm">
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
