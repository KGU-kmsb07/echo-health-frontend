import { useState } from "react";
import S from '../../styles/shared';
import { useHealth } from '../../context/HealthContext';

function OnboardStep1({ next, back }) {
  const { user, updateUser } = useHealth();
  const [name, setName] = useState(user?.name || "");
  const [profileImage, setProfileImage] = useState(user?.profileImage || null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNext = () => {
    if (!name.trim()) return;
    updateUser({ name, profileImage });
    next({ name, profileImage });
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", padding: "20px 24px 32px", background: "#fff" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
        <button onClick={back} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#374151" }}>←</button>
        <div style={{ flex: 1, display: "flex", justifyContent: "center", gap: 6 }}>
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              style={{
                width: i === 0 ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: i === 0 ? "#2563EB" : "#E5E7EB"
              }}
            />
          ))}
        </div>
        <span style={{ fontSize: 13, color: "#9CA3AF" }}>1/4</span>
      </div>
      
      {/* Title */}
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, color: "#111", lineHeight: 1.4, whiteSpace: "pre-line" }}>
        반갑습니다!{"\n"}이름과 사진을 설정해주세요
      </h2>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28, marginBottom: 32 }}>
        {/* 프로필 이미지 영역 */}
        <div style={{ position: "relative" }}>
          <div 
            onClick={() => document.getElementById("profile-file-input").click()}
            style={{ 
              width: 100, 
              height: 100, 
              borderRadius: 50, 
              background: "#E5E7EB", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              cursor: "pointer",
              overflow: "hidden",
              border: "2px solid #E5E7EB",
              boxShadow: "0 4px 10px rgba(0,0,0,0.05)"
            }}
          >
            {profileImage ? (
              <img 
                src={profileImage} 
                alt="Profile Preview" 
                style={{ width: "100%", height: "100%", objectFit: "cover" }} 
              />
            ) : (
              <span style={{ fontSize: 32 }}>📷</span>
            )}
          </div>
          <input 
            id="profile-file-input"
            type="file" 
            accept="image/*" 
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </div>

        {/* 이름 입력 영역 */}
        <div style={{ width: "100%" }}>
          <p style={{ fontSize: 13, color: "#374151", margin: "0 0 6px", fontWeight: 600 }}>이름</p>
          <div style={{ 
            border: "1px solid #E5E7EB", 
            borderRadius: 10, 
            padding: "12px 16px", 
            display: "flex", 
            alignItems: "center",
            background: "#fff"
          }}>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)}
              placeholder="이름을 입력해주세요" 
              maxLength={10}
              style={{ border: "none", outline: "none", width: "100%", fontSize: 16, color: "#374151" }} 
            />
          </div>
        </div>
      </div>

      {/* 다음 버튼 */}
      <button 
        onClick={handleNext} 
        disabled={!name.trim()}
        style={{
          ...S.btn(),
          opacity: name.trim() ? 1 : 0.5,
          cursor: name.trim() ? "pointer" : "not-allowed"
        }}
      >
        다음
      </button>
    </div>
  );
}

export default OnboardStep1;
