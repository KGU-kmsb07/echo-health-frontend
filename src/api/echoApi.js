import { MOCK_RISKS, MOCK_PLAN, MOCK_BENEFITS } from "../mock/mockData";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * 건강 데이터 분석 API
 * 
 * [실제 API 전환 시 수정 사항]
 * const response = await fetch(`${BASE_URL}/analyze`, {
 *   method: "POST",
 *   headers: { "Content-Type": "application/json" },
 *   body: JSON.stringify(userData)
 * });
 * return await response.json();
 */
export async function analyzeHealth(userData) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(MOCK_RISKS);
    }, 300);
  });
}

/**
 * 미래 변화 시뮬레이션 API
 * 
 * [실제 API 전환 시 수정 사항]
 * const response = await fetch(`${BASE_URL}/simulate`, {
 *   method: "POST",
 *   headers: { "Content-Type": "application/json" },
 *   body: JSON.stringify(params)
 * });
 * return await response.json();
 */
export async function simulateChange(params) {
  return new Promise((resolve) => {
    setTimeout(() => {
      // BMI, 체중 감소에 따른 건강 위험도 감소 모의 데이터
      resolve({
        diabetes: Math.max(5, MOCK_RISKS.diabetes - (params.weightChange || 0) * 2),
        hypertension: Math.max(5, MOCK_RISKS.hypertension - (params.weightChange || 0) * 1.5),
        metabolic: Math.max(5, MOCK_RISKS.metabolic - (params.weightChange || 0) * 2.5),
        obesity: Math.max(5, MOCK_RISKS.obesity - (params.weightChange || 0) * 3),
      });
    }, 300);
  });
}

/**
 * 실천 플랜 조회 API
 * 
 * [실제 API 전환 시 수정 사항]
 * const response = await fetch(`${BASE_URL}/plan?resultId=${analysisResult.id}`);
 * return await response.json();
 */
export async function getPlan(analysisResult) {
  // TODO: API 연결 시 아래 주석 해제
  // const res = await fetch(`${BASE_URL}/plan`, { method: "GET", ... });
  // return await res.json();

  return new Promise((resolve) => {
    setTimeout(() => {
      // mock: simulationResult 기반 플랜 생성
      const { diabetes = null, hypertension = null, metabolic = null, obesity = null } = analysisResult || {};
      
      // 가장 위험도 높은 항목 기준으로 플랜 포커스 결정
      const maxRisk = Math.max(diabetes || 0, hypertension || 0, metabolic || 0, obesity || 0);
      const focus = maxRisk === 0 ? "건강"
                  : maxRisk === diabetes ? "혈당" 
                  : maxRisk === hypertension ? "혈압"
                  : maxRisk === metabolic ? "대사" : "체중";

      resolve([
        {
          week: 1,
          title: `${focus} 관리 시작`,
          color: "#2563EB",
          items: [
            "매일 30분 걷기",
            "식사 전 혈당 체크",
            "물 하루 8잔 마시기",
            "취침 전 스트레칭 10분"
          ]
        },
        {
          week: 2,
          title: "생활습관 강화",
          color: "#7C3AED",
          items: [
            "유산소 운동 주 3회",
            "나트륨 줄이기 (국물 반만)",
            "수면 7시간 확보",
            "계단 이용하기"
          ]
        },
        {
          week: 3,
          title: "집중 관리",
          color: "#059669",
          items: [
            "근력 운동 추가 주 2회",
            "채소 매 끼니 포함",
            "음주 줄이기",
            "스트레스 관리 (명상 10분)"
          ]
        },
        {
          week: 4,
          title: "습관 정착",
          color: "#D97706",
          items: [
            "운동 루틴 점검 및 유지",
            "한 달 변화 기록하기",
            "재분석으로 개선 확인",
            "다음 달 목표 설정"
          ]
        }
      ]);
    }, 500);
  });
}

/**
 * 건강 혜택 정보 조회 API
 * 
 * [실제 API 전환 시 수정 사항]
 * const query = new URLSearchParams({ region, age, risks: JSON.stringify(risks) }).toString();
 * const response = await fetch(`${BASE_URL}/benefits?${query}`);
 * return await response.json();
 */
export async function getBenefits(region, age, risks) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(MOCK_BENEFITS);
    }, 300);
  });
}

/**
 * AI 건강 코치 메시지 송신 API
 * 
 * [실제 API 전환 시 수정 사항]
 * const response = await fetch(`${BASE_URL}/coach`, {
 *   method: "POST",
 *   headers: { "Content-Type": "application/json" },
 *   body: JSON.stringify({ messages, context })
 * });
 * return await response.json();
 */
export async function sendCoachMessage(messages, context) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        role: "ai",
        text: "분석 중입니다... 잠시 후 답변을 드릴게요. (실제 서비스에서는 Gemini API가 연결됩니다)",
        source: "출처: Echo Health AI"
      });
    }, 300);
  });
}
