import React, { useState, useEffect } from "react";
import { Row, Col, Form } from "react-bootstrap";
import { register_schema } from "@fairscape/utils";
import { ipcRenderer } from "electron";
import styled from "styled-components";
import {
  StyledForm,
  FormTitle,
  StyledButton,
  FormField,
  TextAreaField,
  JsonLdPreview,
  StyledFormGroup,
  StyledLabel,
  PropertySection,
  PropertyList,
  PropertyItem,
  WhiteText,
} from "../SharedComponents";

const NestedPropertySection = styled(PropertySection)`
  margin-left: 20px;
  border-left: 2px solid #555;
  padding-left: 15px;
`;

const SchemaPathLabel = styled.div`
  color: #aaa;
  font-size: 0.9em;
  margin-bottom: 5px;
`;

const HDF5SchemaForm = ({
  datasetName,
  onSubmit,
  onCancel,
  rocratePath,
  filePath,
}) => {
  const [schemaData, setSchemaData] = useState({
    name: "",
    description: "",
    properties: {},
  });

  const [selectedPath, setSelectedPath] = useState(null);
  const [jsonLdPreview, setJsonLdPreview] = useState({});
  const [editingProperty, setEditingProperty] = useState(null);

  useEffect(() => {
    if (filePath) {
      convertHDF5Schema(filePath);
    }
  }, [filePath]);

  useEffect(() => {
    updateJsonLdPreview();
  }, [schemaData]);

  const convertHDF5Schema = async (hdf5FilePath) => {
    try {
      const schemaJSON = await ipcRenderer.invoke(
        "convert-hdf5-to-schema",
        rocratePath,
        hdf5FilePath
      );
      console.log(schemaJSON);
      setSchemaData(schemaJSON);
    } catch (error) {
      console.error("Error converting HDF5 schema:", error);
      alert(
        "Error converting HDF5 schema. Please check the file and try again."
      );
    }
  };

  const handleSchemaChange = (e) => {
    const { name, value } = e.target;
    setSchemaData((prev) => ({ ...prev, [name]: value }));
  };

  const updateJsonLdPreview = () => {
    const preview = {
      "@id": `ark:59852/schema-${schemaData.name}-${new Date().getTime()}`,
      "@context": {
        "@vocab": "https://schema.org/",
        EVI: "https://w3id.org/EVI#",
      },
      "@type": "EVI:Schema",
      schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      name: schemaData.name,
      description: schemaData.description,
      properties: schemaData.properties,
      additionalProperties: true,
    };
    setJsonLdPreview(preview);
  };

  const handlePropertyChange = (path, field, value) => {
    setSchemaData((prev) => {
      const newProperties = { ...prev.properties };
      let target = newProperties;
      const pathParts = path.split("/").filter(Boolean);
      const lastPart = pathParts.pop();

      // Navigate to the correct nested level
      for (const part of pathParts) {
        if (target[part] && target[part].properties) {
          target = target[part].properties;
        }
      }

      // Update the specific field
      if (!target[lastPart]) {
        target[lastPart] = {};
      }
      target[lastPart][field] = value;

      return { ...prev, properties: newProperties };
    });
  };

  const renderPropertyEditor = (property, path) => {
    return (
      <NestedPropertySection key={path}>
        <SchemaPathLabel>{path}</SchemaPathLabel>
        <FormField
          label="Description"
          value={property.description || ""}
          onChange={(e) =>
            handlePropertyChange(path, "description", e.target.value)
          }
        />
        <StyledFormGroup>
          <StyledLabel>Type</StyledLabel>
          <Form.Control
            as="select"
            value={property.type || "string"}
            onChange={(e) => handlePropertyChange(path, "type", e.target.value)}
            style={{ backgroundColor: "#3e3e3e", color: "#ffffff" }}
          >
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="integer">Integer</option>
            <option value="boolean">Boolean</option>
            <option value="array">Array</option>
            <option value="object">Object</option>
          </Form.Control>
        </StyledFormGroup>
        {property.properties && (
          <PropertySection>
            <WhiteText>Nested Properties</WhiteText>
            {Object.entries(property.properties).map(([key, nestedProp]) =>
              renderPropertyEditor(nestedProp, `${path}/${key}`)
            )}
          </PropertySection>
        )}
      </NestedPropertySection>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const guid = `ark:59852/schema-${schemaData.name
      .toLowerCase()
      .replace(/\s+/g, "-")}-${new Date().getTime()}`;

    try {
      const result = register_schema(
        rocratePath,
        schemaData.name,
        schemaData.description,
        schemaData.properties,
        schemaData.required,
        ",", // separator is not relevant for HDF5
        false, // header is not relevant for HDF5
        guid,
        null,
        true,
        []
      );

      onSubmit(result);
    } catch (error) {
      console.error("Error registering schema:", error);
      alert(`Error registering schema: ${error.message}`);
    }
  };

  return (
    <StyledForm onSubmit={handleSubmit}>
      <FormTitle>Register HDF5 Schema for Dataset: {datasetName}</FormTitle>
      <Row>
        <Col md={6}>
          <FormField
            label="Schema Name"
            name="name"
            value={schemaData.name}
            onChange={handleSchemaChange}
            required
          />
          <TextAreaField
            label="Description"
            name="description"
            value={schemaData.description}
            onChange={handleSchemaChange}
            required
          />
          <PropertySection>
            <WhiteText>HDF5 Structure</WhiteText>
            {Object.entries(schemaData.properties).map(([key, property]) =>
              renderPropertyEditor(property, key)
            )}
          </PropertySection>
          <div style={{ marginTop: "20px" }}>
            <StyledButton type="submit">Register Schema</StyledButton>
            <StyledButton
              onClick={onCancel}
              variant="secondary"
              style={{ marginLeft: "10px" }}
            >
              Cancel
            </StyledButton>
          </div>
        </Col>
        <Col md={6}>
          <JsonLdPreview jsonLdData={jsonLdPreview} />
        </Col>
      </Row>
    </StyledForm>
  );
};

export default HDF5SchemaForm;
