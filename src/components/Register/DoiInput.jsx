import React, { useState } from "react";
import { Row, Col, Button, InputGroup } from "react-bootstrap";
import { getDoiMetadata } from "./Utils/doiUtils";
import { DoiContainer, DoiInput, StyledButton } from "./styles";

const DoiInputComponent = ({ onBack, onDoiSubmit }) => {
  const [doi, setDoi] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const cleanDoi = doi.replace(/^DOI:\s*/i, "").trim();
      const metadata = await getDoiMetadata(cleanDoi);
      onDoiSubmit(metadata);
    } catch (error) {
      setError(`Error fetching DOI metadata: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
            <Button onClick={handleSubmit} disabled={isLoading || !doi.trim()}>
              {isLoading ? "Loading..." : "Fetch Metadata"}
            </Button>
          </InputGroup>
          {error && <div className="text-danger mt-2">{error}</div>}
        </DoiContainer>
        <StyledButton onClick={onBack} variant="secondary">
          Back
        </StyledButton>
      </Col>
    </Row>
  );
};

export default DoiInputComponent;
