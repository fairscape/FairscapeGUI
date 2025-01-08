import React, { useState, useEffect } from "react";
import styled from "styled-components";
import axios from "axios";
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

const SchemaList = styled.ul`
  list-style-type: none;
  padding: 0;
`;

const SchemaItem = styled.li`
  background-color: #3e3e3e;
  border: 1px solid #555;
  border-radius: 5px;
  margin-bottom: 10px;
  padding: 10px;
  cursor: pointer;
  &:hover {
    background-color: #4e4e4e;
  }
`;

const Button = styled.button`
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

const SchemaSelector = ({ onSchemaSelect, onCancel, rocratePath }) => {
  const [schemaFiles, setSchemaFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSchemaFiles = async () => {
      try {
        const response = await axios.get(
          "https://api.github.com/repos/fairscape/cm4ai-schemas/contents/v0.1.0"
        );
        const jsonFiles = response.data.filter((file) =>
          file.name.endsWith(".json")
        );
        setSchemaFiles(jsonFiles);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching schema files:", err);
        setError("Failed to fetch schema files. Please try again later.");
        setLoading(false);
      }
    };
    fetchSchemaFiles();
  }, []);

  const handleSchemaSelect = async (file) => {
    try {
      const rawUrl = `https://raw.githubusercontent.com/fairscape/cm4ai-schemas/main/v0.1.0/${file.name}`;
      const response = await axios.get(rawUrl);
      const schemaContent = response.data;

      console.log(
        "Parsed schema content:",
        JSON.stringify(schemaContent, null, 2)
      );

      // Use the existing @id from the schema
      const guid =
        schemaContent["@id"] ||
        schemaContent.id ||
        `ark:59852/schema-${
          schemaContent.name?.toLowerCase().replace(/\s+/g, "-") || "unknown"
        }-${new Date().getTime()}`;

      console.log("Using GUID:", guid);

      // Prepare properties object
      const properties = schemaContent.properties || {};
      const requiredFields = schemaContent.required || Object.keys(properties);

      // Log the parameters being passed to register_schema
      console.log("Registering schema with parameters:", {
        rocratePath,
        name: schemaContent.name || "",
        description: schemaContent.description || "",
        properties,
        required: requiredFields,
        separator: schemaContent.separator || ",",
        header: schemaContent.header || false,
        guid,
        url: rawUrl,
        additionalProperties: schemaContent.additionalProperties !== false,
        examples: schemaContent.examples || [],
      });

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
        rawUrl,
        schemaContent.additionalProperties !== false,
        schemaContent.examples || []
      );

      console.log("Schema registration result:", result);

      // Prepare the JSON-LD preview
      const jsonLdPreview = {
        "@id": guid,
        "@context": schemaContent["@context"] || {
          "@vocab": "https://schema.org/",
          EVI: "https://w3id.org/EVI#",
        },
        "@type": schemaContent["@type"] || "EVI:Schema",
        schema:
          schemaContent.schema ||
          "https://json-schema.org/draft/2020-12/schema",
        ...schemaContent,
      };

      console.log("Prepared JSON-LD preview:", jsonLdPreview);

      onSchemaSelect(result);
    } catch (err) {
      console.error("Error in handleSchemaSelect:", err);
      setError(
        `Failed to fetch or register schema content for ${file.name}. Error: ${err.message}`
      );
    }
  };

  if (loading) {
    return <Container>Loading schemas...</Container>;
  }

  if (error) {
    return <Container>{error}</Container>;
  }

  return (
    <Container>
      <Title>Select an Existing Schema</Title>
      <SchemaList>
        {schemaFiles.map((file) => (
          <SchemaItem key={file.name} onClick={() => handleSchemaSelect(file)}>
            {file.name}
          </SchemaItem>
        ))}
      </SchemaList>
      <Button onClick={onCancel}>Cancel</Button>
    </Container>
  );
};

export default SchemaSelector;
