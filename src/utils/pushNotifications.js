import supabase from "../supabase/SupabaseClient"; // Update with your actual Supabase client path

const PUBLIC_VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

// Utility function to convert base64 VAPID key to Uint8Array required by PushManager
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export async function subscribeToPushNotifications(userId, businessId) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("Push notifications are not supported in this browser.");
    return;
  }

  if (!PUBLIC_VAPID_KEY) {
    console.error("VITE_VAPID_PUBLIC_KEY is missing from environment variables.");
    return;
  }

  try {
    // 1. Register the Service Worker
    const registration = await navigator.serviceWorker.register("/sw.js");

    // 2. Prompt user for notification permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Notification permission was denied by user.");
      return;
    }

    // 3. Obtain subscription token from the browser push manager
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
    });

    // 4. Upsert the token into Supabase bound to user_id & business_id
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: userId,
        business_id: businessId,
        subscription: subscription.toJSON(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "business_id,user_id" }
    );

    if (error) throw error;
    console.log("Successfully subscribed business to weekly push reports!");
  } catch (error) {
    console.error("Failed to subscribe to push notifications:", error);
  }
}