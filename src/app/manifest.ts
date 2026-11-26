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
    shortcuts: [
      { name: "Delivery", url: "/delivery", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Payments", url: "/payments", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
