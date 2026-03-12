import React from "react";
import { RouteLink } from "./ui/route-link";
import {
  ArrowRight,
  Book,
  GraduationCap,
  Clock,
  CheckCircle,
} from "lucide-react";

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
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case "ongoing":
        return {
          bg: "bg-amber-50",
          text: "text-amber-700",
          border: "border-amber-100",
          icon: Clock,
          label: "In Progress",
        };
      case "completed":
        return {
          bg: "bg-green-50",
          text: "text-green-700",
          border: "border-green-100",
          icon: CheckCircle,
          label: "Completed",
        };
      default:
        return {
          bg: "bg-gray-50",
          text: "text-gray-700",
          border: "border-gray-100",
          icon: Book,
          label: status,
        };
    }
  };

  const getCertificateConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case "issued":
        return {
          bg: "bg-green-50",
          text: "text-green-600",
          border: "border-green-100",
          icon: GraduationCap,
          label: "Certificate Issued",
        };
      case "processing":
        return {
          bg: "bg-violet-50",
          text: "text-violet-600",
          border: "border-violet-100",
          icon: Clock,
          label: "Processing Certificate",
        };
      case "not issued":
        return {
          bg: "bg-gray-50",
          text: "text-gray-500",
          border: "border-gray-100",
          icon: Book,
          label: "Certificate Not Issued",
        };
      default:
        return {
          bg: "bg-gray-50",
          text: "text-gray-500",
          border: "border-gray-100",
          icon: Book,
          label: status,
        };
    }
  };

  const renderCourseCard = (course: Course) => {
    const status = getStatusConfig(course.courseStatus);
    const cert = getCertificateConfig(course.certificateStatus);
    const StatusIcon = status.icon;
    const CertIcon = cert.icon;

    return (
      <RouteLink
        key={course.id}
        href={`/dashboard/student/courses/${course.id}`}
        className="group block"
      >
        <div className="bg-white rounded-[2rem] border border-gray-100 p-6 h-full flex flex-col transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-100/50 hover:-translate-y-2 group-hover:border-indigo-100 relative overflow-hidden">
          {/* Subtle Background Pattern */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 transition-transform duration-700 group-hover:scale-150" />

          <div className="relative z-10 flex flex-col h-full">
            {/* Header: Icon & Status */}
            <div className="flex items-start justify-between mb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-500">
                <Book size={24} />
              </div>
              <div
                className={`px-3 py-1.5 rounded-xl border ${status.bg} ${status.text} ${status.border} flex items-center gap-1.5 shadow-sm`}
              >
                <StatusIcon size={14} />
                <span className="text-[10px] font-black uppercase tracking-wider">
                  {status.label}
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors duration-300 mb-1">
                {course.name}
              </h3>
              <p className="text-xs text-gray-400 font-medium mb-3">
                REG:{" "}
                <span className="text-gray-600 font-bold">
                  {course.registrationNumber}
                </span>
              </p>
              {course.description && (
                <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                  {course.description}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-1.5 text-[10px] font-bold ${cert.text} ${cert.bg} px-2.5 py-1.5 rounded-lg border ${cert.border} shadow-sm transition-all duration-300`}
                >
                  <CertIcon size={12} />
                  {cert.label.toUpperCase()}
                </div>
              </div>
              <div className="flex items-center gap-1 text-indigo-600 font-bold text-sm tracking-tight opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                Enter Course
                <ArrowRight size={16} />
              </div>
            </div>
          </div>
        </div>
      </RouteLink>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {courses.map((course) => renderCourseCard(course))}
    </div>
  );
};

export default CourseList;
