import { LegalPage } from "@/components/legal-page";
import { BUSINESS as B } from "@/lib/business";

export const metadata = { title: "Shipping & Delivery Policy", description: `${B.appName} is a digital service — nothing is shipped.` };

export default function ShippingPage() {
  return (
    <LegalPage
      title="Shipping & Delivery Policy"
      hindiTitle="शिपिंग और डिलीवरी नीति"
      summary={[
        "यह एक ऑनलाइन सॉफ़्टवेयर सेवा है — कोई सामान भेजा नहीं जाता।",
        "पेमेंट होते ही (या ट्रायल शुरू होते ही) ऐप तुरंत चालू हो जाता है।",
        "टिफ़िन की डिलीवरी मेस खुद करता है, यह कंपनी नहीं।",
      ]}
    >
      <h2>1. Digital service — no physical shipping</h2>
      <p>
        <b>{B.appName}</b> is software provided online by <b>{B.legalName}</b>. We do not ship any physical goods. There are no shipping
        charges.
      </p>

      <h2>2. When you get access</h2>
      <p>
        Access starts immediately when you create an account (free trial) or when your subscription payment succeeds. You use the Service at{" "}
        {B.domain} in your browser or as an installed app on your phone. If access does not start within 24 hours of a successful payment,
        contact {B.supportEmail} or {B.supportPhone}.
      </p>

      <h2>3. Food delivery</h2>
      <p>
        Messes use {B.appName} to manage their own tiffin deliveries. We do not prepare, sell, ship or deliver food; delivery of tiffins is
        the responsibility of the mess.
      </p>
    </LegalPage>
  );
}
