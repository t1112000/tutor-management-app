import webpush from "web-push";

if (process.env.VAPID_EMAIL && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function sendPush(
  subscription: webpush.PushSubscription,
  payload: { title: string; body: string; url?: string }
): Promise<void> {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch (err: any) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      const { User } = await import("@/lib/db/index");
      await User.update(
        { pushSubscription: null, pushEnabled: false },
        { where: { pushSubscription: subscription as any } }
      );
    }
    throw err;
  }
}
