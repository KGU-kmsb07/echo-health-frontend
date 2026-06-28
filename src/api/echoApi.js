const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

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

export async function sendCoachMessage(messages, userContext) {
  try {
    const res = await fetch(`${BASE_URL}/coach`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, userContext })
    });
    return await res.json();
  } catch (e) {
    return {
      reply: "현재 AI 코치 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.",
      source: "서비스 점검 중"
    };
  }
}

export async function getBenefits(region, age, risks) {
  return [];
}