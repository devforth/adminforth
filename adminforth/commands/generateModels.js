import fs from "fs";
import path from "path";
import { toPascalCase, mapToTypeScriptType, getInstance } from "./utils.js";
import dotenv from "dotenv";

const envFileArg = process.argv.find((arg) => arg.startsWith("--env-file="));
const envFilePath = envFileArg ? envFileArg.split("=")[1] : ".env";

dotenv.config({ path: envFilePath });

async function generateModels() {
  const currentDirectory = process.cwd();
  const outputDirectory = path.join(
    currentDirectory,
    "node_modules",
    "adminforth",
    "models"
  );
  const modelFilePath = path.join(outputDirectory, "models.ts");

  if (!fs.existsSync(outputDirectory)) {
    fs.mkdirSync(outputDirectory, { recursive: true });
  }

  let modelContent = "// Generated model file\n\n";
  const files = fs.readdirSync(currentDirectory);
  let instanceFound = false;

  for (const file of files) {
    if (file.endsWith(".js") || file.endsWith(".ts")) {
      const instance = await getInstance(file, currentDirectory);
      if (instance) {
        await instance.discoverDatabases();
        instanceFound = true;
        instance.config.resources.forEach((resource) => {
          if (resource.columns) {
            modelContent += `export type ${toPascalCase(
              resource.resourceId
            )} = {\n`;
            resource.columns.forEach((column) => {
              if (column.name && column.type) {
                modelContent += `  ${column.name}: ${mapToTypeScriptType(
                  column.type
                )};\n`;
              }
            });
            modelContent += `}\n\n`;
          }
        });
      }
    }
  }

  if (!instanceFound) {
    console.error("Error: No valid instance found to generate models.");
    return;
  }

  fs.writeFileSync(modelFilePath, modelContent, "utf-8");
  console.log(`Generated TypeScript model file: ${modelFilePath}`);
}

export default generateModels;
