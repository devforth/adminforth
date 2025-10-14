import fs from "fs";
import path from "path";
import { toPascalCase, mapToTypeScriptType, getInstance } from "./utils.js";
import dotenv from "dotenv";
import { callTsProxy } from "./callTsProxy.js";
import { getAdminInstance } from "../commands/createCustomComponent/configLoader.js";

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
  let instanceFound = false;

  const instance = await getAdminInstance();
  if (instance) {
    await instance.discoverDatabases();
    instanceFound = true;
    for (const resource of instance.config.resources) {
      if (resource.columns) {
        const typeName = toPascalCase(resource.resourceId);
        const tsCode = `
          export async function exec() {
            const columns = ${JSON.stringify(resource.columns)};
            const typeName = "${typeName}";
            function mapToTypeScriptType(type) {
              const map = { "integer": "number", "varchar": "string", "boolean": "boolean", "date": "string", "datetime": "string", "decimal": "number", "float": "number", "json": "Record<string, any>", "text": "string", "string": "string", "time": "string" };
              return map[type] || "any";
            }

            let typeStr = \`export type \${typeName} = {\\n\`;
            for (const col of columns) {
              if (col.name && col.type) {
                typeStr += \`  \${col.name}: \${mapToTypeScriptType(col.type)};\\n\`;
              }
            }
            typeStr += "}\\n\\n";
            return typeStr;
          }
        `;

        const result = await callTsProxy(tsCode);
        modelContent += result;
      }
    };
  }

  if (!instanceFound) {
    console.error("Error: No valid instance found to generate models.");
    return;
  }
  fs.writeFileSync(modelFilePath, modelContent, "utf-8");
  console.log(`Generated TypeScript model file: ${modelFilePath}`);
  return true;
}

export default generateModels;
