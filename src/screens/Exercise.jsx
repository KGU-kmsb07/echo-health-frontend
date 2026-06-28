import { useState, useEffect } from "react";
import S from '../styles/shared';
import { ProgressBar } from '../components/Card';
import { useHealth } from '../context/HealthContext';

function ExerciseScreen() {
  const { wearData, todaySteps, updateTodaySteps, weeklyGoals } = useHealth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [exerciseType, setExerciseType] = useState("헬스");
  const [duration, setDuration] = useState("30분");
  const [intensity, setIntensity] = useState("보통");
  const [records, setRecords] = useState({});
  const [exerciseLog, setExerciseLog] = useState({});
  // { "2025-01-15": { minutes: 30, steps: 4200 }, ... }

  // 달력 상태 관리 (현재 날짜 기준)
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  // wearData 있으면 오늘 날짜에 자동으로 점 표시
  useEffect(() => {
    if (wearData?.steps > 0 || wearData?.exerciseMinutes > 0) {
      const todayKey = new Date().toISOString().split("T")[0];
      setExerciseLog(prev => ({
        ...prev,
        [todayKey]: {
          steps: wearData.steps,
          minutes: wearData.exerciseMinutes
        }
      }));
    }
  }, [wearData]);

  useEffect(() => {
    if (wearData) {
      updateTodaySteps(wearData.steps);
    }
  }, [wearData]);

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
  const handleSync = () => {
    if (wearData) {
      const dateKey = `${currentYear}-${currentMonth + 1}-${selectedDay}`;
      const newRecord = `${wearData.exerciseMinutes}분 운동 자동 기록`;
      setRecords(prev => ({
        ...prev,
        [dateKey]: [...(prev[dateKey] || []), newRecord]
      }));
    }
  };

  // 수동 기록 저장 처리
  const handleSaveManualRecord = () => {
    const dateKey = `${currentYear}-${currentMonth + 1}-${selectedDay}`;
    const newRecord = `${exerciseType} ${duration} (${intensity})`;
    setRecords(prev => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] || []), newRecord]
    }));
    setShowAddModal(false);
  };

  const dateKey = `${currentYear}-${currentMonth + 1}-${selectedDay}`;
  const dayRecords = records[dateKey] || [];

  return (
    <div style={S.screen}>
      <div style={S.scrollArea}>
        <div style={{ padding: "20px 16px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
            <div>
              <h2 style={{ fontWeight: 700, fontSize: 20, margin: 0 }}>운동 기록</h2>
              <p style={{ fontSize: 12, color: "#6B7280", margin: "2px 0 0" }}>
                이번 달 {Object.keys(records).filter(k => k.startsWith(`${currentYear}-${currentMonth + 1}-`)).length}일 운동했어요
              </p>
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

                const dateKey = d ? `${currentYear}-${currentMonth + 1}-${d}` : "";
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
            <p style={{ fontWeight: 600, margin: "0 0 10px", fontSize: 15 }}>오늘 걸음 목표</p>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, fontSize: 13 }}>
                <span style={{ fontWeight: 600 }}>걸음 수 달성률</span>
                <span style={{ color: "#2563EB", fontWeight: 700 }}>
                  {(todaySteps ?? 0).toLocaleString()} / {(weeklyGoals?.steps ?? 8000).toLocaleString()} 보 ({Math.min(100, Math.round(((todaySteps ?? 0) / (weeklyGoals?.steps ?? 8000)) * 100))}%)
                </span>
              </div>
              <ProgressBar pct={Math.min(100, Math.round(((todaySteps ?? 0) / (weeklyGoals?.steps ?? 8000)) * 100))} color="#2563EB" />
            </div>
          </div>



          {/* 선택일 운동기록 헤더 및 동기화 버튼 */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontWeight: 500 }}>
                {currentYear}.{String(currentMonth + 1).padStart(2, '0')}.{String(selectedDay).padStart(2, '0')} 운동 기록
              </span>
            </div>
            <button onClick={handleSync} style={{ ...S.btn("outline"), width: "100%" }}>
              ⌚ Wear OS 동기화
            </button>
          </div>

          {/* 운동 기록 리스트 영역 */}
          {dayRecords.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {dayRecords.map((rec, idx) => (
                <div key={idx} style={{ ...S.card, display: "flex", gap: 10, alignItems: "center", marginBottom: 0 }}>
                  <span style={{ fontSize: 20 }}>🏃</span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{rec}</span>
                </div>
              ))}
              <button onClick={() => setShowAddModal(true)} style={{ background: "none", border: "1px dashed #E5E7EB", borderRadius: 12, padding: "12px 0", color: "#6B7280", cursor: "pointer", fontSize: 13, width: "100%", marginTop: 4 }}>+ 운동 직접 추가</button>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#9CA3AF" }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🏃</div>
              <p style={{ fontSize: 14, margin: "0 0 12px" }}>이 날의 운동 기록이 없어요.</p>
              <button onClick={() => setShowAddModal(true)} style={{ background: "none", border: "1px solid #E5E7EB", borderRadius: 20, padding: "6px 16px", color: "#6B7280", cursor: "pointer", fontSize: 13 }}>+ 운동 기록 추가</button>
            </div>
          )}
        </div>
      </div>

      {/* 운동 추가 모달 */}
      {showAddModal && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 200 }} onClick={() => setShowAddModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "#fff", borderRadius: "20px 20px 0 0", padding: "20px 20px 80px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <span style={{ fontWeight: 700, fontSize: 16 }}>운동 기록 추가</span>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer" }}>✕</button>
            </div>
            <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 8px" }}>운동 종류</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {["걷기", "러닝", "헬스", "수영", "축구", "농구", "자전거", "기타"].map(t => (
                <button key={t} style={S.chip(exerciseType === t)} onClick={() => setExerciseType(t)}>{t}</button>
              ))}
            </div>
            <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 8px" }}>운동 시간</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {["20분", "30분", "40분", "60분", "직접 입력"].map(t => (
                <button key={t} style={S.chip(duration === t)} onClick={() => setDuration(t)}>{t}</button>
              ))}
            </div>
            <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 8px" }}>운동 강도</p>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {["가볍게", "보통", "강하게"].map(t => (
                <button key={t} style={S.chip(intensity === t)} onClick={() => setIntensity(t)}>{t}</button>
              ))}
            </div>
            {exerciseType && duration && intensity && (
              <div style={{ background: "#EFF6FF", borderRadius: 10, padding: "10px 12px", marginBottom: 16, fontSize: 12, color: "#1D4ED8" }}>
                {exerciseType} {duration}은 걷기 약 42분과 비슷한 활동량이에요.<br />
                <span style={{ color: "#9CA3AF" }}>운동량 환산은 참고용이며, 개인의 체중과 운동 강도에 따라 차이가 있을 수 있어요.</span>
              </div>
            )}
            <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 4px" }}>메모 (선택)</p>
            <input placeholder="예: 공원 3바퀴" style={{ width: "100%", border: "1px solid #E5E7EB", borderRadius: 10, padding: "12px 14px", fontSize: 14, boxSizing: "border-box", marginBottom: 16 }} />
            <button onClick={handleSaveManualRecord} style={S.btn()}>저장하기</button>
          </div>
        </div>
      )}

    </div>
  );
}

export default ExerciseScreen;
