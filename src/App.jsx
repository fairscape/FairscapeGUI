import React, { useState, useEffect } from "react";
import InitForm from "./components/InitForm";
import FileSelector from "./components/Register/FileSelector";
import ComputationForm from "./components/Register/ComputationForm";
import Review from "./components/Review";
import PackageForm from "./components/PackageForm";
import UploadForm from "./components/UploadForm";
import SidebarComponent from "./components/SideBar";
import Questionnaire from "./components/Questionnaire";
import {
  AppContainer,
  MainContentWrapper,
} from "./components/StyledComponents";

function App() {
  const [currentView, setCurrentView] = useState("questionnaire");
  const [rocratePath, setRocratePath] = useState("");
  const [packagedPath, setPackagedPath] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [registeredFiles, setRegisteredFiles] = useState([]);

  useEffect(() => {
    // Check for existing auth token on component mount
    const token = localStorage.getItem("authToken");
    if (token) {
      // You might want to validate the token here
      setIsLoggedIn(true);
      // You might want to fetch user data here based on the token
    }
  }, []);

  const handleViewSelect = (view) => {
    setCurrentView(view);
  };

  const handleInitSuccess = () => {
    setCurrentView("register");
  };

  const handleInitRequired = (path) => {
    setRocratePath(path);
    setCurrentView("init");
  };

  const handleDoneRegistering = () => {
    setCurrentView("computation");
  };

  const handleComputationComplete = () => {
    setCurrentView("review"); // Change to review step after computation
  };

  const handleReviewComplete = () => {
    setCurrentView("package");
  };

  const handlePackageComplete = (zipPath) => {
    setPackagedPath(zipPath);
    setCurrentView("upload");
  };

  const handleLogin = (data) => {
    setIsLoggedIn(true);
    setUserData(data);
    localStorage.setItem("authToken", data.token);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserData(null);
    localStorage.removeItem("authToken");
    setCurrentView("questionnaire"); // Reset to initial view
  };

  const handleFileRegister = (newFiles) => {
    setRegisteredFiles([...registeredFiles, ...newFiles]);
  };

  const renderMainContent = () => {
    switch (currentView) {
      case "questionnaire":
        return <Questionnaire onStepSelect={handleViewSelect} />;
      case "init":
        return (
          <InitForm
            rocratePath={rocratePath}
            setRocratePath={setRocratePath}
            onSuccess={handleInitSuccess}
          />
        );
      case "register":
        return (
          <FileSelector
            rocratePath={rocratePath}
            setRocratePath={setRocratePath}
            onDoneRegistering={handleDoneRegistering}
            onSkipComputations={handleComputationComplete}
            onFileRegister={handleInitSuccess}
            onInitRequired={handleInitRequired}
          />
        );
      case "computation":
        return (
          <ComputationForm
            rocratePath={rocratePath}
            registeredFiles={registeredFiles}
            onComplete={handleFileRegister}
            onSkip={handleComputationComplete}
          />
        );
      case "review":
        return (
          <Review
            rocratePath={rocratePath}
            onContinue={handleReviewComplete}
            setRocratePath={setRocratePath}
          />
        );
      case "package":
        return (
          <PackageForm
            rocratePath={rocratePath}
            setRocratePath={setRocratePath}
            onComplete={handlePackageComplete}
          />
        );
      case "upload":
        return <UploadForm packagedPath={packagedPath} />;
      default:
        return <div>Select a step from the sidebar</div>;
    }
  };

  return (
    <AppContainer>
      <SidebarComponent
        selectedView={currentView}
        handleViewSelect={handleViewSelect}
        isLoggedIn={isLoggedIn}
        userData={userData}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
      <MainContentWrapper>{renderMainContent()}</MainContentWrapper>
    </AppContainer>
  );
}

export default App;
