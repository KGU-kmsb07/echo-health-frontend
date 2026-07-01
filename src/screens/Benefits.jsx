import { useEffect, useMemo, useState } from "react";
import S from "../styles/shared";
import { useHealth } from "../context/HealthContext";
import { loadMileage } from "../storage/localStore";
import { searchBenefits } from "../api/echoApi";

const REGIONS = [
  "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
  "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"
];

const QUICK_KEYWORDS = ["건강", "금연", "건강검진", "운동", "비만", "고혈압", "당뇨"];
const PAGE_SIZE = 10;

function BenefitsScreen({ back }) {
  const { user, risks } = useHealth();
  const [activeSubTab, setActiveSubTab] = useState(() => {
    const savedTab = localStorage.getItem("echo-health-benefits-tab");
    return savedTab === "mileage" ? "mileage" : "local";
  });
  const [query, setQuery] = useState("건강");
  const [selectedRegion, setSelectedRegion] = useState(user?.region || "");
  const [benefits, setBenefits] = useState([]);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [mileageData, setMileageData] = useState({ total: 0, logs: [] });
  const [selectedDistrict, setSelectedDistrict] = useState(user?.district || "");
  const [sortOrder, setSortOrder] = useState("latest");
  const [page, setPage] = useState(1);

  const locationLabel = selectedDistrict || selectedRegion || "전국";
  const personalizedQuery = (baseQuery) => {
    const terms = [baseQuery.trim() || "건강"];
    if ((risks?.hypertension ?? 0) >= 0.35) terms.push("고혈압 혈압");
    if ((risks?.diabetes ?? 0) >= 0.35) terms.push("당뇨 혈당");
    if ((risks?.obesity ?? 0) === 1) terms.push("비만 체중 운동");
    return [...new Set(terms.join(" ").split(/\s+/).filter(Boolean))].join(" ");
  };

  const refreshMileage = () => {
    setMileageData(loadMileage());
  };

  const loadBenefits = async (nextQuery = query, nextRegion = selectedRegion, nextDistrict = selectedDistrict) => {
    setStatus("loading");
    setMessage("");
    setPage(1);
    const result = await searchBenefits({
      query: personalizedQuery(nextQuery),
      region: nextDistrict || nextRegion,
      perPage: 1000
    });

    if (!result) {
      setBenefits([]);
      setStatus("error");
      setMessage("정부24 혜택 정보를 불러오지 못했습니다.");
      return;
    }

    setBenefits(result.benefits || []);
    setStatus(result.status === "fallback" ? "fallback" : "success");
    setMessage(result.status === "fallback" ? "정부24 연결 실패로 임시 데이터를 표시합니다." : "");
  };

  useEffect(() => {
    refreshMileage();
    localStorage.setItem("echo-health-benefits-tab", activeSubTab);
  }, [activeSubTab]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") refreshMileage();
    };
    const onBenefitsLocal = () => setActiveSubTab("local");
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", refreshMileage);
    window.addEventListener("echo-health-benefits-local", onBenefitsLocal);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", refreshMileage);
      window.removeEventListener("echo-health-benefits-local", onBenefitsLocal);
    };
  }, []);

  useEffect(() => {
    if (activeSubTab === "local") loadBenefits(query, selectedRegion, selectedDistrict);
  }, [activeSubTab]);

  const reversedLogs = useMemo(() => [...(mileageData.logs || [])].reverse(), [mileageData.logs]);
  const sortedBenefits = useMemo(() => {
    const getDeadlineRank = (benefit) => {
      const text = benefit.applicationDeadline || "";
      if (text.includes("상시")) return Number.MAX_SAFE_INTEGER;
      const match = text.match(/20\d{2}[.\-/년\s]*(\d{1,2})?[.\-/월\s]*(\d{1,2})?/);
      if (!match) return Number.MAX_SAFE_INTEGER - 1;
      const year = Number(match[0].match(/20\d{2}/)?.[0]);
      const month = Number(match[1] || 12);
      const day = Number(match[2] || 31);
      return new Date(year, month - 1, day).getTime();
    };

    return [...benefits].sort((a, b) => {
      if (sortOrder === "deadline") return getDeadlineRank(a) - getDeadlineRank(b);
      return String(b.id || b.title || "").localeCompare(String(a.id || a.title || ""));
    });
  }, [benefits, sortOrder]);
  const totalPages = Math.max(1, Math.ceil(sortedBenefits.length / PAGE_SIZE));
  const pagedBenefits = sortedBenefits.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const movePage = (nextPage) => {
    const clamped = Math.min(totalPages, Math.max(1, nextPage));
    setPage(clamped);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getLogTypeLabel = (type) => {
    switch (type) {
      case "todo_check": return "개별 실천 완료";
      case "day_complete": return "하루 목표 완료";
      case "day_final": return "하루 목표 보너스";
      case "week_streak": return "7일 연속 달성";
      case "exercise_day": return "일일 운동";
      case "exercise_streak_7": return "7일 연속 운동";
      case "program_complete": return "4주 프로그램 달성";
      case "plan_cancel": return "포인트 조정";
      default: return "건강 실천 적립";
    }
  };

  const submitSearch = (event) => {
    event.preventDefault();
    loadBenefits(query, selectedRegion, selectedDistrict);
  };

  if (!user) {
    return <div style={{ padding: 20, textAlign: "center" }}>로딩 중...</div>;
  }

  return (
    <div style={S.screen}>
      <div style={{ ...S.topBar, borderBottom: "1px solid #F3F4F6", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "stretch", textAlign: "center" }}>
          <button
            onClick={back}
            style={{ width: 48, border: "none", background: "none", fontSize: 20, cursor: "pointer", color: "#374151" }}
          >
            ←
          </button>
          <button
            onClick={() => setActiveSubTab("local")}
            style={{
              flex: 1,
              padding: "14px 0",
              border: "none",
              background: "none",
              fontSize: 15,
              fontWeight: activeSubTab === "local" ? 700 : 500,
              color: activeSubTab === "local" ? "#2563EB" : "#6B7280",
              borderBottom: activeSubTab === "local" ? "3px solid #2563EB" : "3px solid transparent",
              cursor: "pointer"
            }}
          >
            정부 건강 혜택
          </button>
          <button
            onClick={() => setActiveSubTab("mileage")}
            style={{
              flex: 1,
              padding: "14px 0",
              border: "none",
              background: "none",
              fontSize: 15,
              fontWeight: activeSubTab === "mileage" ? 700 : 500,
              color: activeSubTab === "mileage" ? "#2563EB" : "#6B7280",
              borderBottom: activeSubTab === "mileage" ? "3px solid #2563EB" : "3px solid transparent",
              cursor: "pointer"
            }}
          >
            건강 마일리지
          </button>
        </div>
      </div>

      <div style={{ ...S.scrollArea, paddingTop: 52 }}>
        {activeSubTab === "mileage" ? (
          <div style={{ padding: "20px 16px 16px" }}>
            <div style={{
              background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
              borderRadius: 16,
              padding: 24,
              color: "#fff",
              marginBottom: 20,
              textAlign: "center"
            }}>
              <p style={{ margin: "0 0 8px", fontSize: 13, opacity: 0.9, fontWeight: 500 }}>나의 누적 건강 마일리지</p>
              <h1 style={{ margin: 0, fontSize: 36, fontWeight: 800 }}>
                {mileageData.total.toLocaleString()} <span style={{ fontSize: 18, fontWeight: 500 }}>pt</span>
              </h1>
            </div>

            <div style={S.card}>
              <p style={{ fontWeight: 700, fontSize: 15, margin: "0 0 12px", color: "#1F2937" }}>포인트 적립 내역</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {reversedLogs.length > 0 ? (
                  reversedLogs.map((log, idx) => (
                    <div key={`${log.date || log.todoId || "log"}-${idx}`} style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingBottom: 10,
                      borderBottom: idx === reversedLogs.length - 1 ? "none" : "1px solid #F3F4F6"
                    }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", margin: "0 0 2px" }}>
                          {getLogTypeLabel(log.type)}
                        </p>
                        <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0 }}>
                          {log.date || log.todoId || ""}
                        </p>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: log.points < 0 ? "#EF4444" : "#2563EB" }}>
                        {log.points > 0 ? "+" : ""}{log.points} pt
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: "center", padding: "24px 0", color: "#9CA3AF", fontSize: 13 }}>
                    아직 적립된 마일리지가 없습니다.<br />매일 실천 플랜을 달성해 포인트를 모아보세요.
                  </div>
                )}
              </div>
            </div>

            <div style={{ background: "#F3F4F6", borderRadius: 12, padding: 16, border: "1px solid #E5E7EB" }}>
              <p style={{ fontSize: 12, color: "#4B5563", margin: "0 0 4px", fontWeight: 700 }}>마일리지 사용 안내</p>
              <p style={{ fontSize: 11, color: "#6B7280", margin: 0, lineHeight: 1.5 }}>
                꾸준한 실천 기록은 향후 건강지원금 사업 참여 가능성을 보여주는 참고 자료로 활용할 수 있습니다.
              </p>
            </div>
          </div>
        ) : (
          <div style={{ padding: "20px 16px 16px" }}>
            <h2 style={{ fontWeight: 700, fontSize: 18, margin: "0 0 2px", color: "#1F2937" }}>정부 건강 혜택 찾기</h2>
            <p style={{ fontSize: 12, color: "#6B7280", margin: "0 0 14px" }}>
              정부24 공공서비스 목록에서 {locationLabel} 기준 혜택을 검색합니다.
            </p>

            <form onSubmit={submitSearch} style={{ display: "grid", gap: 8, marginBottom: 12 }}>
              <select
                value={selectedRegion}
                onChange={(event) => {
                  setSelectedRegion(event.target.value);
                  setSelectedDistrict("");
                }}
                style={{
                  border: "1px solid #E5E7EB",
                  borderRadius: 10,
                  padding: "12px 14px",
                  fontSize: 14,
                  background: "#fff"
                }}
              >
                <option value="">전국</option>
                {REGIONS.map((region) => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
              <input
                value={selectedDistrict}
                onChange={(event) => setSelectedDistrict(event.target.value)}
                placeholder="시군구"
                style={{
                  border: "1px solid #E5E7EB",
                  borderRadius: 10,
                  padding: "12px 14px",
                  fontSize: 14,
                  outline: "none"
                }}
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="예: 금연, 건강검진, 운동"
                style={{
                  border: "1px solid #E5E7EB",
                  borderRadius: 10,
                  padding: "12px 14px",
                  fontSize: 14,
                  outline: "none"
                }}
              />
              <button type="submit" style={{ ...S.btn("primary"), width: "100%" }} disabled={status === "loading"}>
                {status === "loading" ? "검색 중..." : "혜택 검색"}
              </button>
            </form>

            <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 14 }}>
              {QUICK_KEYWORDS.map((keyword) => (
                <button
                  key={keyword}
                  type="button"
                  onClick={() => {
                    setQuery(keyword);
                    loadBenefits(keyword, selectedRegion, selectedDistrict);
                  }}
                  style={S.chip(query === keyword)}
                >
                  {keyword}
                </button>
              ))}
            </div>

            {message && (
              <div style={{ background: "#FEF3C7", color: "#92400E", borderRadius: 10, padding: "10px 12px", fontSize: 12, marginBottom: 12 }}>
                {message}
              </div>
            )}

            {status === "loading" ? (
              <div style={{ ...S.card, textAlign: "center", color: "#6B7280" }}>정부24 혜택 정보를 불러오는 중입니다.</div>
            ) : sortedBenefits.length > 0 ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 12, color: "#6B7280" }}>총 {sortedBenefits.length}개</span>
                  <select
                    value={sortOrder}
                    onChange={(event) => {
                      setSortOrder(event.target.value);
                      setPage(1);
                    }}
                    style={{ border: "1px solid #E5E7EB", borderRadius: 8, padding: "8px 10px", fontSize: 12, background: "#fff" }}
                  >
                    <option value="latest">최신순</option>
                    <option value="deadline">마감기간 순</option>
                  </select>
                </div>
                {pagedBenefits.map((benefit) => (
                  <div key={benefit.id || benefit.title} style={{ ...S.card, marginBottom: 10 }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                      {(benefit.tags || []).map((tag) => <span key={tag} style={S.tag()}>{tag}</span>)}
                    </div>
                    <p style={{ fontWeight: 700, margin: "0 0 4px", color: "#111827" }}>{benefit.title}</p>
                    <p style={{ fontSize: 12, color: "#2563EB", margin: "0 0 8px" }}>{benefit.provider}</p>
                    <p style={{ fontSize: 13, color: "#4B5563", margin: "0 0 8px", lineHeight: 1.45 }}>
                      {benefit.summary || benefit.supportContent || "요약 정보가 제공되지 않았습니다."}
                    </p>
                    {benefit.target && (
                      <p style={{ fontSize: 12, color: "#6B7280", margin: "0 0 6px", lineHeight: 1.45 }}>
                        지원대상: {benefit.target}
                      </p>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginTop: 10 }}>
                      <span style={{ fontSize: 11, color: "#9CA3AF" }}>{benefit.applicationDeadline}</span>
                      {benefit.sourceUrl ? (
                        <a href={benefit.sourceUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#2563EB", fontWeight: 700, textDecoration: "none" }}>
                          자세히 보기
                        </a>
                      ) : (
                        <span style={{ fontSize: 12, color: "#9CA3AF" }}>상세 링크 없음</span>
                      )}
                    </div>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
                  <button type="button" onClick={() => movePage(page - 1)} disabled={page === 1} style={{ ...S.btn("outline"), width: "auto", padding: "10px 14px", opacity: page === 1 ? 0.45 : 1 }}>이전</button>
                  <span style={{ fontSize: 12, color: "#6B7280" }}>{page} / {totalPages}</span>
                  <button type="button" onClick={() => movePage(page + 1)} disabled={page === totalPages} style={{ ...S.btn("outline"), width: "auto", padding: "10px 14px", opacity: page === totalPages ? 0.45 : 1 }}>다음</button>
                </div>
              </>
            ) : (
              <div style={{ ...S.card, textAlign: "center", padding: "30px 20px" }}>
                <p style={{ color: "#9CA3AF", fontSize: 14, margin: 0 }}>
                  조건에 맞는 혜택이 아직 없습니다. 다른 검색어로 다시 찾아보세요.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default BenefitsScreen;

