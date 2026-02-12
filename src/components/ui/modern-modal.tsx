"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ModernModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  avatarChar?: string;
  avatarColor?: string;
  children: React.ReactNode;
  className?: string;
}

export function ModernModal({
  open,
  onOpenChange,
  title,
  subtitle,
  avatarChar,
  avatarColor = "bg-indigo-600",
  children,
  className,
}: ModernModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-h-[90vh] overflow-y-auto rounded-t-[32px] p-0 border-none sm:rounded-3xl",
          className,
        )}
      >
        <div className="p-8 space-y-6">
          {/* Accessibility-only labels */}
          <DialogHeader className="sr-only">
            <DialogTitle>{title}</DialogTitle>
            {subtitle && <DialogDescription>{subtitle}</DialogDescription>}
          </DialogHeader>

          {/* Visual Header */}
          <div className="flex items-center gap-4">
            {avatarChar && (
              <div
                className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black",
                  avatarColor,
                )}
              >
                {avatarChar}
              </div>
            )}
            <div>
              <h2 className="font-black text-gray-900 uppercase tracking-tight">
                {title}
              </h2>
              {subtitle && (
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4">{children}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
