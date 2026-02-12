"use client";

import { useParams } from "next/navigation";

export default function CourseDetailsPage() {
  const params = useParams();
  const intakeId = params?.intakeId;
  const courseId = params?.courseId;

  return (
    <div>
      <h1>Course Details</h1>
      <p>Intake ID: {intakeId}</p>
      <p>Course ID: {courseId}</p>
    </div>
  );
}