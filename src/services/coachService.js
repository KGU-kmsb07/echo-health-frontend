import { sendCoachMessage } from '../api/echoApi';

export async function runCoach(messages, userProfile, predictedProfile) {
  const userContext = `
    나이: ${userProfile.age}세, 성별: ${userProfile.gender},
    당뇨 위험: ${predictedProfile.diabetes}%,
    고혈압 위험: ${predictedProfile.hypertension}%,
    BMI: ${predictedProfile.bmi}
  `;
  return await sendCoachMessage(messages, userContext);
}
