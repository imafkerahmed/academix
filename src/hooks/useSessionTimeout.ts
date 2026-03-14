import { useEffect, useRef, useState, useCallback } from "react";
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

  const resetTimeout = useCallback(() => {
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
  }, [enabled, timeoutMinutes, warningMinutes, router]);

  const handleUserActivity = useCallback(() => {
    if (showWarning) return; // Don't reset if warning is showing
    resetTimeout();
  }, [showWarning, resetTimeout]);

  const extendSession = () => {
    setShowWarning(false);
    resetTimeout();
  };

  useEffect(() => {
    if (!enabled) return;

    // Use a microtask to avoid cascading render on mount
    Promise.resolve().then(() => {
      resetTimeout();
    });

    // Track user activity
    const events = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    const throttledActivity = () => {
      handleUserActivity();
    };

    events.forEach((event) => {
      document.addEventListener(event, throttledActivity, true);
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, throttledActivity, true);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    };
  }, [enabled, handleUserActivity, resetTimeout]); // Removed showWarning as it resets on every warning pop

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
