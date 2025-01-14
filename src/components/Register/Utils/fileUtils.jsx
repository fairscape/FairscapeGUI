import fs from "fs";
import path from "path";

export const readFilesRecursively = async (dir, baseDir) => {
  let results = [];
  const items = await fs.promises.readdir(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    const relativePath = path.relative(baseDir, fullPath);

    if (item.isDirectory()) {
      results = results.concat(await readFilesRecursively(fullPath, baseDir));
    } else if (
      item.isFile() &&
      item.name !== "ro-crate-metadata.json" &&
      item.name !== ".DS_Store"
    ) {
      results.push(relativePath);
    }
  }

  return results;
};

export const normalizePath = (filePath) =>
  filePath.replace(/^\//, "").replace(/\\/g, "/");

export const loadRoCrateFiles = async (rocratePath) => {
  if (!rocratePath) {
    throw new Error("Please select an RO-Crate directory.");
  }

  const fileList = await fs.promises.readdir(rocratePath);
  const metadataExists = fileList.includes("ro-crate-metadata.json");

  if (!metadataExists) {
    return { needsInit: true };
  }

  const files = await readFilesRecursively(rocratePath, rocratePath);

  if (files.length === 0) {
    throw new Error(
      "No files found in the RO-Crate directory. Please add files to the selected folder."
    );
  }

  const metadataPath = path.join(rocratePath, "ro-crate-metadata.json");
  const metadata = JSON.parse(await fs.promises.readFile(metadataPath, "utf8"));

  const registeredFiles = metadata["@graph"]
    .filter((item) => item.contentUrl)
    .map((item) => normalizePath(item.contentUrl.replace("file://", "")));

  return {
    files,
    registeredFiles,
    packageType: metadata.packageType || null,
    needsInit: false,
  };
};
