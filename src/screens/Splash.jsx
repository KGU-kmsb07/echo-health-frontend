import S from '../styles/shared';

function SplashScreen({ next }) {
  return (
    <div style={{
      minHeight: "100vh", background: "linear-gradient(160deg, #1E3A8A 0%, #2563EB 50%, #1D4ED8 100%)",
      display: "flex", flexDirection: "column", padding: "48px 24px 32px", color: "#fff",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "auto" }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>E</div>
        <span style={{ fontWeight: 600, fontSize: 16 }}>Echo Health</span>
      </div>
      <div style={{ marginBottom: "auto" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.15)", borderRadius: 20, padding: "6px 12px", marginBottom: 20 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ADE80" }} />
          <span style={{ fontSize: 12 }}>공공데이터 기반 건강 시뮬레이션</span>
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.3, marginBottom: 16 }}>
          미래의 나를 만나고,<br />
          <span style={{ color: "#60A5FA" }}>건강한 선택</span>을<br />시작하다
        </h1>
        <p style={{ fontSize: 14, opacity: 0.8, lineHeight: 1.6, marginBottom: 20 }}>
          공공데이터 기반 건강위험도 시뮬레이션으로<br />현재의 나와 개선된 미래의 나를 비교해보세요.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["KNHANES 2024", "2026.05.20 업데이트", "질병관리청"].map(t => (
            <span key={t} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 20, padding: "4px 10px", fontSize: 12 }}>{t}</span>
          ))}
        </div>
      </div>
      <div>
        <button onClick={next} style={{ ...S.btn(), background: "#fff", color: "#1E3A8A", marginBottom: 8 }}>
          건강 분석 시작하기
        </button>
        <p style={{ textAlign: "center", fontSize: 11, opacity: 0.6 }}>* 모델 기반 시뮬레이션 · 의료 진단이 아닙니다</p>
      </div>
    </div>
  );
}

export default SplashScreen;
