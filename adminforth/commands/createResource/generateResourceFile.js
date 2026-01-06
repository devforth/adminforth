import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import chalk from "chalk";
import Handlebars from "handlebars";
import { fileURLToPath } from 'url';

export async function renderHBSTemplate(templatePath, data){
  const templateContent = await fs.readFile(templatePath, "utf-8");
  const compiled = Handlebars.compile(templateContent);
  return compiled(data);
}

export async function generateResourceFile({
  table,
  columns,
  dataSource = "maindb",
  resourcesDir = "resources"
}) {
  const baseFileName = `${table}.ts`;
  const baseFilePath = path.resolve(process.cwd(), resourcesDir, baseFileName);

  if (fsSync.existsSync(baseFilePath)) {
    const content = await fs.readFile(baseFilePath, "utf-8");
    const match = content.match(/dataSource:\s*["'](.+?)["']/);
    const existingDataSource = match?.[1];
    if (existingDataSource === dataSource) {
      console.log(chalk.yellow(`⚠️ File already exists with same dataSource: ${baseFilePath}`));
      return { alreadyExists: true, path: baseFilePath, fileName: baseFileName, resourceId: table };
    } else {
      const suffixedFileName = `${table}_${dataSource}.ts`;
      const suffixedFilePath = path.resolve(process.cwd(), resourcesDir, suffixedFileName);
      return await writeResourceFile(suffixedFilePath, suffixedFileName, {
        table,
        columns,
        dataSource,
        resourceId: `${table}_${dataSource}`,
      });
    }
  }

  return await writeResourceFile(baseFilePath, baseFileName, {
    table,
    columns,
    dataSource,
    resourceId: table,
  });
}

async function writeResourceFile(filePath, fileName, {
  table,
  columns,
  dataSource,
  resourceId,
}) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const templatePath = path.resolve(__dirname, "templates/resource.ts.hbs");
  console.log(chalk.dim(`Using template: ${templatePath}`));

  const context = {
    table,
    dataSource,
    resourceId,
    label: table.charAt(0).toUpperCase() + table.slice(1),
    columns,
  };

  const content = await renderHBSTemplate(templatePath, context);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf-8");

  console.log(chalk.green(`✅ Generated resource file: ${filePath}`));

  return { alreadyExists: false, path: filePath, fileName, resourceId };
}
