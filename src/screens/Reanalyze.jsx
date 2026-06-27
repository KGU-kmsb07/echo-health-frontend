import { useState } from "react";
import S from '../styles/shared';
import { useHealth } from '../context/HealthContext';

const restrictInteger = (val, max = 3) => {
  const numOnly = val.replace(/[^0-9]/g, "");
  return numOnly.slice(0, max);
};

function ReanalyzeScreen({ setScreen, back }) {
  const { user, setUser, setRisks, setNewResult, calculateHealthData, addNotification } = useHealth();
  const [smoking, setSmoking] = useState(user?.smoking || "비흡연");
  const [drinking, setDrinking] = useState(user?.drinking || "거의 안 함");
  const [exercise, setExercise] = useState(user?.exercise || "거의 안 함");
  const [sleep, setSleep] = useState(user?.sleep || 7);

  // 혈압 상태 선언 및 포커스 관리
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [sysFocused, setSysFocused] = useState(false);
  const [diaFocused, setDiaFocused] = useState(false);

  if (!user) {
    return <div style={{ padding: 20, textAlign: "center" }}>로딩 중...</div>;
  }
  return (
    <div style={S.screen}>
      <div style={{ background: "#fff", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={back} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>←</button>
        <div>
          <span style={{ fontWeight: 700, fontSize: 16 }}>현재 상태를 업데이트해주세요</span>
          <p style={{ fontSize: 12, color: "#6B7280", margin: 0 }}>변화가 있었던 항목만 수정해도 다시 분석할 수 있어요.</p>
        </div>
      </div>
      <div style={S.scrollArea}>
        <div style={{ padding: 16 }}>
          <div style={{ background: "#EFF6FF", borderRadius: 10, padding: "8px 12px", marginBottom: 16, fontSize: 12, color: "#2563EB" }}>
            ℹ️ 나이·성별·키·거주지역은 마이 페이지에서만 수정할 수 있어요.
          </div>
          <div style={S.card}>
            <p style={{ fontWeight: 600, color: "#2563EB", margin: "0 0 12px" }}>신체 측정</p>
            {[{ label: "키", val: user.height, unit: "cm" }, { label: "체중", val: user.weight, unit: "kg" }].map(f => (
              <div key={f.label} style={{ marginBottom: 10 }}>
                <p style={{ fontSize: 13, color: "#374151", margin: "0 0 4px" }}>{f.label}</p>
                <div style={{ border: "1px solid #E5E7EB", borderRadius: 10, padding: "12px 16px", display: "flex", justifyContent: "space-between" }}>
                  <span>{f.val ?? "연결 안됨."}</span><span style={{ color: "#9CA3AF" }}>{f.unit}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={S.card}>
            <p style={{ fontWeight: 600, color: "#2563EB", margin: "0 0 12px" }}>혈액 수치</p>
             <div style={{ marginBottom: 10 }}>
              <p style={{ fontSize: 13, margin: "0 0 4px" }}>혈압</p>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input 
                  type="text"
                  inputMode="numeric"
                  value={systolic}
                  onChange={e => setSystolic(restrictInteger(e.target.value, 3))}
                  placeholder={String(user?.bloodPressure?.systolic || 120)}
                  onFocus={() => setSysFocused(true)}
                  onBlur={() => setSysFocused(false)}
                  style={{
                    flex: 1, 
                    minWidth: 0,
                    border: "1px solid #E5E7EB", 
                    borderRadius: 10, 
                    padding: "12px 8px",
                    background: sysFocused ? "#fff" : "#F3F4F6",
                    outline: "none",
                    fontSize: 13,
                    boxSizing: "border-box",
                    textAlign: "center",
                    color: "#374151"
                  }}
                />
                <span style={{ color: "#9CA3AF" }}>/</span>
                <input 
                  type="text"
                  inputMode="numeric"
                  value={diastolic}
                  onChange={e => setDiastolic(restrictInteger(e.target.value, 3))}
                  placeholder={String(user?.bloodPressure?.diastolic || 80)}
                  onFocus={() => setDiaFocused(true)}
                  onBlur={() => setDiaFocused(false)}
                  style={{
                    flex: 1, 
                    minWidth: 0,
                    border: "1px solid #E5E7EB", 
                    borderRadius: 10, 
                    padding: "12px 8px",
                    background: diaFocused ? "#fff" : "#F3F4F6",
                    outline: "none",
                    fontSize: 13,
                    boxSizing: "border-box",
                    textAlign: "center",
                    color: "#374151"
                  }}
                />
                <span style={{ color: "#9CA3AF", fontSize: 12, whiteSpace: "nowrap" }}>mmHg</span>
              </div>
            </div>
          </div>
          <div style={S.card}>
            <p style={{ fontWeight: 600, margin: "0 0 12px" }}>생활 습관</p>
            <p style={{ fontSize: 13, margin: "0 0 6px" }}>흡연 상태</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              {["비흡연", "과거 흡연", "현재 흡연"].map(s => <button key={s} style={S.chip(smoking === s)} onClick={() => setSmoking(s)}>{s}</button>)}
            </div>
            <p style={{ fontSize: 13, margin: "0 0 6px" }}>음주 빈도</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              {["거의 안 함", "월 1-3회", "주 1-2회", "주 3회 이상"].map(d => <button key={d} style={S.chip(drinking === d)} onClick={() => setDrinking(d)}>{d}</button>)}
            </div>
            <p style={{ fontSize: 13, margin: "0 0 6px" }}>운동 빈도</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              {["거의 안 함", "주 1-2회", "주 3-4회", "주 5회 이상"].map(e => <button key={e} style={S.chip(exercise === e)} onClick={() => setExercise(e)}>{e}</button>)}
            </div>

          </div>
          <button 
            onClick={() => {
              const finalSystolic = systolic ? Number(systolic) : (user.bloodPressure?.systolic ?? 120);
              const finalDiastolic = diastolic ? Number(diastolic) : (user.bloodPressure?.diastolic ?? 80);
              
              const finalData = {
                ...user,
                smoking,
                drinking,
                exercise,
                sleep: Number(sleep),
                systolic: finalSystolic,
                diastolic: finalDiastolic
              };

              const calculated = calculateHealthData(finalData, user.age);

              const updatedUser = {
                ...user,
                smoking,
                drinking,
                exercise,
                sleep: Number(sleep),
                bloodPressure: {
                  systolic: finalSystolic,
                  diastolic: finalDiastolic
                },
                bmi: calculated.bmi,
                healthScore: calculated.healthScore,
                healthAge: calculated.healthAge,
                persona: `${user.region} ${user.district}에 사는 ${user.age}세 ${user.gender}`,
                personaTags: [user.gender, `${user.age}세`, user.region, user.district, smoking, calculated.bmi >= 25 ? "비만" : "정상"]
              };

              setUser(updatedUser);
              setRisks(calculated.risks);

              setNewResult({
                user: updatedUser,
                risks: calculated.risks
              });

              addNotification("건강정보가 업데이트 되었어요.", "📈", "analyze", "analyze");
              setScreen("newresult");
            }} 
            style={S.btn()}
          >
            다시 분석하기 &gt;
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReanalyzeScreen;
