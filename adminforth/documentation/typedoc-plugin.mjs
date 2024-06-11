// @ts-check
/**
 * @param {import('typedoc-plugin-markdown').MarkdownApplication} app
 */
export function load(app) {
  app.renderer.postRenderAsyncJobs.push(async (output) => {
    // do something async here
    await new Promise((r) => setTimeout(r, 5));
    app.logger.info("Post render success");
  });
}