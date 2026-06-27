import S from '../styles/shared';

export function NavBar({ tab, setTab, setScreen }) {
  const items = [
    { id: "home", label: "홈", icon: "🏠" },
    { id: "analyze", label: "분석", icon: "📊" },
    { id: "plan", label: "플랜", icon: "📅" },
    { id: "exercise", label: "운동", icon: "🏃" },
    { id: "benefits", label: "혜택", icon: "❤️" },
    { id: "mypage", label: "마이", icon: "👤" },
  ];
  return (
    <nav style={{ ...S.navBar, zIndex: 600 }}>
      {items.map((i) => (
        <div key={i.id} style={S.navItem(tab === i.id)} onClick={() => { setTab(i.id); setScreen(i.id); }}>
          <span style={{ fontSize: 18 }}>{i.icon}</span>
          <span>{i.label}</span>
        </div>
      ))}
    </nav>
  );
}

export function AIButton({ onClick }) {
  return (
    <button onClick={onClick} style={{
      position: "fixed", bottom: 90, right: "calc(50% - 185px)",
      width: 52, height: 52, borderRadius: "50%", background: "#2563EB",
      border: "none", cursor: "pointer", fontSize: 22, boxShadow: "0 4px 12px rgba(37,99,235,0.4)",
      zIndex: 99, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
    }}>
      <span style={{ fontSize: 11, fontWeight: 700, background: "#10B981", borderRadius: 4, padding: "1px 3px", position: "absolute", top: 2, right: 2 }}>AI</span>
      💬
    </button>
  );
}
