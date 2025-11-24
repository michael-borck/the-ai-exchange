/**
 * Custom hooks for authentication
 */

import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { LoginRequest, RegisterRequest, UserUpdateRequest } from "@/types/index";
import { useAuth as useAuthContext } from "@/context/AuthContext";

export function useLogin() {
  const { setUser, logout } = useAuthContext();

  return useMutation({
    mutationFn: (data: LoginRequest) => apiClient.login(data),
    onSuccess: (response) => {
      // Update auth context with logged-in user
      setUser(response);
    },
    onError: () => {
      logout();
    },
  });
}

export function useRegister() {
  const { setUser } = useAuthContext();

  return useMutation({
    mutationFn: (data: RegisterRequest) => apiClient.register(data),
    onSuccess: (response) => {
      // User is automatically logged in after registration
      setUser(response);
    },
  });
}

export function useUpdateProfile() {
  return useMutation({
    mutationFn: (data: UserUpdateRequest) => apiClient.updateMe(data),
  });
}

export function useLogout() {
  const { logout } = useAuthContext();
  return () => {
    logout();
  };
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (data: { email: string; code: string }) =>
      apiClient.verifyEmail(data.email, data.code),
  });
}

// Re-export useAuth from context
export { useAuth } from "@/context/AuthContext";
