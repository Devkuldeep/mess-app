import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { AppRuntime } from "@/components/app-runtime";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Mess Manager", template: "%s · Mess Manager" },
  description: "Tiffin & mess management — count, delivery, payments.",
  applicationName: "Mess Manager",
  appleWebApp: { capable: true, title: "Mess", statusBarStyle: "default" },
  icons: { icon: "/icons/icon.svg", apple: "/icons/apple-touch-icon.png" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f5f2" },
    { media: "(prefers-color-scheme: dark)", color: "#12100e" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="hi" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <AppRuntime>{children}</AppRuntime>
      </body>
    </html>
  );
}
