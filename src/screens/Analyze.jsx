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

  const getBmiInfo = (bmi) => {
    if (bmi === null || bmi === undefined) return { status: "미측정", color: "#9CA3AF", pct: 0 };
    const val = Number(bmi);
    if (val >= 25) return { status: "비만", color: "#DC2626", pct: 100 };
    if (val >= 23) return { status: "과체중", color: "#F59E0B", pct: 66 };
    return { status: "정상", color: "#10B981", pct: 33 };
  };

  const getBpInfo = (bp) => {
    if (!bp || bp.systolic === null || bp.systolic === undefined) return { status: "미측정", color: "#9CA3AF", pct: 0 };
    const sys = Number(bp.systolic);
    const dia = Number(bp.diastolic);
    if (sys >= 140 || dia >= 90) return { status: "고혈압", color: "#DC2626", pct: 100 };
    if (sys <= 120 && dia <= 80) return { status: "정상", color: "#10B981", pct: 33 };
    if (sys >= 121 || dia >= 81) return { status: "주의", color: "#F59E0B", pct: 66 };
    return { status: "정상", color: "#10B981", pct: 33 };
  };

  const getExerciseInfo = (ex) => {
    if (!ex) return { status: "미측정", color: "#9CA3AF", pct: 0 };
    if (ex === "매일" || ex === "주 5회 이상" || ex === "5일 이상") return { status: "최상", color: "#10B981", pct: 100 };
    if (ex === "주 3~4회" || ex === "주 3-4회" || ex === "3~4일") return { status: "양호", color: "#10B981", pct: 75 };
    if (ex === "주 1~2회" || ex === "주 1-2회" || ex === "1~2일") return { status: "보통", color: "#F59E0B", pct: 50 };
    return { status: "부족", color: "#DC2626", pct: 25 };
  };

  const getSmokingInfo = (sm) => {
    if (!sm) return { status: "미측정", color: "#9CA3AF", pct: 0 };
    if (sm === "현재 흡연") return { status: "위험", color: "#DC2626", pct: 100 };
    if (sm === "과거 흡연") return { status: "주의", color: "#F59E0B", pct: 66 };
    return { status: "양호", color: "#10B981", pct: 33 };
  };

  const getDrinkingInfo = (dr) => {
    if (!dr) return { status: "미측정", color: "#9CA3AF", pct: 0 };
    if (dr === "주 3회 이상") return { status: "위험", color: "#DC2626", pct: 100 };
    if (dr === "주 1~2회") return { status: "주의", color: "#F59E0B", pct: 75 };
    if (dr === "월 1~3회") return { status: "보통", color: "#F59E0B", pct: 50 };
    return { status: "양호", color: "#10B981", pct: 25 };
  };

  const bmiInfo = getBmiInfo(bmiValue);
  const bpInfo = getBpInfo(user.bloodPressure);
  const exInfo = getExerciseInfo(user.exercise);
  const smInfo = getSmokingInfo(user.smoking);
  const drInfo = getDrinkingInfo(user.drinking);
  const bpSummary = hasBP
    ? `혈압(${user.bloodPressure.systolic}/${user.bloodPressure.diastolic}mmHg)은 ${bpInfo.status} 범위입니다`
    : "혈압은 아직 측정되지 않았습니다";

  const indicators = [
    {
      label: "BMI",
      badge: "자동 계산",
      status: bmiInfo.status,
      value: bmiValue !== null ? `${bmiValue}` : "-",
      rank: bmiValue !== null ? (bmiValue >= 25 ? "상위 85%" : bmiValue >= 23 ? "상위 68%" : "상위 30%") : "-",
      pct: bmiInfo.pct,
      color: bmiInfo.color,
      normal: "정상범위: 18.5~23"
    },
    {
      label: "혈압",
      badge: "직접 입력",
      status: bpInfo.status,
      value: bpValue,
      rank: hasBP ? (user.bloodPressure.systolic >= 140 || user.bloodPressure.diastolic >= 90 ? "상위 90%" : user.bloodPressure.systolic > 120 || user.bloodPressure.diastolic > 80 ? "상위 65%" : "상위 20%") : "-",
      pct: bpInfo.pct,
      color: bpInfo.color,
      normal: "정상범위: 120/80mmHg 이하"
    },
    {
      label: "운동빈도",
      badge: "직접 입력",
      status: exInfo.status,
      value: user.exercise || "-",
      rank: user.exercise ? (["거의 안 함", "0일"].includes(user.exercise) ? "상위 95%" : "상위 35%") : "-",
      pct: exInfo.pct,
      color: exInfo.color,
      normal: "정상범위: 주 3회 이상"
    },
    {
      label: "흡연",
      badge: "직접 입력",
      status: smInfo.status,
      value: user.smoking || "-",
      rank: user.smoking ? (user.smoking === "비흡연" ? "상위 40%" : "상위 100%") : "-",
      pct: smInfo.pct,
      color: smInfo.color,
      normal: "정상범위: 비흡연"
    },
    {
      label: "음주",
      badge: "직접 입력",
      status: drInfo.status,
      value: user.drinking || "-",
      rank: user.drinking ? (["거의 안 함", "안함"].includes(user.drinking) ? "상위 30%" : "상위 70%") : "-",
      pct: drInfo.pct,
      color: drInfo.color,
      normal: "정상범위: 안함"
    }
  ];

  return (
    <div style={S.screen}>
      <div style={{ ...S.topBar, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0, borderBottom: "1px solid #F3F4F6" }}>
        <button onClick={back} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>←</button>
        <span style={{ fontWeight: 700, fontSize: 16 }}>현재 건강 분석</span>
      </div>
      <div style={{ ...S.scrollArea, paddingTop: 57 }}>
        <div style={{ padding: 16 }}>
          <div style={{ background: "#EFF6FF", borderRadius: 12, padding: "10px 14px", marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: "#1D4ED8", margin: 0 }}>입력한 기본 정보와 Wear OS 연동 데이터를 바탕으로 현재 건강 위험도를 추정했어요.</p>
            <p style={{ fontSize: 12, color: "#1D4ED8", fontWeight: 600, margin: "4px 0 0" }}>KNHANES 2024 기준·동연령·성별 집단 비교</p>
          </div>

          {/* 위험도 신호등 */}
          <div style={{ ...S.card, marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#111", margin: "0 0 12px" }}>질환 위험도</p>
            <div style={{ display: "flex", justifyContent: "space-around" }}>
              {[
                { label: "당뇨",       key: "diabetes" },
                { label: "고혈압",     key: "hypertension" },
                { label: "대사증후군", key: "metabolic" },
                { label: "비만",       key: "obesity" },
              ].map(({ label, key }) => {
                let val = risks?.[key] ?? null;
                if (val !== null) {
                  if (key === "diabetes" || key === "hypertension" || key === "metabolic") {
                    val = val * 100;
                  } else if (key === "obesity") {
                    val = val === 1 ? 75 : 10;
                  }
                }
                const rl = riskLevel(val);
                return (
                  <div key={key} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{rl.dot}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: rl.color }}>{rl.label}</div>
                    <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 2 }}>{label}</div>
                    {val != null && (
                      <div style={{ fontSize: 11, color: rl.color, fontWeight: 600 }}>{Math.round(val)}%</div>
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

          {indicators.map(item => {
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
              BMI({bmiValue ?? "-"})와 {bpSummary}.
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
