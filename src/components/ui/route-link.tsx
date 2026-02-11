"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.ctrlKey || e.metaKey || e.button === 1) return;
    if (href.startsWith("#")) return;

    e.preventDefault();
    router.push(href);
  };

  return (
    <a href={href} className={className} onClick={handleClick} {...props}>
      {children}
    </a>
  );
};
