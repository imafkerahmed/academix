"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Loader from "./loader";

interface RouteLoaderContextType {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const RouteLoaderContext = createContext<RouteLoaderContextType>({
  isLoading: false,
  setIsLoading: () => {},
});

export const useRouteLoader = () => useContext(RouteLoaderContext);

export const RouteLoaderProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Hide loader when route changes
    setIsLoading(false);
  }, [pathname]);

  return (
    <RouteLoaderContext.Provider value={{ isLoading, setIsLoading }}>
      {children}
      {isLoading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <Loader />
        </div>
      )}
    </RouteLoaderContext.Provider>
  );
};
