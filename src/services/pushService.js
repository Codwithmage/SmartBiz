import { PushNotifications } from "@capacitor/push-notifications";
import supabase from "../supabase/SupabaseClient";

export async function registerPushNotifications(userId, businessId) {
  try {
    // 1. Request permission from user
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === "prompt") {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== "granted") {
      console.log("Push notification permission denied.");
      return;
    }

    // 2. Register device with FCM / APNS
    await PushNotifications.register();

    // 3. Listen for token registration
    PushNotifications.addListener("registration", async (token) => {
      console.log("Push Token received:", token.value);

      // Save token to Supabase
      const { error } = await supabase.from("user_push_tokens").upsert(
        {
          user_id: userId,
          business_id: businessId,
          push_token: token.value,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "push_token" }
      );

      if (error) console.error("Error saving push token:", error);
    });

    PushNotifications.addListener("registrationError", (error) => {
      console.error("Push registration error:", error);
    });
  } catch (err) {
    console.error("Push notification setup failed:", err);
  }
}