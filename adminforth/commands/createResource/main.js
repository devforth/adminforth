import { callTsProxy, findAdminInstance } from "../callTsProxy.js";
import { toTitleCase } from '../utils.js';
import { generateResourceFile } from "./generateResourceFile.js";
import { injectResourceIntoIndex } from "./injectResourceIntoIndex.js";
import { select } from "@inquirer/prompts";

export default async function createResource(args) {
  console.log("Bundling admin SPA...");
  const instance = await findAdminInstance();
  console.log("🪲 Found admin instance:", instance.file);
  console.log("🪲 Found admin instance:", instance.file);
  console.log(JSON.stringify(instance));
  const tables = await callTsProxy(`
    import { admin } from './${instance.file}.js';
    export async function exec() {
      await admin.discoverDatabases();
      return await admin.getAllTables();
    }
  `);

  const tableChoices = Object.entries(tables).flatMap(([db, tbls]) =>
    tbls.map((t) => ({
      name: `${db}.${t}`,
      value: { db, table: t },
    }))
  );
  
  const table = await select({
    message: "🗂 Choose a table to generate a resource for:",
    choices: tableChoices,
  });

  const columns = await callTsProxy(`
    import { admin } from './${instance.file}.js';
    export async function exec() {
      await admin.discoverDatabases();
      return await admin.getAllColumnsInTable("${table.table}");
    }
  `);
  console.log("🪲 Found columns:", columns);

  generateResourceFile({
    table: table.table,
    columns: columns[table.db],
    dataSource: table.db,
  });
  injectResourceIntoIndex({
    table: table.table,
    resourceId: table.table,
    label: toTitleCase(table.table),
    icon: "flowbite:user-solid",
  });
 }
