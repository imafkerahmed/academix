"use client";

import React from "react";
import { AlertCircle, Check, X } from "lucide-react";

interface Approval {
  id: string;
  type: string;
  title: string;
  description: string;
  requestedBy: string;
  date: string;
}

export default function PendingApprovals() {
  const approvals: Approval[] = [
    {
      id: "1",
      type: "payment",
      title: "Payment Verification",
      description: "Student payment of INR 15,000 needs verification",
      requestedBy: "Sarah Johnson",
      date: "2024-02-06",
    },
    {
      id: "2",
      type: "enrollment",
      title: "Enrollment Request",
      description: "New enrollment request for Data Science Course",
      requestedBy: "Mike Davis",
      date: "2024-02-05",
    },
    {
      id: "3",
      type: "assignment",
      title: "Assignment Extension",
      description: "Extension request for Web Development assignment",
      requestedBy: "Emma Wilson",
      date: "2024-02-05",
    },
  ];

  const handleApprove = (id: string) => {
    console.log("Approve:", id);
  };

  const handleReject = (id: string) => {
    console.log("Reject:", id);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Pending Approvals
        </h2>
        <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-1 rounded-full">
          {approvals.length} pending
        </span>
      </div>
      <div className="space-y-3">
        {approvals.map((approval) => (
          <div
            key={approval.id}
            className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle size={16} className="text-orange-500" />
                  <h3 className="font-medium text-gray-900">
                    {approval.title}
                  </h3>
                </div>
                <p className="text-sm text-gray-600">{approval.description}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <span>{approval.requestedBy}</span>
                  <span>•</span>
                  <span>{approval.date}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => handleApprove(approval.id)}
                className="flex-1 flex items-center justify-center gap-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
              >
                <Check size={16} />
                Approve
              </button>
              <button
                onClick={() => handleReject(approval.id)}
                className="flex-1 flex items-center justify-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
              >
                <X size={16} />
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
