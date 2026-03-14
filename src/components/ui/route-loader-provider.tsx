"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";

interface RouteLoaderContextType {
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

const RouteLoaderContext = createContext<RouteLoaderContextType | undefined>(
  undefined,
);

export function RouteLoaderProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (isLoading) {
      Promise.resolve().then(() => setIsLoading(false));
    }
  }, [pathname, searchParams, isLoading]);

  return (
    <RouteLoaderContext.Provider value={{ isLoading, setIsLoading }}>
      {children}
    </RouteLoaderContext.Provider>
  );
}

export function useRouteLoader() {
  const context = useContext(RouteLoaderContext);
  if (context === undefined) {
    throw new Error("useRouteLoader must be used within a RouteLoaderProvider");
  }
  return context;
}
