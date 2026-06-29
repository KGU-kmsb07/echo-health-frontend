import { useState } from "react";
import S from '../../styles/shared';
import { useHealth } from '../../context/HealthContext';
import { analyzeHealth } from '../../api/echoApi';
import { saveAnalysisResult } from '../../storage/localStore';

function Onboard4({ next, back }) {
  const { user, updateAnalysisResult, updateUser, showLoading, hideLoading, isEditMode } = useHealth();
  const [smoking, setSmoking] = useState(user?.smoking || "");
  const [drinking, setDrinking] = useState(user?.drinking || "");
  const [exercise, setExercise] = useState(user?.exercise || "");
  const [errors, setErrors] = useState({});

  const handleStart = async () => {
    const newErrors = {};
    if (!smoking) newErrors.smoking = "공란이면 안됩니다.";
    if (!drinking) newErrors.drinking = "공란이면 안됩니다.";
    if (!exercise) newErrors.exercise = "공란이면 안됩니다.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    let apiResult = null;
    try {
      showLoading("건강 분석 중...");

      const userData = {
        age: user.age,
        sex: user.gender === "남성" ? 1 : 2,
        height_cm: Number(user.height),
        weight_kg: Number(user.weight),
        waist_cm: Number(user.waist) || 80,
        systolic_bp: user.bloodPressure?.systolic || 120,
        diastolic_bp: user.bloodPressure?.diastolic || 80,
        fasting_glucose: 90,
        hba1c: 5.2,
        total_cholesterol: 180,
        hdl_cholesterol: 50,
        triglyceride: 120,
        ldl_direct: 110,
        current_smoking: smoking !== "비흡연" ? 1 : 0,
        aerobic_activity: exercise === "거의 안 함" ? 0 : 1
      };

      const result = await analyzeHealth(userData);

      if (result && !result.error) {
        apiResult = result;
        updateAnalysisResult(result);
        saveAnalysisResult(result);
        updateUser({
          vitality_score: result.vitality_score,
          healthScore: result.vitality_score, // 하위 호환
          bmi: result.bmi
        });
      } else {
        throw new Error("분석 결과가 올바르지 않습니다.");
      }
    } catch (e) {
      console.error("analyzeHealth error:", e);
      alert("건강 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      hideLoading();
    }
    next({ smoking, drinking, exercise, apiResult });
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", padding: "20px 24px 32px", background: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
        <button onClick={back} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#374151" }}>←</button>
        <div style={{ flex: 1, display: "flex", justifyContent: "center", gap: 6 }}>
          {[0, 1, 2, 3].map(i => (
            <div 
              key={i} 
              style={{ 
                width: i === 3 ? 24 : 8, 
                height: 8, 
                borderRadius: 4, 
                background: "#2563EB" 
              }} 
            />
          ))}
        </div>
        <span style={{ fontSize: 13, color: "#9CA3AF" }}>4/4</span>
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16, color: "#111" }}>생활습관을<br />알려주세요.</h2>
      <div style={{ overflowY: "auto", flex: 1 }}>
        <span style={{ fontSize: 11, color: "#9CA3AF", background: "#F3F4F6", borderRadius: 4, padding: "2px 6px" }}>직접 입력</span>
        
        <p style={{ fontSize: 13, color: "#374151", margin: "10px 0 6px", fontWeight: 500 }}>흡연 상태</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14, border: errors.smoking ? "1px solid #EF4444" : "none", borderRadius: 10, padding: errors.smoking ? 4 : 0 }}>
          {["비흡연", "과거 흡연", "현재 흡연"].map(s => <button key={s} type="button" style={S.chip(smoking === s)} onClick={() => { setSmoking(s); if(errors.smoking) setErrors(prev=>({...prev, smoking: null})); }}>{s}</button>)}
        </div>
        {errors.smoking && <p style={{ color: "#EF4444", fontSize: 11, margin: "4px 0 0" }}>{errors.smoking}</p>}

        <p style={{ fontSize: 13, color: "#374151", margin: "0 0 6px", fontWeight: 500 }}>음주 빈도</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14, border: errors.drinking ? "1px solid #EF4444" : "none", borderRadius: 10, padding: errors.drinking ? 4 : 0 }}>
          {["거의 안 함", "월 1-3회", "주 1-2회", "주 3회 이상"].map(d => <button key={d} type="button" style={S.chip(drinking === d)} onClick={() => { setDrinking(d); if(errors.drinking) setErrors(prev=>({...prev, drinking: null})); }}>{d}</button>)}
        </div>
        {errors.drinking && <p style={{ color: "#EF4444", fontSize: 11, margin: "4px 0 0" }}>{errors.drinking}</p>}

        <p style={{ fontSize: 13, color: "#374151", margin: "0 0 6px", fontWeight: 500 }}>운동빈도</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14, border: errors.exercise ? "1px solid #EF4444" : "none", borderRadius: 10, padding: errors.exercise ? 4 : 0 }}>
          {["거의 안 함", "주 1~2회", "주 3~4회", "주 5회 이상", "선택 안 함"].map(e => <button key={e} type="button" style={S.chip(exercise === e)} onClick={() => { setExercise(e); if(errors.exercise) setErrors(prev=>({...prev, exercise: null})); }}>{e}</button>)}
        </div>
        {errors.exercise && <p style={{ color: "#EF4444", fontSize: 11, margin: "4px 0 0" }}>{errors.exercise}</p>}
      </div>
      <button onClick={handleStart} style={S.btn()}>{isEditMode ? "저장하기" : "분석 시작하기"}</button>
    </div>
  );
}

export default Onboard4;