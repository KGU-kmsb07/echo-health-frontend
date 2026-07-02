export async function requestAppNotificationPermission() {
  const nativePermission = window.Capacitor?.Plugins?.NotificationPermission || null;
  if (nativePermission?.requestPermission) {
    const result = await nativePermission.requestPermission();
    return {
      granted: result?.granted === true,
      status: result?.status || (result?.granted ? "granted" : "denied"),
      native: true
    };
  }

  if (typeof window === "undefined" || typeof window.Notification === "undefined") {
    return { granted: true, status: "unsupported" };
  }

  if (window.Notification.permission === "granted") {
    return { granted: true, status: "granted" };
  }

  if (window.Notification.permission === "denied") {
    return { granted: false, status: "denied" };
  }

  const permission = await window.Notification.requestPermission();
  return { granted: permission === "granted", status: permission };
}
