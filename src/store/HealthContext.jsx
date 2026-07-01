import React, { createContext, useContext, useState, useEffect } from "react";
import { MOCK_BENEFITS } from "../mock/mockData";
import {
  saveUserProfile,
  loadUserProfile,
  saveAnalysisResult,
  loadAnalysisResult,
  saveSimulationResult,
  loadSimulationResult,
  saveWeeklyGoals,
  loadWeeklyGoals,
  loadQuestData,
  loadMileage
} from "../storage/localStore";
import { checkAndLockPastDays, refreshQuests } from "../services/mileageService";

const HealthContext = createContext(null);

export const calculateHealthData = (finalData, currentAge) => {
  return {
    bmi: finalData.bmi ?? null,
    vitality_score: finalData.vitality_score ?? null,
    healthScore: finalData.vitality_score ?? null,
    healthAge: finalData.healthAge ?? finalData.age ?? null,
    risks: {
      diabetes: finalData.diabetes_prob ?? finalData.diabetes ?? null,
      hypertension: finalData.hypertension_prob ?? finalData.hypertension ?? null,
      metabolic: finalData.metabolic ?? null,
      obesity: finalData.obesity_status ?? finalData.obesity ?? null
    }
  };
};

export function normalizePredictedProfile(raw, userProfile) {
  if (!raw) return null;

  const diabetesRaw = raw.diabetes_prob !== undefined ? raw.diabetes_prob : raw.diabetes;
  const hyperRaw    = raw.hypertension_prob !== undefined ? raw.hypertension_prob : raw.hypertension;
  const strokeRaw   = raw.stroke_prob !== undefined ? raw.stroke_prob : raw.stroke;
  const heartRaw    = raw.heart_disease_prob !== undefined ? raw.heart_disease_prob : raw.heart_disease;
  const cancerRaw   = raw.cancer_prob !== undefined ? raw.cancer_prob : raw.cancer;
  const obesityVal  = raw.obesity_status !== undefined ? raw.obesity_status : raw.obesity;
  const scoreVal    = raw.vitality_score !== undefined ? raw.vitality_score : raw.healthScore;

  // metabolic 계산 혹은 기존 값 백분율/소수점 호환성 처리
  let metabolicVal = 0.10;
  if (raw.metabolic !== undefined && raw.metabolic !== null) {
    const m = Number(raw.metabolic);
    metabolicVal = m > 1.0 ? m / 100 : m;
  } else if (userProfile) {
    let score = 0;
    const waistVal = Number(userProfile.waist);
    if (userProfile.gender === "남성" && waistVal >= 90) score++;
    if (userProfile.gender === "여성" && waistVal >= 85) score++;
    const sys = Number(userProfile.bloodPressure?.systolic);
    const dia = Number(userProfile.bloodPressure?.diastolic);
    if (sys >= 130 || dia >= 85) score++;
    if (score >= 2) metabolicVal = 0.45;
    else if (score === 1) metabolicVal = 0.20;
    else metabolicVal = 0.10;
  }

  // 백분율 형태로 저장되어 있었다면 소수로 정규화 (하위호환)
  const toDec = (val) => {
    if (val === null || val === undefined) return null;
    const n = Number(val);
    return n > 1.0 ? n / 100 : n;
  };

  // obesity도 1보다 큰 백분율 형태로 들어오는 경우 0 또는 1로 이진화
  let obesityValBinary = null;
  if (obesityVal !== null && obesityVal !== undefined) {
    const obNum = Number(obesityVal);
    obesityValBinary = obNum > 1 ? (obNum >= 50 ? 1 : 0) : obNum;
  } else {
    obesityValBinary = 0;
  }

  return {
    diabetes: toDec(diabetesRaw),
    hypertension: toDec(hyperRaw),
    stroke: toDec(strokeRaw),
    heart_disease: toDec(heartRaw),
    cancer: toDec(cancerRaw),
    metabolic: metabolicVal,
    obesity: obesityValBinary,
    weight_management: raw.weight_management ?? null,
    risks: raw.risks ?? null,
    input_mode: raw.input_mode ?? null,
    feature_set_used: raw.feature_set_used ?? null,
    cardiovascular_notice: raw.cardiovascular_notice ?? raw.risks?.heart_disease?.notice ?? null,
    bmi: raw.bmi ?? null,
    vitality_score: scoreVal ?? null,
    healthScore:   scoreVal ?? null,
    healthAge:     raw.healthAge ?? raw.health_age ?? null
  };
}

const DEFAULT_WEEKLY_PLANS = [
  {
    week: 1,
    title: "체중 관리 시작",
    goal: "규칙적인 식사와 걷기 습관 만들기",
    days: [
      { day: "월", status: "unchecked" },
      { day: "화", status: "unchecked" },
      { day: "수", status: "unchecked" },
      { day: "목", status: "unchecked" },
      { day: "금", status: "unchecked" },
      { day: "토", status: "unchecked" },
      { day: "일", status: "unchecked" }
    ]
  },
  {
    week: 2,
    title: "혈압 관리 집중",
    goal: "나트륨 섭취 줄이기와 유산소 운동 실천",
    days: [
      { day: "월", status: "unchecked" },
      { day: "화", status: "unchecked" },
      { day: "수", status: "unchecked" },
      { day: "목", status: "unchecked" },
      { day: "금", status: "unchecked" },
      { day: "토", status: "unchecked" },
      { day: "일", status: "unchecked" }
    ]
  },
  {
    week: 3,
    title: "활동량·운동빈도 증가",
    goal: "주 3~4회 운동 루틴 만들기",
    days: [
      { day: "월", status: "unchecked" },
      { day: "화", status: "unchecked" },
      { day: "수", status: "unchecked" },
      { day: "목", status: "unchecked" },
      { day: "금", status: "unchecked" },
      { day: "토", status: "unchecked" },
      { day: "일", status: "unchecked" }
    ]
  },
  {
    week: 4,
    title: "흡연·음주 개선",
    goal: "음주 횟수 줄이기와 금연 시도 기록",
    days: [
      { day: "월", status: "unchecked" },
      { day: "화", status: "unchecked" },
      { day: "수", status: "unchecked" },
      { day: "목", status: "unchecked" },
      { day: "금", status: "unchecked" },
      { day: "토", status: "unchecked" },
      { day: "일", status: "unchecked" }
    ]
  }
];

export const generateDynamicNotifications = (user, notifEnabled = true) => {
  if (!notifEnabled) return [];
  const list = [];
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  const joinDate = user && user.createdAt ? new Date(user.createdAt) : now;

  // 1. 오늘의 건강체크 (아침: 08시, 점심: 12시, 저녁: 19시)
  const bp8Date = new Date(`${todayStr}T08:00:00`);
  if (now.getHours() >= 8 && bp8Date >= joinDate) {
    list.push({
      id: 1,
      icon: "✅",
      title: "오늘의 건강체크를 완료해보세요.",
      date: bp8Date.toISOString(),
      unread: true,
      targetScreen: "plan",
      targetTab: "plan"
    });
  }
  
  const bp12Date = new Date(`${todayStr}T12:00:00`);
  if (now.getHours() >= 12 && bp12Date >= joinDate) {
    list.push({
      id: 2,
      icon: "✅",
      title: "오늘의 건강체크를 완료해보세요.",
      date: bp12Date.toISOString(),
      unread: true,
      targetScreen: "plan",
      targetTab: "plan"
    });
  }

  const bp19Date = new Date(`${todayStr}T19:00:00`);
  if (now.getHours() >= 19 && bp19Date >= joinDate) {
    list.push({
      id: 3,
      icon: "✅",
      title: "오늘의 건강체크를 완료해보세요.",
      date: bp19Date.toISOString(),
      unread: true,
      targetScreen: "plan",
      targetTab: "plan"
    });
  }

  // 2. 새로운 숨은 건강 혜택이 발견되었어요 (13시)
  const bp13Date = new Date(`${todayStr}T13:00:00`);
  if (now.getHours() >= 13 && bp13Date >= joinDate) {
    list.push({
      id: 4,
      icon: "💎",
      title: "새로운 숨은 건강 혜택이 발견되었어요.",
      date: bp13Date.toISOString(),
      unread: false,
      targetScreen: "benefits",
      targetTab: "benefits"
    });
  }

  // 3. 운동을 기록해봐요 (18시)
  const bp18Date = new Date(`${todayStr}T18:00:00`);
  if (now.getHours() >= 18 && bp18Date >= joinDate) {
    list.push({
      id: 5,
      icon: "🏃",
      title: "운동을 기록해봐요.",
      date: bp18Date.toISOString(),
      unread: true,
      targetScreen: "exercise",
      targetTab: "exercise"
    });
  }

  return list;
};

export function HealthProvider({ children }) {
  // 1. userProfile 상태 및 로컬스토리지
  const [userProfile, setUserProfile] = useState(() => {
    const saved = loadUserProfile();
    if (saved) return saved;
    return {
      name: "",
      profileImage: null,
      age: null,
      gender: "",
      height: null,
      weight: null,
      waist: null,
      bloodPressure: { systolic: null, diastolic: null },
      smoking: "",
      drinking: "",
      exercise: "",
      region: "",
      district: ""
    };
  });

  useEffect(() => {
    saveUserProfile(userProfile);
  }, [userProfile]);

  // 2. predictedProfile 상태 및 로컬스토리지
  // 로드 시 normalizePredictedProfile 적용 → 구 포맷(소수점) 데이터 자동 마이그레이션
  const [predictedProfile, setPredictedProfileState] = useState(() => {
    const saved = loadAnalysisResult();
    const currentProfile = loadUserProfile();
    if (saved) return normalizePredictedProfile(saved, currentProfile) ?? {
      diabetes: null, hypertension: null, metabolic: null,
      obesity: null, bmi: null, vitality_score: null, healthScore: null, healthAge: null
    };
    return {
      diabetes: null,
      hypertension: null,
      metabolic: null,
      obesity: null,
      bmi: null,
      vitality_score: null,
      healthScore: null,
      healthAge: null
    };
  });

  useEffect(() => {
    saveAnalysisResult(predictedProfile);
  }, [predictedProfile]);

  // 3. 추가 상태
  const [plan, setPlan] = useState(() => {
    const saved = localStorage.getItem("echo-health-plan");
    if (saved && saved !== "null" && saved !== "undefined") {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return { data: parsed, generatedAt: Date.now() };
        }
        return parsed;
      } catch (e) {
        console.error("Failed to parse plan data", e);
      }
    }
    return null;
  });

  useEffect(() => {
    if (plan) {
      localStorage.setItem("echo-health-plan", JSON.stringify(plan));
    } else {
      localStorage.removeItem("echo-health-plan");
    }
  }, [plan]);

  const [weeklyGoals, setWeeklyGoals] = useState(() => {
    return loadWeeklyGoals() || { steps: 8000, exerciseMinutes: 30 };
  });

  useEffect(() => {
    saveWeeklyGoals(weeklyGoals);
  }, [weeklyGoals]);

  const [planGenerated, setPlanGenerated] = useState(() => {
    const saved = localStorage.getItem("echo-health-plan-generated");
    return saved === "true";
  });

  useEffect(() => {
    localStorage.setItem("echo-health-plan-generated", planGenerated ? "true" : "false");
  }, [planGenerated]);

  const [risksUpdatedAt, setRisksUpdatedAt] = useState(() => {
    const saved = localStorage.getItem("echo-health-risks-updated-at");
    return saved ? Number(saved) : Date.now();
  });

  useEffect(() => {
    localStorage.setItem("echo-health-risks-updated-at", String(risksUpdatedAt));
  }, [risksUpdatedAt]);

  const [benefits, setBenefits] = useState(MOCK_BENEFITS);

  const [notifEnabled, setNotifEnabled] = useState(() => {
    const saved = localStorage.getItem("echo-health-notif-enabled");
    return saved !== "false";
  });

  useEffect(() => {
    localStorage.setItem("echo-health-notif-enabled", notifEnabled ? "true" : "false");
  }, [notifEnabled]);

  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem("echo-health-notifications");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse notifications", e);
      }
    }
    const savedNotifEnabled = localStorage.getItem("echo-health-notif-enabled") !== "false";
    return generateDynamicNotifications(userProfile, savedNotifEnabled);
  });

  useEffect(() => {
    localStorage.setItem("echo-health-notifications", JSON.stringify(notifications));
  }, [notifications]);

  const [firstResult, setFirstResult] = useState(() => {
    const saved = localStorage.getItem("echo-health-first-result");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse first result", e);
      }
    }
    return null;
  });

  useEffect(() => {
    if (firstResult) {
      localStorage.setItem("echo-health-first-result", JSON.stringify(firstResult));
    } else {
      localStorage.removeItem("echo-health-first-result");
    }
  }, [firstResult]);

  const [newResult, setNewResult] = useState(() => {
    const saved = localStorage.getItem("echo-health-new-result");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse new result", e);
      }
    }
    return null;
  });

  useEffect(() => {
    if (newResult) {
      localStorage.setItem("echo-health-new-result", JSON.stringify(newResult));
    } else {
      localStorage.removeItem("echo-health-new-result");
    }
  }, [newResult]);

  const [hasReanalyzed, setHasReanalyzed] = useState(() => {
    return localStorage.getItem("echo-health-has-reanalyzed") === "true";
  });

  useEffect(() => {
    localStorage.setItem("echo-health-has-reanalyzed", hasReanalyzed ? "true" : "false");
  }, [hasReanalyzed]);

  const [hasOnboarded, setHasOnboarded] = useState(() => {
    return localStorage.getItem("echo-health-has-onboarded") === "true";
  });

  useEffect(() => {
    localStorage.setItem("echo-health-has-onboarded", hasOnboarded ? "true" : "false");
  }, [hasOnboarded]);

  const [simulationResult, setSimulationResult] = useState(() => {
    return loadSimulationResult();
  });

  useEffect(() => {
    if (simulationResult) {
      saveSimulationResult(simulationResult);
    } else {
      localStorage.removeItem("@echo:simulationResult");
    }
  }, [simulationResult]);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("로딩 중...");

  const showLoading = (message) => {
    setLoadingMessage(message || "로딩 중...");
    setIsLoading(true);
  };

  const hideLoading = () => {
    setIsLoading(false);
  };

  const [isEditMode, setEditMode] = useState(false);

  const [todaySteps, setTodaySteps] = useState(() => {
    const saved = localStorage.getItem("echo-health-today-steps");
    return saved ? Number(saved) : null;
  });

  useEffect(() => {
    if (todaySteps !== null) {
      localStorage.setItem("echo-health-today-steps", String(todaySteps));
    } else {
      localStorage.removeItem("echo-health-today-steps");
    }
  }, [todaySteps]);

  const updateTodaySteps = (steps) => {
    setTodaySteps(steps !== null && steps !== undefined ? Number(steps) : null);
  };

  const navigateWithLoading = (setScreen, target, delay = 800, message = "로딩 중") => {
    setLoadingMessage(message);
    setIsLoading(true);
    setTimeout(() => {
      setScreen(target);
      hideLoading();
    }, delay);
  };

  const [originalUser, setOriginalUser] = useState(() => {
    const saved = localStorage.getItem("echo-health-original-user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse original user", e);
      }
    }
    return null;
  });

  useEffect(() => {
    if (originalUser) {
      localStorage.setItem("echo-health-original-user", JSON.stringify(originalUser));
    } else {
      localStorage.removeItem("echo-health-original-user");
    }
  }, [originalUser]);

  useEffect(() => {
    if (userProfile && hasOnboarded && !originalUser) {
      setOriginalUser(userProfile);
    }
  }, [userProfile, hasOnboarded, originalUser]);

  const [wearData, setWearData] = useState(null);
  const [checkedState, setCheckedState] = useState({});
  const [completedTimes, setCompletedTimes] = useState({});

  const [weeklyPlans, setWeeklyPlans] = useState(() => {
    const saved = localStorage.getItem("echo-health-weekly-milestones");
    if (saved && saved !== "null" && saved !== "undefined") {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse weekly milestones", e);
      }
    }
    return DEFAULT_WEEKLY_PLANS;
  });

  useEffect(() => {
    localStorage.setItem("echo-health-weekly-milestones", JSON.stringify(weeklyPlans));
  }, [weeklyPlans]);

  const [todoCheckedState, setTodoCheckedState] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const todayStr = `${y}-${m}-${day}`;

    const lastDate = localStorage.getItem("echo-health-todo-last-date");
    if (lastDate !== todayStr) {
      localStorage.setItem("echo-health-todo-last-date", todayStr);
      localStorage.setItem("echo-health-todo-checked-state", JSON.stringify({}));
      return {};
    }

    const savedState = localStorage.getItem("echo-health-todo-checked-state");
    if (savedState) {
      try {
        return JSON.parse(savedState);
      } catch (e) {
        console.error("Failed to parse todo checked state", e);
      }
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem("echo-health-todo-checked-state", JSON.stringify(todoCheckedState));
  }, [todoCheckedState]);

  const [planStartDate, setPlanStartDate] = useState(() => {
    const saved = localStorage.getItem("echo-health-plan-start-date");
    if (saved && saved !== "null" && saved !== "undefined") return saved;
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const todayStr = `${y}-${m}-${day}`;
    localStorage.setItem("echo-health-plan-start-date", todayStr);
    return todayStr;
  });

  useEffect(() => {
    localStorage.setItem("echo-health-plan-start-date", planStartDate);
  }, [planStartDate]);

  useEffect(() => {
    const restore = async () => {
      // 로컬 스토리지 데이터 불러오기 (검색 및 복원 체크리스트 요건 충족)
      loadUserProfile();
      loadAnalysisResult();
      loadQuestData();
      loadMileage();
      
      // 앱 진입 시 자정 감지 및 잠금 처리
      await checkAndLockPastDays(updateVitalityBoost);
    };
    restore();
  }, []);

  // 4. 요구사항 관련 매핑 및 함수 구현
  const updateUserProfile = (fields) => {
    setUserProfile(prev => ({
      ...prev,
      ...fields
    }));
  };

  const setPredictedProfile = (result) => {
    if (result === null) {
      setPredictedProfileState({
        diabetes: null, hypertension: null, metabolic: null,
        obesity: null, bmi: null, vitality_score: null, healthScore: null, healthAge: null
      });
    } else {
      // normalizePredictedProfile로 단일 경로 정규화
      const normalized = normalizePredictedProfile(result, userProfile);
      if (normalized) setPredictedProfileState(normalized);
    }
    setRisksUpdatedAt(Date.now());
  };

  const updateVitalityBoost = (amount) => {
    setPredictedProfileState(prev => {
      if (!prev) return prev;
      const currentScore = prev.vitality_score ?? 100;
      const newScore = Math.min(100, currentScore + amount);
      return {
        ...prev,
        vitality_score: newScore,
        healthScore: newScore
      };
    });
  };

  const updatePlan = (result) => {
    if (result === null) {
      setPlan(null);
      setWeeklyGoals({ steps: 8000, exerciseMinutes: 30 });
      setPlanGenerated(false);
      localStorage.removeItem("@echo:questList");
      return;
    }

    let planData = null;
    let generatedAt = Date.now();
    let steps = null;
    let exerciseMinutes = null;

    if (Array.isArray(result)) {
      planData = result;
    } else if (result && result.plan) {
      planData = result.plan;
      generatedAt = result.generatedAt || Date.now();
      if (result.weeklyGoals) {
        steps = result.weeklyGoals.steps;
        exerciseMinutes = result.weeklyGoals.exerciseMinutes;
      }
    } else if (result && result.data) {
      planData = result.data;
      generatedAt = result.generatedAt || Date.now();
      if (result.weeklyGoals) {
        steps = result.weeklyGoals.steps;
        exerciseMinutes = result.weeklyGoals.exerciseMinutes;
      }
    } else {
      setPlan(result);
      setPlanGenerated(true);
      return;
    }

    // 플랜의 상세 items 내부 텍스트에서 걸음수 목표 파싱 시도 (예: "매일 10000보 걷기", "하루 8000보 달성")
    if (planData && Array.isArray(planData)) {
      for (const w of planData) {
        if (w.items && Array.isArray(w.items)) {
          for (const item of w.items) {
            const match = item.replace(/,/g, "").match(/(\d+)\s*(?:보|걸음)/);
            if (match) {
              const val = parseInt(match[1], 10);
              if (val >= 1000 && val <= 30000) {
                steps = val;
                break;
              }
            }
          }
        }
        if (steps) break;
      }
    }

    setPlan({
      data: planData,
      generatedAt: generatedAt
    });

    // 28일치 questData 딕셔너리 생성 및 병합 저장 (refreshQuests)
    if (planData && Array.isArray(planData)) {
    const questStartDate = result?.planStartDate || planStartDate;
    const start = questStartDate ? new Date(questStartDate) : new Date();
      start.setHours(0, 0, 0, 0);
      const newQuestData = {};
      
      for (let i = 0; i < 28; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${day}`;
        
        const weekNum = Math.floor(i / 7) + 1;
        const weeklyItem = planData.find(p => p.week === weekNum);
        const weeklyItems = weeklyItem ? (weeklyItem.items || []) : [];
        
        const todos = weeklyItems.map((item, idx) => ({
          id: `todo_${weekNum}_${idx}`,
          title: item,
          checked: false
        }));
        
        newQuestData[dateStr] = {
          locked: false,
          completed: false,
          points_earned: 0,
          todos
        };
      }
      refreshQuests(newQuestData);
    }

    setWeeklyGoals(prev => ({
      steps: steps ?? prev.steps ?? 8000,
      exerciseMinutes: exerciseMinutes ?? prev.exerciseMinutes ?? 30
    }));

    setPlanGenerated(true);
  };

  const updateSimulationResult = (result) => {
    // 시뮬레이션 결과도 같은 정규화 적용
    if (result) {
      const normalized = normalizePredictedProfile(result, userProfile);
      // 원본 필드(simulatedInputs 등)는 유지하고 위험도 수치만 정규화
      setSimulationResult({ ...result, ...normalized });
    } else {
      setSimulationResult(null);
    }
  };

  const updateWearData = (data) => {
    setWearData(data);
  };

  // 5. 호환성 지원을 위한 Computed 객체 및 헬퍼 매핑
  const user = {
    ...userProfile,
    ...predictedProfile,
    // healthAge: predictedProfile 우선, 없으면 userProfile의 값 사용
    healthAge: predictedProfile?.healthAge ?? userProfile?.healthAge ?? null,
    persona: `${userProfile?.age || ""}세 ${userProfile?.gender || ""}`,
    personaTags: [
      userProfile?.gender,
      userProfile?.age ? `${userProfile.age}세` : "",
      userProfile?.smoking,
      (predictedProfile?.bmi >= 25) ? "비만" : (predictedProfile?.bmi ? "정상" : "")
    ].filter(Boolean)
  };

  const risks = predictedProfile;
  const goalSteps = weeklyGoals.steps;
  const updateGoalSteps = (steps) => {
    setWeeklyGoals(prev => ({ ...prev, steps: Number(steps) }));
  };
  const updateUser = updateUserProfile;
  const setUser = updateUserProfile;

  const resetPlan = (newUser) => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const todayStr = `${y}-${m}-${day}`;

    setPlanStartDate(todayStr);
    localStorage.setItem("echo-health-plan-start-date", todayStr);

    const freshPlans = DEFAULT_WEEKLY_PLANS.map(w => ({
      ...w,
      days: w.days.map(d => ({ ...d, status: "unchecked" }))
    }));
    setWeeklyPlans(freshPlans);
    localStorage.setItem("echo-health-weekly-milestones", JSON.stringify(freshPlans));

    setTodoCheckedState({});
    localStorage.setItem("echo-health-todo-checked-state", JSON.stringify({}));
    localStorage.setItem("echo-health-todo-last-date", todayStr);

    setWeeklyGoals({ steps: 8000, exerciseMinutes: 30 });

    const freshNotifs = generateDynamicNotifications(newUser || user, notifEnabled);
    setNotifications(freshNotifs);
    localStorage.setItem("echo-health-notifications", JSON.stringify(freshNotifs));
  };

  const addNotification = (title, icon = "🔔", targetScreen = "home", targetTab = "") => {
    const newNotif = {
      id: Date.now(),
      icon,
      title,
      date: new Date().toISOString(),
      unread: true,
      targetScreen,
      targetTab
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  return (
    <HealthContext.Provider
      value={{
        user,
        setUser,
        risks,
        setRisks: setPredictedProfile,
        plan,
        setPlan,
        updatePlan,
        benefits,
        setBenefits,
        firstResult,
        setFirstResult,
        newResult,
        setNewResult,
        hasReanalyzed,
        setHasReanalyzed,
        hasOnboarded,
        setHasOnboarded,
        wearData,
        setWearData,
        checkedState,
        setCheckedState,
        completedTimes,
        setCompletedTimes,
        calculateHealthData,
        notifications,
        setNotifications,
        weeklyPlans,
        setWeeklyPlans,
        todoCheckedState,
        setTodoCheckedState,
        planStartDate,
        setPlanStartDate,
        resetPlan,
        addNotification,
        notifEnabled,
        setNotifEnabled,
        simulationResult,
        setSimulationResult,
        updateSimulationResult,
        updateUser,
        originalUser,
        setOriginalUser,
        isLoading,
        loadingMessage,
        setLoadingMessage,
        showLoading,
        hideLoading,
        isEditMode,
        setEditMode,
        goalSteps,
        updateGoalSteps,
        planGenerated,
        setPlanGenerated,
        risksUpdatedAt,
        todaySteps,
        updateTodaySteps,
        navigateWithLoading,
        userProfile,
        setUserProfile,
        predictedProfile,
        setPredictedProfile,
        updateAnalysisResult: setPredictedProfile,
        weeklyGoals,
        setWeeklyGoals,
        updateUserProfile,
        updateVitalityBoost
      }}
    >
      {children}
    </HealthContext.Provider>
  );
}

export function useHealth() {
  const context = useContext(HealthContext);
  if (!context) {
    throw new Error("useHealth must be used within a HealthProvider");
  }
  return context;
}

export default HealthContext;
