import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import { BUSINESS as B } from "@/lib/business";

export const metadata = { title: "Refund & Cancellation Policy", description: `Refunds and cancellations for ${B.appName} subscriptions.` };

// Default rule (edit if you choose differently): free trial, monthly billing in
// advance, cancel any time → access till period end, no partial-month refunds,
// duplicate/wrong charges refunded.
export default function RefundPage() {
  return (
    <LegalPage
      title="Refund & Cancellation Policy"
      hindiTitle="रिफ़ंड और कैंसिलेशन नीति"
      summary={[
        `${B.trialDays} दिन फ़्री ट्रायल — कोई पैसा नहीं लगता।`,
        "कभी भी कैंसिल करें; जिस महीने का पैसा दिया है, उसके आख़िर तक ऐप चलता रहेगा।",
        "आधे महीने का पैसा वापस नहीं होता।",
        `गलती से दो बार या ज़्यादा पैसा कटा तो ${B.refundProcessingDays} कामकाजी दिन में वापस।`,
        "यह नीति सिर्फ़ ऐप के सब्सक्रिप्शन की है — टिफ़िन के पैसे का हिसाब आपके मेस से होगा।",
      ]}
    >
      <p>
        This policy applies to subscriptions to <b>{B.appName}</b> paid to <b>{B.legalName}</b>. It does not cover money paid by tiffin
        customers to a mess for food — refunds for food are between the customer and that mess.
      </p>

      <h2>1. Free trial</h2>
      <p>New messes get a free trial of {B.trialDays} days. You are not charged during the trial, and you can stop at any time.</p>

      <h2>2. Cancellation</h2>
      <ul>
        <li>You can cancel your subscription at any time by writing to {B.supportEmail} (and, once available, from the app&apos;s settings).</li>
        <li>Cancellation stops the next renewal. You keep access until the end of the period you have already paid for.</li>
        <li>You can download all your data before and for {B.retentionDaysAfterClose} days after your account closes.</li>
      </ul>

      <h2>3. Refunds</h2>
      <ul>
        <li>Subscription fees are paid in advance and are <b>not refundable for partially used periods</b>.</li>
        <li>
          We will refund in full: duplicate charges, charges made after a cancellation took effect, and charges we made in error. Tell us within
          30 days of the charge.
        </li>
        <li>
          If the Service is unavailable for a long period because of a fault on our side, contact us — we will offer a fair credit or refund for
          the affected time.
        </li>
      </ul>

      <h2>4. How refunds are paid</h2>
      <p>
        Approved refunds are processed within {B.refundProcessingDays} working days to the original payment method. Your bank or UPI app may
        take a few more days to show it.
      </p>

      <h2>5. Contact</h2>
      <p>
        Email {B.supportEmail} or call {B.supportPhone} ({B.supportHours}) with your mess name and payment details. See also our{" "}
        <Link href="/terms">Terms &amp; Conditions</Link>.
      </p>
    </LegalPage>
  );
}
