import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import axios from "axios";

const StatusContainer = styled.div`
  margin-top: 20px;
  background-color: #3e3e3e;
  border-radius: 10px;
  padding: 20px;
  color: #ffffff;
`;

const StatusTitle = styled.h3`
  margin-bottom: 15px;
`;

const ProgressBarContainer = styled.div`
  background-color: #282828;
  border-radius: 25px;
  height: 50px;
  position: relative;
  overflow: hidden;
  margin-bottom: 20px;
`;

const ProgressBar = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: ${(props) =>
    props.failed === "true"
      ? "#dc3545"
      : "linear-gradient(to right, #007bff, #28a745)"};
  width: ${(props) => props.progress}%;
  transition: width 0.5s ease-in-out, background-color 0.5s ease-in-out;
`;

const StepContainer = styled.div`
  display: flex;
  justify-content: space-between;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
`;

const Step = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: ${(props) => (props.active ? "#ffffff" : "#aaaaaa")};
  z-index: 2;
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  margin-top: 10px;
  font-weight: bold;
`;

const StatusDetails = styled.div`
  margin-top: 15px;
`;

const Link = styled.a`
  color: #007bff;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const StatusTracker = ({ submissionUUID, uploadError, isUploading }) => {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [details, setDetails] = useState(null);
  const [success, setSuccess] = useState(false);
  const [completed, setCompleted] = useState(false);
  const intervalRef = useRef(null);

  const baseUrl = process.env.REACT_APP_BASE_URL || "http://localhost:5173";
  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8080/api";

  useEffect(() => {
    if (uploadError) {
      setStatus("Failed");
      setError(
        `Upload Failed: Status ${uploadError.status} - ${uploadError.message}`
      );
      setSuccess(false);
      setCompleted(true);
    } else if (isUploading) {
      setStatus("In Queue");
      setError(null);
      setSuccess(false);
      setCompleted(false);
    } else if (submissionUUID) {
      setStatus("in progress");
      setError(null);
      setSuccess(false);
      setCompleted(false);
      checkUploadStatus();
      intervalRef.current = setInterval(checkUploadStatus, 2000);
    } else {
      // Reset status when there's no upload in progress
      setStatus(null);
      setError(null);
      setSuccess(false);
      setCompleted(false);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [submissionUUID, uploadError, isUploading]);

  const checkUploadStatus = async () => {
    if (!submissionUUID) return;

    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(
        `${apiUrl}/rocrate/upload/status/${submissionUUID}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Status response:", response.data);
      setStatus(response.data.status);
      setDetails(response.data);
      setSuccess(response.data.success);
      setCompleted(response.data.completed);
      if (response.data.error) {
        setError(response.data.error);
      }

      if (response.data.completed || response.data.error) {
        clearInterval(intervalRef.current);
      }
    } catch (error) {
      console.error("Status check error:", error);
      setError(`Failed to check upload status: ${error.message}`);
      setStatus("Failed");
      setSuccess(false);
      setCompleted(true);
      clearInterval(intervalRef.current);
    }
  };

  const steps = ["In Queue", "Uploading Files", "Minting IDs", "Complete"];
  let currentStep;
  let progress;

  switch (status) {
    case "In Queue":
      currentStep = 0;
      progress = 25;
      break;
    case "in progress":
      currentStep = 1;
      progress = 50;
      break;
    case "minting identifiers":
      currentStep = 2;
      progress = 75;
      break;
    case "finished":
      currentStep = success ? 3 : -1;
      progress = 100;
      break;
    case "Finished":
      currentStep = success ? 3 : -1;
      progress = 100;
      break;
    case "Failed":
      currentStep = -1;
      progress = 100;
      break;
    default:
      currentStep = -1;
      progress = 0;
  }

  const isFailed = status === "Failed" || error || (completed && !success);

  if (!status) {
    return null; // Don't render anything if there's no status
  }

  return (
    <StatusContainer>
      <StatusTitle>RO-Crate Upload Progress</StatusTitle>
      <ProgressBarContainer>
        <ProgressBar progress={progress} failed={isFailed.toString()} />
        <StepContainer>
          {steps.map((step, index) => (
            <Step key={index} active={index <= currentStep}>
              {index + 1}. {step}
            </Step>
          ))}
        </StepContainer>
      </ProgressBarContainer>
      {isFailed && <ErrorMessage>{error || "Upload failed"}</ErrorMessage>}
      {details && (
        <StatusDetails>
          <p>Status: {status}</p>
          <p>Success: {success ? "Yes" : "No"}</p>
          {details.identifiersMinted && (
            <>
              <p>Identifiers Minted: {details.identifiersMinted.length}</p>
              {success && details.identifiersMinted.length > 0 && (
                <p>
                  View Result:{" "}
                  <Link
                    href={`${baseUrl}/${
                      details.identifiersMinted[
                        details.identifiersMinted.length - 1
                      ]
                    }`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open
                  </Link>
                </p>
              )}
            </>
          )}
        </StatusDetails>
      )}
    </StatusContainer>
  );
};

export default StatusTracker;
