// GET /.well-known/assetlinks.json — Digital Asset Links for the Android (TWA) app.
// Configure with env vars, then redeploy:
//   ANDROID_PACKAGE_NAME=in.messmanager.app
//   ANDROID_CERT_SHA256=<upload key SHA-256>,<Play App Signing key SHA-256>
// (Play Console → Test and release → App integrity → App signing shows both.)
import { assetLinks } from "@/lib/assetlinks";

export function GET() {
  return Response.json(assetLinks(process.env.ANDROID_PACKAGE_NAME, process.env.ANDROID_CERT_SHA256), {
    headers: { "cache-control": "public, max-age=3600" },
  });
}
