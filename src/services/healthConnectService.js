function getHealthConnectPlugin() {
  return window.Capacitor?.Plugins?.HealthConnect || null;
}

export function isHealthConnectAvailableInApp() {
  return Boolean(getHealthConnectPlugin());
}

export async function requestWearOSPermissionAndSync() {
  const healthConnect = getHealthConnectPlugin();
  if (!healthConnect) {
    throw new Error("Wear OS sync is available only in the Android app.");
  }

  const status = healthConnect.getStatus ? await healthConnect.getStatus() : null;
  if (status && status.available === false) {
    throw new Error("Health Connect is not available on this device.");
  }

  if (!status?.permissionsGranted && healthConnect.requestHealthPermissions) {
    const permissionResult = await healthConnect.requestHealthPermissions();
    if (permissionResult?.granted === false) {
      if (healthConnect.openHealthConnectSettings) {
        await healthConnect.openHealthConnectSettings();
        throw new Error("Health Connect settings opened. Allow Wear OS health permissions, then tap sync again.");
      }
      throw new Error("Health Connect permission was not granted.");
    }
  }

  if (!healthConnect.sync) {
    throw new Error("Health Connect sync is not ready.");
  }

  const payload = await healthConnect.sync();
  window.__echoHealthWearData = payload;
  window.dispatchEvent(new CustomEvent("echo-health-wearos-sync", { detail: payload }));
  return payload;
}
