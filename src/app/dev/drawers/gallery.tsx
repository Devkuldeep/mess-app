"use client";
import { useState } from "react";
import {
  Drawer, DrawerBody, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHandle, DrawerHeader, DrawerTitle,
  DrawerTrigger, FormRadioGroup, FormSwitch, useDrawer,
} from "@/components/ui";

const customers = ["Aman Verma", "Priya Singh", "Rahul Gupta", "Neha Joshi", "Vikram Patel", "Sana Khan", "Arjun Mehta", "Kavya Rao", "Ravi Kumar", "Pooja Sharma", "Imran Ali", "Deepak Yadav", "Sneha Patil", "Rohit Jain"];

function Row({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="section-title">{title}</h2>
      <div className="card flex flex-wrap gap-2 p-4">{children}</div>
    </section>
  );
}

/** Closes its own drawer after "saving" — shows useDrawer(). */
function SaveAndClose() {
  const { setOpen } = useDrawer();
  return (
    <button type="button" className="btn-primary flex-1" onClick={() => setOpen(false)}>
      लागू करें
    </button>
  );
}

export function DrawersGallery() {
  const [controlled, setControlled] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const note = (s: string) => setLog((l) => [s, ...l].slice(0, 4));

  return (
    <main className="mx-auto max-w-md space-y-6 p-4 pb-24">
      <header>
        <h1 className="text-2xl font-bold">Drawers</h1>
        <p className="text-sm text-muted">src/components/ui/drawers · dev only · Esc / overlay / swipe से बंद करें</p>
      </header>

      <Row title="Bottom sheet">
        {/* 1. Filter sheet: auto height, handle, header, footer */}
        <Drawer onOpenChange={(o) => note(`filter: ${o ? "open" : "closed"}`)}>
          <DrawerTrigger className="btn-primary" data-test="open-filter">फ़िल्टर</DrawerTrigger>
          <DrawerContent onClosed={() => note("filter: close animation done")}>
            <DrawerHandle />
            <DrawerHeader closeLabel="बंद करें">
              <DrawerTitle>ग्राहक फ़िल्टर करें</DrawerTitle>
              <DrawerDescription>प्लान और खाने के प्रकार से छाँटें</DrawerDescription>
            </DrawerHeader>
            <DrawerBody className="space-y-4">
              <FormRadioGroup name="plan" label="प्लान" defaultValue="all" options={[{ value: "all", label: "सभी" }, { value: "both", label: "दोनों" }, { value: "lunch", label: "दोपहर" }]} />
              <FormRadioGroup name="diet" label="खाना" defaultValue="any" options={[{ value: "any", label: "सभी" }, { value: "veg", label: "वेज" }, { value: "nonveg", label: "नॉन-वेज" }]} />
              <FormSwitch name="dues" label="सिर्फ़ बाकी वाले" description="जिनका पैसा बाकी है" />
            </DrawerBody>
            <DrawerFooter>
              <DrawerClose className="btn-secondary flex-1">रद्द करें</DrawerClose>
              <SaveAndClose />
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        {/* 2. Tall sheet with a long scrolling list: swipe only from handle/header */}
        <Drawer>
          <DrawerTrigger className="btn-secondary" data-test="open-list">लंबी लिस्ट (lg)</DrawerTrigger>
          <DrawerContent size="lg">
            <DrawerHandle />
            <DrawerHeader><DrawerTitle>ग्राहक चुनें</DrawerTitle></DrawerHeader>
            <DrawerBody className="px-0">
              <ul className="divide-y divide-line">
                {customers.concat(customers).map((c, i) => (
                  <li key={i}><DrawerClose className="flex min-h-14 w-full items-center px-4 text-left active:bg-line/60">{c}</DrawerClose></li>
                ))}
              </ul>
            </DrawerBody>
          </DrawerContent>
        </Drawer>

        {/* 3. Full-screen */}
        <Drawer>
          <DrawerTrigger className="btn-secondary">फ़ुल स्क्रीन</DrawerTrigger>
          <DrawerContent size="full" tone="surface">
            <DrawerHeader className="border-b border-line pt-4"><DrawerTitle>नया ग्राहक</DrawerTitle></DrawerHeader>
            <DrawerBody className="pt-4"><p className="text-muted">पूरी स्क्रीन वाला फ़ॉर्म (जैसे लंबा फ़ॉर्म)।</p></DrawerBody>
            <DrawerFooter><DrawerClose className="btn-primary w-full">सेव करें</DrawerClose></DrawerFooter>
          </DrawerContent>
        </Drawer>
      </Row>

      <Row title="Side panels">
        {/* 4. Right panel: details */}
        <Drawer>
          <DrawerTrigger className="btn-secondary" data-test="open-right">दाएँ से (details)</DrawerTrigger>
          <DrawerContent side="right">
            <DrawerHeader className="pt-4"><DrawerTitle>Aman Verma</DrawerTitle><DrawerDescription>Lunch + Dinner · Sector 5</DrawerDescription></DrawerHeader>
            <DrawerBody className="space-y-3">
              <p className="card p-3"><span className="text-sm text-muted">बाकी</span><br /><b className="text-2xl text-bad">₹2,720</b></p>
              <p className="text-sm text-muted">बाएँ-दाएँ स्वाइप करके बंद करें (हेडर पकड़ कर)।</p>
            </DrawerBody>
          </DrawerContent>
        </Drawer>

        {/* 5. Left panel: menu, blur overlay */}
        <Drawer>
          <DrawerTrigger className="btn-secondary">बाएँ से (menu)</DrawerTrigger>
          <DrawerContent side="left" size="sm" overlay="blur">
            <DrawerHeader className="pt-4"><DrawerTitle>मेन्यू</DrawerTitle></DrawerHeader>
            <DrawerBody className="px-2">
              {["आज", "डिलीवरी", "ग्राहक", "पेमेंट", "सेटिंग"].map((m) => (
                <DrawerClose key={m} className="flex min-h-12 w-full items-center rounded-xl px-3 text-left font-medium active:bg-line/60">{m}</DrawerClose>
              ))}
            </DrawerBody>
          </DrawerContent>
        </Drawer>

        {/* 6. Top sheet, brand tone */}
        <Drawer>
          <DrawerTrigger className="btn-secondary">ऊपर से (notice)</DrawerTrigger>
          <DrawerContent side="top" tone="brand">
            <DrawerHeader className="pt-4"><DrawerTitle>कल की छुट्टी</DrawerTitle><DrawerDescription>दिवाली — कोई टिफ़िन नहीं बनेगा</DrawerDescription></DrawerHeader>
            <DrawerHandle />
          </DrawerContent>
        </Drawer>
      </Row>

      <Row title="Behaviour">
        {/* 7. Non-dismissible confirm: Esc/overlay/swipe do nothing */}
        <Drawer dismissible={false}>
          <DrawerTrigger className="btn btn-secondary text-bad" data-test="open-confirm">पक्का? (dismissible=false)</DrawerTrigger>
          <DrawerContent>
            <DrawerHeader className="pt-5"><DrawerTitle>ग्राहक हटाएं?</DrawerTitle><DrawerDescription>यह वापस नहीं होगा। जवाब देना ज़रूरी है।</DrawerDescription></DrawerHeader>
            <DrawerFooter className="border-0">
              <DrawerClose className="btn-secondary flex-1" data-test="confirm-no">नहीं</DrawerClose>
              <DrawerClose className="btn flex-1 bg-bad text-card">हाँ, हटाएं</DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        {/* 8. Controlled + nested */}
        <button type="button" className="btn-secondary" data-test="open-controlled" onClick={() => setControlled(true)}>Controlled + nested</button>
        <Drawer open={controlled} onOpenChange={setControlled}>
          <DrawerContent size="md">
            <DrawerHandle />
            <DrawerHeader><DrawerTitle>बाहरी state से खुला</DrawerTitle></DrawerHeader>
            <DrawerBody className="space-y-3">
              <p className="text-sm text-muted">यहाँ से दूसरा drawer खुल सकता है — दोनों एक के ऊपर एक।</p>
              <Drawer>
                <DrawerTrigger className="btn-primary w-full" data-test="open-nested">अंदर वाला drawer</DrawerTrigger>
                <DrawerContent side="right" size="sm">
                  <DrawerHeader className="pt-4"><DrawerTitle>Nested</DrawerTitle></DrawerHeader>
                  <DrawerBody><DrawerClose className="btn-secondary w-full">वापस</DrawerClose></DrawerBody>
                </DrawerContent>
              </Drawer>
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </Row>

      {log.length > 0 && (
        <pre className="card p-3 text-xs" data-test="log">{log.join("\n")}</pre>
      )}
    </main>
  );
}
