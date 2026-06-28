import { useState } from "react";
import S from '../../styles/shared';
import { useHealth } from '../../context/HealthContext';

const restrictInteger = (val, max = 3) => {
  const numOnly = val.replace(/[^0-9]/g, "");
  return numOnly.slice(0, max);
};

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

function OnboardStep2({ next, back }) {
  const { user, hasOnboarded, updateUser } = useHealth();
  const [gender, setGender] = useState(hasOnboarded ? user?.gender || "" : "");
  const [age, setAge] = useState(hasOnboarded ? user?.age || "" : "");
  const [height, setHeight] = useState(hasOnboarded ? user?.height || "" : "");
  const [weight, setWeight] = useState(hasOnboarded ? user?.weight || "" : "");
  const [errors, setErrors] = useState({});

  const handleNext = () => {
    const newErrors = {};
    if (!age) newErrors.age = "공란이면 안됩니다.";
    if (!gender) newErrors.gender = "공란이면 안됩니다.";
    if (!height) newErrors.height = "공란이면 안됩니다.";
    if (!weight) newErrors.weight = "공란이면 안됩니다.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    const data = { gender, age: Number(age), height: Number(height), weight: Number(weight) };
    updateUser(data);
    next(data);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", padding: "20px 24px 32px", background: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
        <button onClick={back} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#374151" }}>←</button>
        <div style={{ flex: 1, display: "flex", justifyContent: "center", gap: 6 }}>
          {[0, 1, 2, 3].map(i => <div key={i} style={{ width: i === 1 ? 24 : 8, height: 8, borderRadius: 4, background: i <= 1 ? "#2563EB" : "#E5E7EB" }} />)}
        </div>
        <span style={{ fontSize: 13, color: "#9CA3AF" }}>2/4</span>
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, color: "#111" }}>기본 신체정보를<br />알려주세요.</h2>
      <div style={{ marginBottom: 20 }}>
        <div style={{ marginTop: 16 }}>
          <span style={{ fontSize: 11, color: "#9CA3AF", background: "#F3F4F6", borderRadius: 4, padding: "2px 6px" }}>직접 입력</span>
          <p style={{ fontSize: 13, color: "#374151", margin: "8px 0 4px" }}>나이</p>
          <div style={{ border: errors.age ? "1px solid #EF4444" : "1px solid #E5E7EB", borderRadius: 10, padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <input 
              type="text" 
              inputMode="numeric"
              value={age} 
              onChange={e => { setAge(restrictInteger(e.target.value, 3)); if(errors.age) setErrors(prev=>({...prev, age: null})); }}
              placeholder="예: 23" 
              style={{ border: "none", outline: "none", width: "100%", fontSize: 16, color: "#374151" }} 
            />
            <span style={{ color: "#9CA3AF" }}>세</span>
          </div>
          {errors.age && <p style={{ color: "#EF4444", fontSize: 11, margin: "4px 0 0" }}>{errors.age}</p>}
        </div>
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: 13, color: "#374151", margin: "0 0 8px" }}>성별</p>
          <div style={{ display: "flex", gap: 8, border: errors.gender ? "1px solid #EF4444" : "none", borderRadius: 10, padding: errors.gender ? 4 : 0 }}>
            {["남성", "여성"].map(g => (
              <button key={g} type="button" onClick={() => { setGender(g); if(errors.gender) setErrors(prev=>({...prev, gender: null})); }} style={{ flex: 1, padding: 14, borderRadius: 10, border: gender === g ? "2px solid #2563EB" : "1px solid #E5E7EB", background: gender === g ? "#EFF6FF" : "#fff", color: gender === g ? "#2563EB" : "#374151", fontWeight: gender === g ? 600 : 400, cursor: "pointer" }}>{g}</button>
            ))}
          </div>
          {errors.gender && <p style={{ color: "#EF4444", fontSize: 11, margin: "4px 0 0" }}>{errors.gender}</p>}
        </div>
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: 13, color: "#374151", margin: "0 0 4px" }}>키</p>
          <div style={{ border: errors.height ? "1px solid #EF4444" : "1px solid #E5E7EB", borderRadius: 10, padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <input 
              type="text" 
              inputMode="decimal"
              value={height} 
              onChange={e => { setHeight(restrictFloat(e.target.value, 3)); if(errors.height) setErrors(prev=>({...prev, height: null})); }}
              placeholder="예: 175.5" 
              style={{ border: "none", outline: "none", width: "100%", fontSize: 16, color: "#374151" }} 
            />
            <span style={{ color: "#9CA3AF" }}>cm</span>
          </div>
          {errors.height && <p style={{ color: "#EF4444", fontSize: 11, margin: "4px 0 0" }}>{errors.height}</p>}
        </div>
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: 13, color: "#374151", margin: "0 0 4px" }}>체중</p>
          <div style={{ border: errors.weight ? "1px solid #EF4444" : "1px solid #E5E7EB", borderRadius: 10, padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <input 
              type="text" 
              inputMode="decimal"
              value={weight} 
              onChange={e => { setWeight(restrictFloat(e.target.value, 3)); if(errors.weight) setErrors(prev=>({...prev, weight: null})); }}
              placeholder="예: 80.1" 
              style={{ border: "none", outline: "none", width: "100%", fontSize: 16, color: "#374151" }} 
            />
            <span style={{ color: "#9CA3AF" }}>kg</span>
          </div>
          {errors.weight && <p style={{ color: "#EF4444", fontSize: 11, margin: "4px 0 0" }}>{errors.weight}</p>}
        </div>
      </div>
      <button onClick={handleNext} style={{ ...S.btn(), marginTop: "auto" }}>다음</button>
    </div>
  );
}

export default OnboardStep2;
