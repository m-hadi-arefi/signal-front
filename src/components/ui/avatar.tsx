"use client";
import * as React from "react";
import { cn, getInitials } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  username: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizes = { sm: "w-7 h-7 text-xs", md: "w-9 h-9 text-sm", lg: "w-12 h-12 text-base", xl: "w-20 h-20 text-xl" };

export function Avatar({ src, username, size = "md", className }: AvatarProps) {
  const [imgError, setImgError] = React.useState(false);

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={username}
        onError={() => setImgError(true)}
        className={cn("rounded-full object-cover ring-1 ring-white/10", sizes[size], className)}
      />
    );
  }

  return (
    <div className={cn("rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white ring-1 ring-white/10", sizes[size], className)}>
      {getInitials(username)}
    </div>
  );
}
