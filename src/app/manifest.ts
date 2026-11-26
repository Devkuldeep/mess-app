import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Mess Manager",
    short_name: "Mess",
    description: "Tiffin & mess management — count, delivery, payments.",
    start_url: "/today",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f7f5f2",
    theme_color: "#ea580c",
    lang: "hi",
    categories: ["business", "food", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    // Shown in the install sheet (Chrome "richer install UI") and used by PWABuilder.
    // Regenerate with demo data at 412×915 @2x (see CLAUDE.md → Android app).
    screenshots: [
      { src: "/screenshots/today.webp", sizes: "824x1830", type: "image/webp", form_factor: "narrow", label: "कल कितना बनाना है — lunch/dinner count with cooking suggestions" },
      { src: "/screenshots/delivery.webp", sizes: "824x1830", type: "image/webp", form_factor: "narrow", label: "डिलीवरी लिस्ट — area-wise delivery checklist that works offline" },
      { src: "/screenshots/payments.webp", sizes: "824x1830", type: "image/webp", form_factor: "narrow", label: "पेमेंट — monthly bills and WhatsApp reminders" },
      { src: "/screenshots/wastage.webp", sizes: "824x1830", type: "image/webp", form_factor: "narrow", label: "बर्बादी रिपोर्ट — leftover food and ₹ loss" },
      { src: "/screenshots/customer-link.webp", sizes: "824x1830", type: "image/webp", form_factor: "narrow", label: "ग्राहक लिंक — customers skip meals and pay by UPI" },
      { src: "/screenshots/home-wide.webp", sizes: "1280x800", type: "image/webp", form_factor: "wide", label: "Mess Manager — tiffin & mess management" },
    ],
    shortcuts: [
      { name: "Delivery", url: "/delivery", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Payments", url: "/payments", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
