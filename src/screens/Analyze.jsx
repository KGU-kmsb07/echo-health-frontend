import S from "../styles/shared";
import { ProgressBar } from "../components/Card";
import { useHealth } from "../context/HealthContext";
import { useState } from "react";

const DISEASES = [
  { key: "hypertension", label: "고혈압" },
  { key: "diabetes", label: "당뇨" },
  { key: "stroke", label: "뇌졸중" },
  { key: "heart_disease", label: "심장질환" },
  { key: "cancer", label: "암" }
];

function toPercent(value) {
  if (value === null || value === undefined) return null;
  const number = Number(value);
  if (Number.isNaN(number)) return null;
  return number <= 1 ? number * 100 : number;
}

function riskInfo(percent) {
  if (percent === null) return { label: "미측정", color: "#9CA3AF", bg: "#F3F4F6" };
  if (percent >= 60) return { label: "위험", color: "#DC2626", bg: "#FEE2E2" };
  if (percent >= 35) return { label: "주의", color: "#D97706", bg: "#FEF3C7" };
  return { label: "낮음", color: "#16A34A", bg: "#D1FAE5" };
}

function getDiseaseValue(risks, key) {
  const nested = risks?.risks?.[key]?.probability;
  if (nested !== undefined && nested !== null) return nested;
  return risks?.[key] ?? null;
}

function AnalyzeScreen({ setScreen, back }) {
  const { user, risks, navigateWithLoading, setUserProfile } = useHealth();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [checkupEntryMode, setCheckupEntryMode] = useState("");
  const [uploadStartY, setUploadStartY] = useState(0);
  const [checkupTouched, setCheckupTouched] = useState(false);
  const [checkupForm, setCheckupForm] = useState({
    systolic_bp: "",
    diastolic_bp: "",
    fasting_glucose: "",
    hba1c: "",
    total_cholesterol: "",
    hdl_cholesterol: "",
    triglyceride: "",
    ldl_direct: ""
  });

  const handleGoToFuture = () => {
    navigateWithLoading(setScreen, "future", 800, "분석 중...");
  };

  if (!user) {
    return <div style={{ padding: 20, textAlign: "center" }}>로딩 중...</div>;
  }

  const featureSet = risks?.feature_set_used || (risks?.input_mode === "checkup" ? "건강검진연동형" : "간편입력형");
  const bmi = user.bmi ?? risks?.bmi ?? null;
  const weightManagement = risks?.weight_management;
  const weightPercent = weightManagement?.percent ?? (risks?.obesity ? 75 : 10);
  const heartNotice = risks?.cardiovascular_notice || risks?.risks?.heart_disease?.notice;
  const weightLevelLabels = {
    underweight: "저체중",
    normal: "정상",
    overweight: "과체중",
    obesity: "비만"
  };
  const weightLevel = weightLevelLabels[weightManagement?.level] || weightManagement?.level || (risks?.obesity ? "관리 필요" : "낮음");

  const updateCheckupField = (key, value) => {
    setCheckupForm(prev => ({ ...prev, [key]: value }));
  };

  const checkupFields = [
    ["systolic_bp", "수축기혈압"],
    ["diastolic_bp", "이완기혈압"],
    ["fasting_glucose", "공복혈당"],
    ["hba1c", "당화혈색소"],
    ["total_cholesterol", "총콜레스테롤"],
    ["hdl_cholesterol", "HDL"],
    ["triglyceride", "중성지방"],
    ["ldl_direct", "LDL"]
  ];

  const applyManualCheckup = () => {
    setCheckupTouched(true);
    const hasEmpty = checkupFields.some(([key]) => checkupForm[key] === "");
    if (hasEmpty) return;

    const healthCheckup = Object.fromEntries(
      Object.entries(checkupForm)
        .filter(([, value]) => value !== "")
        .map(([key, value]) => [key, Number(value)])
    );
    setUserProfile({
      ...user,
      healthCheckup,
      checkupUpdatedAt: new Date().toISOString()
    });
    closeUploadModal();
  };

  const openUploadModal = () => {
    setCheckupEntryMode("");
    setCheckupTouched(false);
    setShowUploadModal(true);
  };

  const closeUploadModal = () => {
    setUploadStartY(0);
    setShowUploadModal(false);
  };

  const handleUploadDragStart = (clientY) => setUploadStartY(clientY);

  const handleUploadDragEnd = (clientY) => {
    if (uploadStartY > 0 && clientY - uploadStartY > 80) {
      closeUploadModal();
      return;
    }
    setUploadStartY(0);
  };

  return (
    <div style={S.screen}>
      <div style={S.headerBar}>
        <button onClick={back} style={S.backButton}>←</button>
        <span style={S.headerTitle}>현재 건강 분석</span>
        <span style={S.headerSpacer} />
      </div>

      <div style={{ ...S.scrollArea, paddingTop: 57 }}>
        <div style={{ padding: 16 }}>
          <div style={{ background: "#EFF6FF", borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: "#1D4ED8", margin: 0 }}>
              국민건강영양조사 2024 기반 {featureSet} 모델로 분석했습니다.
            </p>
            <p style={{ fontSize: 11, color: "#6B7280", margin: "6px 0 0", lineHeight: 1.5 }}>
              이 결과는 의료 진단이 아니라 건강관리 우선순위를 돕기 위한 통계적 위험 신호입니다.
            </p>
          </div>

          <div style={{ ...S.card, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>사용 모델</span>
              <span style={S.tag("#E0E7FF", "#3730A3")}>{featureSet}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12, color: "#4B5563" }}>
              <span>BMI {bmi ? Number(bmi).toFixed(1) : "-"}</span>
              <span>건강나이 {user.healthAge ?? risks?.healthAge ?? "-"}세</span>
              <span>활력지수 {user.vitality_score ?? risks?.vitality_score ?? "-"}점</span>
              <span>체중관리 {weightLevel}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={openUploadModal}
            style={{ ...S.btn("outline"), marginBottom: 12, background: "#fff" }}
          >
            건강검진 자료 있어요!
          </button>

          <div style={{ ...S.card, marginBottom: 12 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: "0 0 12px" }}>질병 위험도</p>
            {DISEASES.map(({ key, label }) => {
              const percent = toPercent(getDiseaseValue(risks, key));
              const info = riskInfo(percent);
              const modelMeta = risks?.risks?.[key];
              return (
                <div key={key} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", marginBottom: 6 }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{label}</span>
                      {modelMeta?.model && <span style={{ marginLeft: 6, fontSize: 10, color: "#9CA3AF" }}>{modelMeta.model}</span>}
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={S.tag(info.bg, info.color)}>{info.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: info.color }}>
                        {percent === null ? "-" : `${Math.round(percent)}%`}
                      </span>
                    </div>
                  </div>
                  <ProgressBar pct={percent ?? 0} color={info.color} />
                  {modelMeta?.metrics && (
                    <p style={{ fontSize: 10, color: "#9CA3AF", margin: "4px 0 0" }}>
                      F1 {modelMeta.metrics.f1} · ROC-AUC {modelMeta.metrics.roc_auc} · threshold {modelMeta.threshold}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ ...S.card, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>체중관리군</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: weightPercent >= 50 ? "#D97706" : "#16A34A" }}>{Math.round(weightPercent)}%</span>
            </div>
            <ProgressBar pct={weightPercent} color={weightPercent >= 50 ? "#D97706" : "#16A34A"} />
            <p style={{ fontSize: 11, color: "#6B7280", margin: "6px 0 0", lineHeight: 1.5 }}>
              체중관리군은 머신러닝 성능 비교에서 제외하고 BMI 23 이상 기준의 rule-based 판정으로 표시합니다.
            </p>
          </div>

          {heartNotice && (
            <div style={{ background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: 12, padding: 14, marginBottom: 12 }}>
              <p style={{ fontSize: 12, color: "#92400E", fontWeight: 700, margin: "0 0 4px" }}>심혈관질환 해석 주의</p>
              <p style={{ fontSize: 11, color: "#92400E", margin: 0, lineHeight: 1.5 }}>{heartNotice}</p>
            </div>
          )}

          <button onClick={handleGoToFuture} style={{ ...S.btn(), marginTop: 4 }}>미래 변화 보기 &gt;</button>
        </div>
      </div>
      {showUploadModal && (
        <div
          onClick={closeUploadModal}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 400, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
        >
          <div
            className="bottom-sheet"
            onClick={(event) => event.stopPropagation()}
            onTouchStart={(event) => handleUploadDragStart(event.touches[0].clientY)}
            onTouchEnd={(event) => handleUploadDragEnd(event.changedTouches[0].clientY)}
            onTouchCancel={() => setUploadStartY(0)}
            onMouseDown={(event) => handleUploadDragStart(event.clientY)}
            onMouseUp={(event) => handleUploadDragEnd(event.clientY)}
            onDragStart={(event) => event.preventDefault()}
            style={{ position: "fixed", bottom: 0, left: 0, right: 0, margin: "0 auto", width: "100%", maxWidth: 390, background: "#fff", borderRadius: "18px 18px 0 0", padding: "20px 20px 104px", maxHeight: "90vh", overflowY: "auto", boxSizing: "border-box", zIndex: 500 }}
          >
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "#E5E7EB", margin: "0 auto 16px" }} />
            <p style={{ fontWeight: 800, fontSize: 16, margin: "0 0 12px" }}>건강검진 자료 있어요!</p>
            <label style={{ ...S.btn("outline"), marginBottom: 8, display: "block", textAlign: "center", boxSizing: "border-box" }}>
              OCR(카메라 촬영)
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={() => alert("정보가 나오지 않습니다. 다른 방법으로 다시 시도해주세요.")}
                style={{ display: "none" }}
              />
            </label>
            <label style={{ ...S.btn("outline"), marginBottom: 8, display: "block", textAlign: "center", boxSizing: "border-box" }}>
              PDF(내 파일 선택)
              <input
                type="file"
                accept="application/pdf"
                onChange={() => alert("정보가 나오지 않습니다. 다른 방법으로 다시 시도해주세요.")}
                style={{ display: "none" }}
              />
            </label>
            <button type="button" onClick={() => setCheckupEntryMode("manual")} style={{ ...S.btn("outline"), marginBottom: 12 }}>
              수동입력
            </button>
            {checkupEntryMode === "manual" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, margin: "8px 0 12px" }}>
                  {[
                    ...checkupFields
                  ].map(([key, label]) => {
                    const isEmpty = checkupTouched && checkupForm[key] === "";
                    return (
                      <input
                        key={key}
                        value={checkupForm[key]}
                        onChange={(event) => updateCheckupField(key, event.target.value)}
                        placeholder={label}
                        type="number"
                        step="0.1"
                        aria-invalid={isEmpty}
                        style={{ border: `1px solid ${isEmpty ? "#EF4444" : "#E5E7EB"}`, borderRadius: 8, padding: "10px 8px", fontSize: 12, minWidth: 0, background: isEmpty ? "#FEF2F2" : "#fff" }}
                      />
                    )
                  })}
                </div>
                {checkupTouched && checkupFields.some(([key]) => checkupForm[key] === "") && (
                  <p style={{ fontSize: 12, color: "#DC2626", margin: "0 0 10px" }}>
                    공란은 안됩니다. 모든 항목을 입력해주세요.
                  </p>
                )}
                <button type="button" onClick={applyManualCheckup} style={{ ...S.btn("primary"), marginBottom: 8 }}>수동 입력값 저장</button>
              </>
            )}
            <button type="button" onClick={closeUploadModal} style={{ ...S.btn("outline"), marginTop: 4 }}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnalyzeScreen;
