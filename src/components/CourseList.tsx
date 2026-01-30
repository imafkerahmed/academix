import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./ui/card";
import { Badge } from "./ui/badge";

interface Course {
  id: string;
  name: string;
  registrationNumber: string;
  description?: string;
  courseStatus: string;
  certificateStatus: string;
}

interface CourseListProps {
  courses: Course[];
}

const CourseList: React.FC<CourseListProps> = ({ courses }) => {
  return (
    <div
      className="flex flex-row overflow-x-auto gap-4 md:flex-col md:overflow-x-visible md:gap-0"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      {courses.map((course) => (
        <Card
          key={course.id}
          className="min-w-[250px] flex-shrink-0 md:min-w-0 md:mb-4 transition-transform transition-shadow duration-300 hover:scale-105 hover:shadow-xl"
        >
          <CardHeader>
            <CardTitle>{course.name}</CardTitle>
            <div className="text-xs text-gray-500 mb-1">
              Reg. No: {course.registrationNumber}
            </div>
            {course.description && (
              <CardDescription>{course.description}</CardDescription>
            )}
            <div className="flex gap-1 mt-2">
              <Badge
                className={
                  course.courseStatus.toLowerCase() === "ongoing"
                    ? "bg-orange-500 text-white"
                    : course.courseStatus.toLowerCase() === "completed"
                      ? "bg-green-500 text-white"
                      : ""
                }
              >
                {course.courseStatus}
              </Badge>
              <Badge
                className={
                  course.certificateStatus.toLowerCase() === "issued"
                    ? "bg-green-500 text-white"
                    : course.certificateStatus.toLowerCase() === "not issued"
                      ? "bg-red-500 text-white"
                      : ""
                }
              >
                {course.certificateStatus.toLowerCase() === "issued"
                  ? "Certificate Issued"
                  : course.certificateStatus.toLowerCase() === "not issued"
                    ? "Certificate Not Issued"
                    : course.certificateStatus}
              </Badge>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
};

export default CourseList;
