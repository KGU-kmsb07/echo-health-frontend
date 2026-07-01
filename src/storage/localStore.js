const USER_PROFILE_KEY = "@echo:userProfile";
const ANALYSIS_RESULT_KEY = "@echo:analysisResult";
const SIMULATION_RESULT_KEY = "@echo:simulationResult";
const QUEST_LIST_KEY = "@echo:questData";
const MILEAGE_KEY = "@echo:mileage";
const WEEKLY_GOALS_KEY = "@echo:weeklyGoals";
const EXERCISE_RECORDS_KEY = "@echo:exerciseRecords";

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

export function saveMileage(data) {
  if (!data) return;
  localStorage.setItem(MILEAGE_KEY, JSON.stringify(data));
}

export function loadMileage() {
  const data = localStorage.getItem(MILEAGE_KEY);
  if (!data) return { total: 0, logs: [] };
  try {
    const parsed = JSON.parse(data);
    if (parsed && typeof parsed === "object" && "total" in parsed) {
      return {
        total: parsed.total || 0,
        logs: Array.isArray(parsed.logs) ? parsed.logs : []
      };
    }
    // 하위 호환성 (숫자형인 경우)
    if (!isNaN(data)) {
      return { total: Number(data), logs: [] };
    }
    return { total: 0, logs: [] };
  } catch (e) {
    if (!isNaN(data)) {
      return { total: Number(data), logs: [] };
    }
    return { total: 0, logs: [] };
  }
}

// QuestData 함수 추가
export function saveQuestData(data) {
  if (!data) return;
  localStorage.setItem(QUEST_LIST_KEY, JSON.stringify(data));
}

export function loadQuestData() {
  const data = localStorage.getItem(QUEST_LIST_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error("Failed to parse quest data from localStorage", e);
    return null;
  }
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

export function saveExerciseRecords(data) {
  if (!data) return;
  localStorage.setItem(EXERCISE_RECORDS_KEY, JSON.stringify(data));
}

export function loadExerciseRecords() {
  const data = localStorage.getItem(EXERCISE_RECORDS_KEY);
  if (!data) return {};
  try {
    const parsed = JSON.parse(data);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (e) {
    console.error("Failed to parse exercise records from localStorage", e);
    return {};
  }
}
