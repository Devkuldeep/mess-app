// Phone normalisation and deep links (WhatsApp click-to-chat, UPI, tel, maps).

/** Keep the last 10 digits of an Indian mobile number, or null if invalid. */
export function normalizePhone(input: string | null | undefined): string | null {
  if (!input) return null;
  let d = input.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? d : null;
}

export function whatsappLink(phone: string | null, text: string): string {
  const p = normalizePhone(phone);
  const q = `text=${encodeURIComponent(text)}`;
  return p ? `https://wa.me/91${p}?${q}` : `https://wa.me/?${q}`;
}

export function upiLink(opts: { upiId: string; payee: string; amount?: number; note?: string }): string {
  const params = new URLSearchParams({ pa: opts.upiId, pn: opts.payee, cu: "INR" });
  if (opts.amount && opts.amount > 0) params.set("am", opts.amount.toFixed(2));
  if (opts.note) params.set("tn", opts.note.slice(0, 50));
  return `upi://pay?${params.toString()}`;
}

export function mapsLink(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;
export const UPI_RE = /^[A-Za-z0-9._-]{2,256}@[A-Za-z0-9.-]{2,64}$/;
