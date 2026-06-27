import S from '../styles/shared';
import { useHealth, generateDynamicNotifications } from '../context/HealthContext';

function MyPageScreen({ setScreen }) {
  const { user, updateUser, notifEnabled, setNotifEnabled, setNotifications, setEditMode } = useHealth();

  if (!user) {
    return <div style={{ padding: 20, textAlign: "center" }}>로딩 중...</div>;
  }
  return (
    <div style={S.screen}>
      <div style={S.scrollArea}>
        <div style={{ padding: "20px 16px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
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
                  .filter(t => t !== user.region && t !== user.district)
                  .map(t => <span key={t} style={S.tag()}>{t}</span>)
              ) : (
                <span style={{ fontSize: 12, color: "#9CA3AF" }}>연결 안됨.</span>
              )}
            </div>
            <p style={{ fontSize: 11, color: "#9CA3AF" }}>이 페르소나는 입력하신 건강정보와 KNHANES 통계를 기반으로 자동 생성됩니다. 건강정보를 수정하면 페르소나도 업데이트돼요.</p>
          </div>
          
          {/* 설정 카드 */}
          <div style={S.card}>
            <p style={{ fontWeight: 600, margin: "0 0 12px" }}>설정</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16 }}>🔔</span>
                <span style={{ fontSize: 14, color: "#374151" }}>푸시 알림 설정</span>
              </div>
              <div 
                onClick={() => {
                  const nextVal = !notifEnabled;
                  setNotifEnabled(nextVal);
                  if (!nextVal) {
                    setNotifications([]);
                  } else {
                    setNotifications(generateDynamicNotifications(user, true));
                  }
                }}
                style={{
                  width: 48,
                  height: 26,
                  borderRadius: 13,
                  background: notifEnabled ? "#2563EB" : "#E5E7EB",
                  cursor: "pointer",
                  position: "relative",
                  transition: "background 0.2s"
                }}
              >
                <div style={{
                  position: "absolute",
                  top: 3,
                  left: notifEnabled ? 25 : 3,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "#fff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                  transition: "left 0.2s"
                }} />
              </div>
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
            {[["모델 버전", "연결 안됨."], ["KNHANES 기준", "연결 안됨."], ["마지막 업데이트", "연결 안됨."], ["AUROC", "연결 안됨."]].map(([k, v]) => (
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
          <p style={{ textAlign: "center", fontSize: 11, color: "#9CA3AF" }}>Echo Health v1.0.0 · © 2024 Echo Health Team<br />본 서비스는 공공 데이터 기반 통계 시뮬레이션이며 의료적 진단이 아닙니다.</p>
        </div>
      </div>
    </div>
  );
}

export default MyPageScreen;
