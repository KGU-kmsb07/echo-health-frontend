import { useEffect, useState } from "react";
import S from '../styles/shared';
import { useHealth } from '../context/HealthContext';
import { simulateHealth } from '../api/echoApi';

const restrictFloat = (val, maxIntDigits = 3) => {
  let clean = val.replace(/[^0-9.]/g, "");
  const parts = clean.split(".");
  if (parts.length > 2) {
    clean = parts[0] + "." + parts.slice(1).join("");
  }
  const dotIndex = clean.indexOf(".");
  if (dotIndex !== -1) {
    const integerPart = clean.slice(0, dotIndex).replace(/[^0-9]/g, "").slice(0, maxIntDigits);
    const decimalPart = clean.slice(dotIndex + 1).replace(/[^0-9]/g, "").slice(0, 1);
    return integerPart + "." + decimalPart;
  } else {
    return clean.slice(0, maxIntDigits);
  }
};

const restrictInteger = (val, max = 3) => {
  const numOnly = val.replace(/[^0-9]/g, "");
  return numOnly.slice(0, max);
};

const riskColor = (value) => {
  if (value >= 60) return "#DC2626"; 
  if (value >= 35) return "#D97706"; 
  return "#16A34A"; 
};

const normalizeExerciseOption = (value) => {
  if (["거의 안 함", "0일", "0회", "0"].includes(value)) return "안함";
  if (["1~2일", "주 1-2회"].includes(value)) return "주 1~2회";
  if (["3~4일", "주 3-4회"].includes(value)) return "주 3~4회";
  if (["5일 이상", "주 5회 이상"].includes(value)) return "주 5~6회";
  return value || "안함";
};

const normalizeDrinkingOption = (value) => {
  if (value === "월 1-3회") return "월 1~3회";
  if (value === "주 1-2회") return "주 1~2회";
  return value || "안함";
};

function SimulateScreen({ setScreen, back }) {
  const { user, wearData, risks, updateSimulationResult, showLoading, hideLoading, setWeeklyGoals, navigateWithLoading } = useHealth();

  const [weight, setWeight] = useState(user?.weight ?? "");
  const [systolic, setSystolic] = useState(user?.bloodPressure?.systolic ?? 120);
  const [diastolic, setDiastolic] = useState(user?.bloodPressure?.diastolic ?? 80);
  const [steps, setSteps] = useState(wearData?.steps ?? 5000);
  const [exercise, setExercise] = useState(normalizeExerciseOption(user?.exercise));
  const [smoking, setSmoking] = useState(user?.smoking ?? "비흡연");
  const [drinking, setDrinking] = useState(normalizeDrinkingOption(user?.drinking));
  const [showValidation, setShowValidation] = useState(false);

  useEffect(() => {
    setWeight(user?.weight ?? "");
    setSystolic(user?.bloodPressure?.systolic ?? 120);
    setDiastolic(user?.bloodPressure?.diastolic ?? 80);
    setExercise(normalizeExerciseOption(user?.exercise));
    setSmoking(user?.smoking ?? "비흡연");
    setDrinking(normalizeDrinkingOption(user?.drinking));
  }, [user?.weight, user?.bloodPressure?.systolic, user?.bloodPressure?.diastolic, user?.exercise, user?.smoking, user?.drinking]);

  const isValid =
    weight !== null && weight !== "" &&
    systolic !== null && systolic !== "" &&
    diastolic !== null && diastolic !== "" &&
    steps !== null && steps !== "" &&
    exercise !== "" &&
    smoking !== "" &&
    drinking !== "";

  if (!user) {
    return <div style={{ padding: 20, textAlign: "center" }}>로딩 중...</div>;
  }

  const handleConfirm = async () => {
    setShowValidation(true);
    if (!isValid) return;

    showLoading("결과를 계산하고 있어요...");

    const checkup = user.healthCheckup || {};
    const payload = {
      input_mode: user.healthCheckup ? "checkup" : "simple",
      age: user.age,
      sex: user.gender === "남성" ? 1 : 2,
      height_cm: Number(checkup.height_cm ?? user.height),
      weight_kg: Number(weight),
      waist_cm: Number(checkup.waist_cm ?? user.waist) || 80,
      systolic_bp: Number(systolic),
      diastolic_bp: Number(diastolic),
      fasting_glucose: Number(checkup.fasting_glucose ?? 90),
      hba1c: Number(checkup.hba1c ?? 5.2),
      total_cholesterol: Number(checkup.total_cholesterol ?? 180),
      hdl_cholesterol: Number(checkup.hdl_cholesterol ?? 50),
      triglyceride: Number(checkup.triglyceride ?? 120),
      ldl_direct: Number(checkup.ldl_direct ?? 110),
      current_smoking: smoking !== "비흡연" ? 1 : 0,
      aerobic_activity: exercise === "안함" ? 0 : 1
    };

    try {
      const result = await simulateHealth(payload);
      if (result && !result.error) {
        updateSimulationResult({
          ...result,
          simulatedInputs: {
            weight: Number(weight),
            bloodPressure: {
              systolic: Number(systolic),
              diastolic: Number(diastolic)
            },
            exercise,
            smoking,
            drinking
          }
        });
        setWeeklyGoals(prev => ({ ...prev, steps: Number(steps) }));
        navigateWithLoading(setScreen, "improved", 600, "결과 계산 중...");
      } else {
        throw new Error("시뮬레이션 API 결과가 올바르지 않습니다.");
      }
    } catch (e) {
      console.error("simulateHealth error:", e);
      alert("시뮬레이션 결과를 계산하는 도중 오류가 발생했습니다.");
    } finally {
      hideLoading();
    }
  };

  return (
    <div style={{ ...S.screen, display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Header */}
      <div style={{ ...S.topBar, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0, borderBottom: "1px solid #F3F4F6" }}>
        <button onClick={back} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>←</button>
        <div>
          <span style={{ fontWeight: 700, fontSize: 16 }}>행동 변화 시뮬레이션</span>
          <p style={{ fontSize: 12, color: "#6B7280", margin: 0 }}>현재 상태 값을 변경하여 미래 위험도 변화를 체험하세요</p>
        </div>
      </div>

      {/* 스크롤 영역 */}
      <div style={{ ...S.scrollArea, flex: 1, padding: "90px 16px 24px", paddingBottom: 100 }}>
        
        {/* 체중 조절 */}
        <div style={S.card}>
          <p style={{ fontWeight: 600, margin: "0 0 10px", fontSize: 14 }}>체중 조절</p>
          <div style={{ border: "1px solid #E5E7EB", borderRadius: 10, padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <input 
              type="number" 
              step="0.1"
              min="30"
              max="200"
              value={weight} 
              onChange={e => setWeight(e.target.value)}
              placeholder="예: 70" 
              style={{ border: "none", outline: "none", width: "100%", fontSize: 16, color: "#374151" }} 
            />
            <span style={{ color: "#9CA3AF" }}>kg</span>
          </div>
          {showValidation && (weight === null || weight === "") && (
            <p style={{ fontSize: 12, color: "#DC2626", marginTop: 4 }}>
              필수 입력 항목입니다
            </p>
          )}
        </div>

        {/* 혈압 조절 */}
        <div style={S.card}>
          <p style={{ fontWeight: 600, margin: "0 0 10px", fontSize: 14 }}>혈압 조절</p>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ flex: 1, border: "1px solid #E5E7EB", borderRadius: 10, padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <input 
                type="number" 
                min="80"
                max="200"
                value={systolic} 
                onChange={e => setSystolic(e.target.value)}
                placeholder="수축기 (예: 120)" 
                style={{ border: "none", outline: "none", width: "100%", fontSize: 15, color: "#374151" }} 
              />
            </div>
            <span style={{ color: "#9CA3AF" }}>/</span>
            <div style={{ flex: 1, border: "1px solid #E5E7EB", borderRadius: 10, padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <input 
                type="number" 
                min="50"
                max="130"
                value={diastolic} 
                onChange={e => setDiastolic(e.target.value)}
                placeholder="이완기 (예: 80)" 
                style={{ border: "none", outline: "none", width: "100%", fontSize: 15, color: "#374151" }} 
              />
            </div>
            <span style={{ color: "#9CA3AF", fontSize: 12 }}>mmHg</span>
          </div>
          {showValidation && (systolic === null || systolic === "" || diastolic === null || diastolic === "") && (
            <p style={{ fontSize: 12, color: "#DC2626", marginTop: 4 }}>
              필수 입력 항목입니다
            </p>
          )}
        </div>

        {/* 활동량 (일일 걸음 수) */}
        <div style={S.card}>
          <p style={{ fontWeight: 600, margin: "0 0 10px", fontSize: 14 }}>일일 걸음 수</p>
          <div style={{ border: "1px solid #E5E7EB", borderRadius: 10, padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <input 
              type="number" 
              min="0"
              max="30000"
              step="100"
              value={steps} 
              onChange={e => setSteps(e.target.value)}
              placeholder="예: 8000" 
              style={{ border: "none", outline: "none", width: "100%", fontSize: 16, color: "#374151" }} 
            />
            <span style={{ color: "#9CA3AF" }}>보</span>
          </div>
          {showValidation && (steps === null || steps === "") && (
            <p style={{ fontSize: 12, color: "#DC2626", marginTop: 4 }}>
              필수 입력 항목입니다
            </p>
          )}
        </div>

        {/* 운동 빈도 */}
        <div style={S.card}>
          <p style={{ fontWeight: 600, margin: "0 0 10px", fontSize: 14 }}>운동 빈도</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["안함", "주 1~2회", "주 3~4회", "주 5~6회", "매일"].map(option => (
              <button 
                key={option} 
                type="button" 
                onClick={() => setExercise(option)} 
                style={S.chip(exercise === option)}
              >
                {option}
              </button>
            ))}
          </div>
          {showValidation && exercise === "" && (
            <p style={{ fontSize: 12, color: "#DC2626", marginTop: 4 }}>
              필수 입력 항목입니다
            </p>
          )}
        </div>

        {/* 흡연 상태 */}
        <div style={S.card}>
          <p style={{ fontWeight: 600, margin: "0 0 10px", fontSize: 14 }}>흡연 상태</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["비흡연", "과거 흡연", "현재 흡연"].map(option => (
              <button 
                key={option} 
                type="button" 
                onClick={() => setSmoking(option)} 
                style={S.chip(smoking === option)}
              >
                {option}
              </button>
            ))}
          </div>
          {showValidation && smoking === "" && (
            <p style={{ fontSize: 12, color: "#DC2626", marginTop: 4 }}>
              필수 입력 항목입니다
            </p>
          )}
        </div>

        {/* 음주 빈도 */}
        <div style={S.card}>
          <p style={{ fontWeight: 600, margin: "0 0 10px", fontSize: 14 }}>음주 빈도</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["안함", "월 1~3회", "주 1~2회", "주 3회 이상"].map(option => (
              <button 
                key={option} 
                type="button" 
                onClick={() => setDrinking(option)} 
                style={S.chip(drinking === option)}
              >
                {option}
              </button>
            ))}
          </div>
          {showValidation && drinking === "" && (
            <p style={{ fontSize: 12, color: "#DC2626", marginTop: 4 }}>
              필수 입력 항목입니다
            </p>
          )}
        </div>

        <p style={{ fontSize: 11, color: "#9CA3AF", margin: "16px 0 0" }}>* KNHANES 회귀 모델 기반 추정치이며, 확정된 건강 예측이 아닙니다.</p>

        {/* 변화 결과 확인하기 버튼 */}
        <div style={{ marginTop: 24, paddingBottom: 32 }}>
          <button 
            onClick={handleConfirm} 
            style={{
              ...S.btn(),
              opacity: isValid ? 1 : 0.4,
              cursor: isValid ? "pointer" : "not-allowed"
            }}
          >
            변화 결과 확인하기
          </button>
        </div>
      </div>
    </div>
  );
}

export default SimulateScreen;
