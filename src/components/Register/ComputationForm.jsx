import React, { useState, useEffect } from "react";
import { Row, Col } from "react-bootstrap";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import {
  register_computation,
  get_registered_files,
  get_ro_crate_metadata,
} from "@fairscape/utils";
import {
  StyledForm,
  FormTitle,
  StyledButton,
  FormField,
  TextAreaField,
  JsonLdPreview,
  StyledListGroup,
  StyledListItem,
  ColumnHeader,
} from "./SharedComponents";

function ComputationForm({ rocratePath, onComplete, onSkip }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    "date-created": "",
    "run-by": "",
    description: "",
    keywords: "",
  });
  const [availableFiles, setAvailableFiles] = useState([]);
  const [fileColumns, setFileColumns] = useState({
    inputs: [],
    outputs: [],
    software: [],
  });
  const [jsonLdPreview, setJsonLdPreview] = useState({});
  const [hasExistingComputations, setHasExistingComputations] = useState(false);

  const loadRegisteredFiles = async () => {
    const files = await get_registered_files(rocratePath);
    setAvailableFiles(files);
  };

  const checkExistingComputations = async () => {
    const metadata = await get_ro_crate_metadata(rocratePath);
    console.log(metadata);
    const computations = metadata["@graph"].filter(
      (item) => item["@type"] === "https://w3id.org/EVI#Computation"
    );
    setHasExistingComputations(computations.length > 0);
  };

  useEffect(() => {
    loadRegisteredFiles();
    checkExistingComputations();
  }, [rocratePath]);

  useEffect(() => {
    updateJsonLdPreview();
  }, [formData, fileColumns]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const sourceColumn =
      source.droppableId === "availableFiles"
        ? availableFiles
        : fileColumns[source.droppableId];
    const destColumn = fileColumns[destination.droppableId];

    if (source.droppableId === destination.droppableId) {
      const newColumn = Array.from(destColumn);
      const [reorderedItem] = newColumn.splice(source.index, 1);
      newColumn.splice(destination.index, 0, reorderedItem);

      setFileColumns({
        ...fileColumns,
        [destination.droppableId]: newColumn,
      });
    } else if (source.droppableId === "availableFiles") {
      const newAvailableFiles = Array.from(availableFiles);
      const newDestColumn = Array.from(destColumn);
      const [movedItem] = newAvailableFiles.splice(source.index, 1);
      newDestColumn.splice(destination.index, 0, movedItem);

      setAvailableFiles(newAvailableFiles);
      setFileColumns({
        ...fileColumns,
        [destination.droppableId]: newDestColumn,
      });
    } else {
      const sourceItems = Array.from(sourceColumn);
      const destItems = Array.from(destColumn);
      const [movedItem] = sourceItems.splice(source.index, 1);

      if (destination.droppableId === "availableFiles") {
        setAvailableFiles([...availableFiles, movedItem]);
      } else {
        destItems.splice(destination.index, 0, movedItem);
        setFileColumns({
          ...fileColumns,
          [destination.droppableId]: destItems,
        });
      }

      setFileColumns({
        ...fileColumns,
        [source.droppableId]: sourceItems,
      });
    }
  };

  const updateJsonLdPreview = () => {
    const guid = `ark:59852/computation-${formData.name
      .toLowerCase()
      .replace(/\s+/g, "-")}-${Date.now()}`;
    const preview = {
      "@context": {
        "@vocab": "https://schema.org/",
        EVI: "https://w3id.org/EVI#",
      },
      "@id": guid,
      "@type": "https://w3id.org/EVI#Computation",
      name: formData.name,
      description: formData.description,
      keywords: formData.keywords.split(",").map((k) => k.trim()),
      runBy: formData["run-by"],
      dateCreated: formData["date-created"],
      usedSoftware: fileColumns.software.map((file) => file.guid),
      usedDataset: fileColumns.inputs.map((file) => file.guid),
      generated: fileColumns.outputs.map((file) => file.guid),
    };
    setJsonLdPreview(preview);
  };

  const handleSubmit = () => {
    const guid = `ark:59852/computation-${formData.name
      .toLowerCase()
      .replace(/\s+/g, "-")}-${Date.now()}`;
    const options = {
      ...formData,
      guid,
      command: "",
      "used-software": fileColumns.software.map((file) => file.guid),
      "used-dataset": fileColumns.inputs.map((file) => file.guid),
      generated: fileColumns.outputs.map((file) => file.guid),
    };

    const result = register_computation(
      rocratePath,
      options.name,
      options["run-by"],
      options["date-created"],
      options.description,
      options.keywords,
      options.guid,
      options.command,
      options["used-software"],
      options["used-dataset"],
      options.generated
    );

    console.log(result);
    setFormData({
      name: "",
      "date-created": "",
      "run-by": "",
      description: "",
      keywords: "",
    });
    setFileColumns({
      inputs: [],
      outputs: [],
      software: [],
    });
    setShowForm(false);
    loadRegisteredFiles();
    checkExistingComputations();
    onComplete();
  };

  const renderColumn = (columnId, columnName) => (
    <Droppable droppableId={columnId}>
      {(provided) => (
        <div>
          <ColumnHeader>{columnName}</ColumnHeader>
          <StyledListGroup {...provided.droppableProps} ref={provided.innerRef}>
            {(columnId === "availableFiles"
              ? availableFiles
              : fileColumns[columnId]
            ).map((file, index) => (
              <Draggable key={file.guid} draggableId={file.guid} index={index}>
                {(provided) => (
                  <StyledListItem
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    {file.name}
                  </StyledListItem>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </StyledListGroup>
        </div>
      )}
    </Droppable>
  );

  if (!showForm) {
    return (
      <StyledForm>
        <FormTitle>Record Computations</FormTitle>
        <p style={{ color: "#ffffff" }}>
          {hasExistingComputations
            ? "Would you like to register another computation?"
            : "Would you like to record any computations that were run to create the files?"}
        </p>
        <StyledButton
          onClick={() => {
            setShowForm(true);
            loadRegisteredFiles();
          }}
        >
          Yes
        </StyledButton>
        <StyledButton onClick={onSkip} variant="secondary">
          No
        </StyledButton>
      </StyledForm>
    );
  }

  return (
    <StyledForm>
      <FormTitle>Record Computation</FormTitle>
      <Row>
        <Col md={8}>
          <Row>
            <Col md={6}>
              <FormField
                label="Computation Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <FormField
                label="Date Created"
                name="date-created"
                value={formData["date-created"]}
                onChange={handleChange}
                type="date"
                required
              />
              <FormField
                label="Run By"
                name="run-by"
                value={formData["run-by"]}
                onChange={handleChange}
                placeholder="First Last, First Last..."
                required
              />
              <FormField
                label="Keywords"
                name="keywords"
                value={formData.keywords}
                onChange={handleChange}
                placeholder="python, machine learning, genetics"
                required
              />
            </Col>
            <Col md={6}>
              <TextAreaField
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
              />
            </Col>
          </Row>
        </Col>
        <Col md={4}>
          <JsonLdPreview jsonLdData={jsonLdPreview} />
        </Col>
      </Row>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Row>
          <Col md={3}>{renderColumn("availableFiles", "Available Files")}</Col>
          <Col md={3}>{renderColumn("inputs", "Input Datasets")}</Col>
          <Col md={3}>{renderColumn("outputs", "Output Datasets")}</Col>
          <Col md={3}>{renderColumn("software", "Software Used")}</Col>
        </Row>
      </DragDropContext>

      <StyledButton onClick={handleSubmit}>Register Computation</StyledButton>
      <StyledButton
        onClick={() => {
          setShowForm(false);
          loadRegisteredFiles();
        }}
        variant="secondary"
      >
        Cancel
      </StyledButton>
    </StyledForm>
  );
}

export default ComputationForm;
