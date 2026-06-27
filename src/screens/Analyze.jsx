import S from '../styles/shared';
import { ProgressBar } from '../components/Card';
import { useHealth } from '../context/HealthContext';

const statusColors = (status) => {
  if (status === "양호" || status === "정상") return { bg: "#D1FAE5", text: "#065F46" };
  if (status === "주의") return { bg: "#FEF3C7", text: "#92400E" };
  if (status === "미측정" || status === "-" || status === "연결 안됨.") return { bg: "#F3F4F6", text: "#6B7280" };
  return { bg: "#FEE2E2", text: "#991B1B" };
};

function riskLevel(value) {
  if (value === null || value === undefined)
    return { label: "미측정", color: "#9CA3AF", dot: "⚪" };
  if (value >= 60) return { label: "위험군", color: "#DC2626", dot: "🔴" };
  if (value >= 35) return { label: "주의",   color: "#D97706", dot: "🟡" };
  return              { label: "정상",   color: "#16A34A", dot: "🟢" };
}

function AnalyzeScreen({ setScreen, back }) {
  const { user, risks, wearData, showLoading, hideLoading, navigateWithLoading } = useHealth();

  const handleGoToFuture = () => {
    navigateWithLoading(setScreen, "future", 800, "분석 중...");
  };

  if (!user) {
    return <div style={{ padding: 20, textAlign: "center" }}>로딩 중...</div>;
  }

  // BMI: height와 weight 둘 다 있을 때만 계산
  const hasBmi = user.height != null && user.weight != null;
  const bmiValue = hasBmi
    ? (() => {
        const h = user.height / 100;
        return +(user.weight / (h * h)).toFixed(1);
      })()
    : null;
  const bmiStatus = bmiValue === null ? "미측정"
    : bmiValue >= 25 ? "비만"
    : bmiValue >= 23 ? "과체중"
    : "정상";

  const hasBP = user.bloodPressure?.systolic != null && user.bloodPressure?.diastolic != null;
  const bpValue = hasBP
    ? `${user.bloodPressure.systolic}/${user.bloodPressure.diastolic}mmHg`
    : "-";

  return (
    <div style={S.screen}>
      <div style={{ background: "#fff", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={back} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>←</button>
        <span style={{ fontWeight: 700, fontSize: 16 }}>현재 건강 분석</span>
      </div>
      <div style={S.scrollArea}>
        <div style={{ padding: 16 }}>
          <div style={{ background: "#EFF6FF", borderRadius: 12, padding: "10px 14px", marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: "#1D4ED8", margin: 0 }}>입력한 기본 정보와 Wear OS 연동 데이터를 바탕으로 현재 건강 위험도를 추정했어요.</p>
            <p style={{ fontSize: 12, color: "#1D4ED8", fontWeight: 600, margin: "4px 0 0" }}>KNHANES 2022 기준·동연령·성별 집단 비교</p>
          </div>

          {/* 위험도 신호등 */}
          <div style={{ ...S.card, marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#111", margin: "0 0 12px" }}>질환 위험도</p>
            <div style={{ display: "flex", justifyContent: "space-around" }}>
              {[
                { label: "당뇨",    key: "diabetes" },
                { label: "고혈압",  key: "hypertension" },
                { label: "대사증후군", key: "metabolic" },
                { label: "비만",    key: "obesity" },
              ].map(({ label, key }) => {
                const val = risks?.[key] ?? null;
                const rl = riskLevel(val);
                return (
                  <div key={key} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{rl.dot}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: rl.color }}>{rl.label}</div>
                    <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 2 }}>{label}</div>
                    {val != null && (
                      <div style={{ fontSize: 11, color: rl.color, fontWeight: 600 }}>{val}%</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {["자동 계산", "직접 입력"].map((t, i) => (
              <span key={t} style={{ padding: "4px 10px", borderRadius: 20, background: i === 0 ? "#EFF6FF" : "#F3F4F6", color: i === 0 ? "#2563EB" : "#6B7280", fontSize: 12, fontWeight: i === 0 ? 600 : 400 }}>{t}</span>
            ))}
          </div>

          {[
            {
              label: "BMI",
              badge: "자동 계산",
              status: bmiStatus,
              value: bmiValue !== null ? `${bmiValue}` : "-",
              rank: bmiValue !== null ? "상위 68%" : "-",
              pct: bmiValue !== null ? 68 : 0,
              color: bmiValue === null ? "#9CA3AF" : (bmiValue >= 23 ? "#F59E0B" : "#10B981"),
              normal: "정상범위: 18.5~23"
            },
            {
              label: "혈압",
              badge: "직접 입력",
              status: !hasBP ? "미측정" : (user.bloodPressure.systolic >= 130 ? "주의" : "정상"),
              value: bpValue,
              rank: hasBP ? "상위 65%" : "-",
              pct: hasBP ? 65 : 0,
              color: !hasBP ? "#9CA3AF" : "#EF4444",
              normal: "정상범위: < 120"
            },
            {
              label: "운동빈도",
              badge: "직접 입력",
              status: !user.exercise ? "미측정" : "부족",
              value: user.exercise || "-",
              rank: user.exercise ? "상위 25%" : "-",
              pct: user.exercise ? 25 : 0,
              color: !user.exercise ? "#9CA3AF" : "#EF4444",
              normal: "정상범위: 주 3회 이상"
            },
            {
              label: "흡연",
              badge: "직접 입력",
              status: !user.smoking ? "미측정" : (user.smoking === "비흡연" ? "양호" : "주의"),
              value: user.smoking || "-",
              rank: user.smoking ? "상위 100%" : "-",
              pct: user.smoking ? 100 : 0,
              color: !user.smoking ? "#9CA3AF" : (user.smoking === "비흡연" ? "#10B981" : "#EF4444"),
              normal: "정상범위: 비흡연"
            },
            {
              label: "음주",
              badge: "직접 입력",
              status: !user.drinking ? "미측정" : "주의",
              value: user.drinking || "-",
              rank: user.drinking ? "상위 55%" : "-",
              pct: user.drinking ? 55 : 0,
              color: !user.drinking ? "#9CA3AF" : "#F59E0B",
              normal: "정상범위: < 2"
            },
          ].map(item => {
            const colors = statusColors(item.status);
            return (
              <div key={item.label} style={{ ...S.card, marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontWeight: 600 }}>{item.label}</span>
                    <span style={{ ...S.tag("#F3F4F6", "#6B7280"), fontSize: 10 }}>{item.badge}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ ...S.tag(colors.bg, colors.text), fontSize: 11 }}>{item.status}</span>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{item.value}</span>
                  </div>
                </div>
                <ProgressBar pct={item.pct} color={item.color} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                  <span style={{ fontSize: 11, color: "#9CA3AF" }}>{item.normal}</span>
                  <span style={{ fontSize: 11, color: "#9CA3AF" }}>{item.rank}</span>
                </div>
              </div>
            );
          })}

          {/* AI 요약 */}
          <div style={{ ...S.card, background: "#F8F9FF", border: "1px solid #E0E7FF" }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8 }}>
              <span>✨</span><span style={{ fontWeight: 600, color: "#4338CA" }}>AI 요약</span>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0, color: "#374151" }}>
              BMI({bmiValue ?? "-"})·혈압({hasBP ? user.bloodPressure.systolic : "-"}mmHg)이 경계 수준이며,
              활동량이 목표의 {user.steps != null ? Math.round(user.steps / 8000 * 100) : "-"}%에 불과합니다.
              운동빈도도 권장 기준 미달입니다. 이 패턴은{" "}
              <span style={{ color: "#EF4444", fontWeight: 600 }}>심혈관 위험군의 초기 징후</span>입니다.
            </p>
          </div>
          <button onClick={handleGoToFuture} style={{ ...S.btn(), marginTop: 8 }}>미래 나 보기 &gt;</button>
        </div>
      </div>
    </div>
  );
}

export default AnalyzeScreen;
