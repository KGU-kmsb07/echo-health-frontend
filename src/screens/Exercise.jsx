import { useState, useEffect } from "react";
import S from '../styles/shared';
import { ProgressBar } from '../components/Card';
import { useHealth } from '../context/HealthContext';
import { loadExerciseRecords, saveExerciseRecords, loadMileage, saveMileage } from "../storage/localStore";
import { requestWearOSPermissionAndSync } from "../services/healthConnectService";

const EXERCISE_OPTIONS = [
  { name: "걷기", met: 3.3 },
  { name: "러닝", met: 8.3 },
  { name: "헬스", met: 5.0 },
  { name: "수영", met: 6.0 },
  { name: "축구", met: 7.0 },
  { name: "농구", met: 6.5 },
  { name: "자전거", met: 5.8 },
  { name: "요가", met: 2.8 },
  { name: "필라테스", met: 3.0 },
  { name: "기타", met: 4.0 }
];

const parseMinutes = (value) => {
  if (value === null || value === undefined) return 30;
  const match = String(value).match(/\d+/);
  return match ? Number(match[0]) : 30;
};

const normalizeIntensity = (value) => {
  if (typeof value === "number") return value;
  if (value === "가볍게") return 3;
  if (value === "강하게") return 8;
  return 5;
};

const getActivityEquivalent = (type, minutes, intensity, user) => {
  const option = EXERCISE_OPTIONS.find(item => item.name === type) || EXERCISE_OPTIONS[EXERCISE_OPTIONS.length - 1];
  const safeMinutes = Math.max(1, Number(minutes) || 0);
  const safeIntensity = Math.max(0, Math.min(10, Number(intensity) || 0));
  const age = Number(user?.healthAge ?? user?.age ?? 40);
  const ageFactor = age >= 60 ? 1.08 : age >= 45 ? 1.04 : age <= 25 ? 0.96 : 1;
  const intensityFactor = 0.65 + safeIntensity * 0.09;
  const activityLoad = option.met * safeMinutes * intensityFactor * ageFactor;
  const walkingMinutes = Math.max(1, Math.round(activityLoad / 3.3));
  const comparisons = [
    { threshold: 15, label: `가벼운 산책 ${walkingMinutes}분` },
    { threshold: 35, label: `빠른 걸음 ${walkingMinutes}분` },
    { threshold: Infinity, label: `러닝 ${Math.max(8, Math.round(walkingMinutes * 0.4))}분` }
  ];
  const similar = comparisons.find(item => walkingMinutes <= item.threshold)?.label;
  return { walkingMinutes, similar };
};

const makeDateKey = (year, monthIndex, day) => {
  const month = String(monthIndex + 1).padStart(2, "0");
  const date = String(day).padStart(2, "0");
  return `${year}-${month}-${date}`;
};

const addDays = (dateKey, amount) => {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + amount);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const getExerciseDates = (records) =>
  Object.keys(records || {})
    .filter(key => Array.isArray(records[key]) && records[key].length > 0)
    .sort();

const buildExerciseMileageLogs = (records) => {
  const dates = getExerciseDates(records);
  const dateSet = new Set(dates);
  const logs = dates.map(date => ({
    type: "exercise_day",
    date,
    points: 1,
    label: "일일 운동"
  }));

  let run = [];
  dates.forEach(date => {
    const prev = run.length ? run[run.length - 1] : null;
    if (!prev || addDays(prev, 1) === date) {
      run.push(date);
    } else {
      run = [date];
    }

    if (run.length >= 7 && run.length % 7 === 0) {
      const startDate = run[run.length - 7];
      const endDate = run[run.length - 1];
      const valid = Array.from({ length: 7 }, (_, index) => addDays(startDate, index)).every(day => dateSet.has(day));
      if (valid) {
        logs.push({
          type: "exercise_streak_7",
          date: endDate,
          streakStartDate: startDate,
          points: 3,
          label: "7일 연속 운동"
        });
      }
    }
  });

  return logs;
};

const syncExerciseMileage = (records) => {
  const mileage = loadMileage();
  const logs = mileage.logs || [];
  const nonExerciseLogs = logs.filter(log => !["exercise_day", "exercise_streak_7"].includes(log?.type));
  const oldExerciseTotal = logs
    .filter(log => ["exercise_day", "exercise_streak_7"].includes(log?.type))
    .reduce((sum, log) => sum + Number(log.points || 0), 0);
  const newExerciseLogs = buildExerciseMileageLogs(records);
  const newExerciseTotal = newExerciseLogs.reduce((sum, log) => sum + Number(log.points || 0), 0);

  saveMileage({
    total: Math.max(0, (mileage.total || 0) - oldExerciseTotal + newExerciseTotal),
    logs: [...nonExerciseLogs, ...newExerciseLogs]
  });
};

const normalizeWearOSPayload = (wearData) => {
  if (!wearData) return { steps: null, records: [] };
  const steps = wearData.steps ?? wearData.stepCount ?? wearData.dailySteps ?? null;
  const now = new Date();
  const todayDateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const toDateKey = (value) => {
    if (!value) return todayDateKey;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return todayDateKey;
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };
  const sessions = Array.isArray(wearData.sessions) ? wearData.sessions : [];
  const records = sessions.filter(session => toDateKey(session.startTime || wearData.syncedAt) === todayDateKey).map((session, index) => ({
    id: session.id || `wear-${Date.now()}-${index}`,
    source: "wearos",
    type: session.type || session.exerciseType || "걷기",
    duration: `${Math.max(1, Number(session.durationMinutes ?? session.minutes ?? 0) || 1)}분`,
    durationMinutes: Math.max(1, Number(session.durationMinutes ?? session.minutes ?? 0) || 1),
    intensity: normalizeIntensity(session.intensity ?? 5),
    equivalent: null,
    memo: "Wear OS 동기화"
  }));

  if (records.length === 0 && wearData.exerciseMinutes) {
    records.push({
      id: `wear-${Date.now()}`,
      source: "wearos",
      type: wearData.exerciseType || "걷기",
      duration: `${Number(wearData.exerciseMinutes)}분`,
      durationMinutes: Number(wearData.exerciseMinutes),
      intensity: normalizeIntensity(wearData.intensity ?? 5),
      equivalent: null,
      memo: "Wear OS 동기화"
    });
  }

  return { steps, records };
};

function ExerciseScreen() {
  const { user, wearData, todaySteps, updateTodaySteps, weeklyGoals, disconnectWearOS } = useHealth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalStartY, setAddModalStartY] = useState(0);
  const [addModalClosing, setAddModalClosing] = useState(false);
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [exerciseType, setExerciseType] = useState("헬스");
  const [duration, setDuration] = useState("30");
  const [intensity, setIntensity] = useState(5);
  const [memo, setMemo] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [records, setRecords] = useState(() => loadExerciseRecords());
  const [wearSyncing, setWearSyncing] = useState(false);
  const wearVitals = user?.wearVitals || {};
  const wearBp = wearVitals.bloodPressure || user?.bloodPressure || {};
  const wearSessionCount = Array.isArray(wearData?.sessions) ? wearData.sessions.length : 0;
  const wearConnected = Boolean(user?.wearLastSyncedAt || wearData);

  // 달력 상태 관리 (현재 날짜 기준)
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  useEffect(() => {
    const normalized = normalizeWearOSPayload(wearData);
    if (normalized.steps !== null && normalized.steps !== undefined) {
      updateTodaySteps(normalized.steps);
    }
    if (wearData) {
      setRecords(loadExerciseRecords());
    }
  }, [wearData]);

  useEffect(() => {
    saveExerciseRecords(records);
    syncExerciseMileage(records);
  }, [records]);

  const applyWearOSData = (payload, { saveSessions = false } = {}) => {
    const normalized = normalizeWearOSPayload(payload);
    if (normalized.steps !== null && normalized.steps !== undefined) {
      updateTodaySteps(normalized.steps);
    }
    if (!saveSessions || normalized.records.length === 0) return;

    const targetDateKey = makeDateKey(currentYear, currentMonth, selectedDay);
    setRecords(prev => ({
      ...prev,
      [targetDateKey]: [
        ...(prev[targetDateKey] || []),
        ...normalized.records.map(record => ({
          ...record,
          equivalent: getActivityEquivalent(record.type, record.durationMinutes, record.intensity, user)
        }))
      ]
    }));
  };

  useEffect(() => {
    window.EchoHealthWearOSSync = (payload) => applyWearOSData(payload, { saveSessions: false });
    const handleWearOSEvent = (event) => applyWearOSData(event.detail, { saveSessions: false });
    window.addEventListener("echo-health-wearos-sync", handleWearOSEvent);
    return () => {
      if (window.EchoHealthWearOSSync) delete window.EchoHealthWearOSSync;
      window.removeEventListener("echo-health-wearos-sync", handleWearOSEvent);
    };
  }, [currentYear, currentMonth, selectedDay, user]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // 1일 요일 계산 (0: 일, 1: 월, ... 6: 토)
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  // 해당 월의 총 일수
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const blanks = Array.from({ length: firstDayOfWeek }, () => null);
  const actualDays = Array.from({ length: totalDaysInMonth }, (_, i) => i + 1);
  const calendarDays = [...blanks, ...actualDays];

  // Wear OS 동기화 기록 처리
  const handleSync = async () => {
    setWearSyncing(true);
    try {
      const payload = await requestWearOSPermissionAndSync();
      applyWearOSData(payload || wearData, { saveSessions: false });
      setRecords(loadExerciseRecords());
    } catch (error) {
      alert(error.message || "Wear OS sync failed.");
    } finally {
      setWearSyncing(false);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleDisconnect = () => {
    disconnectWearOS?.();
  };

  const getRecordDisplay = (record) => {
    if (typeof record === "string") {
      return { title: record, meta: "" };
    }
    const minutes = record.durationMinutes ?? parseMinutes(record.duration);
    const recordIntensity = normalizeIntensity(record.intensity);
    return {
      title: `${record.type} ${minutes}분`,
      meta: `강도 ${recordIntensity}/10${record.memo ? ` · ${record.memo}` : ""}`
    };
  };

  const resetRecordForm = () => {
    setExerciseType("헬스");
    setDuration("30");
    setIntensity(5);
    setMemo("");
    setEditingIndex(null);
  };

  const openAddModal = () => {
    resetRecordForm();
    setAddModalClosing(false);
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setAddModalStartY(0);
    setAddModalClosing(true);
    setTimeout(() => {
      setShowAddModal(false);
      setAddModalClosing(false);
      resetRecordForm();
    }, 220);
  };

  const handleAddModalDragStart = (clientY) => setAddModalStartY(clientY);

  const handleAddModalDragEnd = (clientY) => {
    if (addModalStartY > 0 && clientY - addModalStartY > 80) {
      closeAddModal();
      return;
    }
    setAddModalStartY(0);
  };

  const openEditModal = (record, idx) => {
    if (typeof record === "string") {
      setExerciseType(record.split(" ")[0] || "헬스");
      setDuration(String(parseMinutes(record.match(/\d+분/)?.[0] || "30분")));
      setIntensity(5);
      setMemo("");
    } else {
      setExerciseType(record.type || "헬스");
      setDuration(String(record.durationMinutes ?? parseMinutes(record.duration)));
      setIntensity(normalizeIntensity(record.intensity));
      setMemo(record.memo || "");
    }
    setEditingIndex(idx);
    setAddModalClosing(false);
    setShowAddModal(true);
  };

  const handleDeleteRecord = (idx) => {
    if (!confirm("이 운동 기록을 삭제할까요?")) return;
    setRecords(prev => ({
      ...prev,
      [dateKey]: (prev[dateKey] || []).filter((_, recordIdx) => recordIdx !== idx)
    }));
  };

  // 수동 기록 저장 처리
  const handleSaveManualRecord = () => {
    const dateKey = makeDateKey(currentYear, currentMonth, selectedDay);
    const minutes = Math.max(1, Number(duration) || 0);
    const equivalent = getActivityEquivalent(exerciseType, minutes, intensity, user);
    const newRecord = {
      id: Date.now(),
      type: exerciseType,
      duration: `${minutes}분`,
      durationMinutes: minutes,
      intensity,
      equivalent,
      memo: memo.trim()
    };
    setRecords(prev => ({
      ...prev,
      [dateKey]: editingIndex === null
        ? [...(prev[dateKey] || []), newRecord]
        : (prev[dateKey] || []).map((record, idx) => idx === editingIndex ? newRecord : record)
    }));
    closeAddModal();
  };

  const dateKey = makeDateKey(currentYear, currentMonth, selectedDay);
  const dayRecords = records[dateKey] || [];
  const durationMinutes = Math.max(0, Number(duration) || 0);
  const activityEquivalent = getActivityEquivalent(exerciseType, durationMinutes || 1, intensity, user);

  return (
    <div style={S.screen}>
      <div style={{ ...S.scrollArea, paddingTop: 96 }}>
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ ...S.topBar, display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "20px 16px 12px", borderBottom: "1px solid #F3F4F6" }}>
            <div>
              <h2 style={{ fontWeight: 700, fontSize: 20, margin: 0 }}>운동 기록</h2>
              <p style={{ fontSize: 12, color: "#6B7280", margin: "2px 0 0" }}>
                이번 달 {Object.keys(records).filter(k => k.startsWith(`${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-`)).length}일 운동했어요
              </p>
            </div>
          </div>
          <div style={{ ...S.card, marginBottom: 12, display: "none" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 12 }}>
              <div>
                <p style={{ fontWeight: 800, margin: "0 0 3px", fontSize: 15 }}>Wear OS 동기화</p>
                <p style={{ margin: 0, fontSize: 11, color: "#6B7280" }}>
                  {wearConnected
                    ? `최근 동기화 ${new Date(user?.wearLastSyncedAt || Date.now()).toLocaleString()}`
                    : "걸음수와 운동기록을 가져옵니다."}
                </p>
              </div>
              <button
                type="button"
                onClick={wearConnected ? handleDisconnect : handleSync}
                disabled={wearSyncing}
                aria-pressed={wearConnected}
                style={{
                  width: 48,
                  height: 28,
                  borderRadius: 999,
                  border: "none",
                  padding: 3,
                  background: wearConnected ? "#2563EB" : "#D1D5DB",
                  cursor: wearSyncing ? "default" : "pointer",
                  transition: "background 0.15s"
                }}
              >
                <span
                  style={{
                    display: "block",
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: "#fff",
                    transform: wearConnected ? "translateX(20px)" : "translateX(0)",
                    transition: "transform 0.15s",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                  }}
                />
              </button>
            </div>
            <button
              onClick={handleSync}
              disabled={wearSyncing}
              style={{ ...S.btn(wearConnected ? "outline" : "primary"), width: "100%", opacity: wearSyncing ? 0.7 : 1 }}
            >
              {wearSyncing ? "동기화 중..." : wearConnected ? "Wear OS 다시 동기화" : "Wear OS 연동하기"}
            </button>
            <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", fontSize: 12 }}>
              <span style={{ fontWeight: 800, color: wearConnected ? "#15803D" : "#6B7280" }}>
                {wearConnected ? "연동됨" : "미연동"}
              </span>
              <span style={{ color: "#6B7280" }}>
                운동기록 {wearSessionCount}개
              </span>
            </div>
          </div>
          <div style={{ ...S.card, marginBottom: 12, display: "none" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", marginBottom: 10 }}>
              <div>
                <p style={{ fontWeight: 700, margin: "0 0 3px", fontSize: 14 }}>Wear OS 동기화</p>
                <p style={{ margin: 0, fontSize: 11, color: "#6B7280" }}>
                  {user?.wearLastSyncedAt ? `최근 동기화 ${new Date(user.wearLastSyncedAt).toLocaleString()}` : "아직 동기화되지 않음"}
                </p>
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, color: wearConnected ? "#15803D" : "#6B7280" }}>
                {wearConnected ? "연동됨" : "미동기화"}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12, color: "#374151", marginBottom: 12 }}>
              <span>걸음 {(wearVitals.steps ?? todaySteps)?.toLocaleString?.() || "-"}</span>
              <span>혈압 {wearBp.systolic && wearBp.diastolic ? `${wearBp.systolic}/${wearBp.diastolic}` : "-"}</span>
              <span>운동 기록 {wearSessionCount}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <button onClick={handleSync} disabled={wearSyncing} style={{ ...S.btn("outline"), opacity: wearSyncing ? 0.7 : 1 }}>
                {wearSyncing ? "동기화 중..." : "동기화"}
              </button>
              <button onClick={handleRefresh} style={S.btn("outline")}>
                새로고침
              </button>
              <button onClick={handleDisconnect} disabled={!wearConnected} style={{ ...S.btn("outline"), opacity: wearConnected ? 1 : 0.45, gridColumn: "1 / -1" }}>
                연결 끄기
              </button>
            </div>
            <div style={{ marginTop: 8, padding: "8px 10px", borderRadius: 8, background: wearConnected ? "#ECFDF5" : "#F9FAFB", color: wearConnected ? "#15803D" : "#6B7280", fontSize: 12, fontWeight: 800, textAlign: "center" }}>
              {wearConnected ? "동기화됨" : "미동기화"}
            </div>
          </div>
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <button onClick={handlePrevMonth} style={{ background: "none", border: "none", cursor: "pointer", color: "#374151", fontSize: 16 }}>‹</button>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontWeight: 700 }}>{currentYear}년 {currentMonth + 1}월</span>
                <button
                  onClick={() => {
                    const now = new Date();
                    setCurrentYear(now.getFullYear());
                    setCurrentMonth(now.getMonth());
                    setSelectedDay(now.getDate());
                  }}
                  style={{
                    fontSize: 11, color: "#2563EB",
                    border: "1px solid #2563EB",
                    borderRadius: 10, padding: "2px 8px",
                    background: "#fff", cursor: "pointer"
                  }}
                >
                  오늘
                </button>
              </div>
              <button onClick={handleNextMonth} style={{ background: "none", border: "none", cursor: "pointer", color: "#374151", fontSize: 16 }}>›</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, textAlign: "center", marginBottom: 8 }}>
              {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
                <div key={d} style={{ fontSize: 12, color: i === 0 ? "#EF4444" : i === 6 ? "#3B82F6" : "#9CA3AF", padding: "4px 0" }}>{d}</div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, textAlign: "center" }}>
              {calendarDays.map((d, i) => {
                const isToday = d === today.getDate() && currentYear === today.getFullYear() && currentMonth === today.getMonth();
                const isSelected = d === selectedDay;
                
                let dayStyle = {
                  padding: "6px 0",
                  fontSize: 13,
                  borderRadius: 6,
                  cursor: d ? "pointer" : "default",
                  fontWeight: isSelected ? 700 : 400,
                  border: isToday ? "2px solid #2563EB" : "2px solid transparent",
                  boxSizing: "border-box",
                  transition: "all 0.1s"
                };
                
                if (isSelected) {
                  dayStyle.background = "#2563EB";
                  dayStyle.color = "#fff";
                } else if (!d) {
                  dayStyle.color = "transparent";
                } else {
                  const dayIdx = i % 7;
                  dayStyle.color = dayIdx === 0 ? "#EF4444" : dayIdx === 6 ? "#3B82F6" : "#374151";
                }

                const dateKey = d ? makeDateKey(currentYear, currentMonth, d) : "";
                const hasRecord = records[dateKey] && records[dateKey].length > 0;
                return (
                  <div
                    key={i}
                    onClick={() => d && setSelectedDay(d)}
                    style={{ ...dayStyle, position: "relative" }}
                  >
                    {d}
                    {d && hasRecord && (
                      <div style={{
                        width: 4,
                        height: 4,
                        borderRadius: "50%",
                        background: isSelected ? "rgba(255,255,255,0.8)" : "#9CA3AF",
                        position: "absolute",
                        bottom: 2,
                        left: "50%",
                        transform: "translateX(-50%)"
                      }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 오늘 걸음 목표 */}
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <p style={{ fontWeight: 700, margin: 0, fontSize: 15 }}>만보기</p>
              <span style={{ fontSize: 11, fontWeight: 800, color: wearConnected ? "#15803D" : "#9CA3AF" }}>
                {wearConnected ? "Wear OS 걸음수 반영" : "미연동"}
              </span>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, fontSize: 13 }}>
                <span style={{ fontWeight: 600 }}>오늘 걸음</span>
                <span style={{ color: "#2563EB", fontWeight: 700 }}>
                  {(todaySteps ?? 0).toLocaleString()} / {(weeklyGoals?.steps ?? 8000).toLocaleString()} 보 ({Math.min(100, Math.round(((todaySteps ?? 0) / (weeklyGoals?.steps ?? 8000)) * 100))}%)
                </span>
              </div>
              <ProgressBar pct={Math.min(100, Math.round(((todaySteps ?? 0) / (weeklyGoals?.steps ?? 8000)) * 100))} color="#2563EB" />
            </div>
          </div>
          <div style={{ ...S.card, padding: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 800 }}>Wear OS 동기화</p>
                <p style={{ margin: 0, fontSize: 11, color: "#6B7280" }}>
                  {wearConnected ? `연동됨 · 운동기록 ${wearSessionCount}개` : "걸음수와 오늘 운동기록을 가져옵니다."}
                </p>
              </div>
              <button
                type="button"
                onClick={wearConnected ? handleDisconnect : handleSync}
                disabled={wearSyncing}
                aria-pressed={wearConnected}
                style={{
                  width: 46,
                  height: 26,
                  borderRadius: 999,
                  border: "none",
                  padding: 3,
                  background: wearConnected ? "#2563EB" : "#D1D5DB",
                  cursor: wearSyncing ? "default" : "pointer",
                  flexShrink: 0
                }}
              >
                <span
                  style={{
                    display: "block",
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "#fff",
                    transform: wearConnected ? "translateX(20px)" : "translateX(0)",
                    transition: "none",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.18)"
                  }}
                />
              </button>
            </div>
            <button
              onClick={handleSync}
              disabled={wearSyncing}
              style={{ ...S.btn("outline"), width: "100%", marginTop: 10, padding: "10px 0", fontSize: 13, opacity: wearSyncing ? 0.7 : 1 }}
            >
              {wearSyncing ? "동기화 중..." : wearConnected ? "오늘 데이터 다시 동기화" : "Wear OS 연동하기"}
            </button>
          </div>

          {/* 선택일 운동기록 헤더 및 동기화 버튼 */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontWeight: 500 }}>
                {currentYear}.{String(currentMonth + 1).padStart(2, '0')}.{String(selectedDay).padStart(2, '0')} 운동 기록
              </span>
              <button
                type="button"
                onClick={openAddModal}
                style={{ border: "none", background: "none", color: "#2563EB", fontSize: 13, fontWeight: 800, cursor: "pointer", padding: "4px 0" }}
              >
                운동 추가
              </button>
            </div>
            <button onClick={handleSync} disabled={wearSyncing} style={{ ...S.btn("outline"), width: "100%", opacity: wearSyncing ? 0.7 : 1, display: "none" }}>
              ⌚ Wear OS 동기화
            </button>
          </div>

          {/* 운동 기록 리스트 영역 */}
          {dayRecords.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {dayRecords.map((rec, idx) => {
                const display = getRecordDisplay(rec);
                return (
                <div key={idx} style={{ ...S.card, display: "flex", gap: 10, alignItems: "center", marginBottom: 0 }}>
                  <span style={{ fontSize: 20 }}>🏃</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: "0 0 2px", lineHeight: 1.35 }}>{display.title}</p>
                    {display.meta && <p style={{ fontSize: 11, fontWeight: 500, color: "#9CA3AF", margin: 0, lineHeight: 1.3 }}>{display.meta}</p>}
                  </div>
                  <button onClick={() => openEditModal(rec, idx)} style={{ background: "none", border: "none", color: "#2563EB", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>수정</button>
                  <button onClick={() => handleDeleteRecord(idx)} style={{ background: "none", border: "none", color: "#EF4444", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>삭제</button>
                </div>
              )})}
              <button onClick={openAddModal} style={{ background: "none", border: "1px dashed #E5E7EB", borderRadius: 12, padding: "12px 0", color: "#6B7280", cursor: "pointer", fontSize: 13, width: "100%", marginTop: 4 }}>+ 운동 직접 추가</button>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#9CA3AF" }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🏃</div>
              <p style={{ fontSize: 14, margin: "0 0 12px" }}>이 날의 운동 기록이 없어요.</p>
              <button onClick={openAddModal} style={{ background: "none", border: "1px solid #E5E7EB", borderRadius: 20, padding: "6px 16px", color: "#6B7280", cursor: "pointer", fontSize: 13 }}>+ 운동 기록 추가</button>
            </div>
          )}
        </div>
      </div>

      {/* 운동 추가 모달 */}
      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 400 }} onClick={closeAddModal}>
          <div
            className={`bottom-sheet${addModalClosing ? " closing" : ""}`}
            onClick={e => e.stopPropagation()}
            onTouchStart={e => handleAddModalDragStart(e.touches[0].clientY)}
            onTouchEnd={e => handleAddModalDragEnd(e.changedTouches[0].clientY)}
            onTouchCancel={() => setAddModalStartY(0)}
            onMouseDown={e => handleAddModalDragStart(e.clientY)}
            onMouseUp={e => handleAddModalDragEnd(e.clientY)}
            onDragStart={e => e.preventDefault()}
            style={{ position: "fixed", bottom: 0, left: 0, right: 0, margin: "0 auto", width: "100%", maxWidth: 390, background: "#fff", borderRadius: "20px 20px 0 0", padding: "20px 20px 80px", maxHeight: "90vh", overflowY: "auto", boxSizing: "border-box", zIndex: 500 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <span style={{ fontWeight: 700, fontSize: 16 }}>{editingIndex === null ? "운동 기록 추가" : "운동 기록 수정"}</span>
              <button onClick={closeAddModal} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer" }}>✕</button>
            </div>
            <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 8px" }}>운동 종류</p>
            <select
              value={exerciseType}
              onChange={e => setExerciseType(e.target.value)}
              style={{ width: "100%", border: "1px solid #E5E7EB", borderRadius: 10, padding: "12px 14px", fontSize: 14, boxSizing: "border-box", marginBottom: 16, background: "#fff", color: "#111827" }}
            >
              {EXERCISE_OPTIONS.map(option => (
                <option key={option.name} value={option.name}>{option.name}</option>
              ))}
            </select>
            <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 8px" }}>운동 시간</p>
            <div style={{ position: "relative", marginBottom: 16 }}>
              <input
                value={duration}
                onChange={e => setDuration(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))}
                inputMode="numeric"
                placeholder="예: 30"
                style={{ width: "100%", border: "1px solid #E5E7EB", borderRadius: 10, padding: "12px 42px 12px 14px", fontSize: 14, boxSizing: "border-box" }}
              />
              <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#6B7280" }}>분</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "0 0 8px" }}>
              <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>운동 강도</p>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#2563EB" }}>{intensity}/10</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              value={intensity}
              onChange={e => setIntensity(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#2563EB", marginBottom: 8 }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9CA3AF", marginBottom: 16 }}>
              <span>가볍게</span>
              <span>보통</span>
              <span>강하게</span>
            </div>
            {exerciseType && durationMinutes > 0 && (
              <div style={{ background: "#EFF6FF", borderRadius: 10, padding: "10px 12px", marginBottom: 16, fontSize: 12, color: "#1D4ED8" }}>
                {exerciseType} {durationMinutes}분은 걷기 약 {activityEquivalent.walkingMinutes}분과 비슷한 활동량이에요.<br />
                {activityEquivalent.similar}와 비슷한 활동량이에요.<br />
                <span style={{ color: "#9CA3AF" }}>운동량 환산은 건강나이와 운동 강도를 반영한 참고값이며, 개인 상태에 따라 차이가 있을 수 있어요.</span>
              </div>
            )}
            <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 4px" }}>메모 (선택)</p>
            <input
              value={memo}
              onChange={e => setMemo(e.target.value)}
              placeholder="예: 공원 3바퀴"
              style={{ width: "100%", border: "1px solid #E5E7EB", borderRadius: 10, padding: "12px 14px", fontSize: 14, boxSizing: "border-box", marginBottom: 16 }}
            />
            <button onClick={handleSaveManualRecord} style={S.btn()}>{editingIndex === null ? "저장하기" : "수정 완료"}</button>
          </div>
        </div>
      )}

    </div>
  );
}

export default ExerciseScreen;
