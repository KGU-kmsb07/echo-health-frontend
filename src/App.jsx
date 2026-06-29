import { useState, useEffect } from "react";
import S from "./styles/shared";
import { NavBar, AIButton } from "./components/Layout";
import SplashScreen from "./screens/Splash";
import LoginScreen from "./screens/Login";
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
  const [tempOnboardData, setTempOnboardData] = useState({});

  const nonNavScreens = ["splash", "login", "onboard1", "onboard2", "onboard3", "onboard4"];
  const showNav = hasOnboarded && !nonNavScreens.includes(screen);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [screen]);

  const navigateTo = (nextScreen) => {
    setScreenHistory(prev => [...prev, nextScreen]);
    setScreen(nextScreen);
  };

  const goBack = () => {
    if (screenHistory.length <= 1) return;
    const nextHistory = [...screenHistory];
    nextHistory.pop();
    const prevScreen = nextHistory[nextHistory.length - 1];
    setScreenHistory(nextHistory);
    setScreen(prevScreen);
  };

  const handleOnboard4Complete = async (finalData) => {
    const age = Number(finalData.age);
    const systolicVal = finalData.bpMode === "manual" ? Number(finalData.systolic) : 120;
    const diastolicVal = finalData.bpMode === "manual" ? Number(finalData.diastolic) : 80;

    const regionVal = finalData.region || "서울";
    const districtVal = finalData.district || "마포구";
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
        diabetes: analysisResult.diabetes_prob !== undefined ? analysisResult.diabetes_prob * 100 : analysisResult.diabetes,
        hypertension: analysisResult.hypertension_prob !== undefined ? analysisResult.hypertension_prob * 100 : analysisResult.hypertension,
        metabolic: analysisResult.metabolic ?? 10,
        obesity: analysisResult.obesity_status !== undefined ? (analysisResult.obesity_status === 1 ? 75 : 10) : analysisResult.obesity
      }
    } : calculateHealthData({
      ...finalData,
      systolic: systolicVal,
      diastolic: diastolicVal
    }, age);

    const finalRisks = analysisResult ? {
      diabetes: analysisResult.diabetes_prob !== undefined ? analysisResult.diabetes_prob * 100 : analysisResult.diabetes,
      hypertension: analysisResult.hypertension_prob !== undefined ? analysisResult.hypertension_prob * 100 : analysisResult.hypertension,
      metabolic: analysisResult.metabolic ?? 10,
      obesity: analysisResult.obesity_status !== undefined ? (analysisResult.obesity_status === 1 ? 75 : 10) : analysisResult.obesity
    } : calculated.risks;

    const finalBmi = analysisResult?.bmi ?? calculated.bmi;
    const finalHealthAge = calculated.healthAge;

    const updatedUser = {
      ...userProfileData,
      vitality_score: analysisResult?.vitality_score,
      healthScore: analysisResult?.vitality_score,
      healthAge: finalHealthAge,
      bmi: finalBmi,
      persona: `${regionVal} ${districtVal}에 사는 ${finalData.age}세 ${finalData.gender}`,
      personaTags: [finalData.gender, `${finalData.age}세`, regionVal, districtVal, finalData.smoking, finalBmi >= 25 ? "비만" : "정상"],
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
        case "splash": return <SplashScreen next={() => navigateTo("login")} />;
        case "login": return <LoginScreen next={() => navigateTo("onboard1")} />;
        case "onboard1": return <OnboardStep1 next={(data) => { setTempOnboardData(prev => ({ ...prev, ...data })); navigateTo("onboard2"); }} back={goBack} />;
        case "onboard2": return <OnboardStep2 next={(data) => { setTempOnboardData(prev => ({ ...prev, ...data })); navigateTo("onboard3"); }} back={goBack} />;
        case "onboard3": return <OnboardStep3 next={(data) => { setTempOnboardData(prev => ({ ...prev, ...data })); navigateTo("onboard4"); }} back={goBack} />;
        case "onboard4": return <OnboardStep4 next={(data) => handleOnboard4Complete({ ...tempOnboardData, ...data })} back={goBack} />;
        case "loading": return <LoadingScreen message={loadingMessage} />;
        case "home": return <HomeScreen setScreen={navigateTo} setTab={setTab} />;
        case "analyze": return <AnalyzeScreen setScreen={navigateTo} back={goBack} />;
        case "future": return <FutureScreen setScreen={navigateTo} back={goBack} />;
        case "simulate": return <SimulateScreen setScreen={navigateTo} back={goBack} />;
        case "improved": return <ImprovedScreen setScreen={navigateTo} setTab={setTab} back={goBack} />;
        case "plan": return <PlanScreen setScreen={navigateTo} back={goBack} />;
        case "reanalyze": return <ReanalyzeScreen setScreen={navigateTo} back={goBack} />;
        case "newresult": return <NewResultScreen setScreen={navigateTo} back={goBack} />;
        case "exercise": return <ExerciseScreen back={goBack} />;
        case "benefits": return <BenefitsScreen back={goBack} />;
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 150 }} onClick={() => setShowCoach(false)}>
          <div 
            className="bottom-sheet"
            onClick={e => e.stopPropagation()} 
            style={{ position: "fixed", bottom: 56, left: 0, right: 0, margin: "0 auto", width: "100%", maxWidth: 390, background: "#fff", borderRadius: "20px 20px 0 0", height: "80vh", overflow: "hidden", display: "flex", flexDirection: "column", zIndex: 200 }}
          >
            <CoachScreen setScreen={() => setShowCoach(false)} />
          </div>
        </div>
      )}
      {isLoading && <Loading message={loadingMessage} />}
    </div>
  );
}

export default function App() {
  return (
    <HealthProvider>
      <AppContent />
    </HealthProvider>
  );
}
