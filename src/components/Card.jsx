import S from '../styles/shared';

export function ProgressBar({ pct, color = "#EF4444" }) {
  return (
    <div style={S.progressBar(pct, color)}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.5s" }} />
    </div>
  );
}
