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
  
  // risks에 들어있는 값들이 소수(0.0~1.0) 또는 obesity의 경우 0/1 이진값이므로 백분율로 환산하여 계산
  const dVal = risks?.diabetes !== null && risks?.diabetes !== undefined ? risks.diabetes * 100 : null;
  const hVal = risks?.hypertension !== null && risks?.hypertension !== undefined ? risks.hypertension * 100 : null;
  const mVal = risks?.metabolic !== null && risks?.metabolic !== undefined ? risks.metabolic * 100 : null;
  
  // obesity: 1이면 75%, 0이면 10%로 가상의 백분율 환산
  let oVal = null;
  if (risks?.obesity !== null && risks?.obesity !== undefined) {
    oVal = risks.obesity === 1 ? 75 : 10;
  }

  return {
    diabetes:     dVal !== null ? Math.min(99, Math.round(dVal * factor * 1.4)) : null,
    hypertension: hVal !== null ? Math.min(99, Math.round(hVal * factor * 1.3)) : null,
    metabolic:    mVal !== null ? Math.min(99, Math.round(mVal * factor * 1.35)) : null,
    obesity:      oVal !== null ? Math.min(99, Math.round(oVal * factor * 1.2)) : null,
  };
}

function FutureScreen({ setScreen, back }) {
  const { user, risks } = useHealth();
  
  if (!user) {
    return <div style={{ padding: 20, textAlign: "center" }}>로딩 중...</div>;
  }

  const future = calcFutureRisk(risks, user);
  
  const nowDiabetes = risks?.diabetes !== null && risks?.diabetes !== undefined ? Math.round(risks.diabetes * 100) : null;
  const nowHypertension = risks?.hypertension !== null && risks?.hypertension !== undefined ? Math.round(risks.hypertension * 100) : null;
  const nowMetabolic = risks?.metabolic !== null && risks?.metabolic !== undefined ? Math.round(risks.metabolic * 100) : null;
  const nowObesity = risks?.obesity !== null && risks?.obesity !== undefined ? (risks.obesity === 1 ? 75 : 10) : null;

  const items = [
    { label: "당뇨",     now: nowDiabetes,     then: future.diabetes },
    { label: "고혈압",   now: nowHypertension, then: future.hypertension },
    { label: "대사증후군", now: nowMetabolic,    then: future.metabolic },
    { label: "비만",     now: nowObesity,      then: future.obesity },
  ];

  return (
    <div style={S.screen}>
      <div style={{ ...S.topBar, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0, borderBottom: "1px solid #F3F4F6" }}>
        <button onClick={back} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>←</button>
        <span style={{ fontWeight: 700, fontSize: 16 }}>10년 후의 나</span>
      </div>
      <div style={{ ...S.scrollArea, paddingTop: 57 }}>
        <div style={{ padding: 16 }}>
          <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 12 }}>현재 생활 습관을 유지했을 때의 예측입니다</p>
          <div style={{ background: "#FEF2F2", borderRadius: 10, padding: "10px 14px", marginBottom: 16, color: "#DC2626", fontSize: 12 }}>
            ⚠️ 지금 습관을 유지하면 2034년, 당신은 이렇게 변합니다
          </div>
          <div style={{ ...S.card }}>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 16 }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 6 }}>지금 ({user.age !== null && user.age !== undefined ? `${user.age}세` : "연결 안됨."})</p>
                <div style={{ width: 80, height: 100, background: "#F3F4F6", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 4px" }}>
                  <svg width="60" height="80" viewBox="0 0 60 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="30" cy="14" r="10" fill="#9CA3AF"/>
                    <rect x="16" y="26" width="28" height="32" rx="8" fill="#9CA3AF"/>
                    <rect x="10" y="28" width="12" height="24" rx="6" fill="#9CA3AF"/>
                    <rect x="38" y="28" width="12" height="24" rx="6" fill="#9CA3AF"/>
                    <rect x="16" y="54" width="11" height="22" rx="5" fill="#9CA3AF"/>
                    <rect x="33" y="54" width="11" height="22" rx="5" fill="#9CA3AF"/>
                  </svg>
                </div>
                <p style={{ fontWeight: 500, fontSize: 13 }}>현재</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", color: "#EF4444", textAlign: "center", justifyContent: "center", fontSize: 12, lineHeight: "1.4" }}>
                <div>→<br />10년 후</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 6 }}>2034년 ({user.age !== null && user.age !== undefined ? `${user.age + 10}세` : "연결 안됨."})</p>
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
                <p style={{ fontWeight: 500, fontSize: 13 }}>현재 유지 시</p>
              </div>
            </div>
          </div>

          {/* 리스트 컨테이너 */}
          <div style={{ border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
            {items.map((item, index) => {
              const nowLevel = riskLevel(item.now);
              const thenLevel = riskLevel(item.then);
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
                  {/* [현재 col] */}
                  <div style={{ width: 80, textAlign: "center" }}>
                    <span style={{ fontSize: 16 }}>{nowLevel.dot}</span>{" "}
                    <span style={{ fontSize: 12, color: nowLevel.color }}>{nowLevel.label}</span>
                  </div>
                  {/* [화살표] */}
                  <div style={{ fontSize: 12, color: "#9CA3AF", margin: "0 8px" }}>→</div>
                  {/* [10년후 col] */}
                  <div style={{ width: 80, textAlign: "center" }}>
                    <span style={{ fontSize: 16 }}>{thenLevel.dot}</span>{" "}
                    <span style={{ fontSize: 13, fontWeight: 700, color: thenLevel.color }}>{thenLevel.label}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ background: "#FFFBEB", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#92400E" }}>
            📊 KNHANES 2024 회귀 모델 기반 예측치입니다. 생활 습관을 바꾸면 이 결과가 달라질 수 있어요.
          </div>
          <button onClick={() => setScreen("simulate")} style={S.btn()}>행동 변화 시뮬레이션 해보기</button>
        </div>
      </div>
    </div>
  );
}

export default FutureScreen;
