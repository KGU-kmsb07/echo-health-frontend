const USER_PROFILE_KEY = "@echo:userProfile";
const ANALYSIS_RESULT_KEY = "@echo:analysisResult";
const SIMULATION_RESULT_KEY = "@echo:simulationResult";
const QUEST_LIST_KEY = "@echo:questList";
const MILEAGE_KEY = "@echo:mileage";
const WEEKLY_GOALS_KEY = "@echo:weeklyGoals";

export function saveUserProfile(data) {
  if (!data) return;
  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(data));
}

export function loadUserProfile() {
  const data = localStorage.getItem(USER_PROFILE_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error("Failed to parse user profile from localStorage", e);
    return null;
  }
}

export function saveAnalysisResult(data) {
  if (!data) return;
  localStorage.setItem(ANALYSIS_RESULT_KEY, JSON.stringify(data));
}

export function loadAnalysisResult() {
  const data = localStorage.getItem(ANALYSIS_RESULT_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error("Failed to parse analysis result from localStorage", e);
    return null;
  }
}

export function saveSimulationResult(data) {
  if (!data) return;
  localStorage.setItem(SIMULATION_RESULT_KEY, JSON.stringify(data));
}

export function loadSimulationResult() {
  const data = localStorage.getItem(SIMULATION_RESULT_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error("Failed to parse simulation result from localStorage", e);
    return null;
  }
}

export function saveQuestList(data) {
  if (!data) return;
  localStorage.setItem(QUEST_LIST_KEY, JSON.stringify(data));
}

export function loadQuestList() {
  const data = localStorage.getItem(QUEST_LIST_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error("Failed to parse quest list from localStorage", e);
    return null;
  }
}

export function saveMileage(value) {
  localStorage.setItem(MILEAGE_KEY, String(value));
}

export function loadMileage() {
  const data = localStorage.getItem(MILEAGE_KEY);
  return data ? Number(data) : 0;
}

export function saveWeeklyGoals(data) {
  if (!data) return;
  localStorage.setItem(WEEKLY_GOALS_KEY, JSON.stringify(data));
}

export function loadWeeklyGoals() {
  const data = localStorage.getItem(WEEKLY_GOALS_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error("Failed to parse weekly goals from localStorage", e);
    return null;
  }
}

export function clearAll() {
  localStorage.removeItem(USER_PROFILE_KEY);
  localStorage.removeItem(ANALYSIS_RESULT_KEY);
  localStorage.removeItem(SIMULATION_RESULT_KEY);
  localStorage.removeItem(QUEST_LIST_KEY);
  localStorage.removeItem(MILEAGE_KEY);
  localStorage.removeItem(WEEKLY_GOALS_KEY);
  // 기존 레거시 로컬스토리지 키들도 안전하게 지워줍니다.
  localStorage.removeItem("echo-health-user-profile");
  localStorage.removeItem("echo-health-predicted-profile");
  localStorage.removeItem("echo-health-plan");
  localStorage.removeItem("echo-health-weekly-goals");
  localStorage.removeItem("echo-health-plan-generated");
  localStorage.removeItem("echo-health-risks-updated-at");
  localStorage.removeItem("echo-health-notifications");
  localStorage.removeItem("echo-health-first-result");
  localStorage.removeItem("echo-health-new-result");
  localStorage.removeItem("echo-health-has-reanalyzed");
  localStorage.removeItem("echo-health-has-onboarded");
  localStorage.removeItem("echo-health-simulation-result");
}
