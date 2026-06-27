import React, { useState } from "react";
import S from '../styles/shared';
import { useHealth } from '../context/HealthContext';

function riskLevel(value) {
  if (value === null || value === undefined) return { label: "연결 안됨.", color: "#6B7280", dot: "⚪" };
  if (value >= 60) return { label: "위험군", color: "#DC2626", dot: "🔴" };
  if (value >= 35) return { label: "주의",   color: "#D97706", dot: "🟡" };
  return                  { label: "정상",   color: "#16A34A", dot: "🟢" };
}

function calcFutureRisk(risks, user) {
  if (!user || user.age === null || user.age === undefined) return { diabetes: null, hypertension: null, metabolic: null, obesity: null };
  const factor = 1 + (0.05 * (1 + (user.age - 20) / 100));
  return {
    diabetes:     risks?.diabetes !== null && risks?.diabetes !== undefined ? Math.min(99, Math.round(risks.diabetes * factor * 1.4)) : null,
    hypertension: risks?.hypertension !== null && risks?.hypertension !== undefined ? Math.min(99, Math.round(risks.hypertension * factor * 1.3)) : null,
    metabolic:    risks?.metabolic !== null && risks?.metabolic !== undefined ? Math.min(99, Math.round(risks.metabolic * factor * 1.35)) : null,
    obesity:      risks?.obesity !== null && risks?.obesity !== undefined ? Math.min(99, Math.round(risks.obesity * factor * 1.2)) : null,
  };
}

function ImprovedScreen({ setScreen, setTab, back }) {
  const { 
    user, 
    risks, 
    simulationResult, 
    originalUser,
    plan,
    updatePlan,
    resetPlan,
    setPlanGenerated
  } = useHealth();

  const [showModal, setShowModal] = useState(false);

  const handleCreatePlanClick = () => {
    if (plan) {
      setShowModal(true);
      return;
    }
    setTab("plan");
    setScreen("plan");
  };

  const handleKeepPlan = () => {
    setShowModal(false);
    setTab("plan");
    setScreen("plan");
  };

  const handleRecreatePlan = () => {
    setShowModal(false);
    resetPlan();
    updatePlan(null);
    setPlanGenerated(false);
    setTab("plan");
    setScreen("plan");
  };
  
  if (!user) {
    return <div style={{ padding: 20, textAlign: "center" }}>로딩 중...</div>;
  }

  const oUser = originalUser || user;

  // 현재 유지 시 건강나이
  const currentHealthAge = user.healthAge ?? (user.age !== null && user.age !== undefined ? user.age + 5 : null);
  const keepAge = currentHealthAge;

  // 행동 변화 후 건강나이
  let impAge = null;
  if (user.age !== null && user.age !== undefined) {
    if (simulationResult &&
        simulationResult.diabetes !== null && simulationResult.diabetes !== undefined &&
        simulationResult.hypertension !== null && simulationResult.hypertension !== undefined) {
      const rawAge = user.age + Math.round(
        (simulationResult.diabetes + simulationResult.hypertension) / 20 - 3
      );
      impAge = Math.max(user.age, rawAge);
    } else {
      impAge = user.age + 2;
    }
    // 두 나이가 같거나 impAge가 keepAge 이상이면 1 감소
    if (keepAge !== null && impAge >= keepAge) {
      impAge = keepAge - 1;
    }
  }

  const targetRisks = simulationResult || risks;
  const futBefore = calcFutureRisk(risks, oUser);
  const futAfter = calcFutureRisk(targetRisks, user);

  const items = [
    { label: "당뇨",     now: futBefore.diabetes,     then: futAfter.diabetes },
    { label: "고혈압",   now: futBefore.hypertension, then: futAfter.hypertension },
    { label: "대사증후군", now: futBefore.metabolic,  then: futAfter.metabolic },
    { label: "비만",     now: futBefore.obesity,      then: futAfter.obesity },
  ];

  // 시뮬레이션 요약 텍스트 동적 생성
  const summaryItems = [];
  if (user.weight < oUser.weight)
    summaryItems.push(`체중 ${oUser.weight}kg → ${user.weight}kg 감량 목표`);
  if (user.smoking === "비흡연" && oUser.smoking !== "비흡연")
    summaryItems.push("흡연 → 금연으로 전환");
  if (user.exercise !== oUser.exercise)
    summaryItems.push(`운동빈도 ${oUser.exercise} → ${user.exercise} 증가`);
  if (user.drinking !== oUser.drinking)
    summaryItems.push(`음주 ${oUser.drinking} → ${user.drinking} 감소`);
  if (summaryItems.length === 0)
    summaryItems.push("현재 생활습관 유지 시 예측 결과입니다");

  return (
    <div style={S.screen}>
      <div style={{ background: "#fff", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={back} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>←</button>
        <span style={{ fontWeight: 700, fontSize: 16 }}>개선된 미래 나</span>
      </div>
      <div style={S.scrollArea}>
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
                <p style={{ color: "#EF4444", fontWeight: 600, fontSize: 13 }}>건강나이 {keepAge !== null ? `${keepAge}세` : "연결 안됨."}</p>
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
                <p style={{ color: "#2563EB", fontWeight: 600, fontSize: 13 }}>건강나이 {impAge !== null ? `${impAge}세` : "연결 안됨."}</p>
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
                      <span style={{ fontSize: 16 }}>{nowLevel.dot}</span>{" "}
                      <span style={{ fontSize: 12, color: nowLevel.color }}>{nowLevel.label}</span>
                    </div>
                    {/* [화살표] */}
                    <div style={{ fontSize: 12, color: "#9CA3AF", margin: "0 8px" }}>→</div>
                    {/* [개선 후 col] */}
                    <div style={{ width: 80, textAlign: "center" }}>
                      <div>
                        <span style={{ fontSize: 16 }}>{thenLevel.dot}</span>{" "}
                        <span style={{ fontSize: 13, fontWeight: 700, color: thenLevel.color }}>{thenLevel.label}</span>
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
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.4)", zIndex: 200,
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
              이전에 생성한 플랜을 유지할까요?<br />
              새로 생성하면 체크 기록이 초기화됩니다.
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

export default ImprovedScreen;
