import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import { BUSINESS as B } from "@/lib/business";

export const metadata = { title: "Terms & Conditions", description: `Terms for using ${B.appName}.` };

// Template — get it reviewed by a lawyer before launch.
export default function TermsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      hindiTitle="नियम और शर्तें"
      summary={[
        `${B.trialDays} दिन फ़्री ट्रायल, फिर महीने का प्लान। रिन्यू न हो तो ${B.graceDays} दिन बाद नई एंट्री रुक जाती है, डेटा नहीं मिटता।`,
        "ग्राहकों का डेटा आपके मेस का है। ग्राहकों से अनुमति लेना और खाने की गुणवत्ता/FSSAI नियम मानना मेस मालिक की ज़िम्मेदारी है।",
        "ऐप हिसाब में मदद करता है; बिल और गिनती एक बार ज़रूर जाँच लें।",
        "गलत इस्तेमाल (स्पैम, किसी और का डेटा, हैकिंग) पर अकाउंट बंद हो सकता है।",
        `विवाद होने पर ${B.jurisdictionCity} की अदालतें।`,
      ]}
    >
      <p>
        These Terms are an agreement between you and <b>{B.legalName}</b> ({B.entityType}), {B.address} (&quot;we&quot;, &quot;us&quot;), for
        use of <b>{B.appName}</b> (the &quot;Service&quot;). By creating an account or using the Service you agree to these Terms and our{" "}
        <Link href="/privacy">Privacy Policy</Link>. If you use the Service for a business, you confirm you are allowed to accept these Terms
        for it.
      </p>

      <h2>1. The Service</h2>
      <p>
        {B.appName} is software for tiffin and mess businesses to manage customers, daily cooking counts, deliveries, skips, billing,
        payments records and kitchen wastage, and to give their customers a link to skip meals and pay. We may improve, change or remove
        features over time; we will give reasonable notice before removing something you pay for.
      </p>

      <h2>2. Accounts and staff</h2>
      <ul>
        <li>You must be at least 18 and give accurate details. Keep your password private; you are responsible for activity on your account.</li>
        <li>The mess owner controls who joins the mess as manager or delivery staff and is responsible for their use of the Service.</li>
        <li>Customer links work without a password. Share them only with the customer concerned; anyone with a link can see and change that customer&apos;s skips.</li>
      </ul>

      <h2>3. Free trial, subscription and payment</h2>
      <ul>
        <li>New messes get a free trial of {B.trialDays} days. Plans and prices are listed on the <Link href="/pricing">Pricing</Link> page and may change with at least 30 days&apos; notice.</li>
        <li>Subscriptions are billed in advance for each billing period and renew automatically until cancelled. Prices are in Indian Rupees{B.gstin ? " and exclusive of GST, which is added as applicable" : ""}.</li>
        <li>If a renewal payment fails, you get a grace period of {B.graceDays} days. After that we may limit the account (for example stop new entries) until payment is made. We will not delete your data for non-payment without notice; see section 9.</li>
        <li>Refunds and cancellations are covered by our <Link href="/refund">Refund &amp; Cancellation Policy</Link>.</li>
        <li>If you joined through a reseller or agent, they are not our employees and cannot change these Terms or promise features or prices on our behalf.</li>
      </ul>

      <h2>4. Your data</h2>
      <ul>
        <li>
          <b>You own your mess&apos;s data</b>, including your customers&apos; details. You give us permission to store and process it only to
          provide the Service to you, as described in the Privacy Policy. We act as your data processor for your customers&apos; data.
        </li>
        <li>You can export all your data at any time (More → Backup → Download my data).</li>
        <li>
          You are responsible for having a lawful basis to enter your customers&apos; data: tell them you use {B.appName}, collect only what
          you need, get consent where required (including a parent&apos;s or guardian&apos;s consent for anyone under 18), and respond to
          their requests to correct or delete their data.
        </li>
        <li>Keep your own copies of important records. We take regular backups but do not guarantee that data can never be lost.</li>
      </ul>

      <h2>5. Your business responsibilities</h2>
      <ul>
        <li>
          You alone are responsible for your food business — food safety and hygiene, FSSAI registration or licence, quality, allergens,
          delivery, pricing, taxes and your agreements with your customers. We do not prepare, sell or deliver food.
        </li>
        <li>
          Counts, bills, balances, wastage figures and cooking suggestions are calculated from the data entered and are aids, not guarantees.
          Check them before acting on them or billing customers.
        </li>
        <li>WhatsApp messages and UPI links are sent from your own WhatsApp/UPI apps; follow WhatsApp&apos;s and your bank&apos;s rules and do not spam.</li>
      </ul>

      <h2>6. Acceptable use</h2>
      <p>You must not:</p>
      <ul>
        <li>use the Service for anything illegal, fraudulent or harmful, or to store data you have no right to;</li>
        <li>try to access another mess&apos;s data, break or test our security without permission, or overload the Service;</li>
        <li>copy, resell or reverse-engineer the Service except as allowed by law;</li>
        <li>send spam or harassing messages to your customers using links or data from the Service.</li>
      </ul>

      <h2>7. Availability and offline use</h2>
      <p>
        We aim to keep the Service available but do not promise it will be uninterrupted or error-free. Some features work offline; changes
        made offline are saved on that device and sync when it reconnects — if the device is lost, reset or logged out before syncing, those
        changes can be lost.
      </p>

      <h2>8. Third-party services</h2>
      <p>
        Optional features use third parties such as Google Drive, WhatsApp, UPI apps and payment gateways. Their own terms apply, and we are
        not responsible for their services.
      </p>

      <h2>9. Cancellation, suspension and closing an account</h2>
      <ul>
        <li>You can stop using the Service and cancel your subscription at any time.</li>
        <li>We may suspend or close an account that breaks these Terms, is used unlawfully, or remains unpaid after the grace period, with notice where reasonable.</li>
        <li>After an account is closed, you can ask for an export within {B.retentionDaysAfterClose} days; after that the data is deleted as described in the Privacy Policy.</li>
      </ul>

      <h2>10. Limitation of liability</h2>
      <p>
        To the extent the law allows, the Service is provided &quot;as is&quot;, and we are not liable for indirect or consequential losses
        (such as lost profits, lost data or business interruption). Our total liability for any claim relating to the Service is limited to
        the fees you paid us in the 3 months before the claim. Nothing in these Terms limits liability that cannot be limited under Indian law.
      </p>

      <h2>11. Indemnity</h2>
      <p>
        You agree to compensate us for claims by third parties (including your customers or authorities) arising from your food business, the
        data you entered without a lawful basis, or your breach of these Terms.
      </p>

      <h2>12. Changes to these Terms</h2>
      <p>
        We may update these Terms. For material changes we will notify you in the app at least 15 days before they take effect. Continuing to
        use the Service after that means you accept the new Terms.
      </p>

      <h2>13. Governing law and disputes</h2>
      <p>
        These Terms are governed by the laws of India. We will first try to resolve any dispute by talking to you (write to {B.supportEmail}).
        Otherwise, the courts at {B.jurisdictionCity}, {B.state} have exclusive jurisdiction.
      </p>

      <h2>14. Contact</h2>
      <p>
        {B.legalName}, {B.address}
        <br />
        Email: {B.supportEmail} · Phone: {B.supportPhone}
      </p>
    </LegalPage>
  );
}
