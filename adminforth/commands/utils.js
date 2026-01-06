import path from "path";
import { execSync } from "child_process";
import fs from "fs";

export const toPascalCase = (str) => {
  return str
    .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
    .map((x) => x.slice(0, 1).toUpperCase() + x.slice(1).toLowerCase())
    .join("");
};

export const toCapitalizedSentence = (str) => {
  const words = str
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .split(' ');

  if (words.length === 0) return '';

  return [words[0][0].toUpperCase() + words[0].slice(1), ...words.slice(1)].join(' ');
};

export const toTitleCase = (str) => {
  return str
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const mapToTypeScriptType = (adminType) => {
  switch (adminType) {
    case "string":
    case "text":
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

function processJsFilesInDir(directory) {
  const files = fs.readdirSync(directory);

  files.forEach((file) => {
    const filePath = path.join(directory, file);

    if (fs.statSync(filePath).isDirectory()) {
      processJsFilesInDir(filePath);
    } else if (file.endsWith(".js")) {
      try {
        let fileContent = fs.readFileSync(filePath, "utf-8");

        // Add .js to relative imports if missing
        fileContent = fileContent.replace(
          /import (.+?) from ["'](.+?)["'];/g,
          (match, imports, modulePath) => {
            if (
              !modulePath.endsWith(".js") &&
              (modulePath.startsWith("./") || modulePath.startsWith("../"))
            ) {
              return `import ${imports} from "${modulePath}.js";`;
            }
            return match;
          }
        );

        // Remove /index.js from imports only if it's not a relative path
        fileContent = fileContent.replace(
          /import (.+?) from ["'](.+?)\/index\.js["'];/g,
          (match, imports, modulePath) => {
            if (!modulePath.startsWith(".") && !modulePath.startsWith("..")) {
              return `import ${imports} from "${modulePath}";`;
            }
            return match;
          }
        );

        fs.writeFileSync(filePath, fileContent, "utf-8");
      } catch (error) {
        console.error(`Error processing file '${filePath}':`, error);
      }
    }
  });
}

export async function getInstance(file, currentDirectory) {
  const initialFilePath = path.join(currentDirectory, file);
  let filePath = initialFilePath;

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
      //console.log(`Error: Could not compile TypeScript file '${file}'`);
    }
    const distDir = path.join(currentDirectory, "dist");
    processJsFilesInDir(distDir);

    filePath = filePath
      .replace(".ts", ".js")
      .replace(currentDirectory, distDir);
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
