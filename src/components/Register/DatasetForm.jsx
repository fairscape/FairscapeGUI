import React, { useState, useEffect } from "react";
import { Row, Col } from "react-bootstrap";
import { register_dataset } from "@fairscape/utils";
import path from "path";
import {
  StyledForm,
  FormTitle,
  StyledButton,
  FormField,
  TextAreaField,
  JsonLdPreview,
} from "./SharedComponents";
import SchemaForm from "./SchemaComponents/SchemaForm";
import SchemaUpload from "./SchemaComponents/SchemaUpload";
import SchemaSelector from "./SchemaComponents/SchemaSelector";
import HDF5SchemaForm from "./SchemaComponents/HDF5SchemaForm";
import SchemaOptions from "./SchemaOptions";
import { generateGuid, createJsonLdPreview } from "./Utils/datasetUtils";
import { processDoiMetadata } from "./Utils/doiMetadataUtils";

const initialFormState = {
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
};

function DatasetForm({ file, onBack, rocratePath, onSuccess, doiMetadata }) {
  const [formData, setFormData] = useState(initialFormState);
  const [jsonLdPreview, setJsonLdPreview] = useState({});
  const [showSchemaOptions, setShowSchemaOptions] = useState(false);
  const [showSchemaSelector, setShowSchemaSelector] = useState(false);
  const [showSchemaForm, setShowSchemaForm] = useState(false);
  const [showHDF5SchemaForm, setShowHDF5SchemaForm] = useState(false);
  const [showSchemaUpload, setShowSchemaUpload] = useState(false);
  const [pendingRegistration, setPendingRegistration] = useState(false);
  const [schemaGuid, setSchemaGuid] = useState(null);

  useEffect(() => {
    if (file === "doi" && doiMetadata) {
      const newData = processDoiMetadata(doiMetadata);
      setFormData(newData);
      setJsonLdPreview(createJsonLdPreview(newData, schemaGuid));
    } else if (file !== "doi") {
      const fileName = path
        .basename(file, path.extname(file))
        .replace(/_/g, " ");
      const fileExtension = path.extname(file).slice(1).toUpperCase();

      const newData = {
        ...formData,
        name: fileName,
        "data-format": fileExtension,
      };

      setFormData(newData);
      setJsonLdPreview(createJsonLdPreview(newData, schemaGuid));
    }
  }, [file, doiMetadata]);

  const handleChange = (e) => {
    const newData = { ...formData, [e.target.name]: e.target.value };
    setFormData(newData);
    setJsonLdPreview(createJsonLdPreview(newData, schemaGuid));
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
      if (file !== "doi") {
        const fileExtension = file.toLowerCase().split(".").pop();
        if (fileExtension === "h5" || fileExtension === "hdf5") {
          setShowHDF5SchemaForm(true);
        } else {
          setShowSchemaForm(true);
        }
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
    setSchemaGuid(schemaData);
    registerDataset(schemaData);
  };

  const registerDataset = (schemaGuid = null) => {
    const guid = generateGuid(formData.name);
    const fullFilePath = file === "doi" ? "" : path.join(rocratePath, file);
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
    setPendingRegistration(false);
    onSuccess();
  };

  if (showSchemaOptions) {
    return <SchemaOptions onOptionSelect={handleSchemaOptionSelect} />;
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
      <FormTitle>
        {file === "doi"
          ? "Register Publication/Dataset from DOI"
          : `Register Dataset: ${file}`}
      </FormTitle>
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
