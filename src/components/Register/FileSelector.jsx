import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  ListGroup,
  Button,
  Container,
  Row,
  Col,
  Form,
  InputGroup,
} from "react-bootstrap";
import DatasetForm from "./DatasetForm";
import SoftwareForm from "./SoftwareForm";
import InitModal from "../InitModal";
import fs from "fs";
import path from "path";
import { ipcRenderer } from "electron";

const StyledContainer = styled(Container)`
  background-color: #282828;
  color: #ffffff;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
`;

const StyledTitle = styled.h2`
  margin-bottom: 30px;
  text-align: center;
`;

const StyledListGroup = styled(ListGroup)`
  background-color: #3e3e3e;
`;

const StyledListGroupItem = styled(ListGroup.Item)`
  background-color: #3e3e3e;
  color: ${(props) => (props.isRegistered ? "#888" : "#ffffff")};
  border-color: #555;
  cursor: ${(props) => (props.isRegistered ? "not-allowed" : "pointer")};
  pointer-events: ${(props) => (props.isRegistered ? "none" : "auto")};
  &:hover {
    background-color: ${(props) =>
      props.isRegistered ? "#3e3e3e" : "#4e4e4e"};
  }
`;

const DoiListItem = styled(ListGroup.Item)`
  background-color: #2d2d2d !important;
  color: #ffffff;
  border-color: #555;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  text-align: center;
  font-style: italic;
  &:hover {
    background-color: #3d3d3d !important;
  }
`;

const StyledButton = styled(Button)`
  margin-right: 10px;
  background-color: #007bff;
  border: none;
  &:hover {
    background-color: #0056b3;
  }
`;

const CheckMark = styled.span`
  color: #28a745;
  margin-left: 10px;
`;

const DoneButton = styled(StyledButton)`
  margin-top: 20px;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
`;

const RightAlignedButton = styled(StyledButton)`
  margin-left: auto;
`;

const DoiContainer = styled.div`
  margin-bottom: 20px;
`;

const DoiInput = styled(Form.Control)`
  background-color: #3e3e3e;
  color: #ffffff;
  border-color: #555;
  &:focus {
    background-color: #4e4e4e;
    color: #ffffff;
    border-color: #007bff;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  }
`;

async function getDoiMetadata(doi) {
  // Remove any URL prefix if present
  doi = doi.replace(/^https?:\/\/(dx\.)?doi\.org\//, "");

  // Try CrossRef first
  try {
    const crossrefResponse = await fetch(
      `https://api.crossref.org/works/${doi}`
    );
    if (crossrefResponse.ok) {
      const data = await crossrefResponse.json();
      return {
        source: "CrossRef",
        metadata: data.message,
      };
    }
  } catch (error) {
    console.log("CrossRef fetch failed:", error.message);
  }

  // Try DataCite if CrossRef fails
  try {
    const dataciteResponse = await fetch(
      `https://api.datacite.org/works/${doi}`
    );
    if (dataciteResponse.ok) {
      const data = await dataciteResponse.json();
      return {
        source: "DataCite",
        metadata: data.data,
      };
    }
  } catch (error) {
    console.log("DataCite fetch failed:", error.message);
  }

  throw new Error("Could not fetch metadata from either CrossRef or DataCite");
}

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
  const [doi, setDoi] = useState("");
  const [doiMetadata, setDoiMetadata] = useState(null);
  const [isLoadingDoi, setIsLoadingDoi] = useState(false);

  const readFilesRecursively = async (dir, baseDir) => {
    let results = [];
    const items = await fs.promises.readdir(dir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      const relativePath = path.relative(baseDir, fullPath);

      if (item.isDirectory()) {
        results = results.concat(await readFilesRecursively(fullPath, baseDir));
      } else if (
        item.isFile() &&
        item.name !== "ro-crate-metadata.json" &&
        item.name !== ".DS_Store"
      ) {
        results.push(relativePath);
      }
    }

    return results;
  };

  const normalizePath = (filePath) =>
    filePath.replace(/^\//, "").replace(/\\/g, "/");

  // Monitor doiMetadata changes
  useEffect(() => {
    console.log("doiMetadata state updated:", doiMetadata);
  }, [doiMetadata]);

  useEffect(() => {
    const loadFiles = async () => {
      try {
        if (!rocratePath) {
          setError("Please select an RO-Crate directory.");
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 100));

        const fileList = await fs.promises.readdir(rocratePath);
        const metadataExists = fileList.includes("ro-crate-metadata.json");

        if (!metadataExists) {
          setShowInitModal(true);
          return;
        }

        const filteredFiles = await readFilesRecursively(
          rocratePath,
          rocratePath
        );

        if (filteredFiles.length === 0) {
          setError(
            "No files found in the RO-Crate directory. Please add files to the selected folder."
          );
        } else {
          setFiles(filteredFiles);
          setError(null);

          const metadataPath = path.join(rocratePath, "ro-crate-metadata.json");
          const metadata = JSON.parse(
            await fs.promises.readFile(metadataPath, "utf8")
          );
          const registeredFiles = metadata["@graph"]
            .filter((item) => item.contentUrl)
            .map((item) =>
              normalizePath(item.contentUrl.replace("file://", ""))
            );
          setRegisteredFiles(registeredFiles);

          setPackageType(metadata.packageType || null);
          console.log(packageType);
        }
      } catch (error) {
        console.error("Error reading directory or metadata:", error);
        setError(
          "Error reading directory or metadata. Please make sure the path is correct and accessible."
        );
        setFiles([]);
      }
    };

    loadFiles();
  }, [rocratePath, registeredFiles]);

  const handleDoiSubmit = async () => {
    setIsLoadingDoi(true);
    setError(null);

    try {
      // Clean up DOI by removing any "DOI:" prefix
      const cleanDoi = doi.replace(/^DOI:\s*/i, "").trim();
      const metadata = await getDoiMetadata(cleanDoi);
      setDoiMetadata(metadata);
      setFileType("dataset");
      setSelectedFile("doi");
    } catch (error) {
      setError(`Error fetching DOI metadata: ${error.message}`);
      setDoiMetadata(null);
    } finally {
      setIsLoadingDoi(false);
    }
  };

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
      setDoi("");
      setDoiMetadata(null);
    }
  };

  const handleBrowse = async () => {
    try {
      const result = await ipcRenderer.invoke("open-directory-dialog");
      if (result.filePaths && result.filePaths.length > 0) {
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
      if (result.filePaths && result.filePaths.length > 0) {
        setRocratePath(result.filePaths[0]);
        setSelectedFile(null);
        setFileType(null);
        setFiles([]);
        setRegisteredFiles([]);
        setError(null);
        setPackageType(null);
        setShowDoiInput(false);
        setDoi("");
        setDoiMetadata(null);
      }
    } catch (error) {
      console.error("Failed to open directory dialog:", error);
      setError("Failed to open directory dialog. Please try again.");
    }
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

  if (selectedFile && fileType) {
    const FormComponent = fileType === "dataset" ? DatasetForm : SoftwareForm;
    return (
      <FormComponent
        file={selectedFile}
        onBack={handleBack}
        rocratePath={rocratePath}
        onSuccess={() => {
          onFileRegister();
          setSelectedFile(null);
          setFileType(null);
          setDoiMetadata(null);
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
        <Row>
          <Col>
            <h3>Enter DOI:</h3>
            <DoiContainer>
              <InputGroup>
                <DoiInput
                  type="text"
                  value={doi}
                  onChange={(e) => setDoi(e.target.value)}
                  placeholder="Enter DOI (e.g., 10.1000/xyz123)"
                />
                <Button
                  onClick={handleDoiSubmit}
                  disabled={isLoadingDoi || !doi.trim()}
                >
                  {isLoadingDoi ? "Loading..." : "Fetch Metadata"}
                </Button>
              </InputGroup>
              {error && <div className="text-danger mt-2">{error}</div>}
            </DoiContainer>
            <StyledButton onClick={handleBack} variant="secondary">
              Back
            </StyledButton>
          </Col>
        </Row>
      ) : (
        <>
          <Row>
            <Col>
              <h3>Select a file to add metadata:</h3>
            </Col>
          </Row>
          <Row>
            <Col>
              {error && !showDoiInput ? (
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
