// Dev-only living reference for drawers (src/components/ui/drawers).
// http://localhost:3000/dev/drawers — 404 in production builds.
import { notFound } from "next/navigation";
import { DrawersGallery } from "./gallery";

export const metadata = { title: "Drawers · design system", robots: { index: false } };

export default function DevDrawersPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <DrawersGallery />;
}
