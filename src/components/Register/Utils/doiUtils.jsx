export async function getDoiMetadata(doi) {
  // Remove any URL prefix if present
  doi = doi.replace(/^https?:\/\/(dx\.)?doi\.org\//, "");

  // Try CrossRef first
  try {
    const crossrefResponse = await fetch(
      `https://api.crossref.org/works/${doi}`
    );
    if (crossrefResponse.ok) {
      const data = await crossrefResponse.json();
      return {
        source: "CrossRef",
        metadata: data.message,
      };
    }
  } catch (error) {
    console.log("CrossRef fetch failed:", error.message);
  }

  // Try DataCite if CrossRef fails
  try {
    const dataciteResponse = await fetch(
      `https://api.datacite.org/works/${doi}`
    );
    if (dataciteResponse.ok) {
      const data = await dataciteResponse.json();
      return {
        source: "DataCite",
        metadata: data.data,
      };
    }
  } catch (error) {
    console.log("DataCite fetch failed:", error.message);
  }

  throw new Error("Could not fetch metadata from either CrossRef or DataCite");
}
