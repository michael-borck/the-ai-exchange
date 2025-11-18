/**
 * Custom hooks for authentication
 */

import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { LoginRequest, RegisterRequest, UserUpdateRequest } from "@/types/index";
import { useAuth as useAuthContext } from "@/context/AuthContext";

export function useLogin() {
  return useMutation({
    mutationFn: (data: LoginRequest) => apiClient.login(data),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterRequest) => apiClient.register(data),
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

// Re-export useAuth from context
export { useAuth } from "@/context/AuthContext";
