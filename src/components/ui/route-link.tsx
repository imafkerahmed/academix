"use client";

import React from "react";
import Link from "next/link";

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
  ...props
}) => {
  return (
    <Link href={href} className={className} {...props}>
      {children}
    </Link>
  );
};
