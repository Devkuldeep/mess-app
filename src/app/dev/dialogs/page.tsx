// Dev-only living reference for dialogs (src/components/ui/dilog-box).
// http://localhost:3000/dev/dialogs — 404 in production builds.
import { notFound } from "next/navigation";
import { DialogsGallery } from "./gallery";

export const metadata = { title: "Dialogs · design system", robots: { index: false } };

export default function DevDialogsPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <DialogsGallery />;
}
