import React, { useState, useEffect } from "react";
import { Row, Col } from "react-bootstrap";
import { register_software } from "@fairscape/utils";
import path from "path";
import {
  StyledForm,
  FormTitle,
  StyledButton,
  FormField,
  TextAreaField,
  JsonLdPreview,
} from "./SharedComponents";

function SoftwareForm({ file, onBack, rocratePath, onSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    author: "",
    version: "",
    description: "",
    keywords: "",
    "file-format": "",
    url: "",
    "date-modified": "",
    "used-by-computation": "",
    "associated-publication": "",
    "additional-documentation": "",
  });

  const [jsonLdPreview, setJsonLdPreview] = useState({});

  useEffect(() => {
    const fileName = path.basename(file, path.extname(file)).replace(/_/g, " ");
    const fileExtension = path.extname(file).slice(1).toUpperCase();

    setFormData((prevState) => ({
      ...prevState,
      name: fileName,
      "file-format": fileExtension,
    }));

    updateJsonLdPreview();
  }, [file]);

  useEffect(() => {
    updateJsonLdPreview();
  }, [formData]);

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
    return `ark:${NAAN}/software-${name
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
      "@type": "https://w3id.org/EVI#Software",
      name: formData.name,
      author: formData.author,
      dateModified: formData["date-modified"],
      description: formData.description,
      keywords: formData.keywords.split(",").map((k) => k.trim()),
      version: formData.version,
      associatedPublication: formData["associated-publication"] || undefined,
      additionalDocumentation:
        formData["additional-documentation"] || undefined,
      format: formData["file-format"],
      usedByComputation: formData["used-by-computation"]
        ? formData["used-by-computation"].split(",").map((item) => item.trim())
        : undefined,
      url: formData.url || undefined,
    };
    setJsonLdPreview(preview);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const guid = generateGuid(formData.name);
    const fullFilePath = path.join(rocratePath, file);
    try {
      const result = register_software(
        rocratePath,
        formData.name,
        formData.author,
        formData.version,
        formData.description,
        formData.keywords,
        formData["file-format"],
        guid,
        formData.url,
        formData["date-modified"],
        fullFilePath,
        formData["used-by-computation"],
        formData["associated-publication"],
        formData["additional-documentation"]
      );
      console.log(result);
      onSuccess();
    } catch (error) {
      console.error("Error registering software:", error);
    }
  };

  return (
    <StyledForm onSubmit={handleSubmit}>
      <FormTitle>Register Software: {file}</FormTitle>
      <Row>
        <Col md={6}>
          <FormField
            label="Name"
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
          />
          <FormField
            label="File Format"
            name="file-format"
            value={formData["file-format"]}
            onChange={handleChange}
            required
          />
          <FormField
            label="URL"
            name="url"
            value={formData.url}
            onChange={handleChange}
            placeholder="http://github/link-to-repo"
          />
          <StyledButton type="submit">Register Software</StyledButton>
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

export default SoftwareForm;
