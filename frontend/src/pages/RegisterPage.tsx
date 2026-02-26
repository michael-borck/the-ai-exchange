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
  FormLabel,
  Checkbox,
} from "@chakra-ui/react";
import { useRegister } from "@/hooks/useAuth";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/lib/api";
import { useSpecialties } from "@/hooks/useConfig";
import { ConfigSelect } from "@/components/ConfigSelect";
import { ProfessionalRole } from "@/types/index";

const PROFESSIONAL_ROLES: ProfessionalRole[] = ["Educator", "Researcher", "Professional"];

export default function RegisterPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { isAuthenticated } = useAuth();
  const registerMutation = useRegister();
  const { data: specialties = [] } = useSpecialties();

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<ProfessionalRole[]>([]);
  const [passwordError, setPasswordError] = useState("");
  const [apiError, setApiError] = useState("");

  // Redirect if already logged in
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleRoleToggle = (role: ProfessionalRole) => {
    setSelectedRoles((prev: ProfessionalRole[]) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setApiError("");

    // Validation
    if (!specialty) {
      setApiError("Please select a professional specialty from the list");
      return;
    }

    if (selectedRoles.length === 0) {
      setApiError("Please select at least one professional role");
      return;
    }

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
        professional_roles: selectedRoles,
        specialties: specialty ? [specialty] : [],
      });

      if (response.email_sent === false) {
        toast({
          title: "Account created",
          description: response.message || "We couldn't send the verification email. Please contact an administrator.",
          status: "warning",
          duration: 8000,
          isClosable: true,
        });
      } else {
        toast({
          title: "Account created successfully",
          description: "Please check your email for a verification code.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }

      navigate("/verify-email", { state: { email, emailFailed: response.email_sent === false } });
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

            <ConfigSelect
              label="Professional Specialty"
              value={specialty}
              onChange={setSpecialty}
              options={specialties}
              isRequired={true}
              showOtherOption={true}
              configType="specialty"
              helpText="Your specialty helps others find your expertise. You can also request a new specialty if yours isn't listed."
            />

            <Box width="full">
              <FormLabel fontSize="sm" fontWeight="medium" mb={2}>
                Professional Roles (select all that apply)
              </FormLabel>
              <VStack align="flex-start" spacing={2}>
                {PROFESSIONAL_ROLES.map((role) => (
                  <Checkbox
                    key={role}
                    isChecked={selectedRoles.includes(role)}
                    onChange={() => handleRoleToggle(role)}
                  >
                    <Text fontSize="sm">{role}</Text>
                  </Checkbox>
                ))}
              </VStack>
              <Text fontSize="xs" color="gray.600" mt={2}>
                Select all roles that apply to you. This helps others find the right expertise.
              </Text>
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
