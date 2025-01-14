import React from "react";
import { Card } from "react-bootstrap";
import { StyledForm, FormTitle, StyledButton } from "./SharedComponents";

const schemaOptions = [
  {
    text: "Select Existing Schema",
    action: "select",
    description: "Choose from a list of pre-defined schemas.",
  },
  {
    text: "Create New Schema",
    action: "create",
    description: "Define a custom schema for your dataset.",
  },
  {
    text: "Upload Schema",
    action: "upload",
    description: "Upload a JSON schema file.",
  },
  {
    text: "Skip Schema",
    action: "skip",
    description: "Continue without adding a schema to your dataset.",
  },
];

const SchemaOptions = ({ onOptionSelect }) => {
  return (
    <StyledForm>
      <FormTitle>Would you like to add a schema for this dataset?</FormTitle>
      {schemaOptions.map((option, index) => (
        <Card
          key={index}
          style={{
            marginBottom: "10px",
            backgroundColor: "#3e3e3e",
            border: "1px solid #555",
          }}
        >
          <Card.Body
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <Card.Title style={{ color: "#ffffff" }}>
                {option.text}
              </Card.Title>
              <Card.Text style={{ color: "#ffffff" }}>
                {option.description}
              </Card.Text>
            </div>
            <StyledButton onClick={() => onOptionSelect(option.action)}>
              Select
            </StyledButton>
          </Card.Body>
        </Card>
      ))}
    </StyledForm>
  );
};

export default SchemaOptions;
