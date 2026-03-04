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
  return useMutation({
    mutationFn: (data: RegisterRequest) => apiClient.register(data),
    // Don't auto-login - user must verify email first
    // onSuccess is not used because registration doesn't return token data
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
  const { setUser } = useAuthContext();

  return useMutation({
    mutationFn: (data: { email: string; code: string }) =>
      apiClient.verifyEmail(data.email, data.code),
    onSuccess: (response) => {
      // Log user in after successful email verification
      setUser(response);
    },
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: (email: string) => apiClient.resendVerification(email),
  });
}

// Re-export useAuth from context
export { useAuth } from "@/context/AuthContext";
