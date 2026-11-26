// Class name helper for the design system: clsx for conditionals, then
// tailwind-merge so a caller's className wins over a variant's class
// (cn("px-4", "px-2") → "px-2").
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
