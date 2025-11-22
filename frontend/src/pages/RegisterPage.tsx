/**
 * Register Page
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
  Select,
  FormLabel,
} from "@chakra-ui/react";
import { useRegister } from "@/hooks/useAuth";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/lib/api";
import { ProfessionalRole, PROFESSIONAL_ROLES } from "@/types/index";

export default function RegisterPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { isAuthenticated } = useAuth();
  const registerMutation = useRegister();

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [professionalRole, setProfessionalRole] = useState<ProfessionalRole>("Educator");
  const [passwordError, setPasswordError] = useState("");
  const [apiError, setApiError] = useState("");

  // Redirect if already logged in
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setApiError("");

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    try {
      const response = await registerMutation.mutateAsync({
        email,
        full_name: fullName,
        password,
        professional_role: professionalRole,
      });

      toast({
        title: "Account created successfully",
        description: `Welcome, ${response.full_name}!`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      navigate("/");
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      setApiError(errorMessage);
      toast({
        title: "Registration failed",
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
          <Heading size="lg">Join The AI Exchange</Heading>
          <Text color="gray.600">
            Create an account to share your AI expertise and learn from others
          </Text>
        </VStack>

        <Box width="full" as="form" onSubmit={handleSubmit}>
          <VStack spacing={4}>
            <Box width="full">
              <Text fontSize="sm" fontWeight="medium" mb={2}>
                Full Name
              </Text>
              <Input
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </Box>

            <Box width="full">
              <Text fontSize="sm" fontWeight="medium" mb={2}>
                Email (Curtin domain)
              </Text>
              <Input
                type="email"
                placeholder="you@curtin.edu.au"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Text fontSize="xs" color="gray.600" mt={1}>
                Only Curtin University email addresses are allowed
              </Text>
            </Box>

            <Box width="full">
              <FormLabel fontSize="sm" fontWeight="medium" mb={2}>
                Professional Role
              </FormLabel>
              <Select
                value={professionalRole}
                onChange={(e) => setProfessionalRole(e.target.value as ProfessionalRole)}
                required
              >
                <option value="Educator">Educator</option>
                <option value="Researcher">Researcher</option>
                <option value="Professional">Professional</option>
              </Select>
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

            <Box width="full">
              <Text fontSize="sm" fontWeight="medium" mb={2}>
                Confirm Password
              </Text>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </Box>

            {(passwordError || apiError) && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <Text fontSize="sm">
                  {passwordError || apiError}
                </Text>
              </Alert>
            )}

            <Button
              width="full"
              colorScheme="blue"
              type="submit"
              isLoading={registerMutation.isPending}
            >
              Create Account
            </Button>
          </VStack>
        </Box>

        <HStack spacing={1} justify="center">
          <Text fontSize="sm" color="gray.600">
            Already have an account?
          </Text>
          <RouterLink to="/login">
            <Button variant="link" colorScheme="blue" fontSize="sm">
              Sign in
            </Button>
          </RouterLink>
        </HStack>
      </VStack>
    </Container>
  );
}
