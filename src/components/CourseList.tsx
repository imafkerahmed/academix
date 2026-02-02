import React from "react";
import dynamic from "next/dynamic";
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

const AnimatedList = dynamic(() => import("@/components/ui/AnimatedList.jsx"), {
  ssr: false,
});

const CourseList: React.FC<CourseListProps> = ({ courses }) => {
  const renderCard = (course: Course, mobile: boolean = false) => (
    <Card
      key={course.id}
      className={`transition-transform transition-shadow duration-300 hover:scale-105 hover:shadow-xl ${mobile ? "min-w-[250px] flex-shrink-0" : ""}`}
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
  );

  const items = courses.map((course) => renderCard(course));

  return (
    <div className="w-full">
      {/* Mobile: horizontal scroll */}
      <div className="md:hidden">
        <div
          className="flex flex-row overflow-x-auto gap-4"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {courses.map((course) => renderCard(course, true))}
        </div>
      </div>

      {/* Desktop: vertical animated list with scrollbar */}
      <div className="hidden md:block">
        <AnimatedList
          items={items}
          onItemSelect={() => {}}
          showGradients={false}
          displayScrollbar={true}
          className="w-full"
          itemClassName=""
        />
      </div>
    </div>
  );
};

export default CourseList;
