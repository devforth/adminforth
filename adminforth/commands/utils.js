import path from "path";
import { execSync } from "child_process";
import fs from "fs";

export const toPascalCase = (str) => {
  return str
    .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
    .map((x) => x.slice(0, 1).toUpperCase() + x.slice(1).toLowerCase())
    .join("");
};

export const mapToTypeScriptType = (adminType) => {
  switch (adminType) {
    case "string":
    case "text":
    case "richtext":
    case "datetime":
    case "date":
    case "time":
      return "string";
    case "integer":
    case "float":
    case "decimal":
      return "number";
    case "boolean":
      return "boolean";
    case "json":
    default:
      return "any";
  }
};

export const findInstance = (fileContent) => {
  const adminForthPattern =
    /export\s+(const|let)\s+(.+?)\s*=\s*new\s+AdminForth\s*\(/g;
  const matches = [...fileContent.matchAll(adminForthPattern)];

  if (matches.length === 0) {
    const nonExportPattern = /(const|let)\s+(.+?)\s*=\s*new\s+AdminForth\s*\(/;
    const nonExportMatch = fileContent.match(nonExportPattern);

    if (nonExportMatch) {
      throw new Error(
        `Found AdminForth instance without export: ${nonExportMatch[2]}`
      );
    }
    return;
  }
  if (matches.length > 1) {
    throw new Error(
      `Multiple AdminForth instances found: ${matches
        .map((match) => match[2])
        .join(", ")}`
    );
  }
  return matches[0][2];
};

export async function getInstance(file, currentDirectory) {
  const initialFilePath = path.join(currentDirectory, file);
  let filePath = path.join(currentDirectory, file);

  if (file.endsWith(".ts")) {
    console.log(`Compiling TypeScript file: ${file}`);
    try {
      execSync(
        `./node_modules/.bin/tsc ${filePath} --module ESNext --outDir ./dist`,
        {
          stdio: "ignore",
        }
      );
    } catch (error) {
      console.log(`Error: Could not compile TypeScript file '${file}'`);
    }

    filePath = filePath
      .replace(".ts", ".js")
      .replace(currentDirectory, path.join(currentDirectory, "dist"));
  }

  const fileContent = fs.readFileSync(initialFilePath, "utf-8");
  const instanceName = findInstance(fileContent);

  if (instanceName) {
    try {
      const module = await import(`file://${filePath}`);
      return module[instanceName] || null;
    } catch (error) {
      console.error(`Error importing module '${file}':`, error);
    }
  }
  return null;
}
