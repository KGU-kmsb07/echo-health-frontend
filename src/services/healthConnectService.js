function getHealthConnectPlugin() {
  return window.Capacitor?.Plugins?.HealthConnect || null;
}

export function isHealthConnectAvailableInApp() {
  return Boolean(getHealthConnectPlugin());
}

function dispatchWearOSPayload(payload) {
  window.__echoHealthWearData = payload;
  window.dispatchEvent(new CustomEvent("echo-health-wearos-sync", { detail: payload }));
}

function hasBloodPressurePermission(status) {
  const granted = Array.isArray(status?.grantedPermissions) ? status.grantedPermissions : [];
  return granted.some(permission => String(permission).includes("BloodPressure"));
}

export async function requestWearOSBloodPressureAndSync() {
  const healthConnect = getHealthConnectPlugin();
  if (!healthConnect) {
    throw new Error("Android 앱에서만 Wear OS 혈압 연동을 사용할 수 있습니다.");
  }

  const status = healthConnect.getStatus ? await healthConnect.getStatus() : null;
  if (status && status.available === false) {
    throw new Error("이 기기에서 Health Connect를 사용할 수 없습니다.");
  }

  if (!hasBloodPressurePermission(status) && healthConnect.requestBloodPressurePermission) {
    const permissionResult = await healthConnect.requestBloodPressurePermission();
    if (permissionResult?.granted === false) {
      throw new Error("혈압 데이터 접근 권한이 허용되지 않았습니다.");
    }
  }

  const payload = healthConnect.syncBloodPressure
    ? await healthConnect.syncBloodPressure()
    : await healthConnect.sync();

  dispatchWearOSPayload(payload);
  return payload;
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
  dispatchWearOSPayload(payload);
  return payload;
}
