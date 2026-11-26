// Digital Asset Links for the Android app (Trusted Web Activity).
// Lets the Play Store app open this site full-screen without a URL bar.
// https://developer.android.com/training/app-links/verify-android-applinks

const PACKAGE_RE = /^[a-zA-Z][\w]*(\.[a-zA-Z][\w]*)+$/;
const SHA256_RE = /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/;

/** "aa:bb:…" or "AABB…" (64 hex) → "AA:BB:…", or null if not a SHA-256 cert fingerprint. */
export function normalizeFingerprint(raw: string): string | null {
  const hex = raw.trim().toUpperCase().replace(/[^0-9A-F]/g, "");
  if (hex.length !== 64) return null;
  const fp = hex.match(/.{2}/g)!.join(":");
  return SHA256_RE.test(fp) ? fp : null;
}

/** Statements for /.well-known/assetlinks.json. Empty array when not configured. */
export function assetLinks(packageName: string | undefined, fingerprints: string | undefined) {
  const pkg = packageName?.trim();
  if (!pkg || !PACKAGE_RE.test(pkg)) return [];
  const fps = [...new Set((fingerprints ?? "").split(",").map(normalizeFingerprint).filter((f): f is string => !!f))];
  if (fps.length === 0) return [];
  return [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: { namespace: "android_app", package_name: pkg, sha256_cert_fingerprints: fps },
    },
  ];
}
