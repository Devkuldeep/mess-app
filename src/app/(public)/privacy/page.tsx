import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import { BUSINESS as B } from "@/lib/business";

export const metadata = { title: "Privacy Policy", description: `How ${B.appName} collects, uses and protects personal data.` };

// Template drafted for India's Digital Personal Data Protection Act, 2023 and
// Google's API Services User Data Policy. Get it reviewed by a lawyer.
export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      hindiTitle="गोपनीयता नीति"
      summary={[
        "हम सिर्फ़ उतना डेटा लेते हैं जितना मेस चलाने के लिए ज़रूरी है — नाम, मोबाइल, पता, प्लान, पेमेंट और खाने का हिसाब।",
        "ग्राहकों का डेटा मेस का है; हम उसे सिर्फ़ मेस के कहने पर संभालते हैं। न बेचते हैं, न विज्ञापन दिखाते हैं।",
        "आप कभी भी अपना डेटा डाउनलोड कर सकते हैं, ठीक करवा सकते हैं, या मिटाने को कह सकते हैं।",
        "Google Drive जोड़ने पर हम सिर्फ़ अपनी बनाई बैकअप फ़ाइलें देख/लिख सकते हैं, आपकी बाकी फ़ाइलें नहीं।",
        `शिकायत के लिए: ${B.grievanceOfficerName}, ${B.grievanceEmail}`,
      ]}
    >
      <p>
        This Privacy Policy explains how <b>{B.legalName}</b> ({B.entityType}), {B.address} (&quot;we&quot;, &quot;us&quot;), handles personal
        data in <b>{B.appName}</b> (the &quot;Service&quot;) — the web app at {B.domain}, its installable app, and customer links. It is written
        to meet the Digital Personal Data Protection Act, 2023 (&quot;DPDP Act&quot;) and the rules made under it.
      </p>

      <h2>1. Who is responsible for which data</h2>
      <table>
        <thead>
          <tr><th>Data</th><th>Who decides how it is used</th><th>Our role</th></tr>
        </thead>
        <tbody>
          <tr><td>Your account as a mess owner, manager or delivery staff (name, mobile number, password)</td><td>Us</td><td>Data Fiduciary</td></tr>
          <tr><td>Your mess&apos;s customers (tiffin customers) entered into the Service</td><td>The mess (our customer)</td><td>Data Processor — we act only on the mess&apos;s instructions</td></tr>
        </tbody>
      </table>
      <p>
        If you are a tiffin customer, the mess you buy from is responsible for your data. Please contact them first; we will help them respond
        to your request.
      </p>

      <h2>2. What we collect</h2>
      <ul>
        <li><b>Account data:</b> name, mobile number, password (stored only as a secure hash), role, and the mess you belong to.</li>
        <li><b>Mess data:</b> mess name, phone, UPI ID, plans and prices, menus/dishes, holidays, settings.</li>
        <li>
          <b>Tiffin customer data (entered by the mess):</b> name, mobile number, address, area, food preference (veg/non-veg), notes such as
          &quot;no onion&quot;, plan, start/stop dates, skipped meals, deliveries, and payments recorded.
        </li>
        <li><b>Kitchen data:</b> quantities cooked and left over, reasons and costs (wastage tracking).</li>
        <li>
          <b>Technical data:</b> a login session cookie, your language choice, and basic server logs (IP address, time, page) kept for
          security and troubleshooting.
        </li>
      </ul>
      <p>We do not collect payment card or bank details. UPI payments happen in your UPI app; the mess only records that a payment was made.</p>

      <h2>3. Why we use it (purpose)</h2>
      <ul>
        <li>To run the Service: daily cooking counts, delivery lists, billing and dues, customer skip links, reports and backups.</li>
        <li>To secure accounts, prevent misuse and fix problems.</li>
        <li>To contact you about your account, billing and important changes.</li>
        <li>To meet legal obligations.</li>
      </ul>
      <p>
        We process your account data on the basis of your <b>consent</b>, given when you sign up, and for legitimate uses permitted by the DPDP
        Act. We do <b>not</b> sell personal data, use it for advertising, or share one mess&apos;s data with another mess. Any statistics
        across messes (for example average wastage in an area) are aggregated and anonymised so no person or mess can be identified.
      </p>

      <h2>4. Responsibilities of the mess (for tiffin customer data)</h2>
      <p>
        A mess using the Service must tell its customers that their details are kept in {B.appName}, collect only what it needs, and obtain
        consent where required — including <b>verifiable consent from a parent or guardian for customers under 18</b> (for example
        school/hostel students), as the DPDP Act requires.
      </p>

      <h2>5. Google user data (Google Drive backup)</h2>
      <p>
        If a mess owner chooses to connect Google Drive, we request only the <code>drive.file</code> permission. This lets us create backup
        files of the owner&apos;s own mess data in their Drive and manage only the files we created. We cannot see or change any other files.
        We store the access token encrypted, use it only to upload and remove these backups, and do not share Google user data with anyone.
      </p>
      <p>
        <b>
          {B.appName}&apos;s use and transfer to any other app of information received from Google APIs will adhere to the{" "}
          <a href="https://developers.google.com/terms/api-services-user-data-policy" rel="noreferrer">Google API Services User Data Policy</a>,
          including the Limited Use requirements.
        </b>{" "}
        Google user data is never used for advertising or to train AI models, and humans do not read it except with your permission, for
        security reasons, or where the law requires. You can disconnect at any time from the app or from your Google Account&apos;s
        &quot;Third-party connections&quot; page.
      </p>

      <h2>6. Who we share data with</h2>
      <p>Only service providers that help us run the Service, under contracts that require them to protect it:</p>
      <ul>
        <li>Hosting: {B.hostingProvider}</li>
        <li>Database: {B.databaseProvider}</li>
        <li>Google (only if you connect Google Drive)</li>
        <li>A payment gateway such as Razorpay (only for paying your {B.appName} subscription, when enabled)</li>
      </ul>
      <p>
        WhatsApp reminders and UPI payment links open in your own WhatsApp/UPI app; we do not send your data to WhatsApp or banks ourselves. We
        may disclose data if required by law or a lawful order.
      </p>

      <h2>7. Where data is stored and how it is protected</h2>
      <p>
        Data is stored with {B.databaseProvider} in {B.dataRegion}. We use encrypted connections (HTTPS), hashed passwords, per-mess data
        separation, role-based access, and limited staff access. If the app is used offline, recent pages and unsent changes are kept on that
        phone until they sync; logging out clears them.
      </p>
      <p>
        If a personal data breach happens, we will inform affected users and the Data Protection Board of India as required by law, and the
        affected mess so it can inform its customers.
      </p>

      <h2>8. How long we keep data</h2>
      <ul>
        <li>While your account is active, for as long as needed to provide the Service.</li>
        <li>After an account is closed, we keep the mess&apos;s data for {B.retentionDaysAfterClose} days (so it can be exported or restored) and then delete it, unless the law requires us to keep some of it longer (for example billing records).</li>
        <li>A mess can delete an individual customer&apos;s data at any time.</li>
      </ul>

      <h2>9. Your rights</h2>
      <p>Under the DPDP Act you can:</p>
      <ul>
        <li><b>Access</b> a summary of your personal data and how it is used — owners can download all mess data any time from More → Backup.</li>
        <li><b>Correct or update</b> inaccurate data.</li>
        <li><b>Erase</b> data that is no longer needed, and <b>withdraw consent</b> (which may mean you can no longer use the Service).</li>
        <li><b>Nominate</b> another person to exercise these rights if you die or become unable to.</li>
        <li><b>Raise a grievance</b> with us, and then with the Data Protection Board of India if you are not satisfied.</li>
      </ul>
      <p>
        To use these rights, email {B.grievanceEmail}. Tiffin customers should contact their mess first (see section 1).
      </p>

      <h2>10. Cookies</h2>
      <p>
        We use only essential cookies: one to keep you logged in and one to remember your language. We do not use advertising or tracking
        cookies.
      </p>

      <h2>11. Grievance Officer</h2>
      <p>
        {B.grievanceOfficerName}
        <br />
        Email: {B.grievanceEmail}
        <br />
        Address: {B.address}
        <br />
        We aim to resolve grievances within {B.grievanceResponseDays} days.
      </p>

      <h2>12. Changes to this policy</h2>
      <p>
        If we make important changes, we will show a notice in the app and update the date above. For changes that need fresh consent, we will
        ask for it.
      </p>

      <p>
        Questions? See <Link href="/contact">Contact Us</Link>.
      </p>
    </LegalPage>
  );
}
