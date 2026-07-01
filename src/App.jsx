import React, { useState, useEffect } from "react";
import S from "./styles/shared";
import { NavBar, AIButton } from "./components/Layout";
import SplashScreen from "./screens/Splash";
import PrivacyConsentScreen, { hasPrivacyConsent } from "./screens/PrivacyConsent";
import OnboardStep1 from "./screens/Onboarding/Onboard1";
import OnboardStep2 from "./screens/Onboarding/Onboard2";
import OnboardStep3 from "./screens/Onboarding/Onboard3";
import OnboardStep4 from "./screens/Onboarding/Onboard4";
import HomeScreen from "./screens/Home";
import AnalyzeScreen from "./screens/Analyze";
import FutureScreen from "./screens/Future";
import SimulateScreen from "./screens/Simulate";
import ImprovedScreen from "./screens/Improved";
import PlanScreen from "./screens/Plan";
import ReanalyzeScreen from "./screens/Reanalyze";
import NewResultScreen from "./screens/NewResult";
import ExerciseScreen from "./screens/Exercise";
import BenefitsScreen from "./screens/Benefits";
import MyPageScreen from "./screens/Mypage";
import DataSourceScreen from "./screens/Datasource";
import CoachScreen from "./screens/Coach";
import LoadingScreen from "./screens/Loading";
import { HealthProvider, useHealth } from "./context/HealthContext";
import Loading from "./components/Loading";
import { runAnalysis } from './services/analyzeService';
import { runPlanGeneration } from './services/planService';

function AppContent() {
  const { userProfile, predictedProfile, setUserProfile, setPredictedProfile, hasOnboarded, setHasOnboarded, setFirstResult, calculateHealthData, resetPlan, addNotification, setOriginalUser, isLoading, loadingMessage, showLoading, hideLoading, isEditMode, setEditMode, navigateWithLoading, updatePlan } = useHealth();
  const [screen, setScreen] = useState(hasOnboarded ? "home" : "splash");
  const [screenHistory, setScreenHistory] = useState(hasOnboarded ? ["home"] : ["splash"]);
  const [tab, setTab] = useState("home");
  const [showCoach, setShowCoach] = useState(false);
  const [coachStartY, setCoachStartY] = useState(0);
  const [coachClosing, setCoachClosing] = useState(false);
  const [tempOnboardData, setTempOnboardData] = useState({});

  const nonNavScreens = ["splash", "privacy", "onboard1", "onboard2", "onboard3", "onboard4"];
  const showNav = hasOnboarded && !nonNavScreens.includes(screen);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [screen]);

  const navigateTo = (nextScreen) => {
    setScreenHistory(prev => [...prev, nextScreen]);
    setScreen(nextScreen);
  };

  const goAnalyze = () => {
    hideLoading();
    setShowCoach(false);
    setTab("analyze");
    setScreenHistory(["home", "analyze"]);
    setScreen("analyze");
  };

  const goBack = () => {
    hideLoading();
    setShowCoach(false);
    if (screenHistory.length <= 1) return;
    const nextHistory = [...screenHistory];
    nextHistory.pop();
    const prevScreen = nextHistory[nextHistory.length - 1];
    setScreenHistory(nextHistory);
    setScreen(prevScreen);
  };

  const goHome = () => {
    hideLoading();
    setShowCoach(false);
    setTab("home");
    setScreenHistory(["home"]);
    setScreen("home");
  };

  const closeCoach = () => {
    setCoachStartY(0);
    setCoachClosing(true);
    setTimeout(() => {
      setShowCoach(false);
      setCoachClosing(false);
    }, 220);
  };

  const handleCoachDragStart = (clientY) => setCoachStartY(clientY);

  const handleCoachDragEnd = (clientY) => {
    if (coachStartY > 0 && clientY - coachStartY > 80) {
      closeCoach();
      return;
    }
    setCoachStartY(0);
  };

  const handleOnboard4Complete = async (finalData) => {
    const age = Number(finalData.age);
    const systolicVal = finalData.bpMode === "manual" ? Number(finalData.systolic) : 120;
    const diastolicVal = finalData.bpMode === "manual" ? Number(finalData.diastolic) : 80;

    const regionVal = finalData.region || "";
    const districtVal = finalData.district || "";
    const nameVal = finalData.name || "사용자";
    const profileImageVal = finalData.profileImage !== undefined ? finalData.profileImage : null;

    const userProfileData = {
      name: nameVal,
      profileImage: profileImageVal,
      age: age,
      gender: finalData.gender,
      height: Number(finalData.height),
      weight: Number(finalData.weight),
      waist: Number(finalData.waist) || 80,
      bloodPressure: {
        systolic: systolicVal,
        diastolic: diastolicVal
      },
      smoking: finalData.smoking,
      drinking: finalData.drinking,
      exercise: finalData.exercise,
      region: regionVal,
      district: districtVal
    };

    // 1. userProfile 업데이트
    setUserProfile(userProfileData);
    setOriginalUser(userProfileData);

    showLoading("건강 분석 중...");
    
    // API 분석 실행
    let analysisResult = null;
    try {
      analysisResult = await runAnalysis(userProfileData);
      if (analysisResult && !analysisResult.error) {
        setPredictedProfile(analysisResult);
      }
    } catch (e) {
      console.error("runAnalysis error:", e);
    }
    
    hideLoading();
    showLoading("맞춤 플랜 생성 중...");
    
    // API 플랜 생성
    let planResult = null;
    try {
      planResult = await runPlanGeneration(
        analysisResult || predictedProfile,
        userProfileData.age
      );
      if (planResult) {
        updatePlan(planResult);
      }
    } catch (e) {
      console.error("runPlanGeneration error:", e);
    }
    
    hideLoading();

    // 후속 호환성 연산
    const calculated = analysisResult ? {
      bmi: analysisResult.bmi,
      vitality_score: analysisResult.vitality_score,
      healthScore: analysisResult.vitality_score,
      healthAge: analysisResult.healthAge ?? analysisResult.health_age ?? age,
      risks: {
        diabetes: analysisResult.diabetes_prob !== undefined ? (analysisResult.diabetes_prob > 1 ? analysisResult.diabetes_prob / 100 : analysisResult.diabetes_prob) : (analysisResult.diabetes > 1 ? analysisResult.diabetes / 100 : analysisResult.diabetes),
        hypertension: analysisResult.hypertension_prob !== undefined ? (analysisResult.hypertension_prob > 1 ? analysisResult.hypertension_prob / 100 : analysisResult.hypertension_prob) : (analysisResult.hypertension > 1 ? analysisResult.hypertension / 100 : analysisResult.hypertension),
        metabolic: analysisResult.metabolic !== undefined ? (analysisResult.metabolic > 1 ? analysisResult.metabolic / 100 : analysisResult.metabolic) : 0.10,
        obesity: analysisResult.obesity_status !== undefined ? analysisResult.obesity_status : (analysisResult.obesity > 1 ? (analysisResult.obesity >= 50 ? 1 : 0) : analysisResult.obesity)
      }
    } : calculateHealthData({
      ...finalData,
      systolic: systolicVal,
      diastolic: diastolicVal
    }, age);

    const finalRisks = calculated.risks;

    const finalBmi = analysisResult?.bmi ?? calculated.bmi;
    const finalHealthAge = calculated.healthAge;

    const updatedUser = {
      ...userProfileData,
      vitality_score: analysisResult?.vitality_score,
      healthScore: analysisResult?.vitality_score,
      healthAge: finalHealthAge,
      bmi: finalBmi,
      persona: `${finalData.age}세 ${finalData.gender}`,
      personaTags: [finalData.gender, `${finalData.age}세`, finalData.smoking, finalBmi >= 25 ? "비만" : "정상"],
      createdAt: new Date().toISOString()
    };
    
    resetPlan(updatedUser);
    addNotification("건강정보가 업데이트 되었어요.", "📈", "analyze", "analyze");
    setHasOnboarded(true);

    setFirstResult({
      user: updatedUser,
      risks: finalRisks
    });
    
    if (isEditMode) {
      setScreen("mypage");
      setTab("mypage");
      setScreenHistory(["mypage"]);
      setEditMode(false);
    } else {
      setTab("home");
      setScreenHistory(["home"]);
      setScreen("home");
    }
  };

  const renderScreen = () => {
    const getScreenComponent = () => {
      switch (screen) {
        case "splash": return <SplashScreen next={() => navigateTo(hasPrivacyConsent() ? "onboard1" : "privacy")} />;
        case "privacy": return <PrivacyConsentScreen next={() => navigateTo("onboard1")} back={goBack} />;
        case "onboard1": return <OnboardStep1 next={(data) => { setTempOnboardData(prev => ({ ...prev, ...data })); navigateTo("onboard2"); }} back={goBack} />;
        case "onboard2": return <OnboardStep2 next={(data) => { setTempOnboardData(prev => ({ ...prev, ...data })); navigateTo("onboard3"); }} back={goBack} />;
        case "onboard3": return <OnboardStep3 next={(data) => { setTempOnboardData(prev => ({ ...prev, ...data })); navigateTo("onboard4"); }} back={goBack} />;
        case "onboard4": return <OnboardStep4 next={(data) => handleOnboard4Complete({ ...tempOnboardData, ...data })} back={goBack} />;
        case "loading": return <LoadingScreen message={loadingMessage} />;
        case "home": return <HomeScreen setScreen={navigateTo} setTab={setTab} />;
        case "analyze": return <AnalyzeScreen setScreen={navigateTo} back={goBack} />;
        case "future": return <FutureScreen setScreen={navigateTo} back={goAnalyze} />;
        case "simulate": return <SimulateScreen setScreen={navigateTo} back={goBack} />;
        case "improved": return <ImprovedScreen setScreen={navigateTo} setTab={setTab} back={goAnalyze} />;
        case "plan": return <PlanScreen setScreen={navigateTo} back={goBack} />;
        case "reanalyze": return <ReanalyzeScreen setScreen={navigateTo} back={goBack} />;
        case "newresult": return <NewResultScreen setScreen={navigateTo} back={goBack} />;
        case "exercise": return <ExerciseScreen back={goBack} />;
        case "benefits": return <BenefitsScreen back={goHome} />;
        case "mypage": return <MyPageScreen setScreen={navigateTo} back={goBack} />;
        case "datasource": return <DataSourceScreen setScreen={navigateTo} back={goBack} />;
        case "coach": return <CoachScreen setScreen={(target) => { if(target === false) goBack(); else navigateTo(target); }} back={goBack} />;
        default: return <HomeScreen setScreen={navigateTo} setTab={setTab} />;
      }
    };
    return (
      <div key={screen} className="screen-enter">
        {getScreenComponent()}
      </div>
    );
  };

  return (
    <div style={S.app}>
      {renderScreen()}
      {showNav && <NavBar tab={tab} setTab={setTab} setScreen={(tabName) => {
        hideLoading();
        setShowCoach(false);
        setScreenHistory([tabName]);
        setScreen(tabName);
      }} />}
      {showNav && <AIButton onClick={() => setShowCoach(true)} />}

      {/* AI 코치 팝업 */}
      {showCoach && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 400 }} onClick={closeCoach}>
          <div 
            className={`bottom-sheet${coachClosing ? " closing" : ""}`}
            onClick={e => e.stopPropagation()}
            onTouchStart={e => handleCoachDragStart(e.touches[0].clientY)}
            onTouchEnd={e => handleCoachDragEnd(e.changedTouches[0].clientY)}
            onTouchCancel={() => setCoachStartY(0)}
            onMouseDown={e => handleCoachDragStart(e.clientY)}
            onMouseUp={e => handleCoachDragEnd(e.clientY)}
            onDragStart={e => e.preventDefault()}
            style={{ position: "fixed", bottom: 0, left: 0, right: 0, margin: "0 auto", width: "100%", maxWidth: 390, background: "#fff", borderRadius: "20px 20px 0 0", height: "calc(80vh + 56px)", maxHeight: "calc(100vh - 56px)", paddingBottom: 56, boxSizing: "border-box", overflow: "hidden", display: "flex", flexDirection: "column", zIndex: 500 }}
          >
            <CoachScreen setScreen={closeCoach} />
          </div>
        </div>
      )}
      {isLoading && <Loading message={loadingMessage} />}
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "40px 20px", textAlign: "center", fontFamily: "sans-serif", color: "#374151" }}>
          <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 12 }}>데이터 로드 중 오류가 발생했습니다</h2>
          <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 24, lineHeight: 1.6 }}>
            로컬 저장소의 이전 임시 데이터 포맷이 충돌했거나 렌더링 중 문제가 있을 수 있습니다.<br />
            아래 버튼을 눌러 데이터를 초기화하고 새로고침해 주세요.
          </p>
          <button 
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            style={{ 
              padding: "12px 24px", 
              background: "#EF4444", 
              color: "#fff", 
              border: "none", 
              borderRadius: 8, 
              cursor: "pointer", 
              fontWeight: 700,
              fontSize: 14,
              boxShadow: "0 4px 12px rgba(239, 68, 68, 0.2)"
            }}
          >
            임시 데이터 초기화 및 서비스 재시작
          </button>
          {this.state.error && (
            <pre style={{ marginTop: 32, padding: 12, background: "#F3F4F6", borderRadius: 8, fontSize: 11, color: "#EF4444", textAlign: "left", overflowX: "auto" }}>
              {this.state.error.stack || this.state.error.toString()}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}


export default function App() {
  return (
    <ErrorBoundary>
      <HealthProvider>
        <AppContent />
      </HealthProvider>
    </ErrorBoundary>
  );
}
