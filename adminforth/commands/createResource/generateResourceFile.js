import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import chalk from "chalk";
import Handlebars from "handlebars";
import { fileURLToPath } from 'url';
import { parse } from "@babel/parser";
import * as recast from "recast";
import { namedTypes as n, builders as b } from "ast-types";

const DATA_SOURCE_RE = /dataSource:\s*["'](.+?)["']/;
const ADMINFORTH_DATA_TYPE_KEYS = {
  string: "STRING",
  integer: "INTEGER",
  float: "FLOAT",
  decimal: "DECIMAL",
  boolean: "BOOLEAN",
  date: "DATE",
  datetime: "DATETIME",
  time: "TIME",
  text: "TEXT",
  json: "JSON",
};

const parser = {
  parse(source) {
    return parse(source, {
      sourceType: "module",
      plugins: ["typescript"],
    });
  },
};

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
    const match = content.match(DATA_SOURCE_RE);
    const existingDataSource = match?.[1];
    if (existingDataSource === dataSource) {
      const syncedColumnsCount = await syncResourceColumns(baseFilePath, content, columns);
      return {
        alreadyExists: true,
        path: baseFilePath,
        fileName: baseFileName,
        resourceId: table,
        syncedColumnsCount,
      };
    } else {
      const suffixedFileName = `${table}_${dataSource}.ts`;
      const suffixedFilePath = path.resolve(process.cwd(), resourcesDir, suffixedFileName);
      if (fsSync.existsSync(suffixedFilePath)) {
        const suffixedContent = await fs.readFile(suffixedFilePath, "utf-8");
        const suffixedMatch = suffixedContent.match(DATA_SOURCE_RE);
        const suffixedDataSource = suffixedMatch?.[1];
        if (suffixedDataSource === dataSource) {
          const syncedColumnsCount = await syncResourceColumns(suffixedFilePath, suffixedContent, columns);
          return {
            alreadyExists: true,
            path: suffixedFilePath,
            fileName: suffixedFileName,
            resourceId: `${table}_${dataSource}`,
            syncedColumnsCount,
          };
        }
      }
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
    columns: columns.map(normalizeColumnForTemplate),
  };

  const content = await renderHBSTemplate(templatePath, context);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf-8");

  console.log(chalk.green(`✅ Generated resource file: ${filePath}`));

  return { alreadyExists: false, path: filePath, fileName, resourceId };
}

async function syncResourceColumns(filePath, content, discoveredColumns) {
  const ast = recast.parse(content, { parser });
  const columnsArray = findResourceColumnsArray(ast);

  if (!columnsArray) {
    throw new Error(`Could not find resource columns array in ${filePath}`);
  }

  const dynamicColumnElements = columnsArray.elements.filter((element) => !n.ObjectExpression.check(element));
  if (dynamicColumnElements.length) {
    throw new Error(
      `Resource columns array in ${filePath} contains dynamic entries. ` +
      `Please sync this resource manually because automatic column import only supports literal column objects.`
    );
  }

  const existingColumnNames = new Set(
    columnsArray.elements
      .map((element) => getObjectPropertyValue(element, "name"))
      .filter(Boolean)
  );

  const columnsToImport = discoveredColumns.filter((column) => !existingColumnNames.has(column.name));

  if (!columnsToImport.length) {
    console.log(chalk.green(`✅ Resource is already in sync: ${filePath}`));
    return 0;
  }

  console.log(chalk.cyan(`ℹ️ Going to import ${formatColumnsCount(columnsToImport.length)}: ${columnsToImport.map((column) => column.name).join(", ")}`));

  columnsArray.elements.push(...columnsToImport.map(createColumnAstNode));

  const newContent = recast.print(ast, {
    tabWidth: 2,
    useTabs: false,
    trailingComma: true,
  }).code;

  await fs.writeFile(filePath, newContent, "utf-8");
  console.log(chalk.green(`✅ Imported ${formatColumnsCount(columnsToImport.length)} into resource file: ${filePath}`));

  return columnsToImport.length;
}

function findResourceColumnsArray(ast) {
  let columnsArray = null;

  recast.visit(ast, {
    visitObjectExpression(path) {
      const properties = path.node.properties;
      const columnsProp = findObjectProperty(properties, "columns");
      const hasResourceShape = findObjectProperty(properties, "dataSource") && findObjectProperty(properties, "table");

      if (hasResourceShape && columnsProp && n.ArrayExpression.check(columnsProp.value)) {
        columnsArray = columnsProp.value;
        return false;
      }

      this.traverse(path);
    },
  });

  return columnsArray;
}

function findObjectProperty(properties, name) {
  return properties.find((property) => (
    n.ObjectProperty.check(property) &&
    getPropertyKeyName(property) === name
  ));
}

function getPropertyKeyName(property) {
  if (n.Identifier.check(property.key)) {
    return property.key.name;
  }
  if (n.StringLiteral.check(property.key) || n.Literal.check(property.key)) {
    return property.key.value;
  }
  return null;
}

function getObjectPropertyValue(objectExpression, name) {
  const property = findObjectProperty(objectExpression.properties, name);
  if (!property) {
    return null;
  }
  if (n.StringLiteral.check(property.value) || n.Literal.check(property.value)) {
    return property.value.value;
  }
  return null;
}

function createColumnAstNode(column) {
  const properties = [
    b.objectProperty(b.identifier("name"), b.stringLiteral(column.name)),
  ];

  if (column.type) {
    properties.push(
      b.objectProperty(
        b.identifier("type"),
        b.memberExpression(b.identifier("AdminForthDataTypes"), b.identifier(getAdminForthDataTypeKey(column.type)))
      )
    );
  }

  if (column.isPrimaryKey) {
    properties.push(b.objectProperty(b.identifier("primaryKey"), b.booleanLiteral(true)));
  }

  if (column.isUUID) {
    properties.push(
      b.objectProperty(
        b.identifier("components"),
        b.objectExpression([
          b.objectProperty(b.identifier("list"), b.stringLiteral("@/renderers/CompactUUID.vue")),
        ])
      )
    );
  }

  properties.push(
    b.objectProperty(
      b.identifier("showIn"),
      b.objectExpression([
        b.objectProperty(b.identifier("all"), b.booleanLiteral(true)),
      ])
    )
  );

  return b.objectExpression(properties);
}

function formatColumnsCount(count) {
  return `${count} column${count === 1 ? "" : "s"}`;
}

function normalizeColumnForTemplate(column) {
  if (!column.type) {
    return column;
  }
  return {
    ...column,
    type: getAdminForthDataTypeKey(column.type),
  };
}

function getAdminForthDataTypeKey(type) {
  return ADMINFORTH_DATA_TYPE_KEYS[type] || type;
}
