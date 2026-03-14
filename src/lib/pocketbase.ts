import PocketBase from "pocketbase";

const pb = new PocketBase(
  process.env.NEXT_PUBLIC_POCKETBASE_URL || "https://academixdb.codix.site",
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
  name: string;
  full_name?: string;
  role: "host" | "attendee" | "admin" | "student" | "lecturer" | "superuser";
  avatar?: string;
  verified: boolean;
  accountStatus?: "active" | "disabled";
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
  recurrence_rule?: Record<string, unknown>;
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

export interface Intake {
  id: string;
  code: string;
  start_date: string;
  end_date: string;
  intakeStatus: "ongoing" | "peding" | "completed" | "disabled";
  created: string;
  updated: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  status?: "active" | "completed" | "archived";
  created: string;
  updated: string;
}

export interface CourseTemplate {
  id: string;
  course_code: string;
  course_name: string;
  course_description?: string;
  created: string;
  updated: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  description: string;
  created: string;
  updated: string;
}

export interface CourseIntake {
  id: string;
  course: string;
  intake: string;
  is_semester_based: boolean;
  semester_count?: number;
  course_status: "ongoing" | "completed" | "upcoming";
  start_date: string;
  end_date: string;
  created: string;
  updated: string;
  expand?: {
    course?: Course;
    intake?: Intake;
  };
}

export interface CourseSubject {
  id: string;
  course_intake: string;
  subject: string | string[];
  lecturer?: string;
  semester?: string;
  credits: number;
  created: string;
  updated: string;
  expand?: {
    subject?: Subject | Subject[];
    lecturer?: User;
    course_intake?: CourseIntake;
  };
}

export interface CourseIntakeFee {
  id: string;
  course_intake: string;
  course_fee: number;
  registration_fee: number;
  duration: number;
  created: string;
  updated: string;
  expand?: {
    course_intake?: CourseIntake;
  };
}

// Helper functions
export const isAuthenticated = () => pb.authStore.isValid;

export const getCurrentUser = () => pb.authStore.model as User | null;

export const logout = () => {
  pb.authStore.clear();
  if (typeof document !== "undefined") {
    document.cookie = pb.authStore.exportToCookie({ httpOnly: false });
  }
};

export const isSuperuserOnlyError = (error: unknown): boolean => {
  const err = error as {
    status?: number;
    message?: string;
    response?: { message?: string };
  };
  const message = err?.message || err?.response?.message || "";

  return (
    err?.status === 403 &&
    typeof message === "string" &&
    message.toLowerCase().includes("only superusers can perform this action")
  );
};
