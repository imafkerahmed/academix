"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRouteLoader } from "./route-loader-provider";

interface RouteLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
  className?: string;
  showLoader?: boolean;
}

export const RouteLink: React.FC<RouteLinkProps> = ({
  href,
  children,
  className,
  showLoader = true,
  ...props
}) => {
  const router = useRouter();
  const { setIsLoading } = useRouteLoader();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Don't interfere with ctrl/cmd+click or middle click
    if (e.ctrlKey || e.metaKey || e.button === 1) {
      return;
    }

    // Don't show loader for same-page links (anchors)
    if (href.startsWith("#")) {
      return;
    }

    if (showLoader) {
      e.preventDefault();
      setIsLoading(true);

      // Small delay to ensure loader shows
      setTimeout(() => {
        router.push(href);
      }, 500);
    }
  };

  return (
    <Link href={href} className={className} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
};
