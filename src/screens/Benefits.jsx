import { useEffect, useMemo, useState } from "react";
import S from "../styles/shared";
import { useHealth } from "../context/HealthContext";
import { loadMileage } from "../storage/localStore";
import { searchBenefits } from "../api/echoApi";

const REGIONS = [
  "국가기관", "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
  "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"
];

const DISTRICTS = {
  서울: ["종로구", "중구", "용산구", "성동구", "광진구", "동대문구", "중랑구", "성북구", "강북구", "도봉구", "노원구", "은평구", "서대문구", "마포구", "양천구", "강서구", "구로구", "금천구", "영등포구", "동작구", "관악구", "서초구", "강남구", "송파구", "강동구"],
  부산: ["중구", "서구", "동구", "영도구", "부산진구", "동래구", "남구", "북구", "해운대구", "사하구", "금정구", "강서구", "연제구", "수영구", "사상구", "기장군"],
  대구: ["중구", "동구", "서구", "남구", "북구", "수성구", "달서구", "달성군", "군위군"],
  인천: ["중구", "동구", "미추홀구", "연수구", "남동구", "부평구", "계양구", "서구", "강화군", "옹진군"],
  광주: ["동구", "서구", "남구", "북구", "광산구"],
  대전: ["동구", "중구", "서구", "유성구", "대덕구"],
  울산: ["중구", "남구", "동구", "북구", "울주군"],
  세종: ["세종시"],
  경기: ["수원시", "성남시", "고양시", "용인시", "부천시", "안산시", "안양시", "남양주시", "화성시", "평택시", "의정부시", "시흥시", "파주시", "김포시", "광명시", "광주시", "군포시", "하남시", "오산시", "양주시", "이천시", "구리시", "안성시", "포천시", "의왕시", "양평군", "여주시", "동두천시", "과천시", "가평군", "연천군"],
  강원: ["춘천시", "원주시", "강릉시", "동해시", "태백시", "속초시", "삼척시", "홍천군", "횡성군", "영월군", "평창군", "정선군", "철원군", "화천군", "양구군", "인제군", "고성군", "양양군"],
  충북: ["청주시", "충주시", "제천시", "보은군", "옥천군", "영동군", "증평군", "진천군", "괴산군", "음성군", "단양군"],
  충남: ["천안시", "공주시", "보령시", "아산시", "서산시", "논산시", "계룡시", "당진시", "금산군", "부여군", "서천군", "청양군", "홍성군", "예산군", "태안군"],
  전북: ["전주시", "군산시", "익산시", "정읍시", "남원시", "김제시", "완주군", "진안군", "무주군", "장수군", "임실군", "순창군", "고창군", "부안군"],
  전남: ["목포시", "여수시", "순천시", "나주시", "광양시", "담양군", "곡성군", "구례군", "고흥군", "보성군", "화순군", "장흥군", "강진군", "해남군", "영암군", "무안군", "함평군", "영광군", "장성군", "완도군", "진도군", "신안군"],
  경북: ["포항시", "경주시", "김천시", "안동시", "구미시", "영주시", "영천시", "상주시", "문경시", "경산시", "의성군", "청송군", "영양군", "영덕군", "청도군", "고령군", "성주군", "칠곡군", "예천군", "봉화군", "울진군", "울릉군"],
  경남: ["창원시", "진주시", "통영시", "사천시", "김해시", "밀양시", "거제시", "양산시", "의령군", "함안군", "창녕군", "고성군", "남해군", "하동군", "산청군", "함양군", "거창군", "합천군"],
  제주: ["제주시", "서귀포시"]
};

const PAGE_SIZE = 10;

function BenefitsScreen({ back }) {
  const { user, risks } = useHealth();
  const [activeSubTab, setActiveSubTab] = useState(() => {
    const savedTab = localStorage.getItem("echo-health-benefits-tab");
    return savedTab === "mileage" ? "mileage" : "local";
  });
  const [query, setQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState(user?.region || "");
  const [benefits, setBenefits] = useState([]);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [mileageData, setMileageData] = useState({ total: 0, logs: [] });
  const [selectedDistrict, setSelectedDistrict] = useState(user?.district || "");
  const [sortOrder, setSortOrder] = useState("latest");
  const [expandedTargets, setExpandedTargets] = useState({});
  const [page, setPage] = useState(1);

  const locationLabel = selectedDistrict || selectedRegion || "전국";

  const refreshMileage = () => {
    setMileageData(loadMileage());
  };

  const loadBenefits = async (nextQuery = query, nextRegion = selectedRegion, nextDistrict = selectedDistrict) => {
    setStatus("loading");
    setMessage("서버에서 정부24 혜택 정보를 받아오는 중입니다. 앱 오류가 아니니 잠시만 기다려주세요.");
    setPage(1);
    setExpandedTargets({});
    const riskTags = [];
    if ((risks?.hypertension ?? 0) >= 0.35) riskTags.push("hypertension");
    if ((risks?.diabetes ?? 0) >= 0.35) riskTags.push("diabetes");
    if ((risks?.obesity ?? 0) === 1) riskTags.push("obesity");
    if (String(user?.smoking || "").includes("흡연")) riskTags.push("smoking");

    const result = await searchBenefits({
      query: nextQuery.trim(),
      region: nextRegion,
      subRegion: nextDistrict,
      age: user?.age ?? "",
      gender: user?.gender ?? "",
      smoking: user?.smoking ?? "",
      risks: riskTags,
      sort: "latest",
      perPage: 100
    });

    if (!result) {
      setBenefits([]);
      setStatus("error");
      setMessage("정부24 혜택 정보를 불러오지 못했습니다.");
      return;
    }

    setBenefits(result.items || result.benefits || []);
    setStatus(result.status === "success" ? "success" : "error");
    setMessage(result.status === "success" ? "" : "정부24 혜택 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
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
    if (activeSubTab === "local" && user) loadBenefits(query, selectedRegion, selectedDistrict);
  }, [activeSubTab, user?.age]);

  const reversedLogs = useMemo(() => [...(mileageData.logs || [])].reverse(), [mileageData.logs]);
  const sortedBenefits = useMemo(() => {
    const dateRank = (value = "") => {
      const digits = String(value).replace(/\D/g, "").slice(0, 14);
      return digits ? Number(digits.padEnd(14, "0")) : 0;
    };
    const relevanceRank = (benefit) => {
      const words = query.trim().split(/\s+/).filter(Boolean);
      const text = [benefit.title, benefit.summary, benefit.target, benefit.provider, benefit.region, ...(benefit.tags || [])].join(" ");
      if (words.length === 0) return 0;
      return words.reduce((score, word) => score + (text.includes(word) ? 1 : 0) + (String(benefit.title || "").includes(word) ? 2 : 0), 0);
    };

    if (sortOrder === "latest") return benefits;
    return [...benefits].sort((a, b) => {
      if (sortOrder === "relevance") return relevanceRank(b) - relevanceRank(a) || dateRank(b.updatedAt) - dateRank(a.updatedAt);
      return dateRank(b.updatedAt) - dateRank(a.updatedAt) || String(b.id || b.title || "").localeCompare(String(a.id || a.title || ""));
    });
  }, [benefits, query, sortOrder]);
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
              연령대에 맞는 정부 건강 혜택을 {locationLabel} 기준으로 검색합니다.
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
              {selectedRegion && selectedRegion !== "국가기관" && (
                <select
                  value={selectedDistrict}
                  onChange={(event) => setSelectedDistrict(event.target.value)}
                  style={{
                    border: "1px solid #E5E7EB",
                    borderRadius: 10,
                    padding: "12px 14px",
                    fontSize: 14,
                    background: "#fff"
                  }}
                >
                  <option value="">전체 시군구</option>
                  {(DISTRICTS[selectedRegion] || []).map((district) => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              )}
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="키워드 검색"
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

            {message && (
              <div style={{ background: "#FEF3C7", color: "#92400E", borderRadius: 10, padding: "10px 12px", fontSize: 12, marginBottom: 12 }}>
                {message}
              </div>
            )}

            {status === "loading" ? null : sortedBenefits.length > 0 ? (
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
                    <option value="relevance">관련도순</option>
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
                    {(benefit.matchReasons || []).length > 0 && (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "0 0 8px" }}>
                        {(benefit.matchReasons || []).slice(0, 3).map((reason) => (
                          <span key={reason} style={{ ...S.tag(), background: "#ECFDF5", color: "#047857" }}>{reason}</span>
                        ))}
                      </div>
                    )}
                    {(benefit.conditionWarnings || []).length > 0 && (
                      <p style={{ fontSize: 11, color: "#B45309", margin: "0 0 8px", lineHeight: 1.4 }}>
                        {(benefit.conditionWarnings || []).join(" · ")}
                      </p>
                    )}
                    {benefit.target && (
                      <div style={{ margin: "0 0 6px" }}>
                        <button
                          type="button"
                          onClick={() => setExpandedTargets((prev) => ({ ...prev, [benefit.id || benefit.title]: !prev[benefit.id || benefit.title] }))}
                          style={{ border: "none", background: "none", padding: 0, color: "#2563EB", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                        >
                          지원대상 {expandedTargets[benefit.id || benefit.title] ? "접기" : "펼치기"}
                        </button>
                        {expandedTargets[benefit.id || benefit.title] && (
                          <p style={{ fontSize: 12, color: "#6B7280", margin: "6px 0 0", lineHeight: 1.45 }}>
                            {benefit.target}
                          </p>
                        )}
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginTop: 10 }}>
                      <span style={{ fontSize: 11, color: "#9CA3AF" }}>{benefit.deadline || benefit.applicationDeadline}</span>
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
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, marginTop: 14 }}>
                  <button
                    type="button"
                    onClick={() => movePage(page - 1)}
                    disabled={page === 1}
                    aria-label="이전 페이지"
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      border: "1px solid #E5E7EB",
                      background: "#fff",
                      color: "#2563EB",
                      fontSize: 20,
                      lineHeight: 1,
                      cursor: page === 1 ? "default" : "pointer",
                      opacity: page === 1 ? 0.35 : 1
                    }}
                  >
                    ‹
                  </button>
                  <span style={{ minWidth: 48, textAlign: "center", fontSize: 12, color: "#6B7280", fontWeight: 700 }}>
                    {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => movePage(page + 1)}
                    disabled={page === totalPages}
                    aria-label="다음 페이지"
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      border: "1px solid #E5E7EB",
                      background: "#fff",
                      color: "#2563EB",
                      fontSize: 20,
                      lineHeight: 1,
                      cursor: page === totalPages ? "default" : "pointer",
                      opacity: page === totalPages ? 0.35 : 1
                    }}
                  >
                    ›
                  </button>
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

