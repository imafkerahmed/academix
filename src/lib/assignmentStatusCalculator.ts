export type AssignmentStatus = "ongoing" | "grace-period" | "closed";

export interface AssignmentDateInfo {
  status: AssignmentStatus;
  daysRemaining?: number; // positive number if ongoing
  daysOverdue?: number; // positive number if in grace period
  graceDeadline: Date;
}

/**
 * Calculates the status of an assignment based on its due date
 * - ongoing: Before due date
 * - grace-period: Up to 7 days after due date (late submissions accepted)
 * - closed: After 7 days from due date
 */
export function calculateAssignmentStatus(
  dueDateString: string,
): AssignmentDateInfo {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(dueDateString);
  dueDate.setHours(0, 0, 0, 0);

  const graceDeadline = new Date(dueDate);
  graceDeadline.setDate(graceDeadline.getDate() + 7);

  if (today <= dueDate) {
    // Ongoing
    const diffTime = dueDate.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      status: "ongoing",
      daysRemaining,
      graceDeadline,
    };
  } else if (today <= graceDeadline) {
    // Grace period (late submissions)
    const diffTime = today.getTime() - dueDate.getTime();
    const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      status: "grace-period",
      daysOverdue,
      graceDeadline,
    };
  } else {
    // Closed
    return {
      status: "closed",
      graceDeadline,
    };
  }
}

/**
 * Get the color scheme for a given status
 */
export function getStatusColorScheme(status: AssignmentStatus) {
  switch (status) {
    case "ongoing":
      return {
        bg: "bg-blue-50",
        border: "border-blue-100",
        text: "text-blue-600",
        badge: "bg-blue-100 text-blue-700",
        icon: "text-blue-500",
      };
    case "grace-period":
      return {
        bg: "bg-amber-50",
        border: "border-amber-100",
        text: "text-amber-600",
        badge: "bg-amber-100 text-amber-700",
        icon: "text-amber-500",
      };
    case "closed":
      return {
        bg: "bg-gray-50",
        border: "border-gray-100",
        text: "text-gray-600",
        badge: "bg-gray-100 text-gray-700",
        icon: "text-gray-400",
      };
  }
}

/**
 * Get human-readable status label
 */
export function getStatusLabel(status: AssignmentStatus): string {
  switch (status) {
    case "ongoing":
      return "Ongoing";
    case "grace-period":
      return "Late Submissions Open";
    case "closed":
      return "Closed";
  }
}
