import { useState } from "react";
import S from '../../styles/shared';
import { useHealth } from '../../context/HealthContext';
import { isHealthConnectAvailableInApp, requestWearOSPermissionAndSync } from "../../services/healthConnectService";

const restrictInteger = (val, max = 3) => {
  const numOnly = val.replace(/[^0-9]/g, "");
  return numOnly.slice(0, max);
};

function OnboardStep3({ next, back }) {
  const { user, hasOnboarded, updateUser } = useHealth();
  const [mode, setMode] = useState(hasOnboarded ? user?.bpMode || null : null);
  const [systolic, setSystolic] = useState(hasOnboarded && user?.bpMode === "manual" ? user?.bloodPressure?.systolic || "" : "");
  const [diastolic, setDiastolic] = useState(hasOnboarded && user?.bpMode === "manual" ? user?.bloodPressure?.diastolic || "" : "");
  const [errors, setErrors] = useState({});
  const [wearSyncing, setWearSyncing] = useState(false);
  const [wearSyncMessage, setWearSyncMessage] = useState("");
  const [wearOptionsVisible, setWearOptionsVisible] = useState(user?.bpMode === "wear");
  const wearVitals = user?.wearVitals || {};
  const wearBp = wearVitals.bloodPressure || user?.bloodPressure || {};
  const hasWearData = Boolean(user?.wearLastSyncedAt || wearVitals.steps || wearVitals.heartRate || wearBp.systolic);
  const healthConnectAvailable = isHealthConnectAvailableInApp();

  const handleWearSelect = async () => {
    setErrors({});
    setWearSyncMessage("");
    setMode("wear");
    setWearOptionsVisible(true);
    setWearSyncing(true);
    try {
      await requestWearOSPermissionAndSync();
      setMode("wear");
      setWearSyncMessage("Wear OS 데이터 연동이 완료되었습니다.");
    } catch (error) {
      setMode(null);
      setErrors({ mode: error.message || "Wear OS 권한 요청 또는 동기화에 실패했습니다." });
    } finally {
      setWearSyncing(false);
    }
  };

  const handleNext = () => {
    const newErrors = {};
    if (!mode) {
      newErrors.mode = "연동 방식을 선택해주세요.";
      setErrors(newErrors);
      return;
    }
    if (mode === "manual") {
      if (!systolic) newErrors.systolic = "공란이면 안됩니다.";
      if (!diastolic) newErrors.diastolic = "공란이면 안됩니다.";
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
    }
    const data = { bpMode: mode, systolic: systolic || "120", diastolic: diastolic || "80" };
    updateUser({
      bpMode: data.bpMode,
      bloodPressure: { systolic: Number(data.systolic), diastolic: Number(data.diastolic) }
    });
    next(data);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", padding: "20px 24px 32px", background: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
        <button onClick={back} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#374151" }}>←</button>
        <div style={{ flex: 1, display: "flex", justifyContent: "center", gap: 6 }}>
          {[0, 1, 2, 3].map(i => <div key={i} style={{ width: i === 2 ? 24 : 8, height: 8, borderRadius: 4, background: i <= 2 ? "#2563EB" : "#E5E7EB" }} />)}
        </div>
        <span style={{ fontSize: 13, color: "#9CA3AF" }}>3/4</span>
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, color: "#111" }}>건강 수치를<br />입력해주세요.</h2>
      <div style={{ background: "#2563EB", borderRadius: 12, padding: "14px 16px", color: "#fff", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
          <span>⌚</span><span style={{ fontWeight: 600, fontSize: 14 }}>Wear OS 건강 데이터 연동</span>
        </div>
        <p style={{ fontSize: 12, opacity: 0.85 }}>Wear OS 기기와 연동하면 혈압과 활동량을 더 간편하게 불러올 수 있어요.</p>
      </div>
      <div style={{ border: errors.mode ? "1px solid #EF4444" : "1px solid #E5E7EB", borderRadius: 12, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span>⌚</span><span style={{ fontWeight: 600 }}>혈압</span>
          </div>
          <span style={{ fontSize: 12, color: "#9CA3AF" }}>{mode === "manual" ? "직접 입력" : mode === "wear" ? "Wear OS 연동" : mode === "skip" ? "선택 안 함" : "미연동"}</span>
        </div>
        {errors.mode && <p style={{ color: "#EF4444", fontSize: 11, margin: "0 0 10px" }}>{errors.mode}</p>}
        {[{ label: "⌚ Wear OS 연동하기" }, { label: "직접 입력하기" }, { label: "선택 안 함" }].map((opt, i) => {
          const isSelected = (i === 0 && mode === "wear") || (i === 1 && mode === "manual") || (i === 2 && mode === "skip");
          return (
            <button 
              key={i} 
              type="button"
              onClick={() => { 
                if (i === 0) {
                  handleWearSelect();
                  return;
                }
                if (i === 1) setMode("manual");
                if (i === 2) setMode("skip");
                setWearOptionsVisible(false);
                setErrors({});
              }} 
              style={{ 
                ...S.btn("outline"), 
                marginBottom: 8, 
                fontSize: 14,
                border: isSelected ? "2px solid #2563EB" : "1px solid #E5E7EB",
                background: isSelected ? "#EFF6FF" : "#fff",
                color: isSelected ? "#2563EB" : "#374151",
                fontWeight: isSelected ? 600 : 400
              }}
            >
              {i === 0 && wearSyncing ? "Wear OS 권한 확인 중..." : opt.label}
            </button>
          );
        })}
        {wearOptionsVisible && mode === "wear" && (
          <div>
            {wearSyncMessage && <p style={{ color: "#2563EB", fontSize: 11, margin: "0 0 10px" }}>{wearSyncMessage}</p>}
            <div style={{ border: "1px solid #E5E7EB", borderRadius: 10, padding: 12, background: hasWearData ? "#F0FDF4" : "#F9FAFB", marginTop: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: hasWearData ? "#15803D" : "#6B7280" }}>
                  {hasWearData ? "Wear OS 연동됨" : healthConnectAvailable ? "권한 필요" : "Android 앱에서만 가능"}
                </span>
                <span style={{ fontSize: 11, color: "#6B7280" }}>
                  {user?.wearLastSyncedAt ? new Date(user.wearLastSyncedAt).toLocaleString() : "미동기화"}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 11, color: "#374151" }}>
                <span>걸음 {wearVitals.steps?.toLocaleString?.() || "-"}</span>
                <span>심박 {wearVitals.heartRate ? `${wearVitals.heartRate} bpm` : "-"}</span>
                <span>혈압 {wearBp.systolic && wearBp.diastolic ? `${wearBp.systolic}/${wearBp.diastolic}` : "-"}</span>
                <span>방식 {mode === "wear" ? "Wear OS" : "-"}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {mode === "manual" && (
        <div style={{ border: "1px solid #E5E7EB", borderRadius: 12, padding: 16, marginTop: 12 }}>
          <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, color: "#374151" }}>수축기/이완기 혈압 직접 입력</p>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 4 }}>수축기</p>
              <div style={{ border: errors.systolic ? "1px solid #EF4444" : "1px solid #E5E7EB", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center" }}>
                <input 
                  type="text" 
                  inputMode="numeric"
                  value={systolic} 
                  onChange={e => { setSystolic(restrictInteger(e.target.value, 3)); if(errors.systolic) setErrors(prev=>({...prev, systolic: null})); }} 
                  placeholder="예: 120" 
                  style={{ border: "none", outline: "none", width: "100%", fontSize: 14 }} 
                />
                <span style={{ fontSize: 12, color: "#9CA3AF", marginLeft: 4 }}>mmHg</span>
              </div>
              {errors.systolic && <p style={{ color: "#EF4444", fontSize: 11, margin: "4px 0 0" }}>{errors.systolic}</p>}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 4 }}>이완기</p>
              <div style={{ border: errors.diastolic ? "1px solid #EF4444" : "1px solid #E5E7EB", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center" }}>
                <input 
                  type="text" 
                  inputMode="numeric"
                  value={diastolic} 
                  onChange={e => { setDiastolic(restrictInteger(e.target.value, 3)); if(errors.diastolic) setErrors(prev=>({...prev, diastolic: null})); }} 
                  placeholder="예: 80" 
                  style={{ border: "none", outline: "none", width: "100%", fontSize: 14 }} 
                />
                <span style={{ fontSize: 12, color: "#9CA3AF", marginLeft: 4 }}>mmHg</span>
              </div>
              {errors.diastolic && <p style={{ color: "#EF4444", fontSize: 11, margin: "4px 0 0" }}>{errors.diastolic}</p>}
            </div>
          </div>
        </div>
      )}

      <button onClick={handleNext} style={{ ...S.btn(), marginTop: "auto" }}>다음</button>
    </div>
  );
}

export default OnboardStep3;
