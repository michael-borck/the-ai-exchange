/**
 * API Type Definitions for The AI Exchange
 */

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: "ADMIN" | "STAFF";
  is_active: boolean;
  is_approved: boolean;
  notification_prefs: {
    notify_requests: boolean;
    notify_solutions: boolean;
  };
  created_at: string;
}

export interface TokenResponse extends User {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  full_name: string;
  password: string;
}

export interface UserUpdateRequest {
  full_name?: string;
  notification_prefs?: {
    notify_requests?: boolean;
    notify_solutions?: boolean;
  };
}

export type ResourceType = "REQUEST" | "USE_CASE" | "PROMPT" | "TOOL" | "POLICY" | "PAPER" | "PROJECT" | "CONFERENCE" | "DATASET";
export type ResourceStatus = "OPEN" | "SOLVED" | "ARCHIVED";

export interface Resource {
  id: string;
  user_id: string;
  type: ResourceType;
  title: string;
  content_text: string;
  content_meta?: Record<string, unknown>;
  is_anonymous: boolean;
  status?: ResourceStatus;
  system_tags: string[];
  user_tags: string[];
  shadow_tags: string[];
  parent_id?: string;
  is_hidden: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface ResourceCreate {
  type: ResourceType;
  title: string;
  content_text: string;
  is_anonymous?: boolean;
  parent_id?: string;
  content_meta?: Record<string, unknown>;
}

export interface ResourceUpdate {
  title?: string;
  content_text?: string;
  content_meta?: Record<string, unknown>;
}

export interface Subscription {
  id: string;
  user_id: string;
  tag: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}

export interface ApiError {
  detail: string;
}
