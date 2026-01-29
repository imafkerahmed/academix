import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./ui/card";

interface Course {
  id: string;
  name: string;
  description?: string;
  // Add more fields as needed
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
          className="min-w-[250px] flex-shrink-0 md:min-w-0 md:mb-4"
        >
          <CardHeader>
            <CardTitle>{course.name}</CardTitle>
            {course.description && (
              <CardDescription>{course.description}</CardDescription>
            )}
          </CardHeader>
        </Card>
      ))}
    </div>
  );
};

export default CourseList;
