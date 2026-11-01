"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui";

type Size = "xs" | "sm" | "md" | "lg" | "xl";
const SIZES: Record<Size, string> = { xs: "size-6", sm: "size-8", md: "size-9", lg: "size-12", xl: "size-20 sm:size-24" };

/** The user's display picture, or their initials when there is none (or it fails to load). */
export function UserAvatar({ name, src, size = "md", className }: { name: string; src?: string | null; size?: Size; className?: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  if (!src || failed === src) return <Avatar name={name} size={size} className={className} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name} onError={() => setFailed(src)} className={cn("shrink-0 rounded-full bg-slate-100 object-cover", SIZES[size], className)} />
  );
}
