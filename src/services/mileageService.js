import { loadMileage, saveMileage, loadQuestData, saveQuestData } from '../storage/localStore';

export function getToday() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getWeekKey(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  const year = d.getFullYear();
  const oneJan = new Date(year, 0, 1);
  const numberOfDays = Math.floor((d - oneJan) / (24 * 60 * 60 * 1000));
  const weekNum = Math.ceil((d.getDay() + 1 + numberOfDays) / 7);
  return `${year}-W${String(weekNum).padStart(2, '0')}`;
}

export function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (i + 1)); // 어제부터 이전 7일
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
}

// 자정 지난 날짜들에 대해 마일리지 확정 및 잠금 처리
export async function checkAndLockPastDays(updateVitalityBoost) {
  try {
    const questData = loadQuestData() || {};
    const todayStr = getToday();
    let updated = false;

    for (const date of Object.keys(questData)) {
      const day = questData[date];
      if (day && typeof day === 'object' && date < todayStr && !day.locked) {
        // 자정 지난 날짜 → 최종 상태 기준 확정
        const todos = day.todos || [];
        const checkedCount = Array.isArray(todos) ? todos.filter(t => t && t.checked).length : 0;
        const totalCount = Array.isArray(todos) ? todos.length : 0;
        const allComplete = totalCount > 0 && checkedCount === totalCount;

        const computedPoints = checkedCount + (allComplete ? 2 : 0);
        const points = Number(day.points_earned ?? computedPoints);
        const bonusPoints = allComplete ? 2 : 0;

        questData[date] = {
          ...day,
          locked: true,
          completed: allComplete,
          points_earned: points + bonusPoints,
        };

        // 당일 체크 시 이미 반영된 포인트는 자정에 다시 적립하지 않고 상태만 박제한다.
        const mileage = loadMileage() || { total: 0, logs: [] };
        const alreadyFinalized = (mileage.logs || []).some(
          log => log && log.date === date && log.type === 'day_final'
        );
        if (!alreadyFinalized) {
          await commitDayPoints(date, bonusPoints, allComplete, updateVitalityBoost);
        }
        updated = true;
      }
    }

    if (updated) {
      saveQuestData(questData);
    }
  } catch (e) {
    console.error("checkAndLockPastDays error:", e);
  }
}

// 하루치 포인트 마일리지 반영
export async function commitDayPoints(date, points, allComplete, updateVitalityBoost) {
  try {
    if (points === 0) return;

    const mileage = loadMileage() || { total: 0, logs: [] };
    const logs = mileage.logs || [];

    // 중복 적립 방지
    const alreadyLogged = logs.some(
      log => log && log.date === date && log.type === 'day_final'
    );
    if (alreadyLogged) return;

    mileage.total = (mileage.total || 0) + points;
    mileage.logs = logs;
    mileage.logs.push({
      type: 'day_final',
      date,
      points,
      completed: allComplete,
    });

    saveMileage(mileage);

    // 일일 전체 완료 시 활력 지수 +2 회복
    if (allComplete && updateVitalityBoost) {
      updateVitalityBoost(2);
    }

    // 연속 달성 보너스 확인
    await checkWeekStreak();
    await checkProgramComplete();
  } catch (e) {
    console.error("commitDayPoints error:", e);
  }
}

// 주간 연속 달성 보너스 확인
export async function checkWeekStreak() {
  try {
    const questData = loadQuestData() || {};
    const mileage = loadMileage() || { total: 0, logs: [] };
    const logs = mileage.logs || [];

    const last7 = getLast7Days();
    const completedCount = last7.filter(
      date => questData[date] && questData[date].locked && questData[date].completed
    ).length;

    if (completedCount >= 7) {
      const weekKey = getWeekKey();
      const alreadyGiven = logs.some(
        log => log && log.type === 'week_streak' && log.weekKey === weekKey
      );
      if (alreadyGiven) return;

      mileage.total = (mileage.total || 0) + 3;
      mileage.logs = logs;
      mileage.logs.push({
        type: 'week_streak',
        weekKey,
        points: 3,
        date: getToday()
      });
      saveMileage(mileage);
    }
  } catch (e) {
    console.error("checkWeekStreak error:", e);
  }
}

// 4주(28일) 전체 성공 보너스 확인
export async function checkProgramComplete() {
  try {
    const questData = loadQuestData() || {};
    const mileage = loadMileage() || { total: 0, logs: [] };
    const logs = mileage.logs || [];

    const lockedDays = Object.values(questData).filter(d => d && d.locked);
    const completedDays = lockedDays.filter(d => d && d.completed);

    if (completedDays.length >= 28) {
      const alreadyGiven = logs.some(
        log => log && log.type === 'program_complete'
      );
      if (alreadyGiven) return;

      mileage.total = (mileage.total || 0) + 200;
      mileage.logs = logs;
      mileage.logs.push({
        type: 'program_complete',
        points: 200,
        date: getToday()
      });
      saveMileage(mileage);
    }
  } catch (e) {
    console.error("checkProgramComplete error:", e);
  }
}

// 새 퀘스트 데이터 갱신 시 기존 잠금 데이터 유지 병합
export async function refreshQuests(newQuestData) {
  try {
    const existing = loadQuestData() || {};
    const merged = { ...newQuestData };

    for (const date of Object.keys(existing)) {
      if (existing[date] && existing[date].locked) {
        merged[date] = existing[date]; // 잠금된 과거 기록 보존
      }
    }

    saveQuestData(merged);
  } catch (e) {
    console.error("refreshQuests error:", e);
  }
}
