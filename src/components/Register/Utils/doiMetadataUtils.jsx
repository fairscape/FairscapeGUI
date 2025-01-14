export const processDoiMetadata = (doiMetadata) => {
  const formData = {
    name: "",
    author: "",
    version: "",
    "date-published": "",
    description: "",
    keywords: "",
    "data-format": "DOI",
    url: "",
    "used-by": [],
    "derived-from": [],
    schema: "",
    "associated-publication": "",
    "additional-documentation": "",
  };

  if (doiMetadata.source === "CrossRef") {
    const metadata = doiMetadata.metadata;
    formData.name = metadata.title?.[0] || "";
    formData.author =
      metadata.author
        ?.map((author) => `${author.given || ""} ${author.family || ""}`)
        .join(", ") || "";
    formData["date-published"] = metadata.published?.["date-parts"]?.[0]?.[0]
      ? `${metadata.published["date-parts"][0][0]}-${String(
          metadata.published["date-parts"][0][1] || 1
        ).padStart(2, "0")}-${String(
          metadata.published["date-parts"][0][2] || 1
        ).padStart(2, "0")}`
      : "";
    formData.description = metadata.abstract || "";
    formData.keywords = metadata.subject?.join(", ") || "";
    formData.url = `https://doi.org/${metadata.DOI}`;
    formData.version = metadata.version || "";
  } else if (doiMetadata.source === "DataCite") {
    const metadata = doiMetadata.metadata.attributes;
    formData.name = metadata.title || "";
    formData.author =
      metadata.author
        ?.map((author) => `${author.given || ""} ${author.family || ""}`)
        .join(", ") || "";
    formData["date-published"] = metadata.published
      ? `${metadata.published}-01-01`
      : "";
    formData.description = metadata.description || "";
    formData.url = metadata.url || `https://doi.org/${metadata.doi}`;
    formData.version = metadata.version || "";
  }

  return formData;
};
