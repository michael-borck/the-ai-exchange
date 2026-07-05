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
  FormControl,
  FormLabel,
  FormHelperText,
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

    // Password complexity validation (mirrors backend rules)
    const passwordErrors: string[] = [];
    if (password.length < 10) passwordErrors.push("at least 10 characters");
    if (!/[A-Z]/.test(password)) passwordErrors.push("one uppercase letter");
    if (!/[a-z]/.test(password)) passwordErrors.push("one lowercase letter");
    if (!/\d/.test(password)) passwordErrors.push("one digit");
    if (!/[!@#$%^&*(),.?":{}|<>\-_=+[\]\\;'/~`]/.test(password))
      passwordErrors.push("one special character");
    if (passwordErrors.length > 0) {
      setPasswordError(`Password must contain: ${passwordErrors.join(", ")}`);
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
          description:
            response.message ||
            "We couldn't send the verification email. Please contact an administrator.",
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
          <Text color="whiteAlpha.600">
            Create an account to share your AI expertise and learn from others
          </Text>
        </VStack>

        <Box
          width="full"
          layerStyle="card"
          p={{ base: 6, md: 8 }}
          as="form"
          onSubmit={handleSubmit}
        >
          <VStack spacing={5}>
            <FormControl isRequired>
              <FormLabel requiredIndicator={<></>}>Full Name</FormLabel>
              <Input
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel requiredIndicator={<></>}>Email (Curtin domain)</FormLabel>
              <Input
                type="email"
                placeholder="you@curtin.edu.au"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              <FormHelperText color="whiteAlpha.600">
                Only Curtin University email addresses are allowed
              </FormHelperText>
            </FormControl>

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

            <FormControl>
              <FormLabel>Professional Roles (select all that apply)</FormLabel>
              <HStack spacing={2} flexWrap="wrap">
                {PROFESSIONAL_ROLES.map((role) => {
                  const isSelected = selectedRoles.includes(role);
                  return (
                    <Box
                      key={role}
                      as="button"
                      type="button"
                      px={4}
                      py={2}
                      borderRadius="full"
                      border="1px solid"
                      borderColor={isSelected ? "brand.400" : "dark.border"}
                      bg={isSelected ? "brand.900" : "dark.subtle"}
                      color={isSelected ? "brand.200" : "whiteAlpha.700"}
                      fontSize="sm"
                      fontWeight={isSelected ? "600" : "500"}
                      transition="all 0.15s ease"
                      _hover={{ borderColor: "brand.300" }}
                      aria-pressed={isSelected}
                      onClick={() => handleRoleToggle(role)}
                    >
                      {role}
                    </Box>
                  );
                })}
              </HStack>
              <FormHelperText color="whiteAlpha.600">
                Select all roles that apply to you. This helps others find the right expertise.
              </FormHelperText>
            </FormControl>

            <FormControl isRequired>
              <FormLabel requiredIndicator={<></>}>Password</FormLabel>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <FormHelperText color="whiteAlpha.500">
                10+ characters with an uppercase letter, lowercase letter, digit, and special
                character.
              </FormHelperText>
            </FormControl>

            <FormControl isRequired>
              <FormLabel requiredIndicator={<></>}>Confirm Password</FormLabel>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </FormControl>

            {(passwordError || apiError) && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <Text fontSize="sm">{passwordError || apiError}</Text>
              </Alert>
            )}

            <Button
              width="full"
              size="lg"
              colorScheme="brand"
              type="submit"
              isLoading={registerMutation.isPending}
            >
              Create Account
            </Button>
          </VStack>
        </Box>

        <HStack spacing={1} justify="center">
          <Text fontSize="sm" color="whiteAlpha.600">
            Already have an account?
          </Text>
          <RouterLink to="/login">
            <Button variant="link" colorScheme="brand" fontSize="sm">
              Sign in
            </Button>
          </RouterLink>
        </HStack>
      </VStack>
    </Container>
  );
}
