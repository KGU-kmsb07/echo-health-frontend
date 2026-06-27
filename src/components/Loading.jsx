function Loading({ message = "로딩 중..." }) {
  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(255,255,255,0.85)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      zIndex: 400
    }}>
      {/* 스피너 */}
      <div style={{
        width: 40, height: 40,
        border: "3px solid #E5E7EB",
        borderTop: "3px solid #2563EB",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite"
      }} />
      <p style={{
        marginTop: 16, fontSize: 14,
        color: "#6B7280", fontWeight: 500
      }}>
        {message}
      </p>
    </div>
  );
}

export default Loading;
