import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatRuntime(ms: number | null): string {
  if (ms === null) return "N/A";
  if (ms < 1) return "<1 ms";
  return `${ms} ms`;
}

export function formatMemory(kb: number | null): string {
  if (kb === null) return "N/A";
  if (kb < 1024) return `${kb} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function getDifficultyColor(difficulty: string): string {
  switch (difficulty.toUpperCase()) {
    case "EASY":
      return "text-emerald-500";
    case "MEDIUM":
      return "text-amber-500";
    case "HARD":
      return "text-red-500";
    default:
      return "text-muted-foreground";
  }
}

export function getStatusColor(status: string): string {
  switch (status.toUpperCase()) {
    case "ACCEPTED":
      return "text-green-500";
    case "WRONG_ANSWER":
      return "text-red-500";
    case "TIME_LIMIT_EXCEEDED":
    case "MEMORY_LIMIT_EXCEEDED":
      return "text-yellow-500";
    case "RUNTIME_ERROR":
    case "COMPILATION_ERROR":
      return "text-red-500";
    case "PENDING":
    case "RUNNING":
      return "text-blue-500";
    default:
      return "text-gray-500";
  }
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
