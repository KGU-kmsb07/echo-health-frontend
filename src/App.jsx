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
import { MOCK_USER } from "./mock/mockData";
import Loading from "./components/Loading";

function AppContent() {
  const { setUser, setRisks, hasOnboarded, setHasOnboarded, setFirstResult, calculateHealthData, resetPlan, addNotification, setOriginalUser, isLoading, loadingMessage, hideLoading, isEditMode, setEditMode, navigateWithLoading } = useHealth();
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

  const renderScreen = () => {
    const getScreenComponent = () => {
      switch (screen) {
        case "splash": return <SplashScreen next={() => navigateTo("login")} />;
        case "login": return <LoginScreen next={() => navigateTo("onboard1")} />;
        case "onboard1": return <OnboardStep1 next={(data) => { setTempOnboardData(prev => ({ ...prev, ...data })); navigateTo("onboard2"); }} back={goBack} />;
        case "onboard2": return <OnboardStep2 next={(data) => { setTempOnboardData(prev => ({ ...prev, ...data })); navigateTo("onboard3"); }} back={goBack} />;
        case "onboard3": return <OnboardStep3 next={(data) => { setTempOnboardData(prev => ({ ...prev, ...data })); navigateTo("onboard4"); }} back={goBack} />;
        case "onboard4": return <OnboardStep4 next={(data) => {
          const finalData = { ...tempOnboardData, ...data };
          const age = Number(finalData.age);
          const systolicVal = finalData.bpMode === "manual" ? Number(finalData.systolic) : 120;
          const diastolicVal = finalData.bpMode === "manual" ? Number(finalData.diastolic) : 80;

          const calculated = calculateHealthData({
            ...finalData,
            systolic: systolicVal,
            diastolic: diastolicVal
          }, age);

          const regionVal = finalData.region || MOCK_USER.region || "서울";
          const districtVal = finalData.district || MOCK_USER.district || "마포구";
          const nameVal = finalData.name || MOCK_USER.name || "사용자";
          const profileImageVal = finalData.profileImage !== undefined ? finalData.profileImage : null;

          const updatedUser = {
            ...MOCK_USER,
            name: nameVal,
            profileImage: profileImageVal,
            region: regionVal,
            district: districtVal,
            gender: finalData.gender,
            age: age,
            height: Number(finalData.height),
            weight: Number(finalData.weight),
            bmi: calculated.bmi,
            bloodPressure: {
              systolic: systolicVal,
              diastolic: diastolicVal
            },
            smoking: finalData.smoking,
            drinking: finalData.drinking,
            exercise: finalData.exercise,
            bpMode: finalData.bpMode,
            healthScore: calculated.healthScore,
            healthAge: calculated.healthAge,
            persona: `${regionVal} ${districtVal}에 사는 ${finalData.age}세 ${finalData.gender}`,
            personaTags: [finalData.gender, `${finalData.age}세`, regionVal, districtVal, finalData.smoking, calculated.bmi >= 25 ? "비만" : "정상"],
            createdAt: new Date().toISOString()
          };
          
          resetPlan(updatedUser);
          addNotification("건강정보가 업데이트 되었어요.", "📈", "analyze", "analyze");
          setUser(updatedUser);
          setOriginalUser(updatedUser);
          setRisks(calculated.risks);
          setHasOnboarded(true);

          setFirstResult({
            user: updatedUser,
            risks: calculated.risks
          });
          
          if (isEditMode) {
            setScreen("mypage");
            setTab("mypage");
            setScreenHistory(["mypage"]);
            setEditMode(false);
          } else {
            setTab("home");
            setScreenHistory(["home"]);
            navigateWithLoading(setScreen, "home", 600, "로딩 중");
          }
        }} back={goBack} />;
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
