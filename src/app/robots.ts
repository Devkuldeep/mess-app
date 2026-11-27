import type { MetadataRoute } from "next";

// Public pages are indexable (Google OAuth review & Razorpay check them);
// the app, customer links and API are not.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/pricing", "/privacy", "/terms", "/refund", "/shipping", "/contact", "/learn"],
      disallow: ["/c/", "/join/", "/api/", "/dev/", "/today", "/delivery", "/customers", "/payments", "/wastage", "/more", "/onboarding", "/login", "/signup"],
    },
  };
}
