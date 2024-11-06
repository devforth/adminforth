import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { toPascalCase, mapToTypeScriptType } from "./utils.js";
import dotenv from "dotenv";

const envFileArg = process.argv.find((arg) => arg.startsWith("--env-file="));
const envFilePath = envFileArg ? envFileArg.split("=")[1] : ".env";

dotenv.config({ path: envFilePath });

async function generateModels() {
  const currentDirectory = process.cwd();
  const files = fs.readdirSync(currentDirectory);
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

  const adminForthPattern = /const\s+(.+?)\s*=\s*new\s+AdminForth\s*\(/;

  for (const file of files) {
    if (file.endsWith(".js") || file.endsWith(".ts")) {
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
          console.warn(
            `Error: Could not compile TypeScript file '${file}'`,
            error
          );
        }

        filePath = filePath
          .replace(".ts", ".js")
          .replace(currentDirectory, path.join(currentDirectory, "dist"));
        console.log(`Compiled TypeScript file: ${filePath}`);
      }
      const fileContent = fs.readFileSync(initialFilePath, "utf-8");
      const match = fileContent.match(adminForthPattern);

      if (match) {
        const instanceName = match[1];
        try {
          const module = await import(`file://${filePath}`);
          const instance = module[instanceName];

          await instance.discoverDatabases();

          if (module) {
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
            fs.writeFileSync(modelFilePath, modelContent, "utf-8");
            console.log(`Generated TypeScript model file: ${modelFilePath}`);
            return instance;
          }
        } catch (error) {
          console.error(`Error: Could not import module '${file}'`, error);
        }
      }
    }
  }
}

export default generateModels;
