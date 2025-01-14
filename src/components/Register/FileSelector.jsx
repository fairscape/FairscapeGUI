import React, { useState, useEffect } from "react";
import { Row, Col } from "react-bootstrap";
import { ipcRenderer } from "electron";
import DatasetForm from "./DatasetForm";
import SoftwareForm from "./SoftwareForm";
import InitModal from "../InitModal";
import DoiInputComponent from "./DoiInput";
import { loadRoCrateFiles, normalizePath } from "./Utils/fileUtils";
import {
  StyledContainer,
  StyledTitle,
  StyledListGroup,
  StyledListGroupItem,
  DoiListItem,
  StyledButton,
  CheckMark,
  ButtonContainer,
  DoneButton,
  RightAlignedButton,
} from "./styles";

function FileSelector({
  rocratePath,
  setRocratePath,
  onDoneRegistering,
  onSkipComputations,
  onFileRegister,
  onInitRequired,
}) {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [error, setError] = useState(null);
  const [registeredFiles, setRegisteredFiles] = useState([]);
  const [showInitModal, setShowInitModal] = useState(false);
  const [packageType, setPackageType] = useState(null);
  const [showDoiInput, setShowDoiInput] = useState(false);
  const [doiMetadata, setDoiMetadata] = useState(null);

  useEffect(() => {
    const initializeRoCrate = async () => {
      try {
        const result = await loadRoCrateFiles(rocratePath);

        if (result.needsInit) {
          setShowInitModal(true);
          return;
        }

        setFiles(result.files);
        setRegisteredFiles(result.registeredFiles);
        setPackageType(result.packageType);
        setError(null);
      } catch (error) {
        console.error("Error reading directory or metadata:", error);
        setError(error.message);
        setFiles([]);
      }
    };

    if (rocratePath) {
      initializeRoCrate();
    }
  }, [rocratePath]);

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    if (packageType === "dataset") {
      setFileType("dataset");
    } else {
      setFileType(null);
    }
  };

  const handleTypeSelect = (type) => {
    setFileType(type);
  };

  const handleBack = () => {
    if (fileType) {
      setFileType(null);
    } else {
      setSelectedFile(null);
      setShowDoiInput(false);
      setDoiMetadata(null);
    }
  };

  const handleBrowse = async () => {
    try {
      const result = await ipcRenderer.invoke("open-directory-dialog");
      if (result.filePaths?.[0]) {
        setRocratePath(result.filePaths[0]);
      }
    } catch (error) {
      console.error("Failed to open directory dialog:", error);
      setError("Failed to open directory dialog. Please try again.");
    }
  };

  const handleChangeCrate = async () => {
    try {
      const result = await ipcRenderer.invoke("open-directory-dialog");
      if (result.filePaths?.[0]) {
        setRocratePath(result.filePaths[0]);
        setSelectedFile(null);
        setFileType(null);
        setFiles([]);
        setRegisteredFiles([]);
        setError(null);
        setPackageType(null);
        setShowDoiInput(false);
        setDoiMetadata(null);
      }
    } catch (error) {
      console.error("Failed to open directory dialog:", error);
      setError("Failed to open directory dialog. Please try again.");
    }
  };

  const handleDoiSubmit = (metadata) => {
    setDoiMetadata(metadata);
    setFileType("dataset");
    setSelectedFile("doi");
  };

  const handleInitialize = () => {
    setShowInitModal(false);
    onInitRequired(rocratePath);
  };

  const handleDoneRegistering = () => {
    if (packageType === "dataset") {
      onSkipComputations();
    } else {
      onDoneRegistering();
    }
  };

  const refreshRegisteredFiles = async () => {
    try {
      const result = await loadRoCrateFiles(rocratePath);
      setRegisteredFiles(result.registeredFiles);
    } catch (error) {
      console.error("Error refreshing registered files:", error);
    }
  };

  if (selectedFile && fileType) {
    const FormComponent = fileType === "dataset" ? DatasetForm : SoftwareForm;
    return (
      <FormComponent
        file={selectedFile}
        onBack={async () => {
          await refreshRegisteredFiles();
          handleBack();
          setShowDoiInput(false);
        }}
        rocratePath={rocratePath}
        onSuccess={async () => {
          await refreshRegisteredFiles();
          onFileRegister();
          setSelectedFile(null);
          setFileType(null);
          setDoiMetadata(null);
          setShowDoiInput(false);
        }}
        doiMetadata={doiMetadata}
      />
    );
  }

  return (
    <StyledContainer>
      <StyledTitle>Register Objects</StyledTitle>
      {!rocratePath ? (
        <Row>
          <Col>
            <p>Please select an RO-Crate directory:</p>
            <StyledButton onClick={handleBrowse}>Browse</StyledButton>
          </Col>
        </Row>
      ) : selectedFile && packageType !== "dataset" ? (
        <Row>
          <Col>
            <h3>Is {selectedFile} a dataset or software?</h3>
            <StyledButton onClick={() => handleTypeSelect("dataset")}>
              Dataset
            </StyledButton>
            <StyledButton onClick={() => handleTypeSelect("software")}>
              Software
            </StyledButton>
            <StyledButton onClick={handleBack} variant="secondary">
              Back
            </StyledButton>
          </Col>
        </Row>
      ) : showDoiInput ? (
        <DoiInputComponent onBack={handleBack} onDoiSubmit={handleDoiSubmit} />
      ) : (
        <>
          <Row>
            <Col>
              <h3>Select a file to add metadata:</h3>
            </Col>
          </Row>
          <Row>
            <Col>
              {error ? (
                <p>{error}</p>
              ) : (
                <StyledListGroup>
                  {files.map((file) => (
                    <StyledListGroupItem
                      key={file}
                      action
                      onClick={() => handleFileSelect(file)}
                      isRegistered={registeredFiles.includes(
                        normalizePath(file)
                      )}
                    >
                      {file}
                      {registeredFiles.includes(normalizePath(file)) && (
                        <CheckMark>✓</CheckMark>
                      )}
                    </StyledListGroupItem>
                  ))}
                  <DoiListItem action onClick={() => setShowDoiInput(true)}>
                    Register a publication or dataset using DOI...
                  </DoiListItem>
                </StyledListGroup>
              )}
            </Col>
          </Row>
          {files.length === 0 && !error && (
            <Row>
              <Col>
                <p>No files found in the RO-Crate directory.</p>
              </Col>
            </Row>
          )}
          <ButtonContainer>
            {files.length > 0 && (
              <DoneButton onClick={handleDoneRegistering}>
                Done Registering
              </DoneButton>
            )}
            <RightAlignedButton onClick={handleChangeCrate} variant="secondary">
              Change RO-Crate
            </RightAlignedButton>
          </ButtonContainer>
        </>
      )}

      <InitModal
        show={showInitModal}
        onHide={() => setShowInitModal(false)}
        onInit={handleInitialize}
      />
    </StyledContainer>
  );
}

export default FileSelector;
