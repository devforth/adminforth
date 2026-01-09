import { callTsProxy, findAdminInstance } from "./callTsProxy.js";
import { afLogger } from '../modules/logger.js';


async function bundle() {
  afLogger.info("Bundling admin SPA...");
  const instance = await findAdminInstance();
    

  try {
    await callTsProxy(`
      import { admin } from './${instance.file}.js';

      export async function exec() {
        return await admin.bundleNow({ hotReload: false });
      }
    `);

  } catch (e) {
    afLogger.error(`Running bundle failed`, e);
  }
}

export default bundle;
