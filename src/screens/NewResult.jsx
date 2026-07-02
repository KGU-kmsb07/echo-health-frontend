import React, { useState } from "react";
import S from '../styles/shared';
import { ProgressBar } from '../components/Card';
import { useHealth } from '../context/HealthContext';

function NewResultScreen({ setScreen, back }) {
  const { 
    firstResult, 
    newResult, 
    plan, 
    risksUpdatedAt, 
    updatePlan,
  } = useHealth();

  const [showModal, setShowModal] = useState(false);
  const [modalStartY, setModalStartY] = useState(0);
  const [modalClosing, setModalClosing] = useState(false);

  const toRiskRatio = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    if (!Number.isFinite(number)) return null;
    if (number > 100) return 1;
    return Math.max(0, Math.min(1, number > 1 ? number / 100 : number));
  };

  const formatRiskPercent = (value, digits = 1) => {
    const ratio = toRiskRatio(value);
    return ratio === null ? "-" : `${(ratio * 100).toFixed(digits)}%`;
  };

  const handlePlanContinue = () => {
    if (plan) {
      const planGenTime = plan.generatedAt || 0;
      const risksTime = risksUpdatedAt || 0;
      if (planGenTime < risksTime) {
        setModalClosing(false);
        setShowModal(true);
        return;
      }
    }
    setScreen("plan");
  };

  const handleKeepPlan = () => {
    closeModal(() => setScreen("plan"));
  };

  const handleCreateNewPlan = () => {
    updatePlan(null);
    closeModal(() => setScreen("plan"));
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

  // 안전 가드: 최초 분석 또는 재분석 이력이 없을 경우 디폴트 맵 활용
  const prevUser = firstResult?.user || { vitality_score: 68, healthScore: 68, healthAge: 29, bmi: 24.1, waist: 85, bloodPressure: { systolic: 128, diastolic: 82 }, sleep: 6, exercise: "주 1~2회" };
  const prevRisks = firstResult?.risks || { diabetes: 0.31, hypertension: 0.25, metabolic: 0.10, obesity: 0 };
  
  const currUser = newResult?.user || prevUser;
  const currRisks = newResult?.risks || prevRisks;

  const scoreDiff = (currUser.vitality_score ?? currUser.healthScore) - (prevUser.vitality_score ?? prevUser.healthScore);
  const ageDiff = prevUser.healthAge - currUser.healthAge; // 젊어질수록 나이가 감소하므로 prev - curr

  const formatDelta = (label, prevVal, currVal) => {
    const diff = currVal - prevVal;
    if (label === "건강 점수") {
      if (diff > 0) return { text: `↗ +${diff}점`, color: "#10B981" };
      if (diff < 0) return { text: `↘ ${diff}점`, color: "#EF4444" };
      return { text: "유지", color: "#9CA3AF" };
    }
    if (label === "건강 나이") {
      const d = prevVal - currVal; // 젊어질수록 +
      if (d > 0) return { text: `↘ -${d}세`, color: "#10B981" };
      if (d < 0) return { text: `↗ +${Math.abs(d)}세`, color: "#EF4444" };
      return { text: "유지", color: "#9CA3AF" };
    }
    // 위험도 지표 (낮아질수록 양호)
    let prevPercent = prevVal;
    let currPercent = currVal;
    
    if (label === "당뇨 위험" || label === "고혈압 위험" || label === "대사증후군") {
      const prevRatio = toRiskRatio(prevVal);
      const currRatio = toRiskRatio(currVal);
      if (prevRatio === null || currRatio === null) return { text: "-", color: "#9CA3AF" };
      prevPercent = prevRatio * 100;
      currPercent = currRatio * 100;
    } else if (label === "비만 위험") {
      prevPercent = prevVal === 1 ? 75 : 10;
      currPercent = currVal === 1 ? 75 : 10;
    }
    
    const dPercent = currPercent - prevPercent;
    
    if (dPercent < 0) return { text: `↘ -${Math.abs(dPercent).toFixed(1)}%p`, color: "#10B981" };
    if (dPercent > 0) return { text: `↗ +${dPercent.toFixed(1)}%p`, color: "#EF4444" };
    return { text: "유지", color: "#9CA3AF" };
  };

  const getBmiInfo = (bmi) => {
    const val = Number(bmi);
    if (val >= 25) return { status: "비만", color: "#DC2626", pct: 100 };
    if (val >= 23) return { status: "과체중", color: "#F59E0B", pct: 66 };
    return { status: "정상", color: "#10B981", pct: 33 };
  };

  const getBpInfo = (bp) => {
    const sys = Number(bp?.systolic ?? 120);
    const dia = Number(bp?.diastolic ?? 80);
    if (sys >= 140 || dia >= 90) return { status: "고혈압", color: "#DC2626", pct: 100 };
    if (sys <= 120 && dia <= 80) return { status: "정상", color: "#10B981", pct: 33 };
    if (sys >= 121 || dia >= 81) return { status: "주의", color: "#F59E0B", pct: 66 };
    return { status: "정상", color: "#10B981", pct: 33 };
  };

  const getExerciseInfo = (exercise) => {
    if (exercise === "매일") return { status: "최상", color: "#10B981", pct: 100 };
    if (exercise === "주 5~6회" || exercise === "주 5회 이상" || exercise === "5일 이상") return { status: "양호", color: "#10B981", pct: 85 };
    if (exercise === "주 3~4회" || exercise === "주 3-4회" || exercise === "3~4일") return { status: "양호", color: "#10B981", pct: 75 };
    if (exercise === "주 1~2회" || exercise === "주 1-2회" || exercise === "1~2일") return { status: "보통", color: "#F59E0B", pct: 50 };
    if (exercise === "안함" || exercise === "0일") return { status: "낮음", color: "#EF4444", pct: 15 };
    return { status: "부족", color: "#DC2626", pct: 25 };
  };

  return (
    <div style={S.screen}>
      <div style={{ ...S.topBar, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0, borderBottom: "1px solid #F3F4F6" }}>
        <button onClick={back} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>←</button>
        <span style={{ fontWeight: 700, fontSize: 16 }}>새 분석 결과</span>
      </div>
      <div style={{ ...S.scrollArea, paddingTop: 57 }}>
        <div style={{ padding: 16 }}>
          <div style={{ background: "#F0FDF4", borderRadius: 10, padding: "10px 14px", marginBottom: 16, color: "#065F46", fontSize: 12 }}>
            ✅ 4주 실천 결과가 건강 수치에 반영됐어요! 🎉
          </div>
          <div style={S.card}>
            <p style={{ fontSize: 13, color: "#6B7280", margin: "0 0 6px" }}>업데이트된 건강 점수</p>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{ position: "relative", width: 70, height: 70 }}>
                <svg width="70" height="70" viewBox="0 0 70 70">
                  <circle cx="35" cy="35" r="28" fill="none" stroke="#E5E7EB" strokeWidth="7" />
                  <circle cx="35" cy="35" r="28" fill="none" stroke="#10B981" strokeWidth="7"
                    strokeDasharray={`${2 * Math.PI * 28 * ((currUser.vitality_score ?? currUser.healthScore) / 100)} ${2 * Math.PI * 28 * (1 - (currUser.vitality_score ?? currUser.healthScore) / 100)}`}
                    strokeLinecap="round" transform="rotate(-90 35 35)" />
                </svg>
                <span style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontWeight: 700, fontSize: 14 }}>{currUser.vitality_score ?? currUser.healthScore}</span>
              </div>
              <div>
                <div style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
                  <span style={{ fontSize: 36, fontWeight: 800, color: "#10B981" }}>{currUser.vitality_score ?? currUser.healthScore}</span>
                  <span style={{ color: "#9CA3AF" }}>/100</span>
                </div>
                <p style={{ fontSize: 12, color: "#10B981", margin: "2px 0" }}>
                  {scoreDiff > 0 ? `📈 이전 대비 +${scoreDiff}점 향상` : scoreDiff < 0 ? `📉 이전 대비 ${scoreDiff}점 하락` : " 이전 대비 변동 없음"}
                </p>
                <p style={{ fontSize: 12, color: "#374151", margin: 0 }}>
                  건강나이 {currUser.healthAge}세 {ageDiff > 0 ? `↓ ${ageDiff}세 단축` : ageDiff < 0 ? `↑ ${Math.abs(ageDiff)}세 증가` : "유지"}
                </p>
              </div>
            </div>
          </div>
          <div style={S.card}>
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              <span>✨</span><span style={{ fontWeight: 600 }}>이전 분석 대비 변화</span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
                  {["지표", "이전", "현재", "변화"].map(h => <th key={h} style={{ padding: "6px 4px", color: "#9CA3AF", fontWeight: 500, textAlign: h === "지표" ? "left" : "center" }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "건강 점수", prev: `${prevUser.vitality_score ?? prevUser.healthScore}점`, curr: `${currUser.vitality_score ?? currUser.healthScore}점`, valPrev: prevUser.vitality_score ?? prevUser.healthScore, valCurr: currUser.vitality_score ?? currUser.healthScore },
                  { label: "건강 나이", prev: `${prevUser.healthAge}세`, curr: `${currUser.healthAge}세`, valPrev: prevUser.healthAge, valCurr: currUser.healthAge },
                  { label: "당뇨 위험", prev: formatRiskPercent(prevRisks.diabetes), curr: formatRiskPercent(currRisks.diabetes), valPrev: prevRisks.diabetes, valCurr: currRisks.diabetes },
                  { label: "고혈압 위험", prev: formatRiskPercent(prevRisks.hypertension), curr: formatRiskPercent(currRisks.hypertension), valPrev: prevRisks.hypertension, valCurr: currRisks.hypertension },
                  { label: "대사증후군", prev: formatRiskPercent(prevRisks.metabolic, 0), curr: formatRiskPercent(currRisks.metabolic, 0), valPrev: prevRisks.metabolic, valCurr: currRisks.metabolic },
                  { label: "비만 위험", prev: `${prevRisks.obesity === 1 ? 75 : 10}%`, curr: `${currRisks.obesity === 1 ? 75 : 10}%`, valPrev: prevRisks.obesity, valCurr: currRisks.obesity },
                ].map(r => {
                  const deltaInfo = formatDelta(r.label, r.valPrev, r.valCurr);
                  return (
                    <tr key={r.label} style={{ borderBottom: "1px solid #F9FAFB" }}>
                      <td style={{ padding: "7px 4px" }}>{r.label}</td>
                      <td style={{ padding: "7px 4px", textAlign: "center", color: "#6B7280" }}>{r.prev}</td>
                      <td style={{ padding: "7px 4px", textAlign: "center", color: "#2563EB", fontWeight: 700 }}>{r.curr}</td>
                      <td style={{ padding: "7px 4px", textAlign: "center", color: deltaInfo.color, fontWeight: 600, fontSize: 12 }}>{deltaInfo.text}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 12, color: "#6B7280", margin: "0 0 8px", fontWeight: 500 }}>업데이트된 건강 지표</p>
          {[
            { label: "BMI", val: `${currUser.bmi}`, ...getBmiInfo(currUser.bmi) },
            { label: "혈압", val: `${currUser.bloodPressure.systolic}/${currUser.bloodPressure.diastolic}mmHg`, ...getBpInfo(currUser.bloodPressure) },
            { label: "운동", val: currUser.exercise, ...getExerciseInfo(currUser.exercise) },
          ].map(item => (
            <div key={item.label} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13 }}>
                <span>{item.label}</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{ fontWeight: 600 }}>{item.val}</span>
                  <span style={{ ...S.tag(item.color + "20", item.color), fontSize: 11 }}>{item.status}</span>
                </div>
              </div>
              <ProgressBar pct={item.pct} color={item.color} />
            </div>
          ))}
          <div style={{ ...S.card, background: "#F0FDF4", marginTop: 12 }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              <span>✨</span><span style={{ fontWeight: 600, color: "#065F46" }}>AI 개선 요약</span>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0, color: "#374151" }}>
              4주 실천으로 혈당·혈압·체중이 모두 개선됐습니다. 특히 공복혈당이 정상 범위에 진입했고, 운동 빈도 증가로 대사증후군 위험이 크게 낮아졌어요. 이 추세를 유지하면 추가 8주 후 당뇨 위험이 정상 범주에 도달할 수 있습니다.
            </p>
          </div>
          <button onClick={handlePlanContinue} style={{ ...S.btn(), marginTop: 12, marginBottom: 72 }}>플랜 계속하기</button>
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

export default NewResultScreen;
