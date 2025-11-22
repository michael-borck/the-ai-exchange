/**
 * API Client for The AI Exchange
 */

import axios, { AxiosInstance } from "axios";
import {
  Resource,
  ResourceCreate,
  ResourceUpdate,
  User,
  LoginRequest,
  RegisterRequest,
  UserUpdateRequest,
  TokenResponse,
  Subscription,
} from "@/types/index";

const API_BASE_URL = "/api/v1";

/**
 * Extract error message from API error response
 */
function getErrorMessage(error: any): string {
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }
  if (error.message) {
    return error.message;
  }
  return "An error occurred. Please try again.";
}

class ApiClient {
  axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
    });

    // Add request interceptor to include auth token
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("access_token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Clear tokens and redirect to login
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async register(data: RegisterRequest): Promise<TokenResponse> {
    const response = await this.axiosInstance.post<TokenResponse>(
      "/auth/register",
      data
    );
    this.setTokens(response.data);
    return response.data;
  }

  async login(data: LoginRequest): Promise<TokenResponse> {
    const response = await this.axiosInstance.post<TokenResponse>(
      "/auth/login",
      data
    );
    this.setTokens(response.data);
    return response.data;
  }

  async getMe(): Promise<User> {
    const response = await this.axiosInstance.get<User>("/auth/me");
    return response.data;
  }

  async updateMe(data: UserUpdateRequest): Promise<User> {
    const response = await this.axiosInstance.patch<User>("/auth/me", data);
    return response.data;
  }

  logout(): void {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }

  private setTokens(data: TokenResponse): void {
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
  }

  // Resource endpoints
  async listResources(params?: {
    type?: string;
    tag?: string;
    search?: string;
    status?: string;
    discipline?: string;
    tools?: string;
    min_time_saved?: number;
    sort_by?: string;
    skip?: number;
    limit?: number;
  }): Promise<Resource[]> {
    const response = await this.axiosInstance.get<Resource[]>("/resources", {
      params,
    });
    return response.data;
  }

  async getResource(id: string): Promise<Resource> {
    const response = await this.axiosInstance.get<Resource>(
      `/resources/${id}`
    );
    return response.data;
  }

  async createResource(data: ResourceCreate): Promise<Resource> {
    const response = await this.axiosInstance.post<Resource>(
      "/resources",
      data
    );
    return response.data;
  }

  async updateResource(
    id: string,
    data: ResourceUpdate
  ): Promise<Resource> {
    const response = await this.axiosInstance.patch<Resource>(
      `/resources/${id}`,
      data
    );
    return response.data;
  }

  async deleteResource(id: string): Promise<void> {
    await this.axiosInstance.delete(`/resources/${id}`);
  }

  async getResourceSolutions(id: string): Promise<Resource[]> {
    const response = await this.axiosInstance.get<Resource[]>(
      `/resources/${id}/solutions`
    );
    return response.data;
  }

  // Subscription endpoints
  async listSubscriptions(): Promise<Subscription[]> {
    const response = await this.axiosInstance.get<Subscription[]>(
      "/subscriptions"
    );
    return response.data;
  }

  async subscribe(tag: string): Promise<Subscription> {
    const response = await this.axiosInstance.post<Subscription>(
      "/subscriptions/subscribe",
      { tag }
    );
    return response.data;
  }

  async unsubscribe(tag: string): Promise<void> {
    await this.axiosInstance.post("/subscriptions/unsubscribe", { tag });
  }

  // Generic HTTP methods for other endpoints
  async get<T>(url: string): Promise<{ data: T }> {
    return this.axiosInstance.get<T>(url);
  }

  async post<T>(url: string, data?: any): Promise<{ data: T }> {
    return this.axiosInstance.post<T>(url, data);
  }

  async patch<T>(url: string, data?: any): Promise<{ data: T }> {
    return this.axiosInstance.patch<T>(url, data);
  }

  async delete<T>(url: string): Promise<{ data: T }> {
    return this.axiosInstance.delete<T>(url);
  }
}

export const apiClient = new ApiClient();
export const api = apiClient.axiosInstance;
export { getErrorMessage };
