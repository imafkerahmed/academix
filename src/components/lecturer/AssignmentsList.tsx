"use client";

import React from "react";
import { Calendar, Clock, CheckCircle2 } from "lucide-react";

export interface Assignment {
  id: string;
  subjectCode: string;
  subjectName: string;
  title: string;
  dueDate: string;
  pendingCount: number;
  markedCount: number;
}

interface AssignmentsListProps {
  assignments: Assignment[];
}

export default function AssignmentsList({ assignments }: AssignmentsListProps) {
  const handleMarkSubmissions = (assignmentId: string) => {
    console.log("Mark submissions for:", assignmentId);
    // Placeholder for marking functionality
  };

  if (assignments.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <h2 className="text-xl font-bold mb-4 text-gray-800">
          Assignments to Mark
        </h2>
        <div className="text-center py-8 text-gray-500">
          <p>No assignments to mark</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <h2 className="text-xl font-bold mb-4 text-gray-800">
        Assignments to Mark
      </h2>
      <div className="space-y-3">
        {assignments.map((assignment) => (
          <div
            key={assignment.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700 border border-purple-200 font-semibold">
                    {assignment.subjectCode}
                  </span>
                  <span className="text-sm text-gray-600">
                    {assignment.subjectName}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-gray-800 mb-1">
                  {assignment.title}
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    Due: {assignment.dueDate}
                  </span>
                  <span className="text-orange-600 font-semibold flex items-center gap-1">
                    <Clock size={14} />
                    Pending: {assignment.pendingCount}
                  </span>
                  <span className="text-green-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={14} />
                    Marked: {assignment.markedCount}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleMarkSubmissions(assignment.id)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition whitespace-nowrap"
                aria-label={`Mark submissions for ${assignment.title}`}
              >
                Mark Submissions
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
