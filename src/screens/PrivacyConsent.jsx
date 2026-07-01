import { useState } from "react";
import S from "../styles/shared";
import { privacyConsentDocumentUrl, saveConsent } from "../api/echoApi";

const CONSENT_KEY = "echo-health-privacy-consent";

export function hasPrivacyConsent() {
  return localStorage.getItem(CONSENT_KEY) === "true";
}

export function savePrivacyConsent(value) {
  localStorage.setItem(CONSENT_KEY, value ? "true" : "false");
}

function PrivacyConsentScreen({ next, back }) {
  const [required, setRequired] = useState(hasPrivacyConsent());
  const [optional, setOptional] = useState(localStorage.getItem("echo-health-marketing-consent") === "true");
  const checkboxStyle = {
    width: 22,
    height: 22,
    minWidth: 22,
    flex: "0 0 22px",
    margin: "1px 0 0",
    accentColor: "#2563EB"
  };

  const handleNext = async () => {
    if (!required) return;
    savePrivacyConsent(true);
    localStorage.setItem("echo-health-marketing-consent", optional ? "true" : "false");
    localStorage.setItem("echo-health-notif-enabled", optional ? "true" : "false");
    await saveConsent({
      requiredConsent: true,
      optionalConsent: optional,
      consentVersion: "2024",
      consentedAt: new Date().toISOString()
    });
    next();
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", padding: "77px 24px 32px", background: "#fff" }}>
      <div style={{ ...S.topBar, display: "flex", alignItems: "center", padding: "20px 24px 12px", borderBottom: "1px solid #F3F4F6" }}>
        <button onClick={back} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#374151" }}>←</button>
        <span style={{ flex: 1, textAlign: "center", fontWeight: 700, fontSize: 16 }}>개인정보 동의</span>
        <span style={{ width: 24 }} />
      </div>

      <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 8px", color: "#111", lineHeight: 1.4 }}>
        건강 분석을 위해<br />필수 동의가 필요해요.
      </h2>
      <p style={{ fontSize: 13, color: "#6B7280", margin: "0 0 20px", lineHeight: 1.5 }}>
        입력한 정보는 건강 위험도 예측, 4주 실천 플랜 생성, 마일리지 기록 관리에 사용됩니다.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        <label style={{ ...S.card, display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer", marginBottom: 0 }}>
          <input
            type="checkbox"
            checked={required}
            onChange={e => setRequired(e.target.checked)}
            style={checkboxStyle}
          />
          <span style={{ flex: 1, minWidth: 0 }}>
            <strong style={{ display: "block", fontSize: 14, color: "#111827", marginBottom: 4 }}>[필수] 건강정보 수집 및 이용 동의</strong>
            <span style={{ display: "block", fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>
              이름, 나이, 성별, 신체정보, 생활습관, 혈압 정보를 앱 내 분석과 개인화 추천에 사용합니다.
            </span>
            <a href={privacyConsentDocumentUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ display: "inline-block", marginTop: 8, fontSize: 12, color: "#2563EB", fontWeight: 700, textDecoration: "none" }}>
              개인정보 처리 동의 전문 보기
            </a>
          </span>
        </label>

        <label style={{ ...S.card, display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer", marginBottom: 0 }}>
          <input
            type="checkbox"
            checked={optional}
            onChange={e => setOptional(e.target.checked)}
            style={checkboxStyle}
          />
          <span style={{ flex: 1, minWidth: 0 }}>
            <strong style={{ display: "block", fontSize: 14, color: "#111827", marginBottom: 4 }}>[선택] 건강 혜택 알림 동의</strong>
            <span style={{ display: "block", fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>
              건강 혜택 안내와 실천 리마인더 알림을 받을 수 있습니다.
            </span>
            <a href={privacyConsentDocumentUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ display: "inline-block", marginTop: 8, fontSize: 12, color: "#2563EB", fontWeight: 700, textDecoration: "none" }}>
              선택 동의 안내 보기
            </a>
          </span>
        </label>
      </div>

      <button
        onClick={handleNext}
        disabled={!required}
        style={{ ...S.btn(), opacity: required ? 1 : 0.45, cursor: required ? "pointer" : "not-allowed" }}
      >
        동의하고 계속
      </button>
    </div>
  );
}

export default PrivacyConsentScreen;
