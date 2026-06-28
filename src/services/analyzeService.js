import { analyzeHealth } from '../api/echoApi';

export async function runAnalysis(userProfile) {
  const payload = {
    age: userProfile.age,
    sex: userProfile.gender === "남성" ? 1 : 2,
    height_cm: Number(userProfile.height),
    weight_kg: Number(userProfile.weight),
    waist_cm: Number(userProfile.waist) || 80,
    bmi: userProfile.bmi || Number(userProfile.weight) / ((Number(userProfile.height) / 100) ** 2),
    systolic_bp: userProfile.bloodPressure?.systolic || 120,
    diastolic_bp: userProfile.bloodPressure?.diastolic || 80,
    fasting_glucose: 90,
    hba1c: 5.2,
    total_cholesterol: 180,
    hdl_cholesterol: 50,
    triglyceride: 120,
    ldl_direct: 110,
    current_smoking: userProfile.smoking !== "비흡연" ? 1 : 0,
    aerobic_activity: userProfile.exercise === "거의 안 함" ? 0 : 1
  };

  const result = await analyzeHealth(payload);
  return result; // { diabetes, hypertension, metabolic, obesity, bmi, healthScore, healthAge }
}
