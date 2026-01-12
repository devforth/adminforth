import { callTsProxy, findAdminInstance } from "./callTsProxy.js";


async function bundle() {
  console.log("Bundling admin SPA...");
  const instance = await findAdminInstance();
    

  try {
    await callTsProxy(`
      import { admin } from './${instance.file}.js';

      export async function exec() {
        return await admin.bundleNow({ hotReload: false });
      }
    `);

  } catch (e) {
    console.log(`Running budndle failed`, e);
  }
}

export default bundle;
