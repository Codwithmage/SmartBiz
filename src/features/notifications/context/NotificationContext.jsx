import { useState, useEffect, useCallback } from "react";
// Import context object from .js file
import { NotificationContext } from "./useNotification";
// ⚠️ Ensure this path correctly points to your Supabase client
import supabase from "../../../supabase/supabaseClient";

export function NotificationProvider({ children }) {
  const [notification, setNotification] = useState(null);
  const [pushToken, setPushToken] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "unsupported"
  );

  // 1. Save / Upsert Push Token to Supabase
  const savePushTokenToSupabase = async (token) => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.warn("⚠️ Push Token: No authenticated user logged in yet.");
        return;
      }

      console.log("🔄 Saving push token to Supabase for user:", user.id);

      const { data, error } = await supabase
        .from("user_push_tokens")
        .upsert(
          {
            user_id: user.id,
            push_token: token,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        )
        .select();

      if (error) {
        console.error("❌ Supabase Error saving push token:", error.message, error.details);
      } else {
        console.log("✅ Push token successfully saved to Supabase!", data);
      }
    } catch (err) {
      console.error("Unexpected error in savePushTokenToSupabase:", err);
    }
  };

  // 2. Request Notification Permission & Get Browser Token
  const requestPushPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      console.warn("Push notifications are not supported in this browser.");
      return;
    }

    try {
      console.log("🔔 Requesting notification permission...");
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);

      if (permission === "granted") {
        console.log("✅ Notification permission granted!");
        let token = null;

        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.ready.catch(() => null);
          if (registration && registration.pushManager) {
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
              token = JSON.stringify(subscription);
            }
          }
        }

        if (!token) {
          const cleanUserAgent = window.navigator.userAgent
            .replace(/[^a-zA-Z0-9]/g, "")
            .slice(0, 30);
          token = `web_push_${cleanUserAgent}`;
        }

        setPushToken(token);
        await savePushTokenToSupabase(token);
      } else {
        console.warn("⚠️ Notification permission status:", permission);
      }
    } catch (err) {
      console.error("Failed to request push permission:", err);
    }
  }, []);

  // 3. Auto-sync token when authenticated
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session?.user) {
          if (Notification.permission !== "denied") {
            requestPushPermission();
          }
        }
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [requestPushPermission]);

  // 4. In-App Toast Banner Trigger
  const showNotification = ({ type = "success", message }) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <NotificationContext.Provider
      value={{
        showNotification,
        requestPushPermission,
        pushToken,
        permissionStatus,
      }}
    >
      {children}

      {/* In-App Toast Popup UI */}
      {notification && (
        <div className="fixed right-5 top-5 z-50">
          <div
            className={`rounded-lg px-5 py-3 text-white shadow-lg transition-all ${
              notification.type === "success" ? "bg-green-600" : "bg-red-600"
            }`}
          >
            {notification.message}
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}

// Re-export hook for components importing from NotificationContext
export { useNotification } from "./useNotification";