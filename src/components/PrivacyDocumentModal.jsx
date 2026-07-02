import { useEffect, useState } from "react";
import { fetchPrivacyConsentDocument } from "../api/echoApi";

function PrivacyDocumentModal({ open, title = "개인정보 처리 동의 전문", onClose }) {
  const [status, setStatus] = useState("idle");
  const [documentHtml, setDocumentHtml] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!open) return;

    setStatus("loading");
    fetchPrivacyConsentDocument()
      .then(html => {
        if (cancelled) return;
        setDocumentHtml(html);
        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setDocumentHtml("");
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(17, 24, 39, 0.42)",
        display: "flex",
        alignItems: "stretch",
        justifyContent: "center",
        padding: "env(safe-area-inset-top) 0 env(safe-area-inset-bottom)"
      }}
    >
      <div style={{ width: "100%", maxWidth: 520, background: "#fff", display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
        <div style={{ height: 56, display: "flex", alignItems: "center", gap: 10, padding: "0 16px", borderBottom: "1px solid #E5E7EB", flexShrink: 0 }}>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            style={{ width: 36, height: 36, border: "none", background: "transparent", fontSize: 22, color: "#374151", cursor: "pointer" }}
          >
            ←
          </button>
          <strong style={{ fontSize: 16, color: "#111827" }}>{title}</strong>
        </div>

        {status === "loading" && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, color: "#6B7280", fontSize: 14, textAlign: "center" }}>
            서버에서 약관 전문을 불러오는 중입니다.
          </div>
        )}

        {status === "error" && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, color: "#B45309", fontSize: 14, textAlign: "center", lineHeight: 1.5 }}>
            약관 전문을 불러오지 못했습니다.
            <br />
            네트워크 상태를 확인한 뒤 다시 시도해주세요.
          </div>
        )}

        {status === "ready" && (
          <iframe
            title={title}
            srcDoc={documentHtml}
            sandbox=""
            style={{ flex: 1, width: "100%", border: "none", background: "#fff" }}
          />
        )}
      </div>
    </div>
  );
}

export default PrivacyDocumentModal;
