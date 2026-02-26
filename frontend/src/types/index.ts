/**
 * API Type Definitions for The AI Exchange
 */

export type ProfessionalRole = "Educator" | "Researcher" | "Professional";

export const PROFESSIONAL_ROLES: Record<ProfessionalRole, string> = {
  "Educator": "Educator",
  "Researcher": "Researcher",
  "Professional": "Professional",
};

// Configuration types
export interface ConfigValue {
  key: string;
  label: string;
  description?: string;
  category?: string;
}

export interface ConfigResponse {
  specialties: ConfigValue[];
  professional_roles: ConfigValue[];
  resource_types: ConfigValue[];
}

export interface ConfigListResponse {
  items: ConfigValue[];
  total: number;
}

// Keep for backward compatibility during migration
export type Specialty = string;
export const SPECIALTIES: Specialty[] = [
  "marketing",
  "bis",
  "innovation_entrepreneurship",
  "people_culture",
  "tourism_hospitality",
  "future_of_work",
  "john_curtin_institute",
  "luxury_branding",
  "tourism_research",
  "acses",
  "management_exec_support",
  "lt_planning",
  "lt_support",
  "operations_admin",
  "other"
];

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: "ADMIN" | "STAFF";
  professional_role?: ProfessionalRole; // Legacy single role field
  professional_roles?: ProfessionalRole[]; // New multiple roles field
  area?: string;
  is_active: boolean;
  is_approved: boolean;
  is_verified?: boolean;
  specialties: string[];
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
  professional_roles?: ProfessionalRole[];
  area?: string;
  specialties?: string[];
}

export interface UserUpdateRequest {
  full_name?: string;
  professional_roles?: ProfessionalRole[];
  notification_prefs?: {
    notify_requests?: boolean;
    notify_solutions?: boolean;
  };
}

export type ResourceType = "REQUEST" | "USE_CASE" | "PROMPT" | "TOOL" | "POLICY" | "PAPER" | "PROJECT" | "CONFERENCE" | "DATASET" | "BOOK" | "OTHER";
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
  // Metadata fields
  specialty?: string;
  author_title?: string;
  tools_used?: Record<string, string[]>; // Categorised tools, e.g., { "LLM": ["Claude"], "CUSTOM_APP": ["Talk-Buddy"] }
  tools_used_flat?: string[]; // Flattened list of all tools
  collaborators?: string[]; // Email addresses of collaborators
  time_saved_value?: number;
  time_saved_frequency?: string;
  evidence_of_success?: string[];
  is_fork?: boolean;
  forked_from_id?: string;
  version_number?: number;
  quick_summary?: string;
  workflow_steps?: string[];
  example_prompt?: string;
  ethics_limitations?: string;
  analytics?: {
    view_count: number;
    save_count: number;
    tried_count: number;
    fork_count?: number;
    comment_count?: number;
    helpful_count?: number;
  };
  user?: {
    id: string;
    full_name: string;
    email: string;
    professional_role?: ProfessionalRole;
  };
  // Author information (from ResourceWithAuthor response)
  author_id?: string;
  author_name?: string;
  author_email?: string | null;
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

export interface ResourceCard {
  id: string;
  title: string;
  author: string;
  specialty?: string;
  tools: string[];
  quickSummary: string;
  timeSaved?: number;
  views: number;
  tried: number;
}

export interface ResourcePreview {
  id: string;
  title: string;
  author: string;
  specialty?: string;
  tools: string[];
  quickSummary: string;
  timeSaved?: number;
  views: number;
  tried: number;
}
