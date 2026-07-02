import { useState, useRef } from "react";
import S from '../styles/shared';
import { runCoach } from '../services/coachService';
import { useHealth } from '../context/HealthContext';

const QUICK_CHAT_HINTS = ["혈압을 낮추려면?", "간암 예방 정보", "적정 체중 목표"];

function CoachScreen({ setScreen }) {
  const { user, risks, userProfile, predictedProfile } = useHealth();
  const [messages, setMessages] = useState(() => {
    return [
      {
        role: "ai",
        text: `${user?.name || '안녕하세요'}님, 무엇이 궁금하신가요?`,
        source: "출처: Echo Health AI"
      }
    ];
  });
  const [input, setInput] = useState("");
  const endRef = useRef(null);
  const [startY, setStartY] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleTouchStart = (e) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e) => {
    if (startY <= 0) return;
    const endY = e.changedTouches[0].clientY;
    if (endY - startY > 80) {
      setScreen("home");
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
      setScreen("home");
    }
    setStartY(0);
  };

  const send = async (text) => {
    const msg = text || input;
    if (!msg.trim() || loading) return;

    // 1. 유저 메시지 갱신 및 로딩 표시
    const userMessage = { role: "user", text: msg };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

    try {
      // 2. 실제 API 호출
      const response = await runCoach([...messages, userMessage], userProfile, predictedProfile);
      
      // 3. 성공 시 응답 추가
      setMessages(prev => [...prev, {
        role: "ai",
        text: response.reply || response.text,
        source: response.source
      }]);
    } catch (e) {
      // 4. 실패 시 fallback 처리
      setMessages(prev => [...prev, {
        role: "ai",
        text: "현재 API 연결이 되어있지 않습니다. 관리자에게 문의하세요.",
        source: "서비스 점검 중"
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };
  return (
    <div 
      style={{ 
        display: "flex", 
        flexDirection: "column", 
        height: "100dvh", 
        maxHeight: "100%", 
        background: "#F8F9FB", 
        overflow: "hidden", 
        position: "relative" 
      }}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onMouseUp={handleMouseUp}
    >
      <div 
        className="drag-zone"
        style={{ flexShrink: 0, display: "flex", flexDirection: "column", userSelect: "none", WebkitUserSelect: "none" }}
        onTouchStart={handleTouchStart}
        onMouseDown={handleMouseDown}
        onDragStart={e => e.preventDefault()}
      >
        {/* 드래그 핸들 */}
        <div style={{
          width: 36, height: 4, borderRadius: 2,
          background: "#E5E7EB", margin: "10px auto 2px",
          flexShrink: 0
        }} />
        {/* 헤더 */}
        <div style={{ background: "#fff", padding: "12px 16px 12px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid #F3F4F6", flexShrink: 0 }}>
          <button onClick={() => setScreen("home")} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>←</button>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🤖</div>
          <div>
            <p style={{ fontWeight: 700, margin: 0, fontSize: 14 }}>AI 건강 코치</p>
            <p style={{ fontSize: 11, color: "#10B981", margin: 0 }}>● 공공 데이터 기반 답변</p>
          </div>
        </div>
      </div>
      {/* 의료 면책 배지 */}
      <div style={{ background: "#FEF3C7", padding: "8px 16px", fontSize: 12, color: "#92400E", display: "flex", gap: 6, flexShrink: 0 }}>
        <span>⚠️</span><span>의료 진단이 아닙니다 · 의료진과 상담하시길 권장합니다</span>
      </div>
      {/* 메시지 리스트 */}
      <div style={{ flex: "1 1 auto", overflowY: "auto", padding: "16px 16px 20px", display: "flex", flexDirection: "column", gap: 12, minHeight: 0 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{ maxWidth: "80%" }}>
              <div style={{ background: m.role === "user" ? "#2563EB" : "#F3F4F6", color: m.role === "user" ? "#fff" : "#111", borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", padding: "12px 14px", fontSize: 14, lineHeight: 1.5 }}>
                {m.text}
              </div>
              {m.source && <p style={{ fontSize: 10, color: "#9CA3AF", margin: "3px 4px 0" }}>{m.source}</p>}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <style>{`
              @keyframes bounceDot {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-5px); }
              }
              .dot-bounce {
                display: inline-block;
                width: 6px;
                height: 6px;
                background-color: #9CA3AF;
                border-radius: 50%;
                margin: 0 2px;
                animation: bounceDot 0.8s infinite ease-in-out;
              }
              .dot-bounce:nth-child(1) { animation-delay: -0.32s; }
              .dot-bounce:nth-child(2) { animation-delay: -0.16s; }
            `}</style>
            <div style={{ maxWidth: "80%" }}>
              <div style={{ 
                background: "#F3F4F6", 
                borderRadius: "16px 16px 16px 4px", 
                padding: "16px 22px", 
                display: "flex", 
                alignItems: "center", 
                gap: 2, 
                height: 22
              }}>
                <div className="dot-bounce"></div>
                <div className="dot-bounce"></div>
                <div className="dot-bounce"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      {/* 하단 입력창 */}
      <div style={{ flex: "0 0 auto", background: "#fff", borderTop: "1px solid #F3F4F6", padding: "10px 16px calc(20px + env(safe-area-inset-bottom))", position: "relative" }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 8, overflowX: "auto" }}>
          {QUICK_CHAT_HINTS.map(h => (
            <button key={h} onClick={() => send(h)} style={{ whiteSpace: "nowrap", padding: "5px 12px", borderRadius: 20, border: "1px solid #E5E7EB", background: "#fff", fontSize: 12, cursor: "pointer", color: "#374151" }}>{h}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="건강 관련 질문을 입력하세요..." style={{ flex: 1, border: "1px solid #E5E7EB", borderRadius: 24, padding: "10px 16px", fontSize: 14, outline: "none" }} />
          <button onClick={() => send()} style={{ width: 42, height: 42, borderRadius: "50%", background: "#2563EB", border: "none", color: "#fff", fontSize: 18, cursor: "pointer" }}>↑</button>
        </div>
      </div>
    </div>
  );
}

export default CoachScreen;
