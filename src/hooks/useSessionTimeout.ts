import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/pocketbase";

interface UseSessionTimeoutOptions {
  timeoutMinutes?: number;
  warningMinutes?: number;
  enabled?: boolean;
}

export function useSessionTimeout({
  timeoutMinutes = 30,
  warningMinutes = 5,
  enabled = true,
}: UseSessionTimeoutOptions = {}) {
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const resetTimeout = () => {
    // Clear existing timeouts
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    setShowWarning(false);

    if (!enabled) return;

    const timeoutMs = timeoutMinutes * 60 * 1000;
    const warningMs = Math.max(0, timeoutMs - warningMinutes * 60 * 1000);

    // Set warning timeout
    if (warningMinutes > 0 && warningMinutes < timeoutMinutes) {
      warningTimeoutRef.current = setTimeout(() => {
        setShowWarning(true);
        setTimeRemaining(warningMinutes * 60);

        // Start countdown timer
        const countdownInterval = setInterval(() => {
          setTimeRemaining((prev) => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, warningMs);
    }

    // Set logout timeout
    timeoutRef.current = setTimeout(() => {
      setShowWarning(false);
      logout();
      router.push("/login");
    }, timeoutMs);
  };

  const handleUserActivity = () => {
    if (showWarning) return; // Don't reset if warning is showing
    resetTimeout();
  };

  const extendSession = () => {
    setShowWarning(false);
    resetTimeout();
  };

  useEffect(() => {
    if (!enabled) return;

    resetTimeout();

    // Track user activity
    const events = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    events.forEach((event) => {
      document.addEventListener(event, handleUserActivity, true);
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleUserActivity, true);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    };
  }, [enabled, showWarning]);

  return {
    showWarning,
    timeRemaining,
    extendSession,
    forceLogout: () => {
      logout();
      router.push("/login");
    },
  };
}
