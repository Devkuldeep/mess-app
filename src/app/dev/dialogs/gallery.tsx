"use client";
import { useState } from "react";
import { confirm } from "@/stores/confirm-store";
import { toast } from "@/stores/toast-store";
import {
  ConfirmDialog, Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogIcon,
  DialogTitle, DialogTrigger, Drawer, DrawerBody, DrawerContent, DrawerHandle, DrawerHeader, DrawerTitle, DrawerTrigger,
  FormInput, useDialog,
} from "@/components/ui";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function Row({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="section-title">{title}</h2>
      <div className="card flex flex-wrap gap-2 p-4">{children}</div>
    </section>
  );
}

function SaveHoliday({ onSaved }: { onSaved: (s: string) => void }) {
  const { setOpen } = useDialog();
  return (
    <form
      className="contents"
      onSubmit={(e) => {
        e.preventDefault();
        onSaved(String(new FormData(e.currentTarget).get("reason") || "—"));
        setOpen(false);
      }}
    >
      <DialogBody className="space-y-3">
        <FormInput name="reason" label="कारण" placeholder="दिवाली" autoComplete="off" />
      </DialogBody>
      <DialogFooter>
        <DialogClose className="btn-secondary sm:flex-none">रद्द करें</DialogClose>
        <button type="submit" className="btn-primary sm:flex-none">छुट्टी जोड़ें</button>
      </DialogFooter>
    </form>
  );
}

export function DialogsGallery() {
  const [log, setLog] = useState<string[]>([]);
  const note = (s: string) => setLog((l) => [s, ...l].slice(0, 5));

  return (
    <main className="mx-auto max-w-md space-y-6 p-4 pb-24">
      <header>
        <h1 className="text-2xl font-bold">Dialogs</h1>
        <p className="text-sm text-muted">src/components/ui/dilog-box · dev only</p>
      </header>

      <Row title="Basic">
        {/* 1. Info / success */}
        <Dialog tone="success">
          <DialogTrigger className="btn-secondary" data-test="open-info">पेमेंट मिला</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogIcon>✓</DialogIcon>
              <DialogTitle>₹2,720 मिल गए</DialogTitle>
              <DialogDescription>Aman Verma का नवंबर का बिल पूरा हो गया।</DialogDescription>
            </DialogHeader>
            <DialogFooter><DialogClose className="btn-primary w-full">ठीक है</DialogClose></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 2. Form dialog */}
        <Dialog>
          <DialogTrigger className="btn-secondary" data-test="open-form">फ़ॉर्म वाला</DialogTrigger>
          <DialogContent size="md">
            <DialogHeader align="start" showClose closeLabel="बंद करें">
              <DialogTitle>छुट्टी जोड़ें</DialogTitle>
              <DialogDescription>उस दिन किसी का टिफ़िन नहीं गिना जाएगा</DialogDescription>
            </DialogHeader>
            <SaveHoliday onSaved={(r) => note(`holiday saved: ${r}`)} />
          </DialogContent>
        </Dialog>

        {/* 6. Bottom position */}
        <Dialog>
          <DialogTrigger className="btn-secondary">नीचे वाला</DialogTrigger>
          <DialogContent position="bottom" overlay="blur">
            <DialogHeader><DialogTitle>ऐप अपडेट हो गया</DialogTitle><DialogDescription>नई सुविधाएँ: बर्बादी रिपोर्ट</DialogDescription></DialogHeader>
            <DialogFooter><DialogClose className="btn-primary w-full">देखें</DialogClose></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 7. Full */}
        <Dialog>
          <DialogTrigger className="btn-secondary">फ़ुल स्क्रीन</DialogTrigger>
          <DialogContent size="full" className="pt-[env(safe-area-inset-top)]">
            <DialogHeader align="start" showClose><DialogTitle>नियम और शर्तें</DialogTitle></DialogHeader>
            <DialogBody><p className="text-muted">लंबा टेक्स्ट यहाँ स्क्रॉल होगा…</p></DialogBody>
          </DialogContent>
        </Dialog>
      </Row>

      <Row title="ConfirmDialog">
        {/* 3. Async success */}
        <ConfirmDialog
          tone="danger"
          trigger="ग्राहक हटाएं"
          triggerClassName="btn btn-secondary text-bad"
          title="Aman Verma को हटाएं?"
          description="उनके पेमेंट और छुट्टियाँ भी हट जाएंगी। यह वापस नहीं होगा।"
          confirmLabel="हाँ, हटाएं"
          cancelLabel="नहीं"
          pendingLabel="हटा रहे हैं…"
          onConfirm={async () => {
            await wait(900);
            note("customer deleted");
          }}
        />
        {/* 4. Fails → stays open with error */}
        <ConfirmDialog
          tone="warning"
          trigger="फ़ेल होने वाला"
          triggerClassName="btn-secondary"
          title="सभी को रिमाइंडर भेजें?"
          description="14 ग्राहकों को WhatsApp जाएगा"
          confirmLabel="भेजें"
          cancelLabel="रद्द करें"
          onConfirm={async () => {
            await wait(600);
            return "इंटरनेट नहीं है — बाद में कोशिश करें";
          }}
        />
        {/* 5. Must answer */}
        <Dialog dismissible={false} tone="warning">
          <DialogTrigger className="btn-secondary" data-test="open-must">जवाब ज़रूरी</DialogTrigger>
          <DialogContent alert>
            <DialogHeader>
              <DialogIcon>!</DialogIcon>
              <DialogTitle>बिना सेव किए निकलें?</DialogTitle>
              <DialogDescription>बाहर टैप करने से बंद नहीं होगा — कोई बटन चुनें।</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose className="btn-secondary flex-1" data-test="must-stay">रुकें</DialogClose>
              <DialogClose className="btn flex-1 bg-warn text-card">निकलें</DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Row>

      <Row title="Global (zustand)">
        <button type="button" className="btn-secondary" data-test="toast-ok" onClick={() => toast.success("पेमेंट सेव हो गया")}>toast.success</button>
        <button type="button" className="btn-secondary" data-test="toast-err" onClick={() => toast.error("इंटरनेट नहीं है", { description: "बाद में कोशिश करें" })}>toast.error</button>
        <button
          type="button"
          className="btn-secondary"
          data-test="toast-action"
          onClick={() => toast("ग्राहक हटाया", { action: { label: "वापस लाएं", onClick: () => note("undo clicked") }, duration: 6000 })}
        >
          toast + action
        </button>
        <button
          type="button"
          className="btn-secondary"
          data-test="confirm-fn"
          onClick={async () => note(`confirm() → ${await confirm({ title: "सभी को रिमाइंडर भेजें?", description: "14 ग्राहकों को", tone: "warning", icon: "!" })}`)}
        >
          await confirm()
        </button>
      </Row>

      <Row title="Stacking">
        {/* 8. Dialog from inside a drawer */}
        <Drawer>
          <DrawerTrigger className="btn-secondary" data-test="open-drawer">Drawer → Dialog</DrawerTrigger>
          <DrawerContent>
            <DrawerHandle />
            <DrawerHeader><DrawerTitle>पेमेंट लिखें</DrawerTitle></DrawerHeader>
            <DrawerBody>
              <ConfirmDialog
                tone="success"
                trigger="₹500 सेव करें"
                triggerClassName="btn-primary w-full"
                title="₹500 नकद लिखें?"
                confirmLabel="हाँ"
                cancelLabel="नहीं"
                onConfirm={() => note("₹500 saved from drawer")}
              />
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </Row>

      {log.length > 0 && <pre className="card p-3 text-xs" data-test="log">{log.join("\n")}</pre>}
    </main>
  );
}
