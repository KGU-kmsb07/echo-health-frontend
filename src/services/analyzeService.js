import { analyzeHealth } from "../api/echoApi";

function toSexCode(gender) {
  return gender === "남성" || gender === "남자" || gender === "male" || gender === 1 ? 1 : 2;
}

function toSmokingCode(smoking) {
  return smoking === "현재 흡연" || smoking === "흡연" || smoking === 1 ? 1 : 0;
}

function toAerobicCode(exercise) {
  return ["안함", "거의 안 함", "0회", "0일", "0"].includes(exercise) ? 0 : 1;
}

export function buildAnalysisPayload(userProfile) {
  const healthCheckup = userProfile.healthCheckup || null;
  const payload = {
    input_mode: healthCheckup ? "checkup" : "simple",
    age: Number(userProfile.age),
    sex: toSexCode(userProfile.gender),
    height_cm: Number(userProfile.height),
    weight_kg: Number(userProfile.weight),
    waist_cm: Number(userProfile.waist) || 80,
    current_smoking: toSmokingCode(userProfile.smoking),
    aerobic_activity: toAerobicCode(userProfile.exercise),
    ...(healthCheckup || {})
  };

  return payload;
}

export async function runAnalysis(userProfile) {
  return await analyzeHealth(buildAnalysisPayload(userProfile));
}
