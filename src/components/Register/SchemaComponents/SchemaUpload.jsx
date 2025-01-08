import React, { useState } from "react";
import styled from "styled-components";
import { register_schema } from "@fairscape/utils";

const Container = styled.div`
  background-color: #282828;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  color: #ffffff;
`;

const Title = styled.h2`
  margin-bottom: 30px;
  text-align: center;
`;

const FileInput = styled.input`
  display: none;
`;

const UploadButton = styled.button`
  background-color: #007bff;
  border: none;
  color: white;
  padding: 10px 20px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin: 4px 2px;
  cursor: pointer;
  border-radius: 5px;
  &:hover {
    background-color: #0056b3;
  }
`;

const ErrorMessage = styled.div`
  color: #ff6b6b;
  margin-top: 10px;
`;

const SchemaUpload = ({ onSchemaSelect, onCancel, rocratePath }) => {
  const [error, setError] = useState(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const schemaContent = JSON.parse(e.target.result);

          // Generate a GUID if one isn't provided
          const guid =
            schemaContent["@id"] ||
            schemaContent.id ||
            `ark:59852/schema-${
              schemaContent.name?.toLowerCase().replace(/\s+/g, "-") ||
              "unknown"
            }-${new Date().getTime()}`;

          // Prepare properties object
          const properties = schemaContent.properties || {};
          const requiredFields =
            schemaContent.required || Object.keys(properties);

          // Register the schema
          const result = register_schema(
            rocratePath,
            schemaContent.name || "",
            schemaContent.description || "",
            properties,
            requiredFields,
            schemaContent.separator || ",",
            schemaContent.header || false,
            guid,
            file.name, // Using the local file name as the URL
            schemaContent.additionalProperties !== false,
            schemaContent.examples || []
          );

          onSchemaSelect(result);
        } catch (err) {
          setError(`Invalid JSON schema file: ${err.message}`);
        }
      };
      reader.readAsText(file);
    } catch (err) {
      setError(`Error reading file: ${err.message}`);
    }
  };

  return (
    <Container>
      <Title>Upload Schema</Title>
      <FileInput
        type="file"
        accept=".json"
        onChange={handleFileUpload}
        id="schema-upload"
      />
      <label htmlFor="schema-upload">
        <UploadButton as="span">Choose JSON Schema File</UploadButton>
      </label>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <UploadButton onClick={onCancel}>Cancel</UploadButton>
    </Container>
  );
};

export default SchemaUpload;
