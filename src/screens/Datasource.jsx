import S from '../styles/shared';

function DataSourceScreen({ setScreen, back }) {
  return (
    <div style={S.screen}>
      <div style={{ background: "#fff", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={back} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>←</button>
        <span style={{ fontWeight: 700, fontSize: 16 }}>데이터 출처 정보</span>
      </div>
      <div style={S.scrollArea}>
        <div style={{ padding: 16 }}>
          <div style={{ background: "#EFF6FF", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#1D4ED8" }}>
            Echo Health는 모든 건강 데이터를 국가 공공 데이터에서만 사용합니다. 개인 의료 데이터는 저장하지 않습니다.
          </div>
          <p style={{ fontWeight: 600, margin: "0 0 12px", display: "flex", gap: 6 }}><span>{"📊"}</span>{" 사용 데이터"}</p>
          {[
            { year: "2022년 기준", name: "국민건강영양조사 (KNHANES)", vars: "BMI, 혈압, 혈당, 흡연, 음주, 신체활동, 허리둘레", updated: "2023-12-01", url: "kdca.go.kr/knhanes", color: "#DBEAFE" },
            { year: "2023년 기준", name: "질병관리청 만성질환 통계", vars: "당뇨 유병률, 고혈압 유병률, 대사증후군 기준", updated: "2024-03-15", url: "kdca.go.kr", color: "#EDE9FE" },
            { year: "2022년 기준", name: "국민건강보험 지역별 검진 데이터", vars: "연령별 건강검진 결과, 질병 발생 코호트", updated: "2024-01-10", url: "nhis.or.kr", color: "#D1FAE5" },
            { year: "2024년 기준", name: "공공데이터포털 건강 API", vars: "보건소 위치, 지원 프로그램, 건강증진사업", updated: "2024-06-01", url: "data.go.kr", color: "#FEF3C7" },
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
          <p style={{ fontWeight: 600, margin: "8px 0 12px", display: "flex", gap: 6 }}><span>{"📊"}</span>{" 모델 성능 (v1.2.0)"}</p>
          <div style={S.card}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
                  {["지표", "당뇨", "고혈압", "대사증후군"].map(h => <th key={h} style={{ padding: "6px 4px", color: "#9CA3AF", fontWeight: 500, textAlign: "center" }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "AUROC", v: ["-", "-", "-"] },
                  { label: "정확도", v: ["-", "-", "-"] },
                  { label: "민감도", v: ["-", "-", "-"] },
                  { label: "특이도", v: ["-", "-", "-"] },
                ].map(r => (
                  <tr key={r.label} style={{ borderBottom: "1px solid #F9FAFB" }}>
                    <td style={{ padding: "8px 4px" }}>{r.label}</td>
                    {r.v.map((v, i) => <td key={i} style={{ padding: "8px 4px", textAlign: "center", color: "#2563EB", fontWeight: 500 }}>{v}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 8, textAlign: "center" }}>실제 모델 연동 후 업데이트 예정</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DataSourceScreen;
