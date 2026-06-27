import S from '../styles/shared';

function LoginScreen({ next }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "60px 24px 40px", background: "#fff" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 24, fontWeight: 700 }}>E</div>
        <span style={{ fontSize: 20, fontWeight: 700, color: "#111" }}>Echo Health</span>
        <span style={{ fontSize: 13, color: "#6B7280" }}>공공데이터 기반 건강 시뮬레이션</span>
      </div>
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: "#111" }}>나의 건강 미래를<br />지금 확인해보세요</h2>
        <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 16 }}>3분이면 당신의 건강위험도와<br />개선 가능성을 알 수 있어요.</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          {["당뇨 위험 분석", "10년 후 건강나이", "4주 실천 플랜"].map(t => (
            <span key={t} style={{ background: "#EFF6FF", color: "#2563EB", borderRadius: 20, padding: "5px 12px", fontSize: 12, fontWeight: 500 }}>{t}</span>
          ))}
        </div>
      </div>
      <div style={{ width: "100%" }}>
        <button onClick={next} style={S.btn()}>시작하기</button>
        <p style={{ textAlign: "center", fontSize: 11, color: "#9CA3AF", marginTop: 10 }}>
          🔒 입력한 건강정보는 분석과 시뮬레이션에만 사용됩니다.<br />개인 의료 데이터는 서버에 저장되지 않습니다.
        </p>
      </div>
    </div>
  );
}

export default LoginScreen;
