import { useState } from "react";
import S from '../styles/shared';
import { useHealth } from '../context/HealthContext';

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
  const [filter, setFilter] = useState("전체");
  const [selectedRegion, setSelectedRegion] = useState(user?.region || "");
  const [selectedDistrict, setSelectedDistrict] = useState(user?.district || "");

  if (!user || !benefits) {
    return <div style={{ padding: 20, textAlign: "center" }}>로딩 중...</div>;
  }

  const districts = selectedRegion ? (REGIONS[selectedRegion] || []) : [];

  // 선택된 지역 기준 혜택 필터링
  const filteredBenefits = benefits.filter(b => {
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

  return (
    <div style={S.screen}>
      <div style={S.scrollArea}>
        <div style={{ padding: "20px 16px 16px" }}>
          <h2 style={{ fontWeight: 700, fontSize: 20, margin: "0 0 2px" }}>숨겨진 건강 혜택</h2>
          <p style={{ fontSize: 13, color: "#6B7280", margin: "0 0 14px" }}>
            📍 {locationLabel} 기준 혜택
          </p>

          {/* 지역 선택 */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#374151", margin: "0 0 6px" }}>지역 선택</p>
            {/* 시/도 드롭다운 */}
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

            {/* 시/군/구 드롭다운 (해당 시도에 구가 있을 때만) */}
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
                  <span style={{ color: "#10B981", fontWeight: 600, fontSize: 13 }}>{b.cost}</span>
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
      </div>
    </div>
  );
}

export default BenefitsScreen;
