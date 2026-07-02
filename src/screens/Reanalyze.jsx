import { useState } from "react";
import S from "../styles/shared";
import { useHealth } from "../context/HealthContext";
import { runAnalysis } from "../services/analyzeService";

const restrictInteger = (value, max = 3) => value.replace(/[^0-9]/g, "").slice(0, max);

const normalizeExerciseOption = (value) => {
  if (["거의 안 함", "0일", "0회", "0", "안함"].includes(value)) return "안함";
  if (["1~2일", "주 1-2회", "주 1~2회"].includes(value)) return "주 1~2회";
  if (["3~4일", "주 3-4회", "주 3~4회"].includes(value)) return "주 3~4회";
  if (["5일 이상", "주 5회 이상", "주 5~6회"].includes(value)) return "주 5~6회";
  return value || "안함";
};

function BloodPressureInput({ label, value, onChange, placeholder, focused, onFocus, onBlur }) {
  return (
    <div style={{ minWidth: 0 }}>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(event) => onChange(restrictInteger(event.target.value, 3))}
        placeholder={value ? String(placeholder) : label}
        onFocus={onFocus}
        onBlur={onBlur}
        style={{
          width: "100%",
          height: 48,
          border: "1px solid #E5E7EB",
          borderRadius: 10,
          padding: "0 12px",
          background: focused ? "#fff" : "#F9FAFB",
          outline: "none",
          fontSize: value ? 15 : 13,
          fontWeight: value ? 600 : 500,
          boxSizing: "border-box",
          textAlign: "center",
          color: "#111827"
        }}
      />
    </div>
  );
}

function ReanalyzeScreen({ setScreen, back }) {
  const {
    user,
    setNewResult,
    addNotification,
    showLoading,
    hideLoading,
    userProfile,
    updateUserProfile,
    setPredictedProfile,
    setHasReanalyzed
  } = useHealth();

  const [smoking, setSmoking] = useState(user?.smoking || "비흡연");
  const [drinking, setDrinking] = useState(user?.drinking || "안함");
  const [exercise, setExercise] = useState(normalizeExerciseOption(user?.exercise));
  const [sleep] = useState(user?.sleep || 7);
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [sysFocused, setSysFocused] = useState(false);
  const [diaFocused, setDiaFocused] = useState(false);

  const toRiskRatio = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    if (!Number.isFinite(number)) return null;
    return Math.max(0, Math.min(1, number > 1 ? number / 100 : number));
  };

  const handleSubmit = async () => {
    const finalSystolic = systolic ? Number(systolic) : (userProfile?.bloodPressure?.systolic ?? 120);
    const finalDiastolic = diastolic ? Number(diastolic) : (userProfile?.bloodPressure?.diastolic ?? 80);

    try {
      showLoading("새 분석을 준비하는 중입니다...");

      const mergedUserProfile = {
        ...userProfile,
        smoking,
        drinking,
        exercise,
        sleep: Number(sleep),
        bloodPressure: {
          systolic: finalSystolic,
          diastolic: finalDiastolic
        }
      };

      const result = await runAnalysis(mergedUserProfile);
      if (!result || result.error) {
        throw new Error("분석 결과가 올바르지 않습니다.");
      }

      const updatedUser = {
        ...mergedUserProfile,
        ...result,
        persona: `${userProfile?.age}세 ${userProfile?.gender}`,
        personaTags: [
          userProfile?.gender,
          `${userProfile?.age}세`,
          smoking,
          result.bmi >= 25 ? "비만" : "정상"
        ]
      };

      const updatedRisks = {
        diabetes: toRiskRatio(result.diabetes_prob ?? result.diabetes),
        hypertension: toRiskRatio(result.hypertension_prob ?? result.hypertension),
        metabolic: toRiskRatio(result.metabolic),
        obesity: result.obesity_status ?? result.obesity
      };

      updateUserProfile(mergedUserProfile);
      setPredictedProfile(result);
      setNewResult({ user: updatedUser, risks: updatedRisks });
      setHasReanalyzed(true);
      addNotification("건강정보가 업데이트 되었어요.", "📈", "analyze", "analyze");
      setScreen("newresult");
    } catch (error) {
      console.error("runAnalysis error:", error);
      alert("새 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      hideLoading();
    }
  };

  if (!user) {
    return <div style={{ padding: 20, textAlign: "center" }}>로딩 중...</div>;
  }

  const systolicPlaceholder = user?.bloodPressure?.systolic || 120;
  const diastolicPlaceholder = user?.bloodPressure?.diastolic || 80;

  return (
    <div style={S.screen}>
      <div style={{ ...S.topBar, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0, borderBottom: "1px solid #F3F4F6" }}>
        <button onClick={back} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>←</button>
        <div>
          <span style={{ fontWeight: 700, fontSize: 16 }}>현재 상태를 업데이트해주세요</span>
          <p style={{ fontSize: 12, color: "#6B7280", margin: 0 }}>변화가 있었던 항목만 수정해 다시 분석할 수 있어요.</p>
        </div>
      </div>

      <div style={{ ...S.scrollArea, paddingTop: 74 }}>
        <div style={{ padding: 16 }}>
          <div style={{ background: "#EFF6FF", borderRadius: 10, padding: "8px 12px", marginBottom: 16, fontSize: 12, color: "#2563EB" }}>
            키, 체중 등 기본 정보는 마이페이지에서 수정할 수 있어요.
          </div>

          <div style={S.card}>
            <p style={{ fontWeight: 600, color: "#2563EB", margin: "0 0 12px" }}>신체 측정</p>
            {[
              { label: "키", val: user.height, unit: "cm" },
              { label: "체중", val: user.weight, unit: "kg" }
            ].map((field) => (
              <div key={field.label} style={{ marginBottom: 10 }}>
                <p style={{ fontSize: 13, color: "#374151", margin: "0 0 4px" }}>{field.label}</p>
                <div style={{ border: "1px solid #E5E7EB", borderRadius: 10, padding: "12px 16px", display: "flex", justifyContent: "space-between" }}>
                  <span>{field.val ?? "연결 안됨."}</span>
                  <span style={{ color: "#9CA3AF" }}>{field.unit}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={S.card}>
            <p style={{ fontWeight: 600, color: "#2563EB", margin: "0 0 12px" }}>혈압</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 16px 1fr auto", alignItems: "center", gap: 8 }}>
              <BloodPressureInput
                label="수축기"
                value={systolic}
                onChange={setSystolic}
                placeholder={systolicPlaceholder}
                focused={sysFocused}
                onFocus={() => setSysFocused(true)}
                onBlur={() => setSysFocused(false)}
              />
              <span style={{ color: "#9CA3AF", textAlign: "center", fontSize: 16, lineHeight: 1 }}>/</span>
              <BloodPressureInput
                label="이완기"
                value={diastolic}
                onChange={setDiastolic}
                placeholder={diastolicPlaceholder}
                focused={diaFocused}
                onFocus={() => setDiaFocused(true)}
                onBlur={() => setDiaFocused(false)}
              />
              <span style={{ color: "#9CA3AF", fontSize: 12, whiteSpace: "nowrap" }}>mmHg</span>
            </div>
          </div>

          <div style={S.card}>
            <p style={{ fontWeight: 600, margin: "0 0 12px" }}>생활 습관</p>
            <p style={{ fontSize: 13, margin: "0 0 6px" }}>흡연 상태</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              {["비흡연", "과거 흡연", "현재 흡연"].map((item) => (
                <button key={item} style={S.chip(smoking === item)} onClick={() => setSmoking(item)}>{item}</button>
              ))}
            </div>

            <p style={{ fontSize: 13, margin: "0 0 6px" }}>음주 빈도</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              {["안함", "월 1-3회", "주 1-2회", "주 3회 이상"].map((item) => (
                <button key={item} style={S.chip(drinking === item)} onClick={() => setDrinking(item)}>{item}</button>
              ))}
            </div>

            <p style={{ fontSize: 13, margin: "0 0 6px" }}>운동 빈도</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              {["안함", "주 1~2회", "주 3~4회", "주 5~6회", "매일"].map((item) => (
                <button key={item} style={S.chip(exercise === item)} onClick={() => setExercise(item)}>{item}</button>
              ))}
            </div>
          </div>

          <button onClick={handleSubmit} style={S.btn()}>
            다시 분석하기 &gt;
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReanalyzeScreen;
