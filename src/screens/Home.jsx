import { useState } from "react";
import S from '../styles/shared';
import { useHealth } from '../context/HealthContext';

const getRelativeTime = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);

  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHr < 24) return `${diffHr}시간 전`;
  return `${Math.floor(diffHr / 24)}일 전`;
};

const getPlanProgress = (startDateStr) => {
  if (!startDateStr) return { week: 1, dayName: "월", diffDays: 0, dayIndex: 0 };
  const start = new Date(startDateStr);
  const now = new Date();
  start.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const diffTime = now.getTime() - start.getTime();
  const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  
  const week = Math.min(4, Math.floor(diffDays / 7) + 1);
  const dayIndex = diffDays % 7;
  
  const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"];
  const startDayOfWeek = start.getDay();
  const dayName = daysOfWeek[(startDayOfWeek + dayIndex) % 7];
  
  return { week, dayName, diffDays, dayIndex };
};

function HomeScreen({ setScreen, setTab }) {
  const { user, risks, plan, notifications, setNotifications, todoCheckedState, planStartDate, weeklyGoals } = useHealth();
  const [showNotif, setShowNotif] = useState(false);
  const [startY, setStartY] = useState(0);

  const { week: currentWeek } = getPlanProgress(planStartDate);
  const targetPlan = (plan && plan.data) ? plan.data.find(p => p.week === currentWeek) : null;
  const todayTodoItems = targetPlan ? targetPlan.items : [];
  
  const completedTodayCount = todayTodoItems.filter(item => {
    const key = `todo-${currentWeek}-${item}`;
    return !!todoCheckedState[key];
  }).length;
  
  const totalTodayCount = todayTodoItems.length;

  const handleTouchStart = (e) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e) => {
    if (startY <= 0) return;
    const endY = e.changedTouches[0].clientY;
    if (endY - startY > 80) {
      setShowNotif(false);
    }
    setStartY(0);
  };

  const handleMouseDown = (e) => {
    setStartY(e.clientY);
  };

  const handleMouseUp = (e) => {
    if (startY <= 0) return;
    const endY = e.clientY;
    if (endY - startY > 80) {
      setShowNotif(false);
    }
    setStartY(0);
  };

  if (!user) {
    return <div style={{ padding: 20, textAlign: "center" }}>로딩 중...</div>;
  }
  return (
    <div style={S.screen}>
      <div style={S.scrollArea}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center",
          padding: "20px 24px 12px", gap: 14,
          background: "#fff"
        }}>
          {/* 프로필 사진 */}
          <div style={{
            width: 48, height: 48, borderRadius: 24,
            overflow: "hidden", background: "#E5E7EB",
            flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            {user.profileImage
              ? <img src={user.profileImage} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontSize: 20 }}>👤</span>
            }
          </div>

          {/* 텍스트 */}
          <div>
            <p style={{ fontSize: 18, fontWeight: 700, color: "#111", margin: 0 }}>
              {user.name || "사용자"} 님, 환영합니다
            </p>
          </div>
          
          {/* 알림 종 */}
          <button onClick={() => setShowNotif(true)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontSize: 20, position: "relative", padding: 4 }}>
            🔔
            {notifications.filter(n => n.unread).length > 0 && (
              <span style={{ position: "absolute", top: -2, right: -2, width: 16, height: 16, background: "#EF4444", borderRadius: "50%", color: "#fff", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {notifications.filter(n => n.unread).length}
              </span>
            )}
          </button>
        </div>
        <div style={{ padding: "0 16px 16px" }}>
          {/* Health Score */}
          <div style={{ ...S.card, marginTop: 12 }}>
            <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 8 }}>오늘의 건강 점수</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <span style={{ fontSize: 48, fontWeight: 800, color: "#10B981" }}>{user.healthScore ?? "연결 안됨."}</span>
                <span style={{ fontSize: 16, color: "#9CA3AF" }}>/100</span>
              </div>
              <div style={{ position: "relative", width: 80, height: 80 }}>
                <svg width="80" height="80" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="30" fill="none" stroke="#F3F4F6" strokeWidth="8" />
                  <circle cx="40" cy="40" r="30" fill="none" stroke="#F59E0B" strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 30 * ((user.healthScore ?? 0) / 100)} ${2 * Math.PI * 30 * (1 - (user.healthScore ?? 0) / 100)}`}
                    strokeLinecap="round" transform="rotate(-90 40 40)" />
                </svg>
                <span style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontSize: 20 }}>😊</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 24, marginTop: 8 }}>
              <div><p style={{ fontSize: 11, color: "#9CA3AF", margin: 0 }}>건강 나이</p><p style={{ fontWeight: 700, margin: 0 }}>{user.healthAge !== null ? `${user.healthAge}세` : "연결 안됨."}</p></div>
              <div><p style={{ fontSize: 11, color: "#9CA3AF", margin: 0 }}>실제 나이</p><p style={{ fontWeight: 700, margin: 0 }}>{user.age !== null ? `${user.age}세` : "연결 안됨."}</p></div>
            </div>
          </div>
          {/* 2031 예상 */}
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <p style={{ fontWeight: 600, margin: 0 }}>2031년 예상 건강 상태</p>
              <button onClick={() => setScreen("future")} style={{ background: "none", border: "none", color: "#2563EB", fontSize: 12, cursor: "pointer" }}>자세히 보기 &gt;</button>
            </div>
            <div style={{ display: "flex", justifyContent: "space-around" }}>
              {[
                { icon: "💧", label: "당뇨 위험", pct: risks?.diabetes ?? null, color: "#3B82F6" },
                { icon: "❤️", label: "고혈압 위험", pct: risks?.hypertension ?? null, color: "#EF4444" },
                { icon: "📋", label: "대사증후군", pct: risks?.metabolic ?? null, color: "#8B5CF6" },
                { icon: "⚖️", label: "비만 위험", pct: risks?.obesity ?? null, color: "#F59E0B" }
              ].map(r => (
                <div key={r.label} style={{ textAlign: "center" }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: r.color + "20", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 4px", fontSize: 18 }}>{r.icon}</div>
                  <p style={{ fontSize: 10, color: "#6B7280", margin: "0 0 2px" }}>{r.label}</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: r.color, margin: 0 }}>{r.pct !== null ? `${r.pct}%` : "연결 안됨."}</p>
                </div>
              ))}
            </div>
          </div>
          {/* 혜택 */}
          <div style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontWeight: 700, margin: "0 0 4px" }}>숨은 건강 혜택</p>
              <p style={{ fontSize: 12, color: "#6B7280", margin: 0 }}>거주지역 기준으로 받을 수 있는<br />혜택을 찾아봤어요.</p>
            </div>
            <button onClick={() => { setTab("benefits"); setScreen("benefits"); }} style={{ background: "#10B981", color: "#fff", border: "none", borderRadius: 10, padding: "10px 14px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>혜택<br />확인하기</button>
          </div>
          {/* 오늘의 걸음 수 */}
          <div style={S.card}>
            <p style={{ fontWeight: 600, margin: "0 0 8px", fontSize: 14 }}>오늘의 걸음 수 목표</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: "#111", margin: 0 }}>
              오늘 목표: {(weeklyGoals?.steps ?? 8000).toLocaleString()}보
            </p>
          </div>
          {/* 실천 요약 */}
          <div style={{ ...S.card, background: "#F0FDF4" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
              <span>📅</span><span style={{ fontWeight: 600, fontSize: 13 }}>오늘의 실천 요약</span>
            </div>
            {(plan && plan.data) ? (
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#15803D", margin: "0 0 8px" }}>
                  오늘 실천 {completedTodayCount}/{totalTodayCount} 완료
                </p>
                <button onClick={() => { setScreen("plan"); setTab("plan"); }} style={{ background: "none", border: "none", color: "#2563EB", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0 }}>행동 계획 실천하기 &gt;</button>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: 12, color: "#6B7280", margin: "0 0 8px" }}>미래 시뮬레이션을 완료하면 맞춤 실천 플랜이 생성돼요.</p>
                <button onClick={() => setScreen("future")} style={{ background: "none", border: "none", color: "#2563EB", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0 }}>미래의 나 알아보기 &gt;</button>
              </div>
            )}
          </div>

        </div>
      </div>
      {/* 알림 패널 */}
      {showNotif && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 150 }} onClick={() => setShowNotif(false)}>
          <div 
            className="bottom-sheet"
            onClick={e => e.stopPropagation()} 
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onDragStart={e => e.preventDefault()}
            style={{ position: "fixed", bottom: 56, left: 0, right: 0, margin: "0 auto", width: "100%", maxWidth: 390, background: "#fff", borderRadius: "20px 20px 0 0", padding: "10px 20px 20px", zIndex: 200 }}
          >
            {/* 드래그 핸들 zone */}
            <div 
              className="drag-zone"
              style={{ display: "flex", flexDirection: "column", userSelect: "none", WebkitUserSelect: "none" }}
            >
              {/* 드래그 핸들 바 */}
              <div style={{
                width: 36, height: 4, borderRadius: 2,
                background: "#E5E7EB", margin: "0 auto 16px"
              }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <span style={{ fontWeight: 700, fontSize: 16 }}>알림</span>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  {notifications.length > 0 && (
                    <button 
                      onClick={() => setNotifications([])} 
                      style={{ 
                        background: "none", 
                        border: "none", 
                        color: "#EF4444", 
                        fontSize: 12, 
                        fontWeight: 600, 
                        cursor: "pointer", 
                        padding: "2px 6px" 
                      }}
                    >
                      전체 삭제
                    </button>
                  )}
                  <button onClick={() => setShowNotif(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer" }}>✕</button>
                </div>
              </div>
            </div>
            {/* 알림 본문 리스트 */}
            {notifications.map(n => (
              <div 
                key={n.id} 
                onClick={() => {
                  if (n.targetScreen) {
                    setScreen(n.targetScreen);
                    if (n.targetTab) setTab(n.targetTab);
                  }
                  // 알림 클릭 시 읽음 처리 연동
                  setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, unread: false } : item));
                  setShowNotif(false);
                }}
                style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: "1px solid #F3F4F6", alignItems: "center", cursor: "pointer" }}
              >
                <span style={{ fontSize: 20 }}>{n.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: n.unread ? 600 : 400 }}>{n.title}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9CA3AF" }}>{getRelativeTime(n.date)}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }} onClick={e => e.stopPropagation()}>
                  {n.unread && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563EB" }} />}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setNotifications(prev => prev.filter(item => item.id !== n.id));
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#9CA3AF",
                      fontSize: 16,
                      cursor: "pointer",
                      padding: "4px 8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
            {notifications.length === 0 && (
              <div style={{ padding: "40px 0", textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>
                새로운 알림이 없습니다.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default HomeScreen;
