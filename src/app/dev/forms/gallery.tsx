"use client";
import { useState } from "react";
import {
  FormAmountInput, FormCheckbox, FormDatePicker, FormDateRangePicker, FormInput, FormNumberStepper, FormPasswordInput,
  FormPhoneInput, FormRadioGroup, FormSearchInput, FormSelect, FormSensitiveInput, FormSubmitButton, FormSwitch, FormTextarea,
  ConfirmButton, QuickForm, rangePresets,
} from "@/components/ui";
import type { FormState } from "@/lib/validation";

const sensitiveLabels = { show: "दिखाएं", hide: "छुपाएं", change: "बदलें", cancel: "रद्द" };
const quickErrors = { nameRequired: "नाम ज़रूरी है", fixFields: "लाल निशान वाले फ़ील्ड ठीक करें" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="section-title">{title}</h2>
      <div className="card space-y-5 p-4">{children}</div>
    </section>
  );
}

export function FormsGallery({ today }: { today: string }) {
  const [submitted, setSubmitted] = useState<Record<string, string> | null>(null);

  async function demoAction(fd: FormData) {
    await new Promise((r) => setTimeout(r, 600)); // show the pending state
    setSubmitted(Object.fromEntries([...fd.entries()].map(([k, v]) => [k, String(v)])));
  }

  const [removed, setRemoved] = useState(0);

  async function quickAction(fd: FormData): Promise<FormState> {
    await new Promise((r) => setTimeout(r, 500));
    const name = String(fd.get("name") ?? "").trim();
    if (!name) return { fieldErrors: { name: "nameRequired" } };
    return { ok: true };
  }

  return (
    <main className="mx-auto max-w-md space-y-6 p-4 pb-24">
      <header>
        <h1 className="text-2xl font-bold">Form controls</h1>
        <p className="text-sm text-muted">src/components/ui/forms · dev only</p>
      </header>

      <form action={demoAction} className="space-y-6">
        <Section title="Text">
          <FormInput name="name" label="ग्राहक का नाम" required placeholder="Ravi Kumar" autoComplete="off" />
          <FormInput name="upi" label="UPI ID" suffix="@okaxis" placeholder="sharmatiffin" hint="बिना @ वाला हिस्सा" autoCapitalize="none" />
          <FormInput name="area" label="एरिया" error="एरिया ज़रूरी है" defaultValue="" />
          <FormTextarea name="notes" label="नोट" maxLength={120} placeholder="कम तीखा, बिना प्याज़" />
          <FormSearchInput placeholder="ग्राहक खोजें" defaultValue="Aman" />
          <FormPasswordInput name="password" label="पासवर्ड" autoComplete="new-password" hint="कम से कम 8 अक्षर" />
          <FormSensitiveInput name="accountSecret" label="बैंक खाता नंबर" inputMode="numeric" hint="15 सेकंड बाद अपने-आप छुप जाता है" labels={sensitiveLabels} />
          <FormSensitiveInput name="apiToken" label="API key" savedMask="•••• 4f2a" hint="बदलें दबाए बिना पुराना ही रहेगा" labels={sensitiveLabels} />
        </Section>

        <Section title="Numbers & money">
          <FormPhoneInput name="phone" label="मोबाइल नंबर" required invalidMessage="10 अंकों का मोबाइल नंबर डालें" />
          <FormAmountInput name="amount" label="रकम" size="lg" shortcuts={[{ label: "पूरा बाकी", amount: 2720 }, { amount: 500 }, { amount: 1000 }]} />
          <FormNumberStepper name="cooked" label="कितना बना" unit="किलो" step={0.5} defaultValue={4} />
          <FormNumberStepper name="roti" label="रोटी" unit="नग" step={10} defaultValue={120} />
        </Section>

        <Section title="Choices">
          <FormRadioGroup
            name="diet"
            label="खाने का प्रकार"
            defaultValue="veg"
            options={[
              { value: "veg", label: "वेज", icon: <span className="size-2.5 rounded-sm bg-veg" /> },
              { value: "nonveg", label: "नॉन-वेज", icon: <span className="size-2.5 rounded-sm bg-nonveg" /> },
            ]}
          />
          <FormRadioGroup
            name="plan"
            label="प्लान"
            variant="cards"
            defaultValue="both"
            options={[
              { value: "both", label: "दोपहर + रात", description: "रोज़ 2 टिफ़िन", meta: "₹60 / टिफ़िन" },
              { value: "lunch", label: "सिर्फ़ दोपहर", meta: "₹70 / टिफ़िन" },
              { value: "dinner", label: "सिर्फ़ रात", meta: "₹70 / टिफ़िन" },
            ]}
          />
          <FormRadioGroup
            name="method"
            label="पेमेंट का तरीका"
            variant="list"
            defaultValue="upi"
            options={[
              { value: "upi", label: "UPI", description: "GPay, PhonePe, Paytm" },
              { value: "cash", label: "नकद" },
              { value: "other", label: "अन्य" },
            ]}
          />
          <FormSelect
            name="area2"
            label="एरिया / रूट"
            placeholder="चुनें…"
            options={[{ value: "s5", label: "Sector 5" }, { value: "s7", label: "Sector 7" }, { label: "Civil Lines", options: [{ value: "cl1", label: "Civil Lines – North" }, { value: "cl2", label: "Civil Lines – South" }] }]}
          />
          <FormCheckbox name="consent" label="मैं नियम और गोपनीयता नीति से सहमत हूँ" required />
          <FormCheckbox name="trial" variant="card" label="ट्रायल टिफ़िन" description="पहला टिफ़िन ₹49 में" />
          <FormSwitch name="reminders" label="WhatsApp रिमाइंडर" description="हर महीने 1 तारीख को" defaultChecked />
        </Section>

        <Section title="Dates">
          <FormDatePicker
            name="startDate"
            label="शुरू की तारीख"
            defaultValue={today}
            today={today}
            lang="hi"
            shortcuts={[{ label: "आज", days: 0 }, { label: "कल", days: 1 }, { label: "अगले सोमवार", days: 7 }]}
          />
          <FormDateRangePicker
            name="report"
            label="रिपोर्ट की अवधि"
            defaultValue={{ from: today, to: today }}
            max={today}
            presets={rangePresets(today, { today: "आज", last7: "पिछले 7 दिन", thisMonth: "इस महीने", lastMonth: "पिछला महीना" })}
            labels={{ from: "से", to: "तक", days: "{n} दिन" }}
          />
        </Section>

        <FormSubmitButton pendingText="सेव हो रहा है…">सेव करें</FormSubmitButton>
      </form>

      <Section title="QuickForm + ConfirmButton">
        <QuickForm action={quickAction} submit="सेव करें" saved="सेव हो गया" errors={quickErrors} resetOnSave>
          <FormInput name="name" label="प्लान का नाम" placeholder="खाली छोड़ कर error देखें" />
        </QuickForm>
        <div className="flex items-center gap-2">
          <span className="flex-1 text-sm">हटाया गया: {removed}</span>
          <ConfirmButton action={async () => { await new Promise((r) => setTimeout(r, 400)); setRemoved((n) => n + 1); }} fields={{ id: "demo" }} label="हटाएं" confirm="पक्का? फिर दबाएँ" />
        </div>
      </Section>

      {submitted && (
        <pre className="card overflow-x-auto p-4 text-xs" aria-label="Submitted FormData">{JSON.stringify(submitted, null, 2)}</pre>
      )}
    </main>
  );
}
