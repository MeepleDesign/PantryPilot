import * as webpush from "web-push";

let configured = false;

function ensureConfigured() {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    throw new Error("Push notifications aren't configured yet (missing VAPID keys).");
  }
  webpush.setVapidDetails("mailto:support@pantrypilot.app", publicKey, privateKey);
  configured = true;
}

export type StoredPushSubscription = {
  endpoint: string;
  p256dh: string;
  auth_key: string;
};

/** Sends to one subscription; returns false (and the caller should delete the row) if the browser revoked it. */
export async function sendPushNotification(
  sub: StoredPushSubscription,
  payload: { title: string; body: string; url?: string },
): Promise<boolean> {
  ensureConfigured();
  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth_key },
      },
      JSON.stringify(payload),
    );
    return true;
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) return false;
    throw e;
  }
}
