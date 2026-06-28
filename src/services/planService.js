import { getPlan } from '../api/echoApi';

export async function runPlanGeneration(predictedProfile, age) {
  const result = await getPlan({
    diabetes: predictedProfile.diabetes ?? 0,
    hypertension: predictedProfile.hypertension ?? 0,
    metabolic: predictedProfile.metabolic ?? 0,
    obesity: predictedProfile.obesity ?? 0,
    age: age ?? 30
  });
  // result = { plan: [...], weeklyGoals: { steps, exerciseMinutes } }
  return result;
}
