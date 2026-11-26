// Dev-only living reference for the form controls (src/components/ui/forms).
// http://localhost:3000/dev/forms — returns 404 in production builds.
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { todayIn } from "@/lib/dates";
import { FormsGallery } from "./gallery";

export const metadata = { title: "Forms · design system", robots: { index: false } };

export default function DevFormsPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <Suspense>
      <Gallery />
    </Suspense>
  );
}

async function Gallery() {
  await connection(); // request time → "today" is real, not build time
  return <FormsGallery today={todayIn("Asia/Kolkata")} />;
}
