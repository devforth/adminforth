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
  const fileName = `${table}.ts`;
  const filePath = path.resolve(process.cwd(), resourcesDir, fileName);

  if (fsSync.existsSync(filePath)) {
    console.log(chalk.yellow(`⚠️ File already exists: ${filePath}`));
    return { alreadyExists: true, path: filePath };
  }
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const templatePath = path.resolve(__dirname, "templates/resource.ts.hbs");
  console.log(chalk.dim(`Using template: ${templatePath}`));
  const context = {
    table,
    dataSource,
    resourceId: table,
    label: table.charAt(0).toUpperCase() + table.slice(1),
    columns,
  };

  const content = await renderHBSTemplate(templatePath, context);

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf-8");

  console.log(chalk.green(`✅ Generated resource file: ${filePath}`));

  return { alreadyExists: false, path: filePath };
}
