import generateModels from "./generateModels.js";

async function bundle() {
  const instance = await generateModels();

  if (instance) {
    await instance.bundleNow({ hotReload: false });
  }
}

export default bundle;
