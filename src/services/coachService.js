import { sendCoachMessage } from '../api/echoApi';

export async function runCoach(messages, userProfile, predictedProfile) {
  // 위험도는 소수(0~1) 또는 백분율(0~100) 둘 다 처리
  const toPercent = (val) => {
    if (val === null || val === undefined) return '알 수 없음';
    const n = Number(val);
    if (isNaN(n)) return '알 수 없음';
    // 0~1 범위면 백분율로 변환
    return n <= 1.0 ? `${Math.round(n * 100)}%` : `${Math.round(n)}%`;
  };

  const userContext = {
    나이: userProfile?.age ? `${userProfile.age}세` : '알 수 없음',
    성별: userProfile?.gender || '알 수 없음',
    BMI: predictedProfile?.bmi ? predictedProfile.bmi.toFixed(1) : '알 수 없음',
    당뇨위험도: toPercent(predictedProfile?.diabetes),
    고혈압위험도: toPercent(predictedProfile?.hypertension),
    활력지수: predictedProfile?.vitality_score ?? predictedProfile?.healthScore ?? '알 수 없음',
    흡연: userProfile?.smoking || '알 수 없음',
    운동: userProfile?.exercise || '알 수 없음',
  };

  const result = await sendCoachMessage(messages, userContext);
  return result;
}
