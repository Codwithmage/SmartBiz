// Listen for incoming background push events from Supabase
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();

    const title = data.title || "SmartBiz Summary";
    const options = {
      body: data.body || "Your weekly report is available.",
      icon: "/logo192.png", // Replace with your app icon path in /public
      badge: "/logo192.png",
      data: {
        url: data.url || "/sales",
      },
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (error) {
    console.error("Error processing push notification payload:", error);
  }
});

// Handle clicking on the notification banner
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // If SmartBiz tab is already open, focus it
      for (const client of windowClients) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise open a new tab/window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});