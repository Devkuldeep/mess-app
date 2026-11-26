// Minimal Google OAuth 2.0 + Drive v3 client (fetch only, no SDK).
// Scope: drive.file — the app can only see files it created in the owner's Drive.
import "server-only";
import { createHash, randomBytes } from "node:crypto";

export const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const SCOPES = ["openid", "email", DRIVE_SCOPE];
export const FOLDER_NAME = "Mess Manager Backups";
/** httpOnly cookie holding "state.verifier.orgId" during the OAuth round-trip. */
export const OAUTH_COOKIE = "g_oauth";

// Real endpoints. GOOGLE_TEST_BASE (localhost only) points everything at a fake
// server for automated tests; it's ignored for any other host.
function endpoints() {
  const fake = process.env.GOOGLE_TEST_BASE;
  if (fake && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(fake)) {
    return { auth: `${fake}/o/oauth2/v2/auth`, token: `${fake}/token`, revoke: `${fake}/revoke`, drive: `${fake}/drive/v3`, upload: `${fake}/upload/drive/v3` };
  }
  return {
    auth: "https://accounts.google.com/o/oauth2/v2/auth",
    token: "https://oauth2.googleapis.com/token",
    revoke: "https://oauth2.googleapis.com/revoke",
    drive: "https://www.googleapis.com/drive/v3",
    upload: "https://www.googleapis.com/upload/drive/v3",
  };
}

export function googleConfigured(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.TOKEN_ENCRYPTION_KEY);
}

function client() {
  const id = process.env.GOOGLE_CLIENT_ID;
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  if (!id || !secret) throw new Error("Google OAuth is not configured");
  return { id, secret };
}

export function redirectUri(origin: string): string {
  return `${(process.env.APP_URL || origin).replace(/\/$/, "")}/api/google/callback`;
}

// ───────────── OAuth ─────────────

export function newPkce() {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge, state: randomBytes(16).toString("base64url") };
}

export function authUrl(opts: { redirectUri: string; state: string; challenge: string; loginHint?: string }): string {
  const p = new URLSearchParams({
    client_id: client().id,
    redirect_uri: opts.redirectUri,
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline", // → refresh token for nightly backups
    prompt: "consent", // always return a refresh token, even on reconnect
    include_granted_scopes: "true",
    state: opts.state,
    code_challenge: opts.challenge,
    code_challenge_method: "S256",
  });
  if (opts.loginHint) p.set("login_hint", opts.loginHint);
  return `${endpoints().auth}?${p}`;
}

export class GoogleError extends Error {
  constructor(message: string, readonly status: number, readonly reconnect = false) {
    super(message);
  }
}

async function tokenRequest(body: Record<string, string>) {
  const res = await fetch(endpoints().token, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, string>;
  if (!res.ok) {
    // invalid_grant = token revoked/expired → owner must reconnect
    throw new GoogleError(json.error_description || json.error || `token ${res.status}`, res.status, json.error === "invalid_grant");
  }
  return json;
}

export async function exchangeCode(code: string, verifier: string, redirect: string) {
  const { id, secret } = client();
  const t = await tokenRequest({
    grant_type: "authorization_code", code, code_verifier: verifier, client_id: id, client_secret: secret, redirect_uri: redirect,
  });
  // id_token came straight from Google's token endpoint over TLS, so its
  // payload can be read without verifying the signature (per Google's docs).
  let email: string | null = null;
  if (t.id_token) {
    try {
      email = JSON.parse(Buffer.from(t.id_token.split(".")[1], "base64url").toString()).email ?? null;
    } catch {
      email = null;
    }
  }
  return { accessToken: t.access_token, refreshToken: t.refresh_token as string | undefined, scope: t.scope ?? "", email };
}

export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const { id, secret } = client();
  const t = await tokenRequest({ grant_type: "refresh_token", refresh_token: refreshToken, client_id: id, client_secret: secret });
  return t.access_token;
}

export async function revokeToken(token: string): Promise<void> {
  await fetch(`${endpoints().revoke}?token=${encodeURIComponent(token)}`, { method: "POST", cache: "no-store" }).catch(() => {});
}

// ───────────── Drive ─────────────

async function drive(accessToken: string, path: string, init: RequestInit = {}, base = endpoints().drive) {
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${accessToken}`, ...(init.headers ?? {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new GoogleError(body.error?.message || `drive ${res.status}`, res.status, res.status === 401);
  }
  return res.status === 204 ? null : res.json();
}

export async function createFolder(accessToken: string): Promise<string> {
  const f = (await drive(accessToken, "/files?fields=id", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: FOLDER_NAME, mimeType: "application/vnd.google-apps.folder" }),
  })) as { id: string };
  return f.id;
}

/** True if the folder still exists and isn't in the trash. */
export async function folderUsable(accessToken: string, folderId: string): Promise<boolean> {
  try {
    const f = (await drive(accessToken, `/files/${encodeURIComponent(folderId)}?fields=id,trashed`)) as { trashed?: boolean };
    return !f.trashed;
  } catch (e) {
    if (e instanceof GoogleError && e.status === 404) return false;
    throw e;
  }
}

export async function uploadFile(accessToken: string, folderId: string, name: string, data: Uint8Array, mimeType = "application/zip") {
  const boundary = `mess-${randomBytes(8).toString("hex")}`;
  const meta = JSON.stringify({ name, parents: [folderId], mimeType });
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`),
    Buffer.from(data),
    Buffer.from(`\r\n--${boundary}--`),
  ]);
  return (await drive(
    accessToken,
    "/files?uploadType=multipart&fields=id,name,size",
    { method: "POST", headers: { "content-type": `multipart/related; boundary=${boundary}` }, body },
    endpoints().upload,
  )) as { id: string; name: string };
}

export type DriveFile = { id: string; name: string; createdTime: string };

/** Files in our folder, newest first (drive.file only ever returns files we created). */
export async function listFolder(accessToken: string, folderId: string): Promise<DriveFile[]> {
  const q = encodeURIComponent(`'${folderId.replace(/'/g, "")}' in parents and trashed = false`);
  const r = (await drive(accessToken, `/files?q=${q}&orderBy=createdTime%20desc&pageSize=200&fields=files(id,name,createdTime)`)) as { files: DriveFile[] };
  return r.files ?? [];
}

export async function deleteFile(accessToken: string, id: string): Promise<void> {
  await drive(accessToken, `/files/${encodeURIComponent(id)}`, { method: "DELETE" });
}
