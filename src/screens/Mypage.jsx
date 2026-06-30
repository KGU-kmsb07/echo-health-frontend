import { useState } from 'react';
import S from '../styles/shared';
import { useHealth, generateDynamicNotifications } from '../context/HealthContext';
import { hasPrivacyConsent, savePrivacyConsent } from './PrivacyConsent';

function MyPageScreen({ setScreen }) {
  const { user, setNotifEnabled, setNotifications, setEditMode } = useHealth();
  const [privacyConsent, setPrivacyConsent] = useState(hasPrivacyConsent());
  const [marketingConsent, setMarketingConsent] = useState(localStorage.getItem("echo-health-marketing-consent") === "true");

  if (!user) {
    return <div style={{ padding: 20, textAlign: "center" }}>로딩 중...</div>;
  }
  return (
    <div style={S.screen}>
      <div style={{ ...S.scrollArea, paddingTop: 65 }}>
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ ...S.topBar, display: "flex", alignItems: "center", gap: 12, padding: "20px 16px 12px", borderBottom: "1px solid #F3F4F6" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 }}>E</div>
            <span style={{ fontWeight: 700, fontSize: 16 }}>Echo Health</span>
          </div>
          <div style={S.card}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14 }}>
              {/* 원형 프로필 아바타 */}
              <div style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                overflow: "hidden",
                background: "#E5E7EB",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #E5E7EB"
              }}>
                {user.profileImage ? (
                  <img src={user.profileImage} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="profile" />
                ) : (
                  <span style={{ fontSize: 24 }}>👤</span>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <p style={{ fontWeight: 700, fontSize: 16, margin: "0 0 2px" }}>{user.name || "사용자"} 님</p>
                </div>
                <p style={{ fontSize: 13, color: "#6B7280", margin: "0 0 4px" }}>
                  {user.age !== null && user.age !== undefined ? `${user.age}세` : "연결 안됨."} · {user.gender || "연결 안됨."}
                </p>
              </div>
            </div>
            <button 
              onClick={() => {
                setEditMode(true);
                setScreen("onboard1");
              }}
              style={{ ...S.btn(), fontSize: 14, padding: "12px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <span>👤</span> 건강정보 / 개인정보 수정하기
            </button>
          </div>
          <div style={S.card}>
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8 }}>
              <span>👤</span><span style={{ fontWeight: 600 }}>나의 건강 페르소나</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
              {user.personaTags && user.personaTags.length > 0 ? (
                user.personaTags
                  .map(t => <span key={t} style={S.tag()}>{t}</span>)
              ) : (
                <span style={{ fontSize: 12, color: "#9CA3AF" }}>연결 안됨.</span>
              )}
            </div>
            <p style={{ fontSize: 11, color: "#9CA3AF" }}>이 페르소나는 입력하신 건강정보와 KNHANES 통계를 기반으로 자동 생성됩니다. 건강정보를 수정하면 페르소나도 업데이트돼요.</p>
          </div>

          <div style={S.card}>
            <p style={{ fontWeight: 600, margin: "0 0 12px" }}>개인정보 관리</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
              <div>
                <p style={{ fontSize: 14, color: "#374151", margin: "0 0 2px" }}>건강정보 수집 및 이용</p>
                <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0 }}>분석과 맞춤 플랜 생성을 위한 필수 동의</p>
              </div>
              <button
                onClick={() => {
                  const next = !privacyConsent;
                  savePrivacyConsent(next);
                  setPrivacyConsent(next);
                }}
                style={{ border: "1px solid #E5E7EB", background: privacyConsent ? "#EFF6FF" : "#fff", color: privacyConsent ? "#2563EB" : "#6B7280", borderRadius: 999, padding: "6px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                {privacyConsent ? "동의중" : "미동의"}
              </button>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0 2px", borderTop: "1px solid #F3F4F6", marginTop: 8 }}>
              <div>
                <p style={{ fontSize: 14, color: "#374151", margin: "0 0 2px" }}>건강 혜택 알림</p>
                <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0 }}>지역 혜택과 실천 리마인더 안내</p>
              </div>
              <button
                onClick={() => {
                  const next = !marketingConsent;
                  localStorage.setItem("echo-health-marketing-consent", next ? "true" : "false");
                  setNotifEnabled(next);
                  setNotifications(next ? generateDynamicNotifications(user, true) : []);
                  setMarketingConsent(next);
                }}
                style={{ border: "1px solid #E5E7EB", background: marketingConsent ? "#EFF6FF" : "#fff", color: marketingConsent ? "#2563EB" : "#6B7280", borderRadius: 999, padding: "6px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                {marketingConsent ? "동의중" : "미동의"}
              </button>
            </div>
          </div>
          {[
            { icon: "📋", label: "데이터 출처 정보", screen: "datasource" },
          ].map(item => (
            <div key={item.label} onClick={() => item.screen && setScreen(item.screen)} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span>{item.icon}</span><span style={{ fontSize: 14 }}>{item.label}</span>
              </div>
              <span style={{ color: "#9CA3AF" }}>›</span>
            </div>
          ))}
          <div style={S.card}>
            <p style={{ fontWeight: 600, margin: "0 0 10px" }}>데이터 버전 정보</p>
            {[["모델 버전", "Echo ML v1.0.0"], ["KNHANES 기준", "2024 공개 통계"], ["마지막 업데이트", "2026-05-20"], ["AUROC", "모델별 성능표 참조"]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: "#6B7280" }}>{k}</span><span style={{ fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </div>
          <button 
            onClick={() => {
              if (confirm("저장된 모든 건강 데이터와 실천 기록이 삭제되며 처음부터 다시 시작합니다. 계속하시겠습니까?")) {
                localStorage.clear();
                alert("모든 데이터가 삭제되었습니다. 앱을 재시작합니다.");
                window.location.reload();
              }
            }}
            style={{ ...S.btn("outline"), width: "100%", marginTop: 12, marginBottom: 12, fontSize: 14, padding: "12px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, borderColor: "#EF4444", color: "#EF4444" }}
          >
            <span>🧹</span> 데이터 완전 삭제
          </button>
          <p style={{ textAlign: "center", fontSize: 11, color: "#9CA3AF" }}>Echo Health v1.0.0 · © 2026 Echo Health Team<br />본 서비스는 공공 데이터 기반 통계 시뮬레이션이며 의료적 진단이 아닙니다.</p>
        </div>
      </div>
    </div>
  );
}

export default MyPageScreen;
