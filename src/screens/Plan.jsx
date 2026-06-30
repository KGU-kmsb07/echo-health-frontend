import React, { useState, useEffect, useRef } from "react";
import S from '../styles/shared';
import { useHealth } from '../context/HealthContext';
import WeeklyMilestoneCard, { getWeeklyResult } from '../components/WeeklyMilestoneCard';
import { getPlan } from '../api/echoApi';
import { loadQuestData, saveQuestData, loadMileage, saveMileage } from '../storage/localStore';
import { getToday } from '../services/mileageService';

function PlanScreen({ setScreen }) {
  const { 
    plan, 
    updatePlan, 
    weeklyPlans, 
    setWeeklyPlans, 
    todoCheckedState, 
    setTodoCheckedState, 
    planStartDate, 
    setPlanStartDate,
    risks, 
    simulationResult, 
    showLoading, 
    hideLoading,
    planGenerated,
    setPlanGenerated,
    resetPlan,
    updateVitalityBoost
  } = useHealth();

  const [loading, setLoading] = useState(!plan && !planGenerated);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const FALLBACK_PLAN = {
    plan: [
      {"week": 1, "title": "건강 기초 다지기", "color": "#2563EB",
       "items": ["매일 30분 걷기", "물 하루 8잔", "취침 전 스트레칭", "식사 규칙적으로"]},
      {"week": 2, "title": "생활습관 강화", "color": "#7C3AED",
       "items": ["유산소 운동 주 3회", "나트륨 줄이기", "수면 7시간 확보", "계단 이용"]},
      {"week": 3, "title": "집중 관리", "color": "#059669",
       "items": ["근력 운동 추가", "채소 매 끼니 포함", "음주 줄이기", "스트레스 관리"]},
      {"week": 4, "title": "습관 정착", "color": "#D97706",
       "items": ["운동 루틴 점검", "한 달 변화 기록", "재분석으로 확인", "다음 달 목표 설정"]}
    ],
    weeklyGoals: {"steps": 8000, "exerciseMinutes": 30}
  };

  const withPlanStartDate = (planResult, startDateOverride) => {
    if (!startDateOverride) return planResult;
    if (Array.isArray(planResult)) return { plan: planResult, planStartDate: startDateOverride };
    return { ...planResult, planStartDate: startDateOverride };
  };

  const fetchNewPlan = async (startDateOverride = null) => {
    try {
      showLoading("AI가 맞춤 플랜을 생성하고 있어요...");
      setLoading(true);
      const targetResult = simulationResult || risks;
      if (targetResult) {
        const generatedPlan = await getPlan(targetResult);
        if (isMountedRef.current) {
          if (generatedPlan && !generatedPlan.error) {
            updatePlan(withPlanStartDate(generatedPlan, startDateOverride));
          } else {
            updatePlan(withPlanStartDate(FALLBACK_PLAN, startDateOverride));
          }
          setPlanGenerated(true);
        }
      } else {
        updatePlan(withPlanStartDate(FALLBACK_PLAN, startDateOverride));
        setPlanGenerated(true);
      }
    } catch (error) {
      console.error("Failed to load plan", error);
      if (isMountedRef.current) {
        updatePlan(withPlanStartDate(FALLBACK_PLAN, startDateOverride));
        setPlanGenerated(true);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        hideLoading();
      }
    }
  };

  const handleKeepPlan = () => {
    setShowConfirmModal(false);
  };

  const deductCurrentPlanMileage = (reason = "plan_cancel") => {
    const questData = loadQuestData() || {};
    const mileage = loadMileage() || { total: 0, logs: [] };
    const totalEarned = Object.values(questData).reduce((sum, day) => {
      return sum + Number(day?.points_earned || 0);
    }, 0);

    if (totalEarned > 0) {
      saveMileage({
        ...mileage,
        total: Math.max(0, (mileage.total || 0) - totalEarned),
        logs: [
          ...(mileage.logs || []),
          {
            type: reason,
            date: getToday(),
            points: -totalEarned,
            memo: "플랜 취소로 기존 실천 마일리지 차감"
          }
        ]
      });
    }
    saveQuestData({});
    setTodoCheckedState({});
  };

  const handleRecreatePlan = () => {
    setShowConfirmModal(false);
    const today = getToday();
    setPlanStartDate(today);
    setWeeklyPlans(prev => prev.map(w => ({
      ...w,
      days: w.days.map(day => ({ ...day, status: "unchecked" }))
    })));
    setTodoCheckedState({});
    setPlanGenerated(false);
    fetchNewPlan(today);
  };

  const handleCancelPlan = () => {
    if (!confirm("현재 4주 플랜을 취소할까요? 취소하면 이 플랜으로 적립한 건강 마일리지가 차감됩니다.")) return;
    deductCurrentPlanMileage();
    resetPlan();
    updatePlan(null);
    setPlanGenerated(false);
  };

  const hasFetchedRef = useRef(false);
  useEffect(() => {
    if (plan && plan.data) {
      setLoading(false);
    } else {
      if (!hasFetchedRef.current) {
        hasFetchedRef.current = true;
        fetchNewPlan();
      } else {
        setLoading(false);
      }
    }
  }, [plan]);

  // 플랜 시작일 기준 현재 주차 및 오늘 요일 연산
  const getPlanProgress = (startDateStr) => {
    let dateStr = startDateStr;
    if (!dateStr || dateStr === "null" || dateStr === "undefined" || isNaN(new Date(dateStr).getTime())) {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      dateStr = `${y}-${m}-${day}`;
    }
    const start = new Date(dateStr);
    const now = new Date();
    start.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diffTime = now.getTime() - start.getTime();
    const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    
    // 7일 단위로 주차 계산 (최대 4주)
    const week = Math.min(4, Math.floor(diffDays / 7) + 1);
    const dayIndex = diffDays % 7;
    
    const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"];
    const startDayOfWeek = start.getDay();
    const dayName = daysOfWeek[(startDayOfWeek + dayIndex) % 7];
    
    return { week, dayName, diffDays, dayIndex };
  };

  // ✅ 모든 훅은 조기 리턴 이전에 선언해야 함 (React 훅 규칙)
  const { week: currentWeek, dayIndex: currentDayIndex } = getPlanProgress(planStartDate);

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  useEffect(() => {
    setSelectedDayIndex(currentDayIndex);
  }, [currentDayIndex]);

  const getDateStr = (startDateStr, offsetDays) => {
    if (!startDateStr) return "";
    const d = new Date(startDateStr);
    d.setDate(d.getDate() + offsetDays);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const getSelectedDayName = (idx) => {
    const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"];
    let dateStr = planStartDate;
    if (!dateStr || dateStr === "null" || dateStr === "undefined" || isNaN(new Date(dateStr).getTime())) {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      dateStr = `${y}-${m}-${day}`;
    }
    const start = new Date(dateStr);
    const startDayOfWeek = start.getDay();
    return daysOfWeek[(startDayOfWeek + idx) % 7] + "요일";
  };

  const selectedDate = getDateStr(planStartDate, (currentWeek - 1) * 7 + selectedDayIndex);
  const todayDate = getToday();
  const questData = loadQuestData() || {};
  const isLocked = selectedDate < todayDate || (questData[selectedDate]?.locked ?? false);
  const isCompleted = questData[selectedDate]?.completed ?? false;
  const isToday = selectedDate === todayDate;
  const isActive = isToday && !isLocked;

  // ✅ 훅 선언 후에 조기 리턴 허용
  if (loading) {
    return (
      <div style={S.screen}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12 }}>
          <span style={{ fontSize: 14, color: "#4B5563", fontWeight: 600 }}>AI가 맞춤 플랜을 생성하고 있어요...</span>
          <span style={{ fontSize: 18, color: "#3B82F6", fontWeight: 700 }}>...</span>
        </div>
      </div>
    );
  }

  const handleTodoToggle = async (week, item, idx) => {
    if (!isActive) return; // 오늘 날짜가 아니거나 이미 잠긴 날은 체크 변경 불가

    const key = `todo-${week}-${item}`;
    const wasChecked = !!(todoCheckedState[key]);
    const nextChecked = !wasChecked;
    const nextCheckedState = {
      ...todoCheckedState,
      [key]: nextChecked
    };
    setTodoCheckedState(nextCheckedState);

    // questData 업데이트
    const updatedQuestData = { ...questData };
    if (!updatedQuestData[selectedDate]) {
      updatedQuestData[selectedDate] = { locked: false, completed: false, points_earned: 0, todos: [] };
    }
    if (!updatedQuestData[selectedDate].todos) {
      updatedQuestData[selectedDate].todos = [];
    }
    
    const targetPlan = (plan && plan.data) ? plan.data.find(p => p.week === week) : null;
    const todayTodoItems = targetPlan ? targetPlan.items : [];
    
    if (updatedQuestData[selectedDate].todos.length === 0 && todayTodoItems.length > 0) {
      updatedQuestData[selectedDate].todos = todayTodoItems.map((todoTitle, todoIdx) => ({
        id: `todo_${week}_${todoIdx}`,
        title: todoTitle,
        checked: todoIdx === idx ? nextChecked : false
      }));
    } else if (updatedQuestData[selectedDate].todos[idx]) {
      updatedQuestData[selectedDate].todos[idx].checked = nextChecked;
    } else if (todayTodoItems.length > 0) {
      updatedQuestData[selectedDate].todos[idx] = {
        id: `todo_${week}_${idx}`,
        title: item,
        checked: nextChecked
      };
    }

    const checkedCount = updatedQuestData[selectedDate].todos.filter(t => t.checked).length;
    const totalCount = updatedQuestData[selectedDate].todos.length;
    const allChecked = totalCount > 0 && checkedCount === totalCount;
    const anyChecked = checkedCount > 0;

    updatedQuestData[selectedDate].completed = allChecked;

    // 개별 실천은 즉시 +1pt, 일일 전체 완료 보너스는 자정 마감 후 +2pt로 확정한다.
    const prevPointsEarned = updatedQuestData[selectedDate].points_earned || 0;
    const mileage = loadMileage();

    if (nextChecked && !wasChecked) {
      const newTotal = (mileage.total || 0) + 1;
      const newLog = { type: 'todo_check', date: selectedDate, points: 1, item };
      saveMileage({ ...mileage, total: newTotal, logs: [...(mileage.logs || []), newLog] });
      updatedQuestData[selectedDate].points_earned = prevPointsEarned + 1;
    } else if (!nextChecked && wasChecked) {
      const newTotal = Math.max(0, (mileage.total || 0) - 1);
      const newLog = { type: 'todo_uncheck', date: selectedDate, points: -1, item };
      saveMileage({ ...mileage, total: newTotal, logs: [...(mileage.logs || []), newLog] });
      updatedQuestData[selectedDate].points_earned = Math.max(0, prevPointsEarned - 1);
    }

    saveQuestData(updatedQuestData);

    // weeklyPlans의 요일 상태를 UI 업데이트
    setWeeklyPlans(prev => prev.map(w => {
      if (w.week === week) {
        const updatedDays = w.days.map((d, dIdx) => {
          if (dIdx === selectedDayIndex) {
            let nextStatus = "unchecked";
            if (allChecked) nextStatus = "success";
            else if (anyChecked) nextStatus = "in-progress";
            return { ...d, status: nextStatus };
          }
          return d;
        });
        return { ...w, days: updatedDays };
      }
      return w;
    }));
  };

  // 4주 종합 요약 계산
  const totalSuccessCount = weeklyPlans ? weeklyPlans.reduce((acc, w) => {
    return acc + w.days.filter(d => d.status === "success").length;
  }, 0) : 0;

  const achievedWeeksCount = weeklyPlans ? weeklyPlans.filter(w => {
    return getWeeklyResult(w.days) === "달성";
  }).length : 0;

  // 현재 주차 및 계획 데이터 바인딩
  const currentWeekInfo = weeklyPlans ? weeklyPlans.find(w => w.week === currentWeek) : null;
  const targetPlan = (plan && plan.data) ? plan.data.find(p => p.week === currentWeek) : null;
  const todayTodoItems = targetPlan ? targetPlan.items : [];
  const weekColor = targetPlan ? targetPlan.color : "#3B82F6";

  // 오늘 실천 리스트 진행 상태
  const todoTotal = todayTodoItems.length;
  const todoChecked = todayTodoItems.filter(item => !!todoCheckedState[`todo-${currentWeek}-${item}`]).length;
  const todoStatus =
    todoTotal === 0     ? null :
    todoChecked === 0   ? { label: "시작 전", color: "#9CA3AF" } :
    todoChecked === todoTotal ? { label: "완료 ✅", color: "#16A34A" } :
                          { label: "진행 중 🔥", color: "#D97706" };



  return (
    <div style={S.screen}>
      <div style={{ ...S.scrollArea, paddingTop: 86 }}>
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ ...S.topBar, padding: "20px 16px 12px", borderBottom: "1px solid #F3F4F6" }}>
            <h2 style={{ fontWeight: 700, fontSize: 20, margin: "0 0 4px" }}>실천 플랜</h2>
            <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>오늘의 건강 실천 플랜을 달성해보세요</p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
            <div style={{ background: "#EFF6FF", borderRadius: 20, padding: "4px 10px",
              fontSize: 12, color: "#2563EB", fontWeight: 600 }}>
              ✨ AI 맞춤 추천
            </div>
            <span style={{ fontSize: 12, color: "#9CA3AF" }}>
              분석 결과 기반으로 생성됨
            </span>
          </div>



          {/* 4주 달성 요약 카드 */}
          {weeklyPlans && (
            <div style={{
              background: "#fff",
              borderRadius: 20,
              border: "1px solid #F3F4F6",
              padding: 16,
              marginBottom: 16,
              boxShadow: "0 6px 20px rgba(0, 0, 0, 0.04)"
            }}>
              <p style={{ fontWeight: 700, fontSize: 16, margin: "0 0 16px", color: "#111827" }}>4주 달성 요약</p>
              
              {/* 가로 선형 마일스톤 UI */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "38px 1fr 38px 1fr 38px 1fr 38px",
                alignItems: "start",
                margin: "12px 0 24px",
                position: "relative",
                padding: "0 8px"
              }}>
                {weeklyPlans.map((w, idx) => {
                  const res = getWeeklyResult(w.days);
                  let bg = "#F3F4F6";
                  let color = "#9CA3AF";
                  let border = "1px solid #E5E7EB";
                  
                  if (res === "달성") {
                    bg = "#D1FAE5";
                    color = "#065F46";
                    border = "1px solid #10B981";
                  } else if (res === "진행 중") {
                    bg = "#DBEAFE";
                    color = "#1E40AF";
                    border = "1px solid #3B82F6";
                  } else if (res === "미달성") {
                    bg = "#FEE2E2";
                    color = "#991B1B";
                    border = "1px solid #EF4444";
                  }

                  return (
                    <React.Fragment key={w.week}>
                      <div style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 6,
                        zIndex: 2,
                        position: "relative"
                      }}>
                        <div style={{
                          width: 38,
                          height: 38,
                          borderRadius: "50%",
                          background: bg,
                          color: color,
                          border: border,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 13,
                          fontWeight: 700,
                          boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
                        }}>
                          {w.week}주
                        </div>
                        {res !== "미시작" && (
                          <span style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: color,
                            whiteSpace: "nowrap"
                          }}>
                            {res}
                          </span>
                        )}
                      </div>
                      
                      {idx < weeklyPlans.length - 1 && (
                        <div style={{
                          width: "100%",
                          height: 2,
                          borderBottom: "2px dashed #E5E7EB",
                          transform: "translateY(19px)",
                          zIndex: 1
                        }} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* 전체 진행률 수치 및 안내 문구 */}
              <div style={{ borderTop: "1px dashed #E5E7EB", paddingTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                  <span style={{ color: "#4B5563" }}>전체 성공일</span>
                  <strong style={{ color: "#2563EB" }}>{totalSuccessCount} / 28일</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
                  <span style={{ color: "#4B5563" }}>달성한 주차</span>
                  <strong style={{ color: "#10B981" }}>{achievedWeeksCount} / 4주</strong>
                </div>
                <p style={{ fontSize: 11, color: "#9CA3AF", margin: "4px 0 0", lineHeight: 1.4 }}>
                  💡 5일 이상 성공하면 이번 주 목표 달성으로 기록돼요. 실패(쉬어감)한 날이 있어도 괜찮아요. 다시 이어가면 됩니다.
                </p>
              </div>
            </div>
          )}

          {/* 중앙: 오늘의 실천 카드 (Today Focus - 마일스톤 통합됨) */}
          {currentWeekInfo && (
            <div style={{
              background: "#fff",
              borderRadius: 20,
              border: `2px solid ${weekColor}`,
              padding: 18,
              marginBottom: 16,
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.05)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: weekColor }}>오늘의 실천 플랜</span>
                <span style={{ fontSize: 12, color: "#9CA3AF" }}>매일 자정 자동 갱신</span>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: "#111827", margin: 0 }}>
                  {currentWeek}주차 {getSelectedDayName(selectedDayIndex)} · {currentWeekInfo.title}
                </h3>
                {isCompleted && (
                  <span style={{ background: "#D1FAE5", color: "#065F46", fontSize: 11, fontWeight: 600, padding: "2px 6px", borderRadius: 6 }}>
                    완료 ✅
                  </span>
                )}
                {isLocked && (
                  <span style={{ background: "#F3F4F6", color: "#6B7280", fontSize: 11, fontWeight: 600, padding: "2px 6px", borderRadius: 6, display: "flex", alignItems: "center", gap: 3 }}>
                    🔒 잠금됨
                  </span>
                )}
              </div>

              {/* 주간 7일 마일스톤 통합 배치 */}
              <WeeklyMilestoneCard 
                week={currentWeekInfo.week}
                days={currentWeekInfo.days}
                planStartDate={planStartDate}
                selectedDayIndex={selectedDayIndex}
                onSelectDay={setSelectedDayIndex}
              />

              <div style={{ borderTop: "1px dashed #E5E7EB", margin: "16px 0" }} />

              {/* 세부 목표 체크박스 */}
              <div style={{ background: "#F9FAFB", borderRadius: 12, padding: 14, marginBottom: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#4B5563", margin: 0 }}>실천 리스트</p>
                  {todoStatus && (
                    <span style={{ fontSize: 12, fontWeight: 700, color: todoStatus.color }}>{todoStatus.label}</span>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {todayTodoItems.length > 0 ? (
                    todayTodoItems.map((item, idx) => {
                      const isChecked = questData[selectedDate]?.todos?.[idx]?.checked || false;
                      return (
                        <label key={idx} style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          gap: 10, 
                          cursor: isActive ? "pointer" : "not-allowed",
                          opacity: isLocked ? 0.6 : 1
                        }}>
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            disabled={!isActive}
                            onChange={() => handleTodoToggle(currentWeek, item, idx)}
                            style={{ 
                              width: 18, 
                              height: 18, 
                              cursor: isActive ? "pointer" : "not-allowed", 
                              accentColor: weekColor, 
                              flexShrink: 0 
                            }}
                          />
                          <span style={{
                            fontSize: 14,
                            color: isChecked ? "#9CA3AF" : (isLocked ? "#9CA3AF" : "#374151"),
                            textDecoration: isChecked ? "line-through" : "none",
                            transition: "all 0.1s",
                            display: "flex",
                            alignItems: "center",
                            gap: 4
                          }}>
                            {item}
                            {isLocked && <span style={{ fontSize: 12 }}>🔒</span>}
                          </span>
                        </label>
                      );
                    })
                  ) : (
                    <div style={{ textAlign: "center", padding: "10px 0", color: "#9CA3AF", fontSize: 13 }}>연결 안됨.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 변화 기록하기 */}
          <div style={{ ...S.card, background: "#F8F9FF", marginTop: 12 }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
              <span>📊</span><span style={{ fontWeight: 600, fontSize: 14 }}>변화를 확인해볼까요?</span>
            </div>
            <p style={{ fontSize: 12, color: "#6B7280", margin: "0 0 12px" }}>4주 플랜을 실천한 뒤 현재 상태를 업데이트하면 처음 분석 결과와 비교해 개선 정도를 확인할 수 있어요.</p>
            <button onClick={() => setScreen("reanalyze")} style={S.btn()}>▸ 변화 기록하기</button>
          </div>

          <button
            onClick={() => setShowConfirmModal(true)}
            style={{ ...S.btn("outline"), marginTop: 4, marginBottom: 10 }}
          >
            플랜 새로 생성하기
          </button>

          <button
            onClick={handleCancelPlan}
            style={{ ...S.btn("outline"), borderColor: "#EF4444", color: "#EF4444", marginTop: 4, marginBottom: 12 }}
          >
            플랜 취소하기
          </button>

        </div>
      </div>

      {/* 확인 모달 */}
      {showConfirmModal && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.4)", zIndex: 400,
          display: "flex", alignItems: "flex-end",
          justifyContent: "center"
        }}>
          <div style={{
            background: "#fff", borderRadius: "20px 20px 0 0",
            padding: 24, width: "100%", maxWidth: 390,
            boxSizing: "border-box", marginBottom: 56
          }}>
            <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
              기존 플랜이 있어요
            </p>
            <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 20 }}>
              기존 플랜을 유지할까요, 새로 생성할까요?<br />
              새로 생성하면 체크 기록이 초기화되고 기존 플랜 마일리지가 차감됩니다.
            </p>
            <button onClick={handleKeepPlan} style={{ ...S.btn("primary"), marginBottom: 10 }}>
              기존 플랜 유지하기
            </button>
            <button onClick={handleRecreatePlan} style={{ ...S.btn("outline") }}>
              새로 생성하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlanScreen;
