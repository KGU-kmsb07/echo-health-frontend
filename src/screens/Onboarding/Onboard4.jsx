import { analyzeHealth } from '../../../api/echoApi';

const handleStart = async () => {
  showLoading("건강 분석 중...");

  const userData = {
    age: user.age,
    sex: user.gender === "남성" ? 1 : 2,
    height_cm: Number(user.height),
    weight_kg: Number(user.weight),
    waist_cm: Number(user.waist) || 80,
    bmi: user.bmi || Number(user.weight) / ((Number(user.height) / 100) ** 2),
    systolic_bp: user.bloodPressure?.systolic || 120,
    diastolic_bp: user.bloodPressure?.diastolic || 80,
    fasting_glucose: 90,
    hba1c: 5.2,
    total_cholesterol: 180,
    hdl_cholesterol: 50,
    triglyceride: 120,
    ldl_direct: 110,
    current_smoking: user.smoking !== "비흡연" ? 1 : 0,
    aerobic_activity: user.exercise === "거의 안 함" ? 0 : 1
  };

  const result = await analyzeHealth(userData);

  if (result && !result.error) {
    updateRisks({
      diabetes: result.diabetes,
      hypertension: result.hypertension,
      metabolic: result.metabolic,
      obesity: result.obesity
    });
    updateUser({
      healthScore: result.healthScore,
      healthAge: result.healthAge,
      bmi: result.bmi
    });
  }

  hideLoading();
  next();
};