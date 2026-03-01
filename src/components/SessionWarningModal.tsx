"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, LogOut } from "lucide-react";

interface SessionWarningModalProps {
  isOpen: boolean;
  timeRemaining: number;
  onExtend: () => void;
  onLogout: () => void;
}

export function SessionWarningModal({
  isOpen,
  timeRemaining,
  onExtend,
  onLogout,
}: SessionWarningModalProps) {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999]"
            onClick={onExtend}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1000]"
          >
            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-12 max-w-md w-full text-center">
              {/* Icon */}
              <div className="w-20 h-20 bg-amber-100 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                <Clock size={40} className="text-amber-600 animate-pulse" />
              </div>

              {/* Heading */}
              <h2 className="text-2xl font-black text-gray-900 mb-2">
                Session Expiring Soon
              </h2>

              {/* Description */}
              <p className="text-gray-500 text-sm mb-8">
                Your session will expire in{" "}
                <span className="font-bold text-amber-600">
                  {minutes}:{seconds.toString().padStart(2, "0")}
                </span>
                . Please extend your session or you will be logged out.
              </p>

              {/* Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={onLogout}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  <LogOut size={18} />
                  Logout
                </button>
                <button
                  onClick={onExtend}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Extend Session
                </button>
              </div>

              {/* Click to extend hint */}
              <p className="text-xs text-gray-400 mt-6">
                Or click anywhere on the page to continue working
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
