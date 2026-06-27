function LoadingScreen({ message = "로딩 중" }) {
  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "#fff",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      zIndex: 500
    }}>
      <div style={{
        width: 44, height: 44,
        border: "3px solid #E5E7EB",
        borderTop: "3px solid #2563EB",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite"
      }} />
      <p style={{
        marginTop: 20, fontSize: 15,
        color: "#6B7280", fontWeight: 500
      }}>
        {message}
      </p>
    </div>
  );
}

export default LoadingScreen;
