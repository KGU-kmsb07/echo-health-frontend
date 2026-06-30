import { useState, useEffect } from "react";
import S from '../styles/shared';
import { useHealth } from '../context/HealthContext';
import { loadMileage } from '../storage/localStore';

const REGIONS = {
  "서울": ["강남구","강동구","강북구","강서구","관악구","광진구","구로구",
           "금천구","노원구","도봉구","동대문구","동작구","마포구","서대문구",
           "서초구","성동구","성북구","송파구","양천구","영등포구","용산구",
           "은평구","종로구","중구","중랑구"],
  "경기": ["수원시","성남시","의정부시","안양시","부천시","광명시","평택시",
           "동두천시","안산시","고양시","과천시","구리시","남양주시","오산시"],
  "부산": ["강서구","금정구","기장군","남구","동구","동래구","부산진구",
           "북구","사상구","사하구","서구","수영구","연제구","영도구","중구","해운대구"],
  "대구": ["남구","달서구","달성군","동구","북구","서구","수성구","중구"],
  "인천": ["강화군","계양구","남동구","동구","미추홀구","부평구","서구","연수구","옹진군","중구"],
  "광주": ["광산구","남구","동구","북구","서구"],
  "대전": ["대덕구","동구","서구","유성구","중구"],
  "울산": ["남구","동구","북구","울주군","중구"],
  "세종": [],
  "강원": ["강릉시","고성군","동해시","삼척시","속초시","양구군","양양군","영월군","원주시","인제군","정선군","철원군","춘천시","태백시","평창군","홍천군","화천군","횡성군"],
  "충북": ["괴산군","단양군","보은군","영동군","옥천군","음성군","제천시","증평군","진천군","청주시","충주시"],
  "충남": ["계룡시","공주시","금산군","논산시","당진시","보령시","부여군","서산시","서천군","아산시","예산군","천안시","청양군","태안군","홍성군"],
  "전북": ["고창군","군산시","김제시","남원시","무주군","부안군","순창군","완주군","익산시","임실군","장수군","전주시","정읍시","진안군"],
  "전남": ["강진군","고흥군","곡성군","광양시","구례군","나주시","담양군","목포시","무안군","보성군","순천시","신안군","여수시","영광군","영암군","완도군","장성군","장흥군","진도군","함평군","해남군","화순군"],
  "경북": ["경산시","경주시","고령군","구미시","군위군","김천시","문경시","봉화군","상주시","성주군","안동시","영덕군","영양군","영주시","영천시","예천군","울릉군","울진군","의성군","청도군","청송군","칠곡군","포항시"],
  "경남": ["거제시","거창군","고성군","김해시","남해군","밀양시","사천시","산청군","양산시","의령군","진주시","창녕군","창원시","통영시","하동군","함안군","함양군","합천군"],
  "제주": ["서귀포시","제주시"],
};

const REGION_NAMES = Object.keys(REGIONS);

function BenefitsScreen() {
  const { user, benefits } = useHealth();
  const [activeSubTab, setActiveSubTab] = useState(() => {
    const savedTab = localStorage.getItem("echo-health-benefits-tab");
    return savedTab === "local" ? "local" : "mileage";
  }); // "mileage" or "local"
  const [filter, setFilter] = useState("전체");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [mileageData, setMileageData] = useState({ total: 0, logs: [] });

  const refreshMileage = () => {
    const data = loadMileage();
    setMileageData(data);
  };

  useEffect(() => {
    // 탭 전환 및 화면 진입 시 마일리지 데이터 즉시 갱신
    refreshMileage();
    localStorage.setItem("echo-health-benefits-tab", activeSubTab);
  }, [activeSubTab]);

  // 화면 포커스/가시성 변경 시 실시간 갱신 (플랜 탭에서 돌아올 때)
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') refreshMileage(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', refreshMileage);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', refreshMileage);
    };
  }, []);

  if (!user) {
    return <div style={{ padding: 20, textAlign: "center" }}>로딩 중...</div>;
  }

  const districts = selectedRegion ? (REGIONS[selectedRegion] || []) : [];

  // 선택된 지역 기준 혜택 필터링
  const filteredBenefits = (benefits || []).filter(b => {
    if (filter === "지역") {
      if (!selectedRegion) return false;
      const regionMatch = b.region
        ? (b.region.includes(selectedRegion) || selectedRegion.includes(b.region))
        : false;
      return regionMatch;
    }
    if (filter === "연령") {
      const ageGroup = (user.age != null) ? `${Math.floor(user.age / 10) * 10}대` : "";
      return b.tags?.includes(ageGroup) || b.tags?.includes("연령") || b.tags?.includes("20대");
    }
    return true; // 전체
  });

  const locationLabel = selectedRegion
    ? `${selectedRegion}${selectedDistrict ? " " + selectedDistrict : ""}`
    : "지역 미선택";

  const getLogTypeLabel = (type) => {
    switch (type) {
      case 'todo_check': return '개별 실천 완료';
      case 'day_complete': return '일일 전체 완료 보너스';
      case 'day_final': return '일일 전체 완료 보너스';
      case 'week_streak': return '7일 연속 달성 보너스';
      case 'program_complete': return '4주 종합 달성 보너스';
      case 'plan_cancel': return '플랜 취소 차감';
      default: return '포인트 적립';
    }
  };

  return (
    <div style={S.screen}>
      <div style={{ ...S.topBar, borderBottom: "1px solid #F3F4F6", flexShrink: 0 }}>
        {/* 상단 탭 헤더 */}
        <div style={{ display: "flex", textAlign: "center" }}>
          <button 
            onClick={() => setActiveSubTab("mileage")}
            style={{
              flex: 1, padding: "14px 0", border: "none", background: "none",
              fontSize: 15, fontWeight: activeSubTab === "mileage" ? 700 : 500,
              color: activeSubTab === "mileage" ? "#2563EB" : "#6B7280",
              borderBottom: activeSubTab === "mileage" ? "3px solid #2563EB" : "3px solid transparent",
              cursor: "pointer"
            }}
          >
            건강 마일리지
          </button>
          <button 
            onClick={() => setActiveSubTab("local")}
            style={{
              flex: 1, padding: "14px 0", border: "none", background: "none",
              fontSize: 15, fontWeight: activeSubTab === "local" ? 700 : 500,
              color: activeSubTab === "local" ? "#2563EB" : "#6B7280",
              borderBottom: activeSubTab === "local" ? "3px solid #2563EB" : "3px solid transparent",
              cursor: "pointer"
            }}
          >
            우리동네 건강 혜택
          </button>
        </div>
      </div>

      <div style={{ ...S.scrollArea, paddingTop: 52 }}>
        {activeSubTab === "mileage" ? (
          /* 마일리지 뷰 */
          <div style={{ padding: "20px 16px 16px" }}>
            {/* 총 누적 포인트 대형 카드 */}
            <div style={{
              background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
              borderRadius: 20, padding: 24, color: "#fff", marginBottom: 20,
              boxShadow: "0 8px 20px rgba(16, 185, 129, 0.2)", textAlign: "center"
            }}>
              <p style={{ margin: "0 0 8px", fontSize: 13, opacity: 0.9, fontWeight: 500 }}>나의 누적 건강 마일리지</p>
              <h1 style={{ margin: 0, fontSize: 36, fontWeight: 800 }}>
                {mileageData.total.toLocaleString()} <span style={{ fontSize: 18, fontWeight: 500 }}>pt</span>
              </h1>
            </div>

            {/* 포인트 획득 이력 리스트 */}
            <div style={S.card}>
              <p style={{ fontWeight: 700, fontSize: 15, margin: "0 0 12px", color: "#1F2937" }}>포인트 적립 내역</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {mileageData.logs && mileageData.logs.length > 0 ? (
                  [...mileageData.logs].reverse().map((log, idx) => (
                    <div key={idx} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      paddingBottom: 10, borderBottom: idx === mileageData.logs.length - 1 ? "none" : "1px solid #F3F4F6"
                    }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", margin: "0 0 2px" }}>
                          {getLogTypeLabel(log.type)}
                        </p>
                        <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0 }}>
                          {log.date || log.todoId || ''}
                        </p>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: log.points < 0 ? "#EF4444" : "#2563EB" }}>
                        {log.points > 0 ? "+" : ""}{log.points} pt
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: "center", padding: "24px 0", color: "#9CA3AF", fontSize: 13 }}>
                    아직 적립된 마일리지가 없습니다.<br />매일 실천 플랜을 달성하여 포인트를 모아보세요!
                  </div>
                )}
              </div>
            </div>

            {/* 중장기 비전 및 연계 안내 문구 */}
            <div style={{
              background: "#F3F4F6", borderRadius: 12, padding: 16, border: "1px solid #E5E7EB"
            }}>
              <p style={{ fontSize: 12, color: "#4B5563", margin: "0 0 4px", fontWeight: 700 }}>
                💡 마일리지 활용 안내
              </p>
              <p style={{ fontSize: 11, color: "#6B7280", margin: 0, lineHeight: 1.5 }}>
                꾸준한 실천 기록은 향후 건강 지원금 사업 참여 시 가점 자료로 활용될 수 있습니다. (서비스 확장 시 공공기관 연계 예정)
              </p>
            </div>
          </div>
        ) : (
          /* 기존 건강 혜택 뷰 */
          <div style={{ padding: "20px 16px 16px" }}>
            <h2 style={{ fontWeight: 700, fontSize: 18, margin: "0 0 2px", color: "#1F2937" }}>지자체 건강 혜택 찾기</h2>
            <p style={{ fontSize: 12, color: "#6B7280", margin: "0 0 14px" }}>
              📍 {locationLabel} 기준 혜택
            </p>

            {/* 지역 선택 */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#374151", margin: "0 0 6px" }}>지역 선택</p>
              <select
                value={selectedRegion}
                onChange={e => {
                  setSelectedRegion(e.target.value);
                  setSelectedDistrict("");
                }}
                style={{
                  border: "1px solid #E5E7EB", borderRadius: 10,
                  padding: "12px 16px", width: "100%", marginBottom: 8,
                  fontSize: 14, color: selectedRegion ? "#111" : "#9CA3AF",
                  background: "#fff", appearance: "none",
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%239CA3AF' stroke-width='1.5' fill='none'/%3E%3C/svg%3E\")",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 14px center",
                  cursor: "pointer"
                }}
              >
                <option value="">시/도 선택</option>
                {REGION_NAMES.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>

              {selectedRegion && districts.length > 0 && (
                <select
                  value={selectedDistrict}
                  onChange={e => setSelectedDistrict(e.target.value)}
                  style={{
                    border: "1px solid #E5E7EB", borderRadius: 10,
                    padding: "12px 16px", width: "100%", marginBottom: 8,
                    fontSize: 14, color: selectedDistrict ? "#111" : "#9CA3AF",
                    background: "#fff", appearance: "none",
                    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%239CA3AF' stroke-width='1.5' fill='none'/%3E%3C/svg%3E\")",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 14px center",
                    cursor: "pointer"
                  }}
                >
                  <option value="">시/군/구 선택 (전체)</option>
                  {districts.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              )}
            </div>

            {/* 필터 탭 */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {["전체", "지역", "연령"].map(f => (
                <button key={f} style={S.chip(filter === f)} onClick={() => setFilter(f)}>{f}</button>
              ))}
            </div>

            {/* 혜택 목록 */}
            {filteredBenefits.length > 0 ? (
              filteredBenefits.map(b => (
                <div key={b.id} style={{ ...S.card, cursor: "pointer", marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {b.tags?.map(t => <span key={t} style={S.tag()}>{t}</span>)}
                    </div>
                    <span style={{ color: "#2563EB", fontWeight: 600, fontSize: 13 }}>{b.cost}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p style={{ fontWeight: 600, margin: "0 0 3px" }}>{b.title}</p>
                      <p style={{ fontSize: 12, color: "#6B7280", margin: 0 }}>{b.desc}</p>
                    </div>
                    <span style={{ color: "#9CA3AF" }}>›</span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ ...S.card, textAlign: "center", padding: "30px 20px" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🏙️</div>
                <p style={{ color: "#9CA3AF", fontSize: 14, margin: "0 0 4px" }}>
                  {filter === "지역" && !selectedRegion
                    ? "지역을 선택하면 맞춤 혜택을 확인할 수 있어요."
                    : "해당 조건에 맞는 혜택이 없습니다."}
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
