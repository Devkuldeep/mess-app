// GET /api/export → ZIP download of all the org's data. Owner only.
import { getMember } from "@/server/auth";
import { buildExport } from "@/server/export";

export async function GET() {
  const ctx = await getMember();
  if (!ctx) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (ctx.role !== "owner") return Response.json({ error: "forbidden" }, { status: 403 });

  const { filename, zip } = await buildExport(ctx);
  return new Response(zip as BodyInit, {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="${filename}"`,
      "content-length": String(zip.byteLength),
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
