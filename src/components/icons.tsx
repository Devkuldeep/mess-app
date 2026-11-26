// Inline SVG icons (no icon font, no dependency). 24px, currentColor.
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = (p: P) => ({
  width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
  strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true, ...p,
});

export const IconPot = (p: P) => (<svg {...base(p)}><path d="M4 11h16v4a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" /><path d="M2 11h20M9 7c0-1 1-1 1-2M14 7c0-1 1-1 1-2" /></svg>);
export const IconBike = (p: P) => (<svg {...base(p)}><circle cx="5.5" cy="17" r="3" /><circle cx="18.5" cy="17" r="3" /><path d="M8.5 17h5l3-6h-4l-2-3H8M15 6h2.5l1 4" /></svg>);
export const IconUsers = (p: P) => (<svg {...base(p)}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6" /></svg>);
export const IconRupee = (p: P) => (<svg {...base(p)}><path d="M6 4h12M6 9h12M14 4c3 0 3 10-4 10H6l8 7" /></svg>);
export const IconMore = (p: P) => (<svg {...base(p)}><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg>);
export const IconPlus = (p: P) => (<svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>);
export const IconCheck = (p: P) => (<svg {...base(p)}><path d="m5 12 5 5L20 7" /></svg>);
export const IconPhone = (p: P) => (<svg {...base(p)}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" /></svg>);
export const IconMap = (p: P) => (<svg {...base(p)}><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>);
export const IconWhatsApp = (p: P) => (<svg {...base(p)}><path d="M3.5 20.5 5 16a8.5 8.5 0 1 1 3 3z" /><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 1c-1 0-2.5-1.5-2.5-2.5l1-1-1-2z" /></svg>);
export const IconChevron = (p: P) => (<svg {...base(p)}><path d="m9 6 6 6-6 6" /></svg>);
export const IconBack = (p: P) => (<svg {...base(p)}><path d="m15 6-6 6 6 6" /></svg>);
export const IconCloudOff = (p: P) => (<svg {...base(p)}><path d="m3 3 18 18M8 8a5 5 0 0 0-2 9h11M19.5 16A4 4 0 0 0 17 9h-1a6 6 0 0 0-5-3.9" /></svg>);
export const IconSync = (p: P) => (<svg {...base(p)}><path d="M20 12a8 8 0 0 1-14 5.3M4 12A8 8 0 0 1 18 6.7" /><path d="M18 2v5h-5M6 22v-5h5" /></svg>);
export const IconCopy = (p: P) => (<svg {...base(p)}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a1 1 0 0 1 1-1h10" /></svg>);
export const IconSearch = (p: P) => (<svg {...base(p)}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>);
export const IconCalendar = (p: P) => (<svg {...base(p)}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>);
export const IconDownload = (p: P) => (<svg {...base(p)}><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>);
