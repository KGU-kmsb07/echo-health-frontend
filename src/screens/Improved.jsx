import React, { useState } from "react";
import S from '../styles/shared';
import { useHealth } from '../context/HealthContext';
import { loadUserProfile } from "../storage/localStore";

function riskLevel(value) {
  if (value === null || value === undefined) return { label: "연결 안됨.", color: "#6B7280", dot: "⚪" };
  if (value >= 60) return { label: "위험군", color: "#DC2626", dot: "🔴" };
  if (value >= 35) return { label: "주의",   color: "#D97706", dot: "🟡" };
  return                  { label: "정상",   color: "#16A34A", dot: "🟢" };
}

function toPercent(value) {
  if (value === null || value === undefined) return null;
  const number = Number(value);
  if (Number.isNaN(number)) return null;
  return number <= 1 ? number * 100 : number;
}

const DISEASE_ITEMS = [
  { key: "hypertension", label: "고혈압" },
  { key: "stroke", label: "뇌졸중" },
  { key: "diabetes", label: "당뇨" },
  { key: "heart_disease", label: "심장질환" },
  { key: "cancer", label: "암" }
];

function getRiskPercent(source, key) {
  const value = source?.[key] ?? source?.risks?.[key]?.probability ?? null;
  const percent = toPercent(value);
  return percent === null ? null : Math.round(percent);
}

function ImprovedScreen({ setScreen, setTab, back }) {
  const { 
    user, 
    risks, 
    simulationResult, 
    originalUser,
    plan,
    updatePlan,
  } = useHealth();

  const [showModal, setShowModal] = useState(false);
  const [modalStartY, setModalStartY] = useState(0);
  const [modalClosing, setModalClosing] = useState(false);

  const handleCreatePlanClick = () => {
    if (plan) {
      setModalClosing(false);
      setShowModal(true);
      return;
    }
    setTab("plan");
    setScreen("plan");
  };

  const handleKeepPlan = () => {
    closeModal(() => {
      setTab("plan");
      setScreen("plan");
    });
  };

  const handleCreateNewPlan = () => {
    updatePlan(null);
    closeModal(() => {
      setTab("plan");
      setScreen("plan");
    });
  };

  const closeModal = (afterClose) => {
    setModalStartY(0);
    setModalClosing(true);
    setTimeout(() => {
      setShowModal(false);
      setModalClosing(false);
      if (afterClose) afterClose();
    }, 220);
  };

  const handleModalDragStart = (clientY) => setModalStartY(clientY);

  const handleModalDragEnd = (clientY) => {
    if (modalStartY > 0 && clientY - modalStartY > 80) {
      closeModal();
      return;
    }
    setModalStartY(0);
  };

  if (!user) {
    return <div style={{ padding: 20, textAlign: "center" }}>로딩 중...</div>;
  }

  const oUser = loadUserProfile() || originalUser || user;
  const simInputs = simulationResult?.simulatedInputs || {};

  const originalScore = risks?.vitality_score ?? risks?.healthScore ?? null;
  const simScore = simulationResult?.vitality_score ?? originalScore;
  const scoreDiff = originalScore !== null && simScore !== null ? Math.round(simScore - originalScore) : null;

  const targetRisksForCalc = simulationResult ?? risks;
  const items = DISEASE_ITEMS.map(({ key, label }) => ({
    label,
    now: getRiskPercent(risks, key),
    then: getRiskPercent(targetRisksForCalc, key)
  }));

  // 시뮬레이션 요약 텍스트 동적 생성 (스냅샷 비교)
  const summaryItems = [];
  const simWeight = simInputs.weight !== undefined ? simInputs.weight : oUser.weight;
  const simSmoking = simInputs.smoking !== undefined ? simInputs.smoking : oUser.smoking;
  const simExercise = simInputs.exercise !== undefined ? simInputs.exercise : oUser.exercise;
  const simDrinking = simInputs.drinking !== undefined ? simInputs.drinking : oUser.drinking;

  if (simWeight < oUser.weight)
    summaryItems.push(`체중 ${oUser.weight}kg → ${simWeight}kg 감량 목표`);
  if (simSmoking === "비흡연" && oUser.smoking !== "비흡연")
    summaryItems.push("흡연 → 금연으로 전환");
  if (simExercise !== oUser.exercise)
    summaryItems.push(`운동빈도 ${oUser.exercise} → ${simExercise} 증가`);
  if (simDrinking !== oUser.drinking)
    summaryItems.push(`음주 ${oUser.drinking} → ${simDrinking} 감소`);
  if (summaryItems.length === 0)
    summaryItems.push("현재 생활습관 유지 시 예측 결과입니다");

  return (
    <div style={S.screen}>
      <div style={S.headerBar}>
        <button onClick={back} style={S.backButton}>←</button>
        <span style={S.headerTitle}>개선된 미래 나</span>
        <span style={S.headerSpacer} />
      </div>
      <div style={{ ...S.scrollArea, paddingTop: 57 }}>
        <div style={{ padding: 16 }}>
          <div style={{ ...S.card }}>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 16 }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 6 }}>현재 유지 시</p>
                <div style={{ width: 80, height: 100, background: "#FEE2E2", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 4px" }}>
                  <svg width="60" height="80" viewBox="0 0 60 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="30" cy="14" r="10" fill="#FCA5A5"/>
                    <ellipse cx="30" cy="42" rx="20" ry="18" fill="#FCA5A5"/>
                    <rect x="10" y="28" width="11" height="22" rx="5" fill="#FCA5A5"/>
                    <rect x="39" y="28" width="11" height="22" rx="5" fill="#FCA5A5"/>
                    <rect x="16" y="56" width="11" height="20" rx="5" fill="#FCA5A5"/>
                    <rect x="33" y="56" width="11" height="20" rx="5" fill="#FCA5A5"/>
                  </svg>
                </div>
                <p style={{ color: "#EF4444", fontWeight: 600, fontSize: 13 }}>활력 지수 {originalScore !== null ? `${originalScore}점` : "연결 안됨."}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", flexDirection: "column", justifyContent: "center", color: "#10B981", fontSize: 12, lineHeight: "1.4" }}>
                <span>→</span><span>개선 후</span>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 6 }}>행동 변화 후</p>
                <div style={{ width: 80, height: 100, background: "#DBEAFE", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 4px" }}>
                  <svg width="60" height="80" viewBox="0 0 60 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="30" cy="14" r="10" fill="#93C5FD"/>
                    <rect x="18" y="26" width="24" height="30" rx="8" fill="#93C5FD"/>
                    <rect x="10" y="28" width="10" height="22" rx="5" fill="#93C5FD"/>
                    <rect x="40" y="28" width="10" height="22" rx="5" fill="#93C5FD"/>
                    <rect x="17" y="53" width="10" height="22" rx="5" fill="#93C5FD"/>
                    <rect x="33" y="53" width="10" height="22" rx="5" fill="#93C5FD"/>
                  </svg>
                </div>
                <p style={{ color: "#2563EB", fontWeight: 600, fontSize: 13 }}>활력 지수 {simScore !== null ? `${simScore}점` : "연결 안됨."}</p>
                {scoreDiff !== null && (
                  <p style={{ color: scoreDiff >= 0 ? "#16A34A" : "#DC2626", fontWeight: 700, fontSize: 11, marginTop: 2 }}>
                    {scoreDiff > 0 ? `+${scoreDiff}점` : scoreDiff < 0 ? `${scoreDiff}점` : "변동 없음"}
                  </p>
                )}
              </div>
            </div>
            
            {/* 리스트 컨테이너 */}
            <div style={{ border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
              {items.map((item, index) => {
                const nowLevel = riskLevel(item.now);
                const thenLevel = riskLevel(item.then);
                const diff = (item.then !== null && item.then !== undefined && item.now !== null && item.now !== undefined) ? item.then - item.now : null;
                let deltaText = "";
                let deltaColor = "#9CA3AF";
                if (diff === null) {
                  deltaText = "연결 안됨.";
                  deltaColor = "#9CA3AF";
                } else if (diff < 0) {
                  deltaText = `▼${Math.abs(diff)}%p`;
                  deltaColor = "#16A34A";
                } else if (diff > 0) {
                  deltaText = `▲${diff}%p`;
                  deltaColor = "#DC2626";
                } else {
                  deltaText = "-";
                  deltaColor = "#9CA3AF";
                }
                return (
                  <div 
                    key={item.label} 
                    style={{
                      display: "flex", 
                      alignItems: "center", 
                      padding: "14px 16px",
                      borderBottom: index === items.length - 1 ? "none" : "1px solid #F3F4F6",
                      background: "#fff"
                    }}
                  >
                    {/* [질환명 col] */}
                    <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "#111" }}>
                      {item.label}
                    </div>
                    {/* [유지 시 col] */}
                    <div style={{ width: 80, textAlign: "center" }}>
                      <div>
                        <span style={{ fontSize: 16 }}>{nowLevel.dot}</span>{" "}
                        <span style={{ fontSize: 12, color: nowLevel.color }}>{nowLevel.label}</span>
                      </div>
                      <div style={{ fontSize: 10, color: "#6B7280", marginTop: 2, fontWeight: 600 }}>
                        {item.now !== null && item.now !== undefined ? `${item.now}%` : "-"}
                      </div>
                    </div>
                    {/* [화살표] */}
                    <div style={{ fontSize: 12, color: "#9CA3AF", margin: "0 8px" }}>→</div>
                    {/* [개선 후 col] */}
                    <div style={{ width: 80, textAlign: "center" }}>
                      <div>
                        <span style={{ fontSize: 16 }}>{thenLevel.dot}</span>{" "}
                        <span style={{ fontSize: 13, fontWeight: 700, color: thenLevel.color }}>{thenLevel.label}</span>
                      </div>
                      <div style={{ fontSize: 10, color: "#6B7280", marginTop: 2, fontWeight: 600 }}>
                        {item.then !== null && item.then !== undefined ? `${item.then}%` : "-"}
                      </div>
                      <div style={{ fontSize: 10, color: deltaColor, marginTop: 2, fontWeight: 600 }}>{deltaText}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div style={{ border: "2px solid #10B981", borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8 }}>
              <span>✅</span><span style={{ fontWeight: 600, color: "#065F46" }}>시뮬레이션 요약</span>
            </div>
            {summaryItems.map(t => (
              <p key={t} style={{ fontSize: 13, color: "#065F46", margin: "3px 0", display: "flex", gap: 6 }}><span>✓</span>{t}</p>
            ))}
          </div>
          <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 12, textAlign: "center" }}>모델 기반 비교 시나리오 — 확정 예측이 아닙니다.</p>
          <button onClick={handleCreatePlanClick} style={{ ...S.btn(), display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <span>✨</span> 4주 실천 플랜 생성하기
          </button>
          <p style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center", marginTop: 6 }}>분석 결과를 바탕으로 맞춤 플랜을 생성합니다</p>
        </div>
      </div>

      {/* 확인 모달 */}
      {showModal && (
        <div onClick={closeModal} style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.4)", zIndex: 400,
          display: "flex", alignItems: "flex-end",
          justifyContent: "center"
        }}>
          <div
            className={`bottom-sheet${modalClosing ? " closing" : ""}`}
            onClick={(event) => event.stopPropagation()}
            onTouchStart={(event) => handleModalDragStart(event.touches[0].clientY)}
            onTouchEnd={(event) => handleModalDragEnd(event.changedTouches[0].clientY)}
            onTouchCancel={() => setModalStartY(0)}
            onMouseDown={(event) => handleModalDragStart(event.clientY)}
            onMouseUp={(event) => handleModalDragEnd(event.clientY)}
            onDragStart={(event) => event.preventDefault()}
            style={{
            position: "fixed", bottom: 0, left: 0, right: 0, margin: "0 auto",
            background: "#fff", borderRadius: "20px 20px 0 0",
            padding: "24px 24px 80px", width: "100%", maxWidth: 390,
            boxSizing: "border-box", zIndex: 500
          }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "#E5E7EB", margin: "0 auto 16px" }} />
            <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
              기존 플랜이 있어요
            </p>
            <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 20 }}>
              이전에 생성한 플랜을 유지합니다.
            </p>
            <button onClick={handleKeepPlan} style={{ ...S.btn("primary") }}>
              기존 플랜 유지하기
            </button>
            <button onClick={handleCreateNewPlan} style={{ ...S.btn("outline"), marginTop: 8 }}>
              새 플랜으로 다시 만들기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImprovedScreen;
