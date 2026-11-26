"use client";
// One place to import GSAP from in the design system, with plugins registered
// once at module load (never inside a component that re-renders).
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import { Flip } from "gsap/Flip";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, Draggable, Flip);

/** True when the user asked the OS for less motion. */
export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export { gsap, Draggable, Flip, useGSAP };
