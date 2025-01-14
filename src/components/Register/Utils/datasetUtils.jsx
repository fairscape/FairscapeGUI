export const generateGuid = (name) => {
  const NAAN = "59852";
  const sq = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace("T", "")
    .slice(0, 14);
  return `ark:${NAAN}/dataset-${name.toLowerCase().replace(/\s+/g, "-")}-${sq}`;
};

export const createJsonLdPreview = (formData, schemaGuid) => {
  const guid = generateGuid(formData.name);
  return {
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
    keywords: formData.keywords
      ? formData.keywords.split(",").map((k) => k.trim())
      : [],
    format: formData["data-format"],
    url: formData.url || undefined,
    usedBy: formData["used-by"] || undefined,
    derivedFrom: formData["derived-from"] || undefined,
    schema: schemaGuid || undefined,
    associatedPublication: formData["associated-publication"] || undefined,
    additionalDocumentation: formData["additional-documentation"] || undefined,
  };
};
