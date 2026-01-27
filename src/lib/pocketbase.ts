import PocketBase from "pocketbase";

const pb = new PocketBase(
  process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://localhost:8090",
);

// Enable auto-refresh
pb.autoCancellation(false);

// Store auth in cookie (persists across page refreshes)
if (typeof window !== "undefined") {
  pb.authStore.onChange(() => {
    document.cookie = pb.authStore.exportToCookie({ httpOnly: false });
  });
}

export default pb;

// Type definitions
export interface User {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  role: "host" | "attendee" | "admin" | "student" | "lectuer";
  avatar?: string;
  verified: boolean;
  created: string;
  updated: string;
}

export interface ZoomToken {
  id: string;
  user: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  zoom_user_id?: string;
  created: string;
  updated: string;
}

export interface Class {
  id: string;
  host: string;
  title: string;
  description?: string;
  zoom_meeting_id?: string;
  zoom_join_url?: string;
  zoom_start_url?: string;
  recurrence_rule?: Record<string, any>;
  start_time: string;
  duration?: number;
  is_recurring: boolean;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  created: string;
  updated: string;
}

export interface ClassAttendee {
  id: string;
  class: string;
  attendee: string;
  joined_at?: string;
  status: "registered" | "attended" | "absent";
  created: string;
  updated: string;
}

// Helper functions
// Removed duplicate isAuthenticated and getCurrentUser

// Removed duplicate logout

export interface ZoomToken {
  id: string;
  user: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  zoom_user_id?: string;
  created: string;
  updated: string;
}

export interface Class {
  id: string;
  host: string;
  title: string;
  description?: string;
  zoom_meeting_id?: string;
  zoom_join_url?: string;
  zoom_start_url?: string;
  recurrence_rule?: Record<string, any>;
  start_time: string;
  duration?: number;
  is_recurring: boolean;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  created: string;
  updated: string;
}

export interface ClassAttendee {
  id: string;
  class: string;
  attendee: string;
  joined_at?: string;
  status: "registered" | "attended" | "absent";
  created: string;
  updated: string;
}

// Helper functions
export const isAuthenticated = () => pb.authStore.isValid;

export const getCurrentUser = () => pb.authStore.model as User | null;

export const logout = () => {
  pb.authStore.clear();
};
