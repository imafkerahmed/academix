"use client";
import React, { useEffect, useState, useRef } from "react";
import PaymentSummaryChart from "@/components/admin/PaymentSummaryChart";
import StudentSummaryChart from "@/components/admin/StudentSummaryChart";

interface SummaryCarouselProps {
  paymentSummary: {
    paid: number;
    pending: number;
    paidAmount: number;
    pendingAmount: number;
  };
  studentIntakes: { intake: string; count: number }[];
  intervalMs?: number;
}

const slides = ["payment", "student"] as const;
type SlideType = (typeof slides)[number];

export default function SummaryCarousel({
  paymentSummary,
  studentIntakes,
  intervalMs = 5000,
}: SummaryCarouselProps) {
  const [current, setCurrent] = useState<SlideType>("payment");
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (paused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev === "payment" ? "student" : "payment"));
    }, intervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [intervalMs, paused]);

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="transition-all duration-500 min-h-[320px] w-full">
        {current === "payment" ? (
          <PaymentSummaryChart
            paid={paymentSummary.paid}
            pending={paymentSummary.pending}
            paidAmount={paymentSummary.paidAmount}
            pendingAmount={paymentSummary.pendingAmount}
          />
        ) : (
          <StudentSummaryChart intakes={studentIntakes} />
        )}
      </div>
      <div className="flex justify-center mt-2 gap-2">
        <button
          className={`h-2 w-2 rounded-full ${current === "payment" ? "bg-blue-600" : "bg-gray-300"}`}
          onClick={() => setCurrent("payment")}
          aria-label="Show Payment Summary"
        />
        <button
          className={`h-2 w-2 rounded-full ${current === "student" ? "bg-blue-600" : "bg-gray-300"}`}
          onClick={() => setCurrent("student")}
          aria-label="Show Student Summary"
        />
      </div>
    </div>
  );
}
