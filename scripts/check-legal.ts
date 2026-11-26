// Pre-launch check: fails if src/lib/business.ts still has [PLACEHOLDERS].
//   npm run check:legal
import { findPlaceholders } from "../src/lib/business.ts";

const left = findPlaceholders();
if (left.length === 0) {
  console.log("✓ No placeholders left in src/lib/business.ts");
} else {
  console.error(`✖ ${left.length} placeholder(s) to fill in src/lib/business.ts:\n`);
  for (const l of left) console.error(`  - ${l}`);
  console.error("\nThen have a lawyer review /privacy, /terms and /refund.");
  process.exit(1);
}
