import { useEffect, useState } from "react";
import S from "../styles/shared";
import { warmupServer } from "../api/echoApi";

function SplashScreen({ next }) {
  const [warming, setWarming] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function wakeServer() {
      setWarming(true);
      await warmupServer();
      if (!mounted) return;
      setReady(true);
      setWarming(false);
    }

    wakeServer();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #1E3A8A 0%, #2563EB 50%, #1D4ED8 100%)",
      display: "flex",
      flexDirection: "column",
      padding: "48px 24px 32px",
      color: "#fff",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "auto" }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>E</div>
        <span style={{ fontWeight: 600, fontSize: 16 }}>Echo Health</span>
      </div>

      <div style={{ marginBottom: "auto" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.15)", borderRadius: 20, padding: "6px 12px", marginBottom: 20 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ADE80" }} />
          <span style={{ fontSize: 12 }}>KNHANES 2024 기반 건강 분석</span>
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.3, marginBottom: 16 }}>
          오늘의 건강 데이터를<br />
          <span style={{ color: "#BFDBFE" }}>가볍게 확인하세요</span>
        </h1>
        <p style={{ fontSize: 14, opacity: 0.86, lineHeight: 1.6, marginBottom: 20 }}>
          서버 응답 준비를 먼저 확인한 뒤 앱을 시작합니다.<br />
          이 단계에서는 사용자 정보를 보내지 않습니다.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["KNHANES 2024", "질병관리청", "정부24 API"].map(t => (
            <span key={t} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 20, padding: "4px 10px", fontSize: 12 }}>{t}</span>
          ))}
        </div>
      </div>

      <div>
        <button
          onClick={next}
          disabled={warming}
          style={{ ...S.btn(), background: "#fff", color: "#1E3A8A", marginBottom: 8, opacity: warming ? 0.78 : 1 }}
        >
          {warming ? "서버를 깨우는 중입니다..." : "건강 분석 시작하기"}
        </button>
        <p style={{ textAlign: "center", fontSize: 11, opacity: 0.7, margin: "0 0 8px" }}>
          {ready ? "서버 준비가 완료되었습니다." : "서버에서 기본 상태를 확인하는 중입니다."}
        </p>
        <p style={{ textAlign: "center", fontSize: 11, opacity: 0.6, margin: 0 }}>
          * 모델 기반 예측이며 의료 진단이 아닙니다.
        </p>
      </div>
    </div>
  );
}

export default SplashScreen;
