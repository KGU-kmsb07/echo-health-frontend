const isNativeAndroid = window.Capacitor?.isNativePlatform?.() && window.Capacitor?.getPlatform?.() === "android";
const BASE_URL = import.meta.env.VITE_API_URL || (isNativeAndroid ? "http://10.0.2.2:8080" : "http://localhost:8080");

export const privacyConsentDocumentUrl = `${BASE_URL}/privacy/consent/document`;

export async function warmupServer(timeoutMs = 8000) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE_URL}/health`, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal
    });
    return res.ok;
  } catch (e) {
    console.warn("warmupServer delayed:", e);
    return false;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function fetchPrivacyConsentDocument() {
  const res = await fetch(privacyConsentDocumentUrl);
  if (!res.ok) {
    throw new Error("privacy document fetch failed");
  }
  return await res.text();
}

export async function analyzeHealth(userData) {
  try {
    const res = await fetch(`${BASE_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData)
    });
    return await res.json();
  } catch (e) {
    console.error("analyzeHealth error:", e);
    return null;
  }
}

export async function simulateHealth(userData) {
  try {
    const res = await fetch(`${BASE_URL}/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData)
    });
    return await res.json();
  } catch (e) {
    console.error("simulateHealth error:", e);
    return null;
  }
}

export async function uploadCheckupFile(file, source = "ocr") {
  try {
    const res = await fetch(`${BASE_URL}/checkup/extract?source=${encodeURIComponent(source)}`, {
      method: "POST",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file
    });
    return await res.json();
  } catch (e) {
    console.error("uploadCheckupFile error:", e);
    return null;
  }
}

export async function saveConsent(payload) {
  try {
    const res = await fetch(`${BASE_URL}/privacy/consent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (e) {
    console.error("saveConsent error:", e);
    return null;
  }
}

export async function getPlan(analysisResult) {
  try {
    const params = new URLSearchParams({
      diabetes: analysisResult.diabetes ?? 0,
      hypertension: analysisResult.hypertension ?? 0,
      metabolic: analysisResult.metabolic ?? 0,
      obesity: analysisResult.obesity ?? 0,
      age: analysisResult.age ?? 30
    });
    const res = await fetch(`${BASE_URL}/plan?${params}`);
    return await res.json();
  } catch (e) {
    console.error("getPlan error:", e);
    return null;
  }
}

export async function fetchKdcaContent(category) {
  try {
    const res = await fetch(`${BASE_URL}/kdca/content?category=${encodeURIComponent(category)}`);
    return await res.json();
  } catch (e) {
    console.error("fetchKdcaContent error:", e);
    return null;
  }
}

export async function generateQuests(userData, predictResult) {
  try {
    const res = await fetch(`${BASE_URL}/quest/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_data: userData, predict_result: predictResult })
    });
    return await res.json();
  } catch (e) {
    console.error("generateQuests error:", e);
    return null;
  }
}

export async function sendCoachMessage(messages, userContext) {
  try {
    const res = await fetch(`${BASE_URL}/coach`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, userContext })
    });
    return await res.json();
  } catch (e) {
    console.error("sendCoachMessage error:", e);
    return {
      text: "현재 AI 건강 코치 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.",
      source: "서비스 점검 중"
    };
  }
}

export async function searchBenefits({ query = "", keyword = "", region = "", subRegion = "", age = "", gender = "", smoking = "", risks = [], sort = "latest", page = 1, perPage = 100 } = {}) {
  try {
    const params = new URLSearchParams({
      query,
      keyword,
      region,
      subRegion,
      age: String(age || ""),
      gender,
      smoking,
      risks: Array.isArray(risks) ? risks.join(",") : String(risks || ""),
      sort,
      page: String(page),
      perPage: String(perPage)
    });
    const res = await fetch(`${BASE_URL}/api/benefits/search?${params}`);
    return await res.json();
  } catch (e) {
    console.error("searchBenefits error:", e);
    return null;
  }
}

export async function matchBenefits(payload) {
  try {
    const res = await fetch(`${BASE_URL}/api/benefits/match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (e) {
    console.error("matchBenefits error:", e);
    return null;
  }
}



