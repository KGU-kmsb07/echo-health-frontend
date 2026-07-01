import S from '../styles/shared';

function DataSourceScreen({ setScreen, back }) {
  return (
    <div style={S.screen}>
      <div style={{ ...S.topBar, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid #F3F4F6" }}>
        <button onClick={back} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>←</button>
        <span style={{ fontWeight: 700, fontSize: 16 }}>데이터 출처 정보</span>
      </div>
      <div style={{ ...S.scrollArea, paddingTop: 57 }}>
        <div style={{ padding: 16 }}>
          <div style={{ background: "#EFF6FF", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#1D4ED8" }}>
            Echo Health는 모든 건강 데이터를 국가 공공 데이터에서만 사용합니다. 개인 의료 데이터는 저장하지 않습니다.
          </div>
          <p style={{ fontWeight: 600, margin: "0 0 12px", display: "flex", gap: 6 }}><span>{"📊"}</span>{" 사용 데이터"}</p>
          {[
            { year: "2024년 기준", name: "국민건강영양조사 공통 검진조사", vars: "BMI, 혈압, 허리둘레, 혈액검사 기반 건강위험 변수", updated: "2026-05-20", url: "kdca.go.kr/knhanes", color: "#DBEAFE" },
            { year: "2024년 기준", name: "국민건강영양조사 건강설문조사", vars: "흡연, 음주, 신체활동, 만성질환 관련 설문 변수", updated: "2026-05-20", url: "kdca.go.kr/knhanes", color: "#EDE9FE" },
            { year: "2024년 기준", name: "국민건강영양조사 영양조사", vars: "식생활, 영양섭취, 생활습관 보조 변수", updated: "2026-05-20", url: "kdca.go.kr/knhanes", color: "#DBEAFE" },
          ].map(d => (
            <div key={d.name} style={{ ...S.card, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ ...S.tag(d.color), fontSize: 11 }}>{d.year}</span>
                <span style={{ fontSize: 11, color: "#2563EB" }}>{d.url} ↗</span>
              </div>
              <p style={{ fontWeight: 600, margin: "0 0 3px" }}>{d.name}</p>
              <p style={{ fontSize: 12, color: "#2563EB", margin: "0 0 3px" }}>사용 변수: {d.vars}</p>
              <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0 }}>마지막 업데이트: {d.updated}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DataSourceScreen;
