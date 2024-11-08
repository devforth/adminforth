import { IAdminForth, IHttpServer } from "../types/Back.js";


abstract class GenericServer implements IHttpServer {
    protected adminforth: IAdminForth;

    /**
     * Base constructor for the server. Initializes the `adminforth` instance.
     * @param adminforth - AdminForth instance for configuration and utilities.
     */
    constructor(adminforth: IAdminForth) {
        this.adminforth = adminforth;
    }

    /**
     * Sets up the SPA server for serving frontend assets and handling client routes.
     */
    abstract setupSpaServer(): void;

    /**
     * Serves the application instance.
     * @param app - Framework-specific app instance.
     */
    abstract serve(app: unknown): void;

    /**
     * Middleware for authorizing requests.
     * @param handler - Handler function to execute after authorization.
     * @returns Framework-specific middleware function.
     */
    abstract authorize(handler: Function): Function;

    /**
     * Defines an endpoint with the specified method, path, and handler.
     * @param method - HTTP method (e.g., 'GET', 'POST').
     * @param path - Path for the endpoint.
     * @param handler - Request handler function.
     * @param noAuth - If true, skips authorization middleware.
     */
    abstract endpoint({
        method,
        path,
        handler,
        noAuth,
    }): void;

    /**
   * Generates an HTML response for when the server is not ready.
   * @param title - The title to display.
   * @param explanation - The explanation to display.
   * @returns A string containing the HTML response.
   */
  protected respondNoServer(title: string, explanation: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body>
        <div class="center">
          <h1>Oops!</h1>
          <h2>${title}</h2>
          <p>${explanation}</p>
        </div>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f0f0f0;
            margin: 0;
            padding: 0;
          }
          .center {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            flex-direction: column;
          }
        </style>
        <script>
          setTimeout(() => {
            location.reload();
          }, 1500);
        </script>
      </body>
      </html>
    `;
  }
}

export default GenericServer;