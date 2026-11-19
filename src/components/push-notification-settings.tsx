"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell, BellOff } from "lucide-react";
import { Spinner } from "@/components/spinner";
import { subscribeToPush, unsubscribeFromPush } from "@/lib/actions/push";
import { useToast } from "@/components/toast";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64Safe);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

type Status = "checking" | "unsupported" | "denied" | "off" | "on";

export function PushNotificationSettings() {
  const [status, setStatus] = useState<Status>("checking");
  const [pending, startTransition] = useTransition();
  const showToast = useToast();

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        if (!cancelled) setStatus("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        if (!cancelled) setStatus("denied");
        return;
      }
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        const existing = await registration.pushManager.getSubscription();
        if (!cancelled) setStatus(existing ? "on" : "off");
      } catch {
        if (!cancelled) setStatus("off");
      }
    }
    check();
    return () => {
      cancelled = true;
    };
  }, []);

  function enable() {
    startTransition(async () => {
      try {
        const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!publicKey) throw new Error("Push notifications aren't set up yet.");

        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setStatus("denied");
          return;
        }

        const registration = await navigator.serviceWorker.register("/sw.js");
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

        const json = subscription.toJSON();
        if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
          throw new Error("Couldn't set up that subscription.");
        }
        await subscribeToPush({
          endpoint: json.endpoint,
          keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
        });
        setStatus("on");
        showToast("Notifications enabled");
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Couldn't enable notifications.");
      }
    });
  }

  function disable() {
    startTransition(async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await unsubscribeFromPush(subscription.endpoint);
          await subscription.unsubscribe();
        }
        setStatus("off");
        showToast("Notifications turned off");
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Couldn't turn off notifications.");
      }
    });
  }

  if (status === "checking") return null;

  if (status === "unsupported") {
    return (
      <p className="text-sm text-muted">Push notifications aren&apos;t supported on this browser.</p>
    );
  }

  if (status === "denied") {
    return (
      <p className="text-sm text-muted">
        Notifications are blocked for this site. Enable them in your browser&apos;s site settings
        to turn this on.
      </p>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm text-muted">
        Get a daily alert for today&apos;s planned meals (and any missing ingredients), plus
        pantry items expiring soon or a key ingredient running low.
      </p>
      <button
        type="button"
        disabled={pending}
        onClick={status === "on" ? disable : enable}
        className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium disabled:cursor-wait disabled:opacity-60 ${
          status === "on"
            ? "border border-border bg-surface hover:bg-background"
            : "bg-brand text-brand-foreground hover:bg-brand-dark"
        }`}
      >
        {pending ? (
          <Spinner className="h-4 w-4" />
        ) : status === "on" ? (
          <BellOff className="h-4 w-4" />
        ) : (
          <Bell className="h-4 w-4" />
        )}
        {status === "on" ? "Turn off" : "Enable"}
      </button>
    </div>
  );
}
