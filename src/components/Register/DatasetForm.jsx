import React, { useState, useEffect } from "react";
import { Row, Col, Card } from "react-bootstrap";
import { register_dataset } from "@fairscape/utils";
import path from "path";
import {
  StyledForm,
  FormTitle,
  StyledButton,
  FormField,
  TextAreaField,
  JsonLdPreview,
  StyledFormGroup,
  WhiteText,
} from "./SharedComponents";
import SchemaForm from "./SchemaComponents/SchemaForm";
import SchemaUpload from "./SchemaComponents/SchemaUpload";
import SchemaSelector from "./SchemaComponents/SchemaSelector";
import HDF5SchemaForm from "./SchemaComponents/HDF5SchemaForm";

function DatasetForm({ file, onBack, rocratePath, onSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    author: "",
    version: "",
    "date-published": "",
    description: "",
    keywords: "",
    "data-format": "",
    url: "",
    "used-by": [],
    "derived-from": [],
    schema: "",
    "associated-publication": "",
    "additional-documentation": "",
  });

  const [jsonLdPreview, setJsonLdPreview] = useState({});
  const [showSchemaOptions, setShowSchemaOptions] = useState(false);
  const [showSchemaSelector, setShowSchemaSelector] = useState(false);
  const [showSchemaForm, setShowSchemaForm] = useState(false);
  const [showHDF5SchemaForm, setShowHDF5SchemaForm] = useState(false);
  const [showSchemaUpload, setShowSchemaUpload] = useState(false);
  const [datasetRegistered, setDatasetRegistered] = useState(false);
  const [pendingRegistration, setPendingRegistration] = useState(false);
  const [schemaGuid, setSchemaGuid] = useState(null);

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
  useEffect(() => {
    const fileName = path.basename(file, path.extname(file)).replace(/_/g, " ");
    const fileExtension = path.extname(file).slice(1).toUpperCase();

    setFormData((prevState) => ({
      ...prevState,
      name: fileName,
      "data-format": fileExtension,
    }));

    updateJsonLdPreview();
  }, [file]);

  useEffect(() => {
    updateJsonLdPreview();
  }, [formData, schemaGuid]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const generateGuid = (name) => {
    const NAAN = "59852";
    const sq = new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace("T", "")
      .slice(0, 14);
    return `ark:${NAAN}/dataset-${name
      .toLowerCase()
      .replace(/\s+/g, "-")}-${sq}`;
  };

  const updateJsonLdPreview = () => {
    const guid = generateGuid(formData.name);
    const preview = {
      "@context": {
        "@vocab": "https://schema.org/",
        EVI: "https://w3id.org/EVI#",
      },
      "@id": guid,
      "@type": "https://w3id.org/EVI#Dataset",
      name: formData.name,
      author: formData.author,
      version: formData.version,
      datePublished: formData["date-published"],
      description: formData.description,
      keywords: formData.keywords.split(",").map((k) => k.trim()),
      format: formData["data-format"],
      url: formData.url || undefined,
      usedBy: formData["used-by"] || undefined,
      derivedFrom: formData["derived-from"] || undefined,
      schema: schemaGuid || undefined,
      associatedPublication: formData["associated-publication"] || undefined,
      additionalDocumentation:
        formData["additional-documentation"] || undefined,
    };
    setJsonLdPreview(preview);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setPendingRegistration(true);
    setShowSchemaOptions(true);
  };

  const handleSchemaOptionSelect = (action) => {
    setShowSchemaOptions(false);
    if (action === "select") {
      setShowSchemaSelector(true);
    } else if (action === "create") {
      // Check file extension for HDF5
      const fileExtension = file.toLowerCase().split(".").pop();
      if (fileExtension === "h5" || fileExtension === "hdf5") {
        setShowHDF5SchemaForm(true);
      } else {
        setShowSchemaForm(true);
      }
    } else if (action === "upload") {
      setShowSchemaUpload(true);
    } else {
      registerDataset();
    }
  };

  const handleSchemaRegistration = (schemaData) => {
    console.log("Schema ID:", schemaData);
    setSchemaGuid(schemaData);
    registerDataset(schemaData);
  };

  const registerDataset = (schemaGuid = null) => {
    const guid = generateGuid(formData.name);
    const fullFilePath = path.join(rocratePath, file);
    const result = register_dataset(
      rocratePath,
      formData.name,
      formData.author,
      formData.version,
      formData["date-published"],
      formData.description,
      formData.keywords,
      formData["data-format"],
      fullFilePath,
      guid,
      formData.url,
      formData["used-by"],
      formData["derived-from"],
      schemaGuid,
      formData["associated-publication"],
      formData["additional-documentation"]
    );
    console.log(result);
    setDatasetRegistered(true);
    setPendingRegistration(false);
    setShowSchemaForm(false);
    setShowSchemaSelector(false);
    onSuccess();
  };

  if (showSchemaOptions) {
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
              <StyledButton
                onClick={() => handleSchemaOptionSelect(option.action)}
              >
                Select
              </StyledButton>
            </Card.Body>
          </Card>
        ))}
      </StyledForm>
    );
  }

  if (showSchemaSelector) {
    return (
      <SchemaSelector
        onSchemaSelect={handleSchemaRegistration}
        onCancel={() => setShowSchemaOptions(true)}
        rocratePath={rocratePath}
      />
    );
  }

  if (showSchemaForm) {
    return (
      <SchemaForm
        datasetName={formData.name}
        onSubmit={handleSchemaRegistration}
        onCancel={() => setShowSchemaOptions(true)}
        rocratePath={rocratePath}
        filePath={file}
      />
    );
  }
  if (showHDF5SchemaForm) {
    return (
      <HDF5SchemaForm
        datasetName={formData.name}
        onSubmit={handleSchemaRegistration}
        onCancel={() => setShowSchemaOptions(true)}
        rocratePath={rocratePath}
        filePath={file}
      />
    );
  }
  if (showSchemaUpload) {
    return (
      <SchemaUpload
        onSchemaSelect={handleSchemaRegistration}
        onCancel={() => setShowSchemaOptions(true)}
        rocratePath={rocratePath}
      />
    );
  }

  return (
    <StyledForm onSubmit={handleSubmit}>
      <FormTitle>Register Dataset: {file}</FormTitle>
      <Row>
        <Col md={6}>
          <FormField
            label="Dataset Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <FormField
            label="Author"
            name="author"
            value={formData.author}
            onChange={handleChange}
            required
            placeholder="1st Author First Last, 2nd Author First Last, ..."
          />
          <FormField
            label="Version"
            name="version"
            value={formData.version}
            onChange={handleChange}
            required
            placeholder="Examples: 1.0.1, 1.0"
          />
          <FormField
            label="Date Published"
            name="date-published"
            value={formData["date-published"]}
            onChange={handleChange}
            type="date"
            required
          />
          <TextAreaField
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
          />
          <FormField
            label="Keywords"
            name="keywords"
            value={formData.keywords}
            onChange={handleChange}
            required
            placeholder="genetics, vital signs, heart rate"
          />
          <FormField
            label="Data Format"
            name="data-format"
            value={formData["data-format"]}
            onChange={handleChange}
            required
          />
          <StyledButton type="submit">
            {pendingRegistration ? "Registering..." : "Register Dataset"}
          </StyledButton>
          <StyledButton onClick={onBack} variant="secondary">
            Back
          </StyledButton>
        </Col>
        <Col md={6}>
          <JsonLdPreview jsonLdData={jsonLdPreview} />
        </Col>
      </Row>
    </StyledForm>
  );
}

export default DatasetForm;
