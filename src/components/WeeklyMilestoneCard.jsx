import React from 'react';

export function getWeeklyResult(days) {
  const successCount = days.filter(d => d.status === "success").length;
  const failCount = days.filter(d => d.status === "fail").length;
  const uncheckedCount = days.filter(d => d.status === "unchecked").length;

  if (successCount === 0 && failCount === 0 && uncheckedCount === 7) {
    return "미시작";
  }
  if (successCount >= 5) {
    return "달성";
  }
  if (uncheckedCount > 0) {
    return "진행 중";
  }
  return "미달성";
}

function WeeklyMilestoneCard({ week, days, planStartDate }) {
  const getStatusStyles = (status) => {
    switch (status) {
      case "success":
        return {
          bg: "#D1FAE5",
          color: "#065F46",
          border: "1px solid #10B981",
          text: "성공"
        };
      case "fail":
        return {
          bg: "#FEE2E2",
          color: "#991B1B",
          border: "1px solid #EF4444",
          text: "쉬어감"
        };
      case "unchecked":
      default:
        return {
          bg: "#F3F4F6",
          color: "#9CA3AF",
          border: "1px solid #E5E7EB",
          text: "미체크"
        };
    }
  };

  const getDayName = (idx) => {
    const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"];
    if (!planStartDate) return daysOfWeek[(1 + idx) % 7]; // default starting from Monday (1)
    const start = new Date(planStartDate);
    const startDayOfWeek = start.getDay();
    return daysOfWeek[(startDayOfWeek + idx) % 7];
  };

  return (
    <div style={{ marginBottom: 18 }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: "#4B5563", margin: "0 0 10px" }}>이번 주 마일스톤</p>
      
      {/* 7일 가로 선형 마일스톤 UI */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        margin: "8px 0 14px",
        position: "relative",
        padding: "0 2px"
      }}>
        {days.map((d, idx) => {
          const cfg = getStatusStyles(d.status);
          const dayName = getDayName(idx);
          return (
            <React.Fragment key={idx}>
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                zIndex: 2,
                position: "relative"
              }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: cfg.bg,
                    color: cfg.color,
                    border: cfg.border,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.02)",
                    userSelect: "none"
                  }}
                >
                  {dayName}
                </div>
                <span style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: cfg.color,
                  whiteSpace: "nowrap"
                }}>
                  {cfg.text}
                </span>
              </div>
              
              {idx < days.length - 1 && (
                <div style={{
                  flex: 1,
                  height: 2,
                  borderBottom: "2px dashed #E5E7EB",
                  margin: "0 -4px",
                  transform: "translateY(-8px)",
                  zIndex: 1
                }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

export default WeeklyMilestoneCard;
