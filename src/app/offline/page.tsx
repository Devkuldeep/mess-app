// Precached by the service worker; shown when a page isn't cached yet and
// there's no network. Static, bilingual (no cookies available offline).
import { dictionaries } from "@/lib/i18n";
import { IconCloudOff } from "@/components/icons";
import { RetryButton } from "./retry";

export const metadata = { title: "Offline" };

export default function OfflinePage() {
  const { hi, en } = dictionaries;
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-warn-soft text-warn">
        <IconCloudOff className="size-8" />
      </div>
      <h1 className="text-xl font-semibold">{hi.offlineTitle} · {en.offlineTitle}</h1>
      <p className="text-muted">{hi.offlineBody}</p>
      <p className="text-sm text-muted">{en.offlineBody}</p>
      <RetryButton label={`${hi.retry} · ${en.retry}`} />
    </main>
  );
}
